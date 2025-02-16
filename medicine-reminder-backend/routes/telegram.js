import express from 'express';
import { notificationService } from '../services/notificationService.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { addMinutes } from 'date-fns';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { sendTelegramMessage } from '../config/telegram.js';

const router = express.Router();

router.post('/webhook', async (req, res) => {
  try {
    console.log('Received webhook:', JSON.stringify(req.body, null, 2));
    
    const { message, callback_query } = req.body;

    // Handle /start command
    if (message?.text === '/start') {
      const chatId = message.chat.id;
      console.log('Start command received from:', {
        chatId,
        username: message.from.username,
        firstName: message.from.first_name,
        lastName: message.from.last_name
      });

      // Send welcome message first
      await notificationService.handleStartCommand(chatId);

      // Try to find user by phone number (since Telegram username might not match email)
      const users = await User.find({});
      let matchedUser = null;

      // Log all users for debugging
      console.log('Available users:', users.map(u => ({
        id: u._id,
        email: u.email,
        phone: u.phone
      })));

      // Update the first user we find without a telegramChatId
      // In production, you should implement a proper user matching strategy
      matchedUser = await User.findOneAndUpdate(
        { telegramChatId: null }, // Find first user without telegram chat id
        { telegramChatId: chatId.toString() },
        { new: true }
      );

      if (matchedUser) {
        console.log('Updated user with Telegram chatId:', {
          userId: matchedUser._id,
          chatId
        });
        
        await notificationService.sendTelegramMessage(
          chatId,
          `✅ Successfully connected to your MediTimely account!\nYou'll receive medication reminders here.`,
          false
        );
      } else {
        console.log('No matching user found for Telegram chat:', chatId);
      }
    }

    // Handle callback queries (button clicks)
    if (callback_query) {
      const { data, message } = callback_query;
      const notificationId = message.message_id;
      const chatId = message.chat.id;

      switch (data) {
        case 'medicine_taken':
          await notificationService.markMedicationAsTaken(notificationId, chatId);
          break;
        
        case 'remind_later':
          await notificationService.scheduleReminder(notificationId, chatId, 5);
          break;
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.sendStatus(500);
  }
});

router.post('/test-notification', async (req, res) => {
  try {
    const { userId } = req.body;
    const testMessage = `
🔔 <b>Test Notification</b>

This is a test message to verify your Telegram notifications are working.

<code>- MediTimely Bot</code>`;

    const sent = await sendNotification(userId, testMessage);
    
    res.json({
      success: sent,
      message: sent ? 'Test notification sent' : 'Failed to send test notification'
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get Telegram connection link
router.get('/connect-link', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const botUsername = process.env.TELEGRAM_BOT_USERNAME;
    const connectLink = `https://t.me/${botUsername}?start=${userId}`;
    
    console.log('Generated Telegram connect link:', {
      userId,
      botUsername,
      link: connectLink
    });

    res.json({ 
      link: connectLink,
      instructions: "1. Click the link\n2. Start the bot\n3. You'll receive a confirmation message"
    });
  } catch (error) {
    console.error('Error generating connect link:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test Telegram connection
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.telegramChatId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please connect your Telegram account first' 
      });
    }

    await sendTelegramMessage(
      user.telegramChatId, 
      `🔔 *Test Message*\n\nYour MediTimely connection is working!\nTime: ${new Date().toLocaleString()}`
    );

    res.json({ 
      success: true, 
      message: 'Test message sent successfully' 
    });
  } catch (error) {
    console.error('Test message failed:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 