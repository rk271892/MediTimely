import User from '../models/User.js';
import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Initializing Telegram bot...');

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
  process.exit(1);
}

console.log('Bot token loaded:', process.env.TELEGRAM_BOT_TOKEN.slice(0, 10) + '...');

// Handle /start command
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { 
  polling: true,
  webHook: false
});

bot.getMe().then(botInfo => {
  console.log('Bot initialized successfully:', {
    username: botInfo.username,
    firstName: botInfo.first_name,
    canJoinGroups: botInfo.can_join_groups,
    canReadMessages: botInfo.can_read_all_group_messages
  });
}).catch(error => {
  console.error('Failed to initialize bot:', error);
  process.exit(1);
});

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  console.log('New user started bot:', chatId);
  
  try {
    // Store the chat ID temporarily
    await User.findOneAndUpdate(
      { telegramUsername: msg.from.username },
      { 
        telegramChatId: chatId,
        telegramUsername: msg.from.username,
        $setOnInsert: {
          name: msg.from.first_name || 'Telegram User',
          email: `${msg.from.username}@telegram.com`,
          password: Math.random().toString(36).slice(-8)
        }
      },
      { 
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );
    
    bot.sendMessage(chatId, 'Welcome to MediTimely! You will now receive medication reminders here.');
  } catch (error) {
    console.error('Error saving telegram chat ID:', error);
    bot.sendMessage(chatId, 'Sorry, there was an error setting up your notifications.');
  }
});

// Function to send notification
const sendNotification = async (userId, message) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.telegramChatId) {
      console.error('Cannot send notification: User not found or Telegram not connected', {
        userId,
        telegramChatId: user?.telegramChatId
      });
      throw new Error('User not found or Telegram not connected');
    }

    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN is not configured');
      throw new Error('Telegram bot token not configured');
    }

    console.log('Attempting to send Telegram message:', {
      chatId: user.telegramChatId,
      messagePreview: message.slice(0, 50) + '...',
      botToken: process.env.TELEGRAM_BOT_TOKEN.slice(0, 10) + '...'
    });

    const response = await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: user.telegramChatId,
        text: message,
        parse_mode: 'HTML',
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [
              { text: "✅ Taken", callback_data: "medicine_taken" },
              { text: "⏰ Remind in 5min", callback_data: "remind_later" }
            ]
          ]
        })
      }
    );

    console.log('Telegram API response:', {
      ok: response.data.ok,
      messageId: response.data.result?.message_id,
      chatId: response.data.result?.chat?.id
    });

    return true;
  } catch (error) {
    const errorDetails = {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      userId,
      telegramError: error.response?.data?.description
    };
    console.error('Failed to send Telegram notification:', errorDetails);
    return false;
  }
};

export { sendNotification, bot }; 