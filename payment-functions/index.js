const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const fetch = require("node-fetch");

// Настройки для контроля стоимости
setGlobalOptions({ maxInstances: 10 });

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
    const { orderId, amount, description, clientEmail, clientName, items } = request.body;

    // Проверяем обязательные поля
    if (!orderId || !amount || !clientName) {
      throw new Error('Отсутствуют обязательные поля: orderId, amount, clientName');
    }

    logger.info('Создание платежа', { orderId, amount, clientName });

    // TODO: Замените на реальные данные от Альфа-Банка
    const paykeeperUrl = 'https://demo.alfa-processing.ru'; // URL вашего PayKeeper сервера
    const login = 'demo'; // Логин от Альфа-Банка
    const password = 'demo'; // Пароль от Альфа-Банка

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

    if (paymentData.result === 'success') {
      logger.info('Платеж создан успешно', { paymentId: paymentData.id });
      
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
    const { orderId, status, paymentId } = request.body;
    
    logger.info('Получено уведомление об оплате', { orderId, status, paymentId });

    // TODO: Обновите статус заказа в вашей базе данных
    // Здесь должен быть код для обновления Firestore
    
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