export const environment = {
  production: true,
  useEmulators: false,
  bypassAuth: false,
  // Llave PÚBLICA del comercio REAL (no es secreta): toda transacción tiene que ser de este comercio.
  wompiPublicKey: 'pub_prod_4HbTBjxCLEox6IHck4HIfClWGJ7HAGFg',
  // Wompi REAL. Sólo producción consulta esta API: una transacción de pruebas no existe acá,
  // así que nunca puede activar un plan. Los links de pago reales viven en config/app (Firestore).
  wompi: {
    apiUrl: 'https://production.wompi.co/v1',
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
    vapidKey: 'YOUR_VAPID_KEY',
  },
};
