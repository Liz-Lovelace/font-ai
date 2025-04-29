import TelegramBot from 'node-telegram-bot-api';
import { preparePrompt, generateImageFromPrompt } from './ai.js';

// Define admin chat IDs
const adminChatIds = [5101585056, 1311788757];

// Initialize admin bot instance (ensure TELEGRAM_BOT_TOKEN_ADMIN_PANEL is set in your .env)
let adminBot;
if (process.env.TELEGRAM_BOT_TOKEN_ADMIN_PANEL) {
  adminBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN_ADMIN_PANEL);
  console.log('Admin bot initialized.');
} else {
  console.warn('TELEGRAM_BOT_TOKEN_ADMIN_PANEL not set. Admin notifications will be disabled.');
}

// Function to send messages/photos to admin panels
async function sendToAdminPanels({ text, imageBuffer, username }) {
  if (!adminBot) return; // Don't proceed if admin bot wasn't initialized

  const messageSuffix = `\n\nUser: @${username || 'Unknown'}`;
  const fullText = `${text}${messageSuffix}`;

  for (const chatId of adminChatIds) {
    try {
      if (imageBuffer) {
        await adminBot.sendPhoto(chatId, imageBuffer, { caption: fullText }, { filename: 'font-sample-image', contentType: 'image/png' });
      } else {
        await adminBot.sendMessage(chatId, fullText);
      }
    } catch (error) {
      console.error(`Error sending message to admin chat ID ${chatId}:`, error);
      // Decide if you want to notify the main bot or handle silently
    }
  }
}

// Function to get username safely
function getUsername(msg) {
    const from = msg.from || msg.message?.chat; // Handle both message and callback_query
    if (!from) return 'Unknown';
    return from.username || `${from.first_name || ''} ${from.last_name || ''}`.trim() || `ID:${from.id}`;
}

export function startTelegramBot() {
  const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendPhoto(chatId, 'assets/start-image.png', {
      caption: 'Welcome to AI Font Generator\n\nDescribe your font'
    });
  });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;
    const username = getUsername(msg); // Use helper function

    if (!userMessage || userMessage === '/start') {
      return;
    }

    // Send user message to admins
    await sendToAdminPanels({ text: `Received message: "${userMessage}"`, username });

    try {
      await bot.sendMessage(chatId, 'Please wait while I create your font... Usually takes 1-5 minutes.');
      
      const prompt = await preparePrompt(userMessage);
      console.log('Prompt for image generation:', prompt);

      // Send generated prompt to admins
      await sendToAdminPanels({ text: `Generated prompt: "${prompt}"`, username });

      const imageBuffer = await generateImageFromPrompt(prompt);

      // Send generated image to admins
      await sendToAdminPanels({ text: `Generated image`, imageBuffer, username });

      // Send photo with inline keyboard button
      await bot.sendPhoto(chatId, imageBuffer, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Convert to editable font file',
                callback_data: 'convert_font_start'
              }
            ]
          ]
        }
      }, { filename: 'font-sample-image', contentType: 'image/png' });

    } catch (error) {
      console.error('Error processing message:', error);
      // Optionally send error details to admins as well
      await sendToAdminPanels({ text: `Error processing message for user @${username}:\n${error.message || error}`, username });
      await bot.sendMessage(chatId, 'Whoops, something broke!');
    }
  });

  // Handle button clicks (callback queries)
  bot.on('callback_query', async (callbackQuery) => {
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const data = callbackQuery.data;
    const username = getUsername(callbackQuery); // Get username from callback query context

    try {
      // Always answer the callback query first to remove the loading state
      await bot.answerCallbackQuery(callbackQuery.id);

      if (data === 'convert_font_start') {
        await bot.sendMessage(chatId, 'This feature is being developed, and is done by hand for now. This will take from an hour to one day.\n\nContinue?', {
          reply_markup: {
            inline_keyboard: [
              [
                { text: 'Yes', callback_data: 'convert_font_yes' },
                { text: 'No', callback_data: 'convert_font_no' }
              ]
            ]
          }
        });
        // Remove the 'Convert' button from the original photo message
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
           chat_id: chatId,
           message_id: message.message_id
        });
      } else if (data === 'convert_font_yes') {
        // Send a new message instead of editing
        await bot.sendMessage(chatId, 'Ok, we will contact you soon. While waiting, you can try new prompts. If you have any question, you can contact @tim_sign');
        // Remove the Yes/No buttons from the confirmation message
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
          chat_id: chatId,
          message_id: message.message_id
        });
        // Notify admins
        await sendToAdminPanels({ text: `User @${username} clicked YES to manual font conversion.`, username });
      } else if (data === 'convert_font_no') {
        // Send a new message instead of editing
        await bot.sendMessage(chatId, 'Ok, you can send a new prompt');
        // Remove the Yes/No buttons from the confirmation message
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
           chat_id: chatId,
           message_id: message.message_id
        });
      }
    } catch (error) {
        console.error('Error processing callback query:', error);
        // Send a generic error message to the user for callback errors
        await bot.sendMessage(chatId, 'Sorry, something went wrong processing that action.');
        // Optionally notify admins about callback errors
        await sendToAdminPanels({ text: `Error processing callback '${data}' for user @${username}:\n${error.message || error}`, username });
    }
  });

  bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
  });

  console.log('Bot is running...');
} 