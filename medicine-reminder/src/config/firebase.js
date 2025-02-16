import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyChI_iTa6BLGkbdJXhKrtyoVbDWeJMvu4c",
  authDomain: "meditimely-3e9da.firebaseapp.com",
  projectId: "meditimely-3e9da",
  storageBucket: "meditimely-3e9da.firebasestorage.app",
  messagingSenderId: "986135196942",
  appId: "1:986135196942:web:f976ee20e6cb2346f5535f"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      return token;
    }
  } catch (error) {
    console.error('Notification permission error:', error);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  }); 