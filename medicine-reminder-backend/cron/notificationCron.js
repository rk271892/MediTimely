import cron from 'node-cron';
import { notificationService } from '../services/notificationService.js';

// Schedule notification check every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('Running notification cron job at:', new Date().toISOString());
  try {
    await notificationService.checkAndSendNotifications();
  } catch (error) {
    console.error('Notification cron error:', error);
  }
});

// Run cleanup daily at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running notification cleanup at:', new Date().toISOString());
  try {
    await notificationService.cleanupOldNotifications();
  } catch (error) {
    console.error('Notification cleanup error:', error);
  }
}); 