importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDk_So7bgA7t-BfZcZqtR503OSWLYcUZcY',
  authDomain: 'agendago-b8ea6.firebaseapp.com',
  projectId: 'agendago-b8ea6',
  storageBucket: 'agendago-b8ea6.firebasestorage.app',
  messagingSenderId: '72485695160',
  appId: '1:72485695160:web:429fc6fb80cc0ff88f8e4d',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192x192.png',
  });
});
