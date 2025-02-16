import Notification from '../models/Notification.js';
import Medication from '../models/Medication.js';
import User from '../models/User.js';
import { format } from 'date-fns';
import { addDays, parseISO, isValid, addMinutes, addHours, subHours } from 'date-fns';
import axios from 'axios';
import { sendNotification } from '../controllers/telegramController.js';
import { incrementStat } from '../utils/monitoring.js';
import logger from '../utils/logger.js';

const TIME_ZONE = 'Asia/Kolkata';
const IST_OFFSET = 330; // IST offset in minutes (5 hours 30 minutes)

// Helper function to convert local time to UTC
const localToUTC = (date) => {
  if (!(date instanceof Date) || isNaN(date)) {
    throw new Error('Invalid date object');
  }
  
  // Create a new date to avoid modifying the input
  const utcDate = new Date(date.getTime() - (IST_OFFSET * 60 * 1000));
  
  console.log('Converting local to UTC:', {
    local: format(date, 'yyyy-MM-dd HH:mm:ss'),
    utc: format(utcDate, 'yyyy-MM-dd HH:mm:ss'),
    offset: IST_OFFSET
  });
  
  return utcDate;
};

// Helper function to convert UTC to local time
const utcToLocal = (date) => {
  if (!(date instanceof Date) || isNaN(date)) {
    throw new Error('Invalid date object');
  }
  
  // Create a new date to avoid modifying the input
  const localDate = new Date(date.getTime() + (IST_OFFSET * 60 * 1000));
  
  console.log('Time conversion:', {
    utc: format(date, 'yyyy-MM-dd HH:mm:ss'),
    local: format(localDate, 'yyyy-MM-dd HH:mm:ss'),
    offset: IST_OFFSET
  });
  
  return localDate;
};

const createMedicationMessage = (medication, timing, user) => {
  const { name, dosage, instructions } = medication;
  
  return `
🔔 *Medication Reminder*

Hello ${user.name}! Time for your medicine.

💊 *Medicine:* ${name}
💉 *Dosage:* ${dosage}
⏰ *Time:* ${timing.time} (${timing.period})
${instructions ? `📝 *Instructions:* ${instructions}` : ''}

_Stay healthy! Remember to take your medicine on time._

\`- MediTimely Bot\``;
};

const createReminderResponse = (action, medication, minutes = 5) => {
  const responses = {
    taken: `
✅ *Medication Taken*

Great job taking your ${medication.name}! 
Stay consistent with your medication schedule.

_Your health is our priority!_`,
    
    reminder: `
⏰ *Reminder Set*

I'll remind you about ${medication.name} again in ${minutes} minutes.

_Don't forget to take your medicine!_`,
    
    skip: `
⚠️ *Medication Skipped*

You've skipped ${medication.name}. 
Please consult your healthcare provider if you frequently miss doses.

_Your health matters!_`
  };

  return responses[action] || responses.taken;
};

const sendMedicationReminder = async (user, medication, timing) => {
  try {
    const message = `🔔 Medication Reminder!\n\n` +
      `Time to take: ${medication.name}\n` +
      `Dosage: ${medication.dosage}\n` +
      `Time: ${timing}\n\n` +
      `Stay healthy! 💊`;

    await sendNotification(user._id, message);
    console.log('Reminder sent successfully');
  } catch (error) {
    console.error('Failed to send reminder:', error);
  }
};

export const notificationService = {
  async scheduleNotifications(medication, user) {
    try {
      const currentUser = await User.findById(user._id);
      if (!currentUser) {
        throw new Error('User not found');
      }

      const startDate = parseISO(medication.duration.startDate);
      
      console.log('Scheduling notifications for:', {
        medication: medication.name,
        startDate: format(startDate, 'yyyy-MM-dd'),
        timings: medication.timings
      });

      for (let day = 0; day < medication.duration.days; day++) {
        const currentDate = addDays(startDate, day);
        
        for (const timing of medication.timings) {
          // Parse time
          const [hours, minutes] = timing.time.split(':').map(Number);
          
          // Create scheduled date in local time
          const scheduledDate = new Date(currentDate);
          scheduledDate.setHours(hours, minutes, 0, 0);
          
          console.log('Creating notification for:', {
            date: format(scheduledDate, 'yyyy-MM-dd HH:mm:ss'),
            time: timing.time,
            period: timing.period
          });

          const notification = new Notification({
            userId: currentUser._id,
            medicationId: medication._id,
            time: timing.time,
            period: timing.period,
            message: createMedicationMessage(medication, timing, currentUser),
            scheduledFor: scheduledDate, // Store in local time
            type: 'sms',
            notificationTypes: currentUser.telegramChatId ? ['telegram', 'sms'] : ['sms'],
            telegramChatId: currentUser.telegramChatId,
            metadata: {
              medicineName: medication.name,
              dosage: medication.dosage,
              time: timing.time,
              period: timing.period,
              instructions: medication.instructions,
              userName: currentUser.name
            }
          });

          await notification.save();
        }
      }
    } catch (error) {
      console.error('Failed to schedule notifications:', error);
      throw error;
    }
  },

  async sendTelegramMessage(chatId, message, includeButtons = true) {
    try {
      const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      
      const payload = {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      };

      // Add buttons only if includeButtons is true
      if (includeButtons) {
        payload.reply_markup = JSON.stringify({
          inline_keyboard: [
            [
              { text: "✅ Taken", callback_data: "medicine_taken" },
              { text: "⏰ Remind in 5min", callback_data: "remind_later" }
            ]
          ]
        });
      }

      const response = await axios.post(url, payload);
      return response.data;
    } catch (error) {
      console.error('Failed to send Telegram message:', error.response?.data || error.message);
      throw error;
    }
  },

  async checkAndSendNotifications() {
    try {
      incrementStat('requests');
      logger.info('Checking notifications');
      
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      console.log('Checking notifications:', {
        currentTime: format(now, 'yyyy-MM-dd HH:mm:ss'),
        windowStart: format(fiveMinutesAgo, 'yyyy-MM-dd HH:mm:ss'),
        windowEnd: format(fiveMinutesFromNow, 'yyyy-MM-dd HH:mm:ss')
      });

      const notifications = await Notification.find({
        status: 'pending',
        scheduledFor: {
          $gte: fiveMinutesAgo,
          $lte: fiveMinutesFromNow
        }
      }).populate('userId medicationId');

      console.log(`Found ${notifications.length} notifications in time window`);

      for (const notification of notifications) {
        try {
          console.log('Processing notification:', {
            id: notification._id,
            scheduledTime: format(notification.scheduledFor, 'yyyy-MM-dd HH:mm:ss'),
            currentTime: format(now, 'yyyy-MM-dd HH:mm:ss'),
            timeUntilNotification: Math.round((notification.scheduledFor - now) / 1000 / 60) + ' minutes'
          });

          const user = notification.userId;
          if (!user) {
            console.log('User not found for notification:', notification._id);
            continue;
          }

          if (user.telegramChatId) {
            await sendNotification(user._id, notification.message);
            console.log('Notification sent successfully to:', user.name);
            incrementStat('notifications.sent');
            logger.info('Notification sent', { userId: user._id, type: 'telegram' });
          }

          notification.status = 'sent';
          await notification.save();
        } catch (error) {
          console.error('Error processing notification:', error);
          notification.status = 'failed';
          await notification.save();
          incrementStat('notifications.failed');
          incrementStat('errors');
          logger.error('Notification failed', { userId: user._id, type: 'telegram', error: error.message });
        }
      }
    } catch (error) {
      incrementStat('errors');
      logger.error('Notification check failed', { error: error.message });
    }
  },

  async cleanupOldNotifications() {
    try {
      // Delete notifications older than 7 days and already sent
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const result = await Notification.deleteMany({
        status: 'sent',
        scheduledFor: { $lt: sevenDaysAgo }
      });

      console.log('Cleaned up old notifications:', result.deletedCount);
    } catch (error) {
      console.error('Failed to cleanup old notifications:', error);
    }
  },

  async markMedicationAsTaken(messageId, chatId) {
    try {
      const notification = await Notification.findOne({
        telegramChatId: chatId,
        status: 'sent'
      }).sort({ scheduledFor: -1 });

      if (!notification) {
        throw new Error('Notification not found');
      }

      const medication = await Medication.findById(notification.medicationId);
      
      // Update notification status
      notification.status = 'taken';
      await notification.save();

      // Send confirmation message with new template
      await this.sendTelegramMessage(
        chatId,
        createReminderResponse('taken', medication),
        false
      );

      return notification;
    } catch (error) {
      console.error('Failed to mark medication as taken:', error);
      throw error;
    }
  },

  async scheduleReminder(messageId, chatId, minutes = 5) {
    try {
      const notification = await Notification.findOne({
        telegramChatId: chatId,
        status: 'sent'
      }).sort({ scheduledFor: -1 });

      if (!notification) {
        throw new Error('Notification not found');
      }

      const medication = await Medication.findById(notification.medicationId);
      const reminderTime = addMinutes(new Date(), minutes);

      // Create a new reminder notification
      const newNotification = await Notification.create({
        ...notification.toObject(),
        _id: undefined,
        status: 'pending',
        scheduledFor: reminderTime,
        message: createMedicationMessage(medication, {
          time: format(reminderTime, 'HH:mm'),
          period: notification.period
        }, await User.findById(notification.userId)),
        metadata: {
          ...notification.metadata,
          isReminder: true,
          originalNotificationId: notification._id
        }
      });

      // Send confirmation message with new template
      await this.sendTelegramMessage(
        chatId,
        createReminderResponse('reminder', medication, minutes),
        false
      );

      return newNotification;
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
      throw error;
    }
  },

  async handleStartCommand(chatId, username) {
    try {
      const welcomeMessage = `
🎉 <b>Welcome to MediTimely!</b>

I'll help you stay on top of your medication schedule. You'll receive:
• Timely reminders for your medications
• Easy options to mark medicines as taken
• Ability to snooze reminders if needed

Your notifications will appear here once you're connected.

<i>Stay healthy!</i>
`;

      await this.sendTelegramMessage(chatId, welcomeMessage, false);
      return true;
    } catch (error) {
      console.error('Failed to handle start command:', error);
      return false;
    }
  },

  sendMedicationReminder,

  async sendPasswordResetLink(user, resetToken) {
    if (!user.telegramChatId) {
      throw new Error('User has not connected Telegram');
    }

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `
🔐 <b>Password Reset Request - MediTimely</b>

Hello ${user.name || 'there'},

You requested to reset your password. Click the link below to set a new password:

${resetUrl}

⚠️ If you didn't request this, please ignore this message.
⏰ This link will expire in 1 hour.

<i>MediTimely - Your Medication Reminder</i>
`;

    return this.sendTelegramMessage(user.telegramChatId, message);
  },
}; 