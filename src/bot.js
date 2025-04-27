import TelegramBot from 'node-telegram-bot-api';
import { preparePrompt } from './ai.js';

/**
 * Starts the Telegram bot and sets up message handlers
 */
export function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const bot = new TelegramBot(token, { polling: true });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;

    if (!userMessage) {
      return;
    }

    // Show "typing..." status while processing
    bot.sendChatAction(chatId, 'typing');

    try {
      // Get response from OpenAI
      const response = await preparePrompt(userMessage);
      
      // Send the response back to the user
      await bot.sendMessage(chatId, response);
    } catch (error) {
      console.error('Error processing message:', error);
      await bot.sendMessage(chatId, 'Sorry, I encountered an error while processing your message.');
    }
  });

  bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
  });

  console.log('Bot is running...');
} 