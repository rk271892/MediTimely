import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { adminMiddleware } from '../middlewares/adminMiddleware.js';
import User from '../models/User.js';
import Medication from '../models/Medication.js';
import Notification from '../models/Notification.js';
import authController from '../controllers/authController.js';
import { getBot, sendTelegramMessage } from '../config/telegram.js';

const router = express.Router();

// Admin login route - no middleware needed
router.post('/login', authController.adminLogin);

// Combined middleware for protected routes
const protectAdminRoute = [authMiddleware, adminMiddleware, authController.verifyAdminToken];

// Apply protection to specific routes
router.get('/stats', protectAdminRoute, async (req, res) => {
  try {
    console.log('Fetching admin stats');
    const [
      totalUsers,
      totalMedications,
      activeNotifications,
      completedReminders
    ] = await Promise.all([
      User.countDocuments(),
      Medication.countDocuments(),
      Notification.countDocuments({ status: 'pending' }),
      Notification.countDocuments({ status: 'taken' })
    ]);

    res.json({
      totalUsers,
      totalMedications,
      activeNotifications,
      completedReminders
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
});

// Get all users
router.get('/users', protectAdminRoute, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Delete user
router.delete('/users/:id', protectAdminRoute, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Add this route to your admin routes
router.get('/me', protectAdminRoute, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: { ...user.toObject(), isAdmin: true } });
  } catch (error) {
    console.error('Get admin user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all medications (admin)
router.get('/medications', protectAdminRoute, async (req, res) => {
  try {
    console.log('Fetching medications for admin');
    
    const medications = await Medication.find()
      .populate({
        path: 'userId',
        select: 'name email'
      })
      .sort({ createdAt: -1 });

    console.log('Found medications:', medications.length);
    res.json(medications);
  } catch (error) {
    console.error('Admin medications error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch medications',
      error: error.message 
    });
  }
});

// Delete medication (admin)
router.delete('/medications/:id', protectAdminRoute, async (req, res) => {
  try {
    console.log('Deleting medication:', req.params.id);
    
    const medication = await Medication.findById(req.params.id);
    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    // Delete associated notifications
    await Notification.deleteMany({ medication: medication._id });
    
    // Delete the medication
    await Medication.findByIdAndDelete(req.params.id);

    res.json({ message: 'Medication deleted successfully' });
  } catch (error) {
    console.error('Delete medication error:', error);
    res.status(500).json({ 
      message: 'Failed to delete medication',
      error: error.message 
    });
  }
});

// Update medication status (admin)
router.patch('/medications/:id/status', protectAdminRoute, async (req, res) => {
  try {
    console.log('Updating medication status:', {
      id: req.params.id,
      active: req.body.active
    });

    const medication = await Medication.findByIdAndUpdate(
      req.params.id,
      { active: req.body.active },
      { 
        new: true,
        runValidators: true
      }
    ).populate('userId', 'name email');

    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    res.json(medication);
  } catch (error) {
    console.error('Update medication status error:', error);
    res.status(500).json({ 
      message: 'Failed to update medication status',
      error: error.message 
    });
  }
});

// Get medication details (admin)
router.get('/medications/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id)
      .populate('userId', 'name email');

    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    res.json(medication);
  } catch (error) {
    console.error('Failed to fetch medication:', error);
    res.status(500).json({ message: 'Failed to fetch medication' });
  }
});

// Get all notifications (admin)
router.get('/notifications', protectAdminRoute, async (req, res) => {
  try {
    console.log('Fetching notifications for admin');
    
    const notifications = await Notification.find()
      .populate({
        path: 'userId',
        select: 'name email'
      })
      .populate({
        path: 'medicationId',
        select: 'name dosage'
      })
      .sort({ scheduledFor: -1 });

    console.log('Found notifications:', notifications.length);
    res.json(notifications);
  } catch (error) {
    console.error('Admin notifications error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch notifications',
      error: error.message 
    });
  }
});

// Resend notification (admin)
router.post('/notifications/:id/resend', protectAdminRoute, async (req, res) => {
  try {
    console.log('Resending notification:', req.params.id);
    
    const notification = await Notification.findById(req.params.id)
      .populate('userId')
      .populate('medicationId');

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Create a new notification based on the old one
    const newNotification = new Notification({
      userId: notification.userId._id,
      medicationId: notification.medicationId._id,
      scheduledFor: new Date(), // Schedule for now
      status: 'pending',
      type: notification.type
    });

    await newNotification.save();

    // Attempt to send the notification immediately
    try {
      // You'll need to implement this function based on your notification service
      await sendNotification(newNotification);
      newNotification.status = 'sent';
      await newNotification.save();
    } catch (sendError) {
      console.error('Failed to send notification:', sendError);
      // Keep the status as pending if sending fails
    }

    res.json(newNotification);
  } catch (error) {
    console.error('Resend notification error:', error);
    res.status(500).json({ 
      message: 'Failed to resend notification',
      error: error.message 
    });
  }
});

// Delete notification (admin)
router.delete('/notifications/:id', protectAdminRoute, async (req, res) => {
  try {
    console.log('Deleting notification:', req.params.id);
    
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ 
      message: 'Failed to delete notification',
      error: error.message 
    });
  }
});

// Update notification status (admin)
router.patch('/notifications/:id/status', protectAdminRoute, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'sent', 'failed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
    .populate('userId', 'name email')
    .populate('medicationId', 'name dosage');

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Update notification status error:', error);
    res.status(500).json({ 
      message: 'Failed to update notification status',
      error: error.message 
    });
  }
});

// Broadcast message to users
router.post('/broadcast', protectAdminRoute, async (req, res) => {
  try {
    const { title, content, type, targetUsers } = req.body;
    console.log('Received broadcast request:', { title, content, type, targetUsers });

    // Get target users based on criteria
    let userQuery = {};
    if (targetUsers === 'active') {
      userQuery.lastActive = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    } else if (targetUsers === 'inactive') {
      userQuery.lastActive = { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }

    const users = await User.find(userQuery);
    console.log(`Found ${users.length} users for broadcast`);

    // Create notifications for each user
    const notifications = [];
    const currentTime = new Date();
    
    for (const user of users) {
      // Base notification for broadcast
      const baseNotification = {
        userId: user._id,
        message: content,
        scheduledFor: currentTime,
        status: 'pending',
        metadata: {
          isSystemBroadcast: true,
          title: title,
          originalContent: content,
          broadcastType: type
        }
      };

      // Add notifications based on type
      if (type === 'all' || type === 'email') {
        notifications.push({
          ...baseNotification,
          type: 'email'
        });
      }
      if (type === 'all' || type === 'sms') {
        notifications.push({
          ...baseNotification,
          type: 'sms'
        });
      }
      if ((type === 'all' || type === 'telegram') && user.telegramChatId) {
        notifications.push({
          ...baseNotification,
          type: 'push',
          telegramChatId: user.telegramChatId
        });
      }
    }

    console.log('Created notifications:', notifications.length);

    // Save all notifications
    const savedNotifications = await Notification.insertMany(notifications);
    console.log('Saved notifications:', savedNotifications.length);

    // Send Telegram messages immediately
    for (const notification of savedNotifications) {
      if (notification.type === 'push' && notification.telegramChatId) {
        try {
          const messageText = `
🔔 *${notification.metadata.title}*

${notification.message}

_Sent from MediTimely Admin_`;

          await sendTelegramMessage(notification.telegramChatId, messageText);
          
          await Notification.findByIdAndUpdate(
            notification._id,
            { status: 'sent', sentAt: new Date() }
          );
        } catch (error) {
          console.error(`Failed to send Telegram message:`, error);
          await Notification.findByIdAndUpdate(
            notification._id,
            { status: 'failed', error: error.message }
          );
        }
      }
    }

    res.json({ 
      success: true,
      message: 'Broadcast sent successfully',
      notificationCount: savedNotifications.length,
      userCount: users.length
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send broadcast',
      error: error.message 
    });
  }
});

// Helper function to send notification
async function sendNotification(notification) {
  // Implement your notification sending logic here
  // This could involve sending emails, SMS, push notifications, etc.
  // For now, we'll just log it
  console.log('Sending notification:', {
    userId: notification.userId,
    medicationId: notification.medicationId,
    scheduledFor: notification.scheduledFor,
    type: notification.type
  });
}

// Add this route to check Telegram setup
router.get('/telegram-status', protectAdminRoute, async (req, res) => {
  try {
    const users = await User.find().select('name email telegramChatId');
    const botInfo = await getBot().telegram.getMe();
    
    res.json({
      botInfo,
      users: users.map(user => ({
        name: user.name,
        email: user.email,
        hasTelegram: !!user.telegramChatId,
        telegramChatId: user.telegramChatId
      }))
    });
  } catch (error) {
    console.error('Telegram status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add this route to check user Telegram IDs
router.get('/check-telegram-users', protectAdminRoute, async (req, res) => {
  try {
    const users = await User.find();
    const userDetails = users.map(user => ({
      name: user.name,
      email: user.email,
      telegramChatId: user.telegramChatId || 'Not set'
    }));
    
    console.log('User Telegram details:', userDetails);
    res.json(userDetails);
  } catch (error) {
    console.error('Error checking telegram users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test Telegram connection
router.post('/test-telegram', protectAdminRoute, async (req, res) => {
  try {
    const { chatId } = req.body;
    
    await sendTelegramMessage(chatId, '🤖 *Test Message*\n\nYour MediTimely bot is working!');
    
    res.json({
      success: true,
      message: 'Test message sent successfully'
    });
  } catch (error) {
    console.error('Test telegram error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add this route to check user setup
router.get('/check-user-setup', protectAdminRoute, async (req, res) => {
  try {
    const bot = await getBot();
    const users = await User.find();
    const botInfo = await bot.telegram.getMe();

    const userDetails = await Promise.all(users.map(async user => ({
      name: user.name,
      email: user.email,
      telegramChatId: user.telegramChatId,
      hasValidTelegram: user.telegramChatId ? await validateTelegramChat(bot, user.telegramChatId) : false
    })));

    res.json({
      botInfo,
      users: userDetails
    });
  } catch (error) {
    console.error('Setup check error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function validateTelegramChat(bot, chatId) {
  try {
    await bot.telegram.sendChatAction(chatId, 'typing');
    return true;
  } catch (error) {
    console.log('Invalid chat ID:', chatId, error.message);
    return false;
  }
}

// Add this route to test broadcast
router.post('/test-broadcast', protectAdminRoute, async (req, res) => {
  try {
    const users = await User.find({ telegramChatId: { $exists: true, $ne: null } });
    console.log('Found users with Telegram:', users.length);

    const testMessage = `
🔔 *Test Broadcast*

This is a test broadcast message from MediTimely Admin.
Time: ${new Date().toLocaleString()}

_Test message from admin panel_`;

    const results = await Promise.all(users.map(async user => {
      try {
        await sendTelegramMessage(user.telegramChatId, testMessage);
        return { userId: user._id, success: true };
      } catch (error) {
        console.error(`Failed to send to user ${user._id}:`, error);
        return { userId: user._id, success: false, error: error.message };
      }
    }));

    res.json({
      success: true,
      totalUsers: users.length,
      results
    });
  } catch (error) {
    console.error('Test broadcast failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add this route to check server time
router.get('/system-time', async (req, res) => {
  try {
    // Get system time in different formats
    const now = new Date();
    const systemTime = {
      utc: now.toUTCString(),
      iso: now.toISOString(),
      local: now.toString(),
      indianTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      timestamp: now.getTime(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: now.getTimezoneOffset()
    };

    // Get system timezone using shell command (Linux/Unix only)
    const { exec } = require('child_process');
    exec('timedatectl', (error, stdout, stderr) => {
      if (error) {
        systemTime.systemSettings = 'Could not get system timezone';
      } else {
        systemTime.systemSettings = stdout;
      }
      res.json(systemTime);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 