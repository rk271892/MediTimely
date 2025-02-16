import { Telegraf } from 'telegraf';
import axios from 'axios';

let bot = null;
let isRunning = false;

async function clearWebhook(token) {
  try {
    await axios.get(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`);
    console.log('Webhook cleared successfully');
  } catch (error) {
    console.error('Error clearing webhook:', error.message);
  }
}

async function initializeBot() {
  try {
    if (bot) {
      try {
        await bot.stop();
        isRunning = false;
      } catch (error) {
        console.log('Error stopping existing bot:', error);
      }
    }

    console.log('Initializing Telegram bot...');
    
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not defined');
    }

    // Clear any existing webhook
    await clearWebhook(token);

    // Create new bot instance
    bot = new Telegraf(token, {
      handlerTimeout: 90000,
      polling: false
    });

    // Basic error handling
    bot.catch((err, ctx) => {
      console.error('Bot error:', err);
    });

    // Test command
    bot.command('test', async (ctx) => {
      try {
        await ctx.reply('Bot is working! 👍');
      } catch (error) {
        console.error('Error sending test message:', error);
      }
    });

    // Just use the telegram API directly for sending messages
    const botInfo = await bot.telegram.getMe();
    console.log('Bot info:', botInfo);

    // Don't use polling, just initialize the bot
    bot.telegram.deleteWebhook({ drop_pending_updates: true });

    console.log('Bot initialized successfully');
    isRunning = true;

    return bot;
  } catch (error) {
    console.error('Bot initialization error:', error);
    bot = null;
    isRunning = false;
    throw error;
  }
}

export async function getBot() {
  if (!bot) {
    return initializeBot();
  }
  return bot;
}

export async function stopBot() {
  if (bot && isRunning) {
    try {
      await bot.stop();
      isRunning = false;
      console.log('Bot stopped successfully');
    } catch (error) {
      console.error('Error stopping bot:', error);
    }
  }
}

// Don't auto-initialize, let it initialize on first use
export async function sendTelegramMessage(chatId, message) {
  try {
    const botInstance = await getBot();
    return await botInstance.telegram.sendMessage(chatId, message, {
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    throw error;
  }
} 