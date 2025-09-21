const fetch = require("node-fetch");
const { defineSecret } = require("firebase-functions/params");

// Определяем секреты
const telegramBotToken = defineSecret("TELEGRAM_BOT_TOKEN");
const telegramChatId = defineSecret("TELEGRAM_CHAT_ID");

// Отладочная информация
console.log("Telegram config debug:", {
  hasSecretToken: !!telegramBotToken.value(),
  hasSecretChatId: !!telegramChatId.value(),
  finalToken: telegramBotToken.value() ? "SET" : "NOT SET",
  finalChatId: telegramChatId.value() ? "SET" : "NOT SET"
});

/**
 * Отправляет сообщение в Telegram
 * @param {string} text - Текст сообщения
 * @param {string} parseMode - Режим парсинга (HTML, Markdown)
 */
async function sendTelegramMessage(text, parseMode = "HTML") {
  try {
    const botToken = telegramBotToken.value();
    const chatId = telegramChatId.value();
    
    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN не настроен");
      return false;
    }

    if (!chatId) {
      console.error("TELEGRAM_CHAT_ID не настроен");
      return false;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: parseMode,
      }),
    });

    const result = await response.json();
    
    if (result.ok) {
      console.log("Сообщение успешно отправлено в Telegram");
      return true;
    } else {
      console.error("Ошибка отправки в Telegram:", result);
      return false;
    }
  } catch (error) {
    console.error("Ошибка при отправке сообщения в Telegram:", error);
    return false;
  }
}

module.exports = {
  sendTelegramMessage,
};