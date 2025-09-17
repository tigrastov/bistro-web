const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
const fetch = require("node-fetch");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// Конфиг: env vars или firebase functions:config (безопасное чтение)
const cfg = (() => {
  try {
    const c = functions.config();
    return c && typeof c === 'object' ? c : {};
  } catch (e) {
    console.warn('functions.config() is not available; using empty config');
    return {};
  }
})();
const ALFA_LOGIN = process.env.ALFA_LOGIN || (cfg.alfa && cfg.alfa.login);
const ALFA_PASSWORD = process.env.ALFA_PASSWORD || (cfg.alfa && cfg.alfa.password);
const ALFA_CALLBACK_SECRET = process.env.ALFA_CALLBACK_SECRET || (cfg.alfa && cfg.alfa.callback_secret);
const DISABLE_SIGNATURE_VERIFY = process.env.DISABLE_SIGNATURE_VERIFY === 'true' || (cfg.alfa && cfg.alfa.disable_signature === 'true');
const SAVE_WEBHOOK_LOGS = process.env.SAVE_WEBHOOK_LOGS === 'true' || (cfg.alfa && cfg.alfa.save_webhook_logs === 'true');
const SAVE_PAYMENT_MAPPINGS = process.env.SAVE_PAYMENT_MAPPINGS === 'true' || (cfg.alfa && cfg.alfa.save_payment_mappings === 'true');

// Функция для создания реального платежа
exports.createPayment = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { orderId, amount, description, clientEmail, clientName, location } = req.body;

    if (!orderId || !amount || !clientName || !location) {
      throw new Error("Отсутствуют обязательные поля: orderId, amount, clientName, location");
    }

    // Регистрируем платёж через API Альфа-Банка
    const response = await fetch("https://payment.alfabank.ru/payment/rest/register.do", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        userName: ALFA_LOGIN,
        password: ALFA_PASSWORD,
        orderNumber: orderId,
        amount: amount * 100, // в копейках
        returnUrl: "https://xn--b1aqjenl.online/success",
        failUrl: "https://xn--b1aqjenl.online/fail",
        description: description || `Заказ #${orderId}`,
        clientEmail: clientEmail || "",
      }),
    });

    const data = await response.json();

    if (data.formUrl) {
      if (SAVE_PAYMENT_MAPPINGS) {
        try {
          await db.collection('paymentMappings').doc(String(data.orderId)).set({
            preOrderId: String(orderId),
            location: String(location),
            createdAt: new Date(),
          });
        } catch (e) {
          console.warn('Failed to save payment mapping (disabled or error):', e?.message || e);
        }
      }
      res.json({ success: true, paymentUrl: data.formUrl, paymentId: data.orderId });
    } else {
      throw new Error(data.errorMessage || "Ошибка создания платежа");
    }

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Функция для обработки webhook с проверкой подписи
exports.paymentWebhook = functions.https.onRequest(async (req, res) => {
  try {
    // CORS/Preflight
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      return res.status(204).send('');
    }

    // Поддержка JSON, form-urlencoded и query params (на случай GET/redirect)
    const bodyObj = (typeof req.body === 'object' && Object.keys(req.body).length)
      ? req.body
      : Object.fromEntries(new URLSearchParams(req.rawBody?.toString() || ''));
    const queryObj = req.query || {};
    const callbackData = { ...bodyObj, ...queryObj };

    console.log('Webhook payload:', callbackData);
    if (SAVE_WEBHOOK_LOGS) {
      try {
        await db.collection('webhookLogs').add({
          createdAt: new Date(),
          headers: req.headers || {},
          body: callbackData,
        });
      } catch (e) {
        console.warn('Failed to write webhook log', e);
      }
    }

    const signatureFromBank = callbackData.token;
    const dataString = Object.keys(callbackData)
      .filter(k => k !== "token")
      .sort()
      .map(k => `${callbackData[k]}`)
      .join("");

    // Проверяем подпись (можно пропустить для теста через skipSig=1)
    const skipSig = String(callbackData.skipSig || callbackData.skip_signature || '') === '1';
    const hash = crypto.createHmac("sha256", ALFA_CALLBACK_SECRET).update(dataString).digest("hex");
    const isGet = req.method === 'GET';
    const noToken = !signatureFromBank;
    if (!skipSig && !DISABLE_SIGNATURE_VERIFY && !isGet && !noToken && hash !== signatureFromBank) {
      return res.status(403).json({ success: false, message: "Неверная подпись" });
    }
    if (skipSig || DISABLE_SIGNATURE_VERIFY || isGet || noToken) {
      if (hash !== signatureFromBank) {
        console.warn('Signature bypassed:', { isGet, noToken, DISABLE_SIGNATURE_VERIFY, skipSig });
      }
    }

    // Определяем preOrderId (наш ID документа) и находим его локацию
    let preOrderId = String(callbackData.orderNumber || '');
    let location;
    if (!preOrderId && SAVE_PAYMENT_MAPPINGS) {
      const bankOrderId = String(
        callbackData.orderId || callbackData.bankOrderId || callbackData.mdOrder || ''
      );
      if (bankOrderId) {
        const mapSnap = await db.collection('paymentMappings').doc(bankOrderId).get();
        if (mapSnap.exists) {
          ({ preOrderId, location } = mapSnap.data());
        }
      }
    }

    if (!preOrderId) {
      return res.status(400).json({ success: false, message: 'Нет orderNumber (preOrderId)' });
    }

    if (!location) {
      const locationDocs = await db.collection('locations').listDocuments();
      let found = false;
      for (const locDoc of locationDocs) {
        const tryRef = locDoc.collection('orders').doc(preOrderId);
        const trySnap = await tryRef.get();
        if (trySnap.exists) {
          location = locDoc.id;
          found = true;
          break;
        }
      }
      if (!found) {
        return res.status(404).json({ success: false, message: "Заказ по preOrderId не найден ни в одной локации" });
      }
    }

    // Обновляем заказ в Firestore (предзаказ в locations/{location}/orders/{preOrderId})
    const rawStatus = String(callbackData.status ?? callbackData.orderStatus ?? callbackData.paymentState ?? '');
    const operation = String(callbackData.operation || '').toLowerCase();

    // Строгая проверка входных данных: обновляем только если явная успешная операция
    const isApprovedOperation = operation === 'deposited' || operation === 'approved' || operation === 'success';
    const paidRegex = /^(1|2|3|paid|approved|success|ok)$/i;
    const failRegex = /^(0|failed|declined|canceled|cancelled|error)$/i;
    const normalized = paidRegex.test(rawStatus)
      ? 'Оплачено'
      : failRegex.test(rawStatus)
      ? 'Отклонено'
      : 'Неизвестно';

    // Идемпотентность: не перетирать уже финальные статусы
    const orderRef = db
      .collection('locations')
      .doc(String(location))
      .collection('orders')
      .doc(String(preOrderId));

    const existingSnap = await orderRef.get();
    if (!existingSnap.exists) {
      return res.status(404).json({ success: false, message: 'Заказ не найден для обновления' });
    }

    const existing = existingSnap.data() || {};
    const isFinal = existing.status === 'Оплачено' || existing.status === 'Отклонено';

    if (!isApprovedOperation && normalized === 'Оплачено') {
      // Игнорируем несоответствие: статус говорит об оплате, а операция — нет
      console.warn('Ignoring webhook: operation not approved for paid status', { operation, rawStatus });
      return res.json({ success: true, ignored: true });
    }

    if (isFinal) {
      // Не перезаписываем финальный статус
      return res.json({ success: true, idempotent: true });
    }

    await orderRef.update({
      status: normalized,
      paymentStatus: rawStatus || normalized,
      updatedAt: new Date(),
      operation: operation || existing.operation,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});