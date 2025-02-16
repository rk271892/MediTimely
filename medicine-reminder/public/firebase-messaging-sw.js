importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyChI_iTa6BLGkbdJXhKrtyoVbDWeJMvu4c',
  authDomain: 'meditimely-3e9da.firebaseapp.com',
  projectId: 'meditimely-3e9da',
  storageBucket: 'meditimely-3e9da.firebasestorage.app',
  messagingSenderId: '986135196942',
  appId: '1:986135196942:web:f976ee20e6cb2346f5535f'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  
  self.registration.showNotification(title, {
    body,
    icon: '/icon.png',
    badge: '/badge.png'
  });
}); 