// const functions = require("firebase-functions");
// const admin = require("firebase-admin");
// const crypto = require("crypto");
// const fetch = require("node-fetch");

// const { onDocumentCreated } = require("firebase-functions/v2/firestore");

// // Переменные окружения для Telegram (настраиваются через Firebase CLI)

// const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
// const { sendTelegramMessage } = require("./telegram");


// if (!admin.apps.length) admin.initializeApp();
// const db = admin.firestore();

// // Конфиг: env vars или firebase functions:config (безопасное чтение)
// const cfg = (() => {
//   try {
//     const c = functions.config();
//     return c && typeof c === 'object' ? c : {};
//   } catch (e) {
//     console.warn('functions.config() is not available; using empty config');
//     return {};
//   }
// })();
// const ALFA_LOGIN = process.env.ALFA_LOGIN || (cfg.alfa && cfg.alfa.login);
// const ALFA_PASSWORD = process.env.ALFA_PASSWORD || (cfg.alfa && cfg.alfa.password);
// const ALFA_CALLBACK_SECRET = process.env.ALFA_CALLBACK_SECRET || (cfg.alfa && cfg.alfa.callback_secret);
// const DISABLE_SIGNATURE_VERIFY = process.env.DISABLE_SIGNATURE_VERIFY === 'true' || (cfg.alfa && cfg.alfa.disable_signature === 'true');
// const SAVE_WEBHOOK_LOGS = process.env.SAVE_WEBHOOK_LOGS === 'true' || (cfg.alfa && cfg.alfa.save_webhook_logs === 'true');
// const SAVE_PAYMENT_MAPPINGS = process.env.SAVE_PAYMENT_MAPPINGS === 'true' || (cfg.alfa && cfg.alfa.save_payment_mappings === 'true');

// // Функция для создания реального платежа
// exports.createPayment = functions.https.onRequest(async (req, res) => {
//   res.set("Access-Control-Allow-Origin", "*");
//   res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
//   res.set("Access-Control-Allow-Headers", "Content-Type");

//   if (req.method === "OPTIONS") {
//     res.status(204).send("");
//     return;
//   }

//   try {
//     const { orderId, amount, description, clientEmail, clientName, location } = req.body;

//     if (!orderId || !amount || !clientName || !location) {
//       throw new Error("Отсутствуют обязательные поля: orderId, amount, clientName, location");
//     }

//     // Регистрируем платёж через API Альфа-Банка
//     const response = await fetch("https://payment.alfabank.ru/payment/rest/register.do", {
//       method: "POST",
//       headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       body: new URLSearchParams({
//         userName: ALFA_LOGIN,
//         password: ALFA_PASSWORD,
//         orderNumber: orderId,
//         amount: amount * 100, // в копейках
//         // returnUrl: "https://xn--b1aqjenl.online/success",
//         // failUrl: "https://xn--b1aqjenl.online/fail",
//         returnUrl: "https://vkusno-market.ru/success",
//         failUrl: "https://vkusno-market.ru/fail",
//         description: description || `Заказ #${orderId}`,
//         clientEmail: clientEmail || "",
//       }),
//     });

//     const data = await response.json();

//     if (data.formUrl) {
//       if (SAVE_PAYMENT_MAPPINGS) {
//         try {
//           await db.collection('paymentMappings').doc(String(data.orderId)).set({
//             preOrderId: String(orderId),
//             location: String(location),
//             createdAt: new Date(),
//           });
//         } catch (e) {
//           console.warn('Failed to save payment mapping (disabled or error):', e?.message || e);
//         }
//       }
//       res.json({ success: true, paymentUrl: data.formUrl, paymentId: data.orderId });
//     } else {
//       throw new Error(data.errorMessage || "Ошибка создания платежа");
//     }

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// // Функция для обработки webhook с проверкой подписи
// exports.paymentWebhook = functions.https.onRequest(async (req, res) => {
//   try {
//     // CORS/Preflight
//     res.set('Access-Control-Allow-Origin', '*');
//     res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
//     res.set('Access-Control-Allow-Headers', 'Content-Type');
//     if (req.method === 'OPTIONS') {
//       return res.status(204).send('');
//     }

//     // Поддержка JSON, form-urlencoded и query params (на случай GET/redirect)
//     const bodyObj = (typeof req.body === 'object' && Object.keys(req.body).length)
//       ? req.body
//       : Object.fromEntries(new URLSearchParams(req.rawBody?.toString() || ''));
//     const queryObj = req.query || {};
//     const callbackData = { ...bodyObj, ...queryObj };

//     console.log('Webhook payload:', callbackData);
//     if (SAVE_WEBHOOK_LOGS) {
//       try {
//         await db.collection('webhookLogs').add({
//           createdAt: new Date(),
//           headers: req.headers || {},
//           body: callbackData,
//         });
//       } catch (e) {
//         console.warn('Failed to write webhook log', e);
//       }
//     }

//     const signatureFromBank = callbackData.token;
//     const dataString = Object.keys(callbackData)
//       .filter(k => k !== "token")
//       .sort()
//       .map(k => `${callbackData[k]}`)
//       .join("");

//     // Проверяем подпись (можно пропустить для теста через skipSig=1)
//     const skipSig = String(callbackData.skipSig || callbackData.skip_signature || '') === '1';
//     const hash = crypto.createHmac("sha256", ALFA_CALLBACK_SECRET).update(dataString).digest("hex");
//     const isGet = req.method === 'GET';
//     const noToken = !signatureFromBank;
//     if (!skipSig && !DISABLE_SIGNATURE_VERIFY && !isGet && !noToken && hash !== signatureFromBank) {
//       return res.status(403).json({ success: false, message: "Неверная подпись" });
//     }
//     if (skipSig || DISABLE_SIGNATURE_VERIFY || isGet || noToken) {
//       if (hash !== signatureFromBank) {
//         console.warn('Signature bypassed:', { isGet, noToken, DISABLE_SIGNATURE_VERIFY, skipSig });
//       }
//     }

//     // Определяем preOrderId (наш ID документа) и находим его локацию
//     let preOrderId = String(callbackData.orderNumber || '');
//     let location;
//     if (!preOrderId && SAVE_PAYMENT_MAPPINGS) {
//       const bankOrderId = String(
//         callbackData.orderId || callbackData.bankOrderId || callbackData.mdOrder || ''
//       );
//       if (bankOrderId) {
//         const mapSnap = await db.collection('paymentMappings').doc(bankOrderId).get();
//         if (mapSnap.exists) {
//           ({ preOrderId, location } = mapSnap.data());
//         }
//       }
//     }

//     if (!preOrderId) {
//       return res.status(400).json({ success: false, message: 'Нет orderNumber (preOrderId)' });
//     }

//     if (!location) {
//       const locationDocs = await db.collection('locations').listDocuments();
//       let found = false;
//       for (const locDoc of locationDocs) {
//         const tryRef = locDoc.collection('orders').doc(preOrderId);
//         const trySnap = await tryRef.get();
//         if (trySnap.exists) {
//           location = locDoc.id;
//           found = true;
//           break;
//         }
//       }
//       if (!found) {
//         return res.status(404).json({ success: false, message: "Заказ по preOrderId не найден ни в одной локации" });
//       }
//     }

//     // Обновляем заказ в Firestore (предзаказ в locations/{location}/orders/{preOrderId})
//     const rawStatus = String(callbackData.status ?? callbackData.orderStatus ?? callbackData.paymentState ?? '');
//     const operation = String(callbackData.operation || '').toLowerCase();

//     // Строгая проверка входных данных: обновляем только если явная успешная операция
//     const isApprovedOperation = operation === 'deposited' || operation === 'approved' || operation === 'success';
//     const paidRegex = /^(1|2|3|paid|approved|success|ok)$/i;
//     const failRegex = /^(0|failed|declined|canceled|cancelled|error)$/i;
//     const normalized = paidRegex.test(rawStatus)
//       ? 'Оплачено'
//       : failRegex.test(rawStatus)
//       ? 'Отклонено'
//       : 'Неизвестно';

//     // Идемпотентность: не перетирать уже финальные статусы
//     const orderRef = db
//       .collection('locations')
//       .doc(String(location))
//       .collection('orders')
//       .doc(String(preOrderId));

//     const existingSnap = await orderRef.get();
//     if (!existingSnap.exists) {
//       return res.status(404).json({ success: false, message: 'Заказ не найден для обновления' });
//     }

//     const existing = existingSnap.data() || {};
//     const isFinal = existing.status === 'Оплачено' || existing.status === 'Отклонено';

//     if (!isApprovedOperation && normalized === 'Оплачено') {
//       // Игнорируем несоответствие: статус говорит об оплате, а операция — нет
//       console.warn('Ignoring webhook: operation not approved for paid status', { operation, rawStatus });
//       return res.json({ success: true, ignored: true });
//     }

//     if (isFinal) {
//       // Не перезаписываем финальный статус
//       return res.json({ success: true, idempotent: true });
//     }

//     await orderRef.update({
//       status: normalized,
//       paymentStatus: rawStatus || normalized,
//       updatedAt: new Date(),
//       operation: operation || existing.operation,
//     });

//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });





// exports.notifyPaidOrder = onDocumentUpdated({
//   document: "locations/{location}/orders/{orderId}",
//   secrets: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"]
// }, async (event) => {
//   try {
//     const before = event.data.before?.data() || {};
//     const after = event.data.after?.data() || {};
//     const location = event.params.location;
//     const orderId = event.params.orderId;

//     // Проверяем, что статус изменился на "Оплачено"
//     const prevStatus = before.status;
//     const newStatus = after.status;

//     if (prevStatus !== newStatus && newStatus === "Оплачено") {


//      const deliveryFlag = after.isDelivery ? "🚚 С доставкой" : "🏪 Без доставки";

//       let itemsText = "";
//       if (after.items && Array.isArray(after.items)) {
//         itemsText = after.items.map(item =>
//           `• ${item.name} × ${item.quantity} = ${item.price * item.quantity} ₽`
//         ).join("\n");
//       } else {
//         itemsText = "Товары не указаны";
//       }

//       const displayOrderNumber = after.orderNumber ? `#${String(after.orderNumber).padStart(4, '0')}` : `#${orderId}`;
//       const text = `💸 <b>Оплаченный заказ ${displayOrderNumber}</b>

// 📍 <b>Локация:</b> ${location}
// 👤 <b>Имя:</b> ${after.userName || after.name || "Не указано"}
// 📞 <b>Телефон:</b> ${after.userPhone || after.phone || "Не указан"}
// 💰 <b>Сумма:</b> ${after.total || 0} ₽
// 📦 <b>Статус:</b> ${newStatus}
// ${deliveryFlag}
// 🛍️ <b>Товары:</b>
// ${itemsText}`;

//       const success = await sendTelegramMessage(text);
//       if (success) console.log(`Уведомление о заказе ${orderId} отправлено в Telegram`);
//       else console.error(`Не удалось отправить уведомление о заказе ${orderId}`);
//     }
//   } catch (error) {
//     console.error("Ошибка при отправке уведомления об оплате:", error);
//   }
// });



const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
const fetch = require("node-fetch");

const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { sendTelegramMessage } = require("./telegram");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const cfg = (() => {
  try {
    const c = functions.config();
    return c && typeof c === 'object' ? c : {};
  } catch (e) {
    console.warn('functions.config() is not available; using empty config');
    return {};
  }
})();

const ALFA_LOGIN = process.env.ALFA_LOGIN || cfg.alfa?.login;
const ALFA_PASSWORD = process.env.ALFA_PASSWORD || cfg.alfa?.password;
const ALFA_CALLBACK_SECRET = process.env.ALFA_CALLBACK_SECRET || cfg.alfa?.callback_secret;
const DISABLE_SIGNATURE_VERIFY = process.env.DISABLE_SIGNATURE_VERIFY === 'true' || cfg.alfa?.disable_signature === 'true';
const SAVE_WEBHOOK_LOGS = process.env.SAVE_WEBHOOK_LOGS === 'true' || cfg.alfa?.save_webhook_logs === 'true';
const SAVE_PAYMENT_MAPPINGS = process.env.SAVE_PAYMENT_MAPPINGS === 'true' || cfg.alfa?.save_payment_mappings === 'true';

// ================= CREATE PAYMENT =================
exports.createPayment = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { orderId, amount, description, clientEmail, clientName, location, platform } = req.body;

    if (!orderId || !amount || !clientName || !location) {
      throw new Error("Отсутствуют обязательные поля: orderId, amount, clientName, location");
    }

    const isMobile = platform === 'ios' || platform === 'android';
    const returnUrl = isMobile ? "myapp://payment-success" : "https://vkusno-market.ru/success";
    const failUrl = isMobile ? "myapp://payment-fail" : "https://vkusno-market.ru/fail";

    const response = await fetch("https://payment.alfabank.ru/payment/rest/register.do", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        userName: ALFA_LOGIN,
        password: ALFA_PASSWORD,
        orderNumber: orderId,
        amount: amount * 100,
        returnUrl,
        failUrl,
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
          console.warn('Не удалось сохранить mapping платежа:', e?.message || e);
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

// ================= PAYMENT WEBHOOK =================
exports.paymentWebhook = functions.https.onRequest(async (req, res) => {
  try {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).send('');

    const bodyObj = (typeof req.body === 'object' && Object.keys(req.body).length)
      ? req.body
      : Object.fromEntries(new URLSearchParams(req.rawBody?.toString() || ''));
    const queryObj = req.query || {};
    const callbackData = { ...bodyObj, ...queryObj };

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

    const skipSig = String(callbackData.skipSig || callbackData.skip_signature || '') === '1';
    const hash = crypto.createHmac("sha256", ALFA_CALLBACK_SECRET).update(dataString).digest("hex");
    const isGet = req.method === 'GET';
    const noToken = !signatureFromBank;
    if (!skipSig && !DISABLE_SIGNATURE_VERIFY && !isGet && !noToken && hash !== signatureFromBank) {
      return res.status(403).json({ success: false, message: "Неверная подпись" });
    }

    let preOrderId = String(callbackData.orderNumber || '');
    let location;
    if (!preOrderId && SAVE_PAYMENT_MAPPINGS) {
      const bankOrderId = String(callbackData.orderId || callbackData.bankOrderId || callbackData.mdOrder || '');
      if (bankOrderId) {
        const mapSnap = await db.collection('paymentMappings').doc(bankOrderId).get();
        if (mapSnap.exists) ({ preOrderId, location } = mapSnap.data());
      }
    }

    if (!preOrderId) return res.status(400).json({ success: false, message: 'Нет orderNumber (preOrderId)' });

    if (!location) {
      const locationDocs = await db.collection('locations').listDocuments();
      let found = false;
      for (const locDoc of locationDocs) {
        const trySnap = await locDoc.collection('orders').doc(preOrderId).get();
        if (trySnap.exists) {
          location = locDoc.id;
          found = true;
          break;
        }
      }
      if (!found) return res.status(404).json({ success: false, message: "Заказ не найден ни в одной локации" });
    }

    const rawStatus = String(callbackData.status ?? callbackData.orderStatus ?? callbackData.paymentState ?? '');
    const operation = String(callbackData.operation || '').toLowerCase();
    const isApprovedOperation = operation === 'deposited' || operation === 'approved' || operation === 'success';
    const paidRegex = /^(1|2|3|paid|approved|success|ok)$/i;
    const failRegex = /^(0|failed|declined|canceled|cancelled|error)$/i;
    const normalized = paidRegex.test(rawStatus)
      ? 'Оплачено'
      : failRegex.test(rawStatus)
      ? 'Отклонено'
      : 'Неизвестно';

    const orderRef = db.collection('locations').doc(String(location)).collection('orders').doc(String(preOrderId));
    const existingSnap = await orderRef.get();
    if (!existingSnap.exists) return res.status(404).json({ success: false, message: 'Заказ не найден для обновления' });

    const existing = existingSnap.data() || {};
    const isFinal = existing.status === 'Оплачено' || existing.status === 'Отклонено';
    if (!isApprovedOperation && normalized === 'Оплачено') return res.json({ success: true, ignored: true });
    if (isFinal) return res.json({ success: true, idempotent: true });

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

// ================= NOTIFY PAID ORDER =================
exports.notifyPaidOrder = onDocumentUpdated({
  document: "locations/{location}/orders/{orderId}",
  secrets: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"]
}, async (event) => {
  try {
    const before = event.data.before?.data() || {};
    const after = event.data.after?.data() || {};
    const location = event.params.location;
    const orderId = event.params.orderId;

    if (before.status !== after.status && after.status === "Оплачено") {
      const deliveryFlag = after.isDelivery ? "🚚 С доставкой" : "🏪 Без доставки";

      let itemsText = "";
      if (after.items && Array.isArray(after.items)) {
        itemsText = after.items.map(item => `• ${item.name} × ${item.quantity} = ${item.price * item.quantity} ₽`).join("\n");
      } else itemsText = "Товары не указаны";

      const displayOrderNumber = after.orderNumber ? `#${String(after.orderNumber).padStart(4, '0')}` : `#${orderId}`;
      const text = `💸 <b>Оплаченный заказ ${displayOrderNumber}</b>

📍 <b>Локация:</b> ${location}
👤 <b>Имя:</b> ${after.userName || after.name || "Не указано"}
📞 <b>Телефон:</b> ${after.userPhone || after.phone || "Не указан"}
💰 <b>Сумма:</b> ${after.total || 0} ₽
📦 <b>Статус:</b> ${after.status}
${deliveryFlag}
🛍️ <b>Товары:</b>
${itemsText}`;

      const success = await sendTelegramMessage(text);
      if (success) console.log(`Уведомление о заказе ${orderId} отправлено в Telegram`);
      else console.error(`Не удалось отправить уведомление о заказе ${orderId}`);
    }
  } catch (error) {
    console.error("Ошибка при отправке уведомления об оплате:", error);
  }
});
