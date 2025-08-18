const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
try { admin.app(); } catch (_) { admin.initializeApp(); }
const db = admin.firestore();

// Настройки для контроля стоимости и региона
setGlobalOptions({ region: "us-central1", maxInstances: 10 });

// Получение настроек PayKeeper из env или functions:config
function getPaykeeperConfig() {
  const envCfg = {
    url: process.env.PAYKEEPER_URL,
    login: process.env.PAYKEEPER_LOGIN,
    password: process.env.PAYKEEPER_PASSWORD,
    token: process.env.PAYKEEPER_TOKEN,
  };
  let runtimeCfg = {};
  try {
    runtimeCfg = (require("firebase-functions").config().paykeeper) || {};
  } catch (_) {
    runtimeCfg = {};
  }
  const url = envCfg.url || runtimeCfg.url;
  const login = envCfg.login || runtimeCfg.login;
  const password = envCfg.password || runtimeCfg.password;
  const token = envCfg.token || runtimeCfg.token;
  if (!url || !login || !password) {
    throw new Error("PAYKEEPER_URL/LOGIN/PASSWORD не заданы в конфигурации функций");
  }
  return { url, login, password, token };
}

// Функция создания платежа через API Альфа-Банка
exports.createPayment = onRequest(async (request, response) => {
  // Разрешаем CORS для веб-приложения
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type');

  // Обрабатываем preflight запрос
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  try {
    // Получаем данные из запроса
    const { orderId, amount, description, clientEmail, clientName, items, location, orderPath } = request.body;

    // Проверяем обязательные поля
    if (!orderId || !amount || !clientName) {
      throw new Error('Отсутствуют обязательные поля: orderId, amount, clientName');
    }

    logger.info('Создание платежа', { orderId, amount, clientName });

    // Пробуем взять реальные креды; если их нет или включён мок-режим — вернём тестовую ссылку
    let paykeeperUrl, login, password, token;
    let useMock = false;
    try {
      const cfg = getPaykeeperConfig();
      paykeeperUrl = cfg.url;
      login = cfg.login;
      password = cfg.password;
      token = cfg.token;
    } catch (e) {
      useMock = true;
    }
    if (String(process.env.PAYKEEPER_MOCK).toLowerCase() === 'true') {
      useMock = true;
    }

    if (useMock) {
      // Возвращаем валидный ответ с «ссылкой на оплату» для ручного теста UI
      const mockPaymentId = `mock-${Date.now()}`;
      // Обновим заказ (если нам передали его местоположение)
      const targetPath = orderPath || (location && orderId ? `locations/${location}/orders/${orderId}` : null);
      if (targetPath) {
        await db.doc(targetPath).set({
          paymentStatus: "pending",
          paymentId: mockPaymentId,
          paymentUrl: 'https://demo.alfa-processing.ru/payments/payments/',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        await db.collection("payments").doc(String(mockPaymentId)).set({
          orderPath: targetPath,
          orderId,
          amount,
          status: "pending",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
      response.json({
        success: true,
        paymentUrl: 'https://demo.alfa-processing.ru/payments/payments/',
        paymentId: mockPaymentId,
        message: 'MOCK: возвращена тестовая ссылка без обращения к API',
      });
      return;
    }

    // Создаем счет через API PayKeeper
    const paymentResponse = await fetch(`${paykeeperUrl}/api/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64')
      },
      body: new URLSearchParams({
        clientid: clientName,
        orderid: orderId,
        sum: amount,
        service_name: description || `Заказ #${orderId}`,
        client_email: clientEmail || '',
        ...(token ? { token } : {}),
        // Дополнительные параметры для товаров
        ...(items && items.reduce((acc, item, index) => ({
          ...acc,
          [`item_${index + 1}_name`]: item.name,
          [`item_${index + 1}_price`]: item.price,
          [`item_${index + 1}_quantity`]: item.quantity,
        }), {}))
      })
    });

    const paymentData = await paymentResponse.json();

    if (!paymentResponse.ok) {
      throw new Error(paymentData && paymentData.msg ? paymentData.msg : `PayKeeper HTTP ${paymentResponse.status}`);
    }

    if (paymentData.result === 'success') {
      logger.info('Платеж создан успешно', { paymentId: paymentData.id });
      const targetPath = orderPath || (location && orderId ? `locations/${location}/orders/${orderId}` : null);
      if (targetPath) {
        await db.doc(targetPath).set({
          paymentStatus: "pending",
          paymentId: paymentData.id,
          paymentUrl: paymentData.payment_url,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        await db.collection("payments").doc(String(paymentData.id)).set({
          orderPath: targetPath,
          orderId,
          amount,
          status: "pending",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
      
      // Возвращаем URL для оплаты
      response.json({
        success: true,
        paymentUrl: paymentData.payment_url,
        paymentId: paymentData.id,
        message: 'Платеж создан успешно'
      });
    } else {
      throw new Error(paymentData.msg || 'Ошибка создания платежа');
    }

  } catch (error) {
    logger.error('Ошибка создания платежа', { error: error.message });
    
    response.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Функция обработки уведомлений об оплате (webhook)
exports.paymentWebhook = onRequest(async (request, response) => {
  try {
    const body = request.body || {};
    const paymentId = body.id || body.payment_id || body.invoice_id || body.paymentId;
    const statusRaw = body.status || body.payment_status || body.result;
    const isSuccess = String(statusRaw).toLowerCase() === "success" || String(statusRaw).toLowerCase() === "paid";

    logger.info('Получено уведомление об оплате', { paymentId, statusRaw });

    if (paymentId) {
      const mapSnap = await db.collection("payments").doc(String(paymentId)).get();
      if (mapSnap.exists) {
        const { orderPath } = mapSnap.data();
        if (orderPath) {
          await db.doc(orderPath).set({
            paymentStatus: isSuccess ? "paid" : "failed",
            paidAt: isSuccess ? admin.firestore.FieldValue.serverTimestamp() : null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
      }
      // Сохраним сырой payload для аудита
      await db.collection("payments_webhooks").doc(String(paymentId))
        .collection("events").add({
          payload: body,
          receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    response.json({ success: true, message: 'Уведомление обработано' });
    
  } catch (error) {
    logger.error('Ошибка обработки webhook', { error: error.message });
    response.status(500).json({ success: false, message: error.message });
  }
});

// Тестовая функция для проверки
exports.helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.json({
    message: "Hello from Firebase Functions!",
    timestamp: new Date().toISOString(),
    project: "bistro-app-acfb4"
  });
});