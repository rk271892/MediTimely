import User from '../models/User.js';
import Medication from '../models/Medication.js';
import { notificationService } from '../services/notificationService.js';
import axios from 'axios';

export const notificationController = {
  async registerDevice(req, res) {
    try {
      const { userId, fcmToken } = req.body;
      
      await User.findByIdAndUpdate(userId, {
        fcmToken: fcmToken
      });

      res.json({ message: 'Device registered successfully' });
    } catch (error) {
      console.error('Register device error:', error);
      res.status(500).json({ message: 'Failed to register device' });
    }
  },

  async scheduleReminder(req, res) {
    try {
      const { medicationId, time } = req.body;
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await notificationService.scheduleNotification({
        userId: user._id,
        medicationId,
        time,
        telegramChatId: user.telegramChatId
      });

      res.json({ message: 'Reminder scheduled successfully' });
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
      res.status(500).json({ message: 'Failed to schedule reminder' });
    }
  },

  async sendTelegramMessage(chatId, message) {
    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      throw error;
    }
  },

  async completeTelegramSetup(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Get updates from Telegram
      const response = await axios.get(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getUpdates`
      );
      
      console.log('Telegram updates:', response.data);

      if (!response.data.ok || !response.data.result.length) {
        return res.json({ 
          success: false, 
          message: 'No Telegram updates found. Please send /start to the bot first.' 
        });
      }

      // Get the most recent chat ID
      const updates = response.data.result;
      const lastUpdate = updates[updates.length - 1];
      const chatId = lastUpdate.message.chat.id;

      // Update user with Telegram chat ID
      user.telegramChatId = chatId.toString();
      await user.save();

      // Send test message
      await this.sendTelegramMessage(
        chatId,
        "✅ Successfully connected! You'll now receive medication reminders here."
      );

      res.json({ success: true, message: 'Successfully connected to Telegram' });
    } catch (error) {
      console.error('Complete setup error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async testTelegramNotification(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user?.telegramChatId) {
        return res.status(400).json({ 
          message: 'No Telegram chat ID found. Please connect Telegram first.' 
        });
      }

      await this.sendTelegramMessage(
        user.telegramChatId,
        "🔔 Test message from MediTimely!\n\nIf you see this, your notifications are working correctly!"
      );

      res.json({ success: true, message: 'Test message sent successfully' });
    } catch (error) {
      console.error('Test message failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async registerFCMToken(req, res) {
    try {
      const { token } = req.body;
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.fcmToken = token;
      await user.save();

      res.json({ message: 'FCM token registered successfully' });
    } catch (error) {
      console.error('Failed to register FCM token:', error);
      res.status(500).json({ message: 'Failed to register FCM token' });
    }
  }
}; 