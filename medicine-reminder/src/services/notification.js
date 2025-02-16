import axios from 'axios';
import { requestNotificationPermission } from '../config/firebase';

const API_URL = 'http://localhost:3000/api';

export const notificationService = {
  async registerFCMToken() {
    try {
      const fcmToken = await requestNotificationPermission();
      if (fcmToken) {
        const response = await axios.post(`${API_URL}/notifications/register-fcm`, {
          fcmToken
        });
        return response.data;
      }
    } catch (error) {
      console.error('Failed to register FCM token:', error);
      throw error;
    }
  },

  async enableNotifications() {
    try {
      // First register FCM token
      await this.registerFCMToken();
      
      // Then enable notifications in your existing service
      const response = await axios.post(`${API_URL}/notifications/enable`);
      return response.data;
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      throw error;
    }
  },

  async disableNotifications() {
    try {
      const response = await axios.post(`${API_URL}/notifications/disable`);
      return response.data;
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      throw error;
    }
  }
}; 