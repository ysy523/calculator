const TelegramBot = require('node-telegram-bot-api');

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your actual Telegram bot token
const bot = new TelegramBot('7070539474:AAFLAyrf0StDd6W9LCgkR1z6N6FpvL-zkJE', { polling: true });

bot.on('message', (msg) => {
  console.log(msg);
});
