const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
const fetch = require("node-fetch");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// Берём данные из environment variables
const ALFA_LOGIN = process.env.ALFA_LOGIN;
const ALFA_PASSWORD = process.env.ALFA_PASSWORD;
const ALFA_CALLBACK_SECRET = process.env.ALFA_CALLBACK_SECRET;

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
    const { orderId, amount, description, clientEmail, clientName } = req.body;

    if (!orderId || !amount || !clientName) {
      throw new Error("Отсутствуют обязательные поля: orderId, amount, clientName");
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
    const callbackData = req.body;

    const signatureFromBank = callbackData.token;
    const dataString = Object.keys(callbackData)
      .filter(k => k !== "token")
      .sort()
      .map(k => `${callbackData[k]}`)
      .join("");

    // Проверяем подпись
    const hash = crypto.createHmac("sha256", ALFA_CALLBACK_SECRET).update(dataString).digest("hex");
    if (hash !== signatureFromBank) {
      return res.status(403).json({ success: false, message: "Неверная подпись" });
    }

    // Обновляем заказ в Firestore
    const orderNumber = callbackData.orderNumber;
    const status = callbackData.status;

    await db.collection("orders").doc(orderNumber).update({
      paymentStatus: status,
      updatedAt: new Date(),
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});