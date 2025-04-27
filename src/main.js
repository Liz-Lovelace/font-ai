import 'dotenv/config';
import { startTelegramBot } from './bot.js';

// Ensure the required environment variables are set
if (!process.env.OPENAI_API_TOKEN || !process.env.TELEGRAM_BOT_TOKEN) {
  console.error('Error: Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

console.log('Starting Telegram bot...');
startTelegramBot(); 