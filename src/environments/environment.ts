export const environment = {
  production: false,
  useEmulators: false,
  bypassAuth: false,
  // Llave PÚBLICA del comercio en sandbox (no es secreta): se compara con el comercio de cada transacción.
  wompiPublicKey: 'pub_test_KF76s43F4OOQvwf8eiJ1THUbdunAdLAq',
  // Wompi en MODO PRUEBAS (sandbox): pagos ficticios. Los links de pago viven en Firestore
  // (config/app, los edita el superadmin): acá se usa el link "de pruebas" de cada plan.
  wompi: {
    apiUrl: 'https://sandbox.wompi.co/v1',
  },
  firebase: {
    apiKey: 'AIzaSyDk_So7bgA7t-BfZcZqtR503OSWLYcUZcY',
    authDomain: 'agendago-b8ea6.firebaseapp.com',
    databaseURL: 'https://agendago-b8ea6-default-rtdb.firebaseio.com',
    projectId: 'agendago-b8ea6',
    storageBucket: 'agendago-b8ea6.firebasestorage.app',
    messagingSenderId: '72485695160',
    appId: '1:72485695160:web:429fc6fb80cc0ff88f8e4d',
    measurementId: 'G-C86BSB7RR2',
    vapidKey: 'YOUR_VAPID_KEY', // Firebase Console → Cloud Messaging → Web Push certificates
  },
};
