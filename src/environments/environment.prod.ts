export const environment = {
  production: true,
  useEmulators: false,
  bypassAuth: false,
  wompiPublicKey: 'pub_prod_4HbTBjxCLEox6IHck4HIfClWGJ7HAGFg',
  // Wompi REAL. Sólo producción consulta esta API: una transacción de pruebas no existe acá,
  // así que nunca puede activar un plan.
  wompi: {
    apiUrl: 'https://production.wompi.co/v1',
    checkout: {
      mensual:   'https://checkout.wompi.co/l/p5GJth',
      semestral: 'https://checkout.wompi.co/l/3pQr9V',
    },
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
