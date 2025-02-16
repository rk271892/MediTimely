import express from 'express';
import { notificationController } from '../controllers/notificationController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import User from '../models/User.js';
import { notificationService } from '../services/notificationService.js';
import Notification from '../models/Notification.js';
import { format } from 'date-fns';
import axios from 'axios';
import logger from '../utils/logger.js';

const router = express.Router();

// Initialize Twilio only if credentials are present
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  const twilio = await import('twilio');
  twilioClient = twilio.default(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

// Add helper functions
const localToUTC = (date) => {
  return subHours(date, 5.5); // IST is UTC+5:30
};

const utcToLocal = (date) => {
  return addHours(date, 5.5); // IST is UTC+5:30
};

router.post('/register-fcm', authMiddleware, notificationController.registerFCMToken);
router.post('/schedule', authMiddleware, notificationController.scheduleReminder);
router.post('/complete-telegram-setup', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Send a test message
    const { sendNotification } = require('../controllers/telegramController');
    const testResult = await sendNotification(
      user._id, 
      '✅ Successfully connected to MediTimely!\nYou will receive your medication reminders here.'
    );

    if (!testResult) {
      return res.status(400).json({ 
        success: false, 
        message: 'Could not send test message. Please make sure you started the bot.' 
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/test-telegram', authMiddleware, notificationController.testTelegramNotification);
router.post('/test-whatsapp', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const phone = user.whatsappNumber || user.phone;
    console.log('Testing WhatsApp for phone:', phone);

    const formattedPhone = phone.startsWith('+91') ? phone.slice(3) : phone;

    const payload = {
      messages: [{
        from: process.env.INFOBIP_SENDER,
        to: `91${formattedPhone}`,
        content: {
          text: "🔔 *Test Message*\n\nThis is a test message from your medication reminder app!\n\nStay healthy! 💪"
        }
      }]
    };

    console.log('Sending test message:', {
      url: `https://${process.env.INFOBIP_BASE_URL}/whatsapp/1/message/text`,
      payload
    });

    const response = await axios.post(
      `https://${process.env.INFOBIP_BASE_URL}/whatsapp/1/message/text`,
      payload,
      {
        headers: {
          'Authorization': `App ${process.env.INFOBIP_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    res.json({ 
      success: true, 
      response: response.data,
      message: 'Test message sent successfully'
    });
  } catch (error) {
    console.error('Test failed:', {
      error: error.message,
      response: error.response?.data
    });
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data 
    });
  }
});

router.get('/check', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const notifications = await Notification.find({
      userId: req.user.id,
      status: 'pending'
    }).sort({ scheduledFor: 1 });

    res.json({
      currentTime: now.toISOString(),
      totalPending: notifications.length,
      nextNotifications: notifications.slice(0, 5).map(n => ({
        id: n._id,
        scheduledFor: n.scheduledFor,
        message: n.message
      }))
    });
  } catch (error) {
    console.error('Failed to check notifications:', error);
    res.status(500).json({ message: 'Failed to check notifications' });
  }
});

// Add this route to test Twilio configuration
router.get('/test-config', authMiddleware, async (req, res) => {
  try {
    const config = {
      accountSid: process.env.TWILIO_ACCOUNT_SID ? `...${process.env.TWILIO_ACCOUNT_SID.slice(-4)}` : 'missing',
      authTokenPresent: Boolean(process.env.TWILIO_AUTH_TOKEN),
      whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER,
      twilioInitialized: Boolean(twilioClient)
    };

    res.json({
      message: 'Twilio configuration check',
      config
    });
  } catch (error) {
    console.error('Config check failed:', error);
    res.status(500).json({ 
      message: 'Failed to check configuration',
      error: error.message
    });
  }
});

router.get('/upcoming', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const localNow = utcToLocal(now);
    const endOfDay = new Date(localNow);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('Fetching notifications:', {
      from: format(localNow, 'yyyy-MM-dd HH:mm:ss'),
      to: format(endOfDay, 'yyyy-MM-dd HH:mm:ss'),
      utcFrom: localToUTC(localNow).toISOString(),
      utcTo: localToUTC(endOfDay).toISOString()
    });

    const notifications = await Notification.find({
      userId: req.user.id,
      status: 'pending',
      scheduledFor: {
        $gte: localToUTC(localNow),
        $lte: localToUTC(endOfDay)
      }
    }).sort({ scheduledFor: 1 });

    res.json({
      currentTime: format(localNow, 'yyyy-MM-dd HH:mm:ss'),
      notifications: notifications.map(n => ({
        id: n._id,
        scheduledFor: format(utcToLocal(n.scheduledFor), 'yyyy-MM-dd HH:mm:ss'),
        message: n.message,
        status: n.status,
        telegramChatId: n.telegramChatId
      }))
    });
  } catch (error) {
    console.error('Failed to fetch upcoming notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Add this test endpoint
router.post('/test-message', authMiddleware, async (req, res) => {
  try {
    const response = await notificationService.sendWhatsAppMessage(
      req.user.phone,
      'Time to take Test Medicine (1 tablet). Stay healthy!'
    );
    res.json({ success: true, response });
  } catch (error) {
    console.error('Test message failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// Add this test endpoint
router.post('/test-infobip', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const phone = user.whatsappNumber || user.phone;
    console.log('Testing Infobip WhatsApp for phone:', phone);

    const payload = {
      messages: [{
        from: process.env.INFOBIP_SENDER,
        to: `91${phone.startsWith('+91') ? phone.slice(3) : phone}`,
        content: {
          text: "🔔 *Test Message*\n\nThis is a test message from your medication reminder app!\n\nStay healthy! 💪"
        }
      }]
    };

    const response = await axios.post(
      `${process.env.INFOBIP_BASE_URL}/whatsapp/1/message/text`,
      payload,
      {
        headers: {
          'Authorization': `App ${process.env.INFOBIP_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    res.json({ 
      success: true, 
      response: response.data,
      message: 'Test message sent successfully'
    });
  } catch (error) {
    console.error('Test failed:', {
      error: error.message,
      response: error.response?.data
    });
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// Webhook endpoint for Telegram
router.post('/telegram-webhook', express.json(), async (req, res) => {
  try {
    console.log('Received Telegram webhook:', JSON.stringify(req.body, null, 2));
    
    const { message } = req.body;
    if (!message) {
      console.log('No message in webhook');
      return res.sendStatus(200);
    }

    const chatId = message.chat.id;
    const text = message.text || '';
    
    console.log('Received message:', {
      chatId,
      text,
      from: message.from
    });

    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      const userId = parts[1]; // Get the user ID from /start command

      console.log('Start command received with userId:', userId);

      if (userId) {
        // Find and update the user with their Telegram chat ID
        const user = await User.findByIdAndUpdate(
          userId,
          { telegramChatId: chatId.toString() },
          { new: true }
        );

        console.log('Updated user:', user);

        if (user) {
          await notificationService.sendTelegramMessage(
            chatId,
            "✅ Successfully connected! You'll now receive medication reminders here."
          );
        } else {
          await notificationService.sendTelegramMessage(
            chatId,
            "❌ User not found. Please try connecting again from the app."
          );
        }
      } else {
        await notificationService.sendTelegramMessage(
          chatId,
          "Please connect through the MediTimely app to receive notifications."
        );
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.sendStatus(500);
  }
});

// Test endpoint to verify bot token
router.post('/test-telegram', authMiddleware, async (req, res) => {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    console.log('Testing Telegram bot connection...');
    
    const response = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`);
    console.log('Bot info:', response.data);
    
    res.json({ 
      success: true, 
      botInfo: response.data,
      message: 'Bot is working correctly'
    });
  } catch (error) {
    console.error('Telegram test failed:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.description || error.message 
    });
  }
});

// Add endpoint to get Telegram connect link
router.get('/telegram-link', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const botUsername = 'MediTimely_Bot'; // Your bot username
    const startParameter = userId; // Pass user ID as start parameter
    
    const telegramLink = `https://t.me/${botUsername}?start=${startParameter}`;
    res.json({ link: telegramLink });
  } catch (error) {
    console.error('Error generating Telegram link:', error);
    res.status(500).json({ message: 'Failed to generate Telegram link' });
  }
});

// Add a test endpoint to check time conversion
router.get('/test-time', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const localNow = utcToLocal(now);
    const endWindow = addMinutes(localNow, 15);

    res.json({
      current: {
        utc: now.toISOString(),
        local: format(localNow, 'yyyy-MM-dd HH:mm:ss'),
        utcBack: localToUTC(localNow).toISOString()
      },
      window: {
        utc: localToUTC(endWindow).toISOString(),
        local: format(endWindow, 'yyyy-MM-dd HH:mm:ss')
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete all notifications for the current user
router.delete('/cleanup/user', authMiddleware, async (req, res) => {
  try {
    logger.info('Cleaning up notifications for user:', { userId: req.user.userId });
    
    // Delete all notifications for this user
    const result = await Notification.deleteMany({ userId: req.user.userId });
    
    logger.info('Cleanup completed:', { deletedCount: result.deletedCount });
    res.json({ 
      message: 'User notifications deleted successfully',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    logger.error('Cleanup error:', error);
    res.status(500).json({ message: 'Failed to cleanup notifications' });
  }
});

router.post('/send-sms', authMiddleware, async (req, res) => {
  try {
    if (!twilioClient) {
      return res.status(400).json({ message: 'SMS service not configured' });
    }
    // Your SMS sending logic...
  } catch (error) {
    logger.error('SMS send error:', error);
    res.status(500).json({ message: 'Failed to send SMS' });
  }
});

export default router; 