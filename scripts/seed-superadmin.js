/**
 * Script de seed — crea el usuario superadmin en Firebase Auth + Firestore.
 *
 * Requisito: colocar el archivo de service account en la raíz del proyecto
 * con el nombre "service-account.json".
 *
 * Pasos para obtenerlo:
 *   Firebase Console → Project Settings → Service Accounts → Generate new private key
 *
 * Ejecutar:
 *   node scripts/seed-superadmin.js
 */

const admin = require('firebase-admin');
const path  = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'service-account.json');

let serviceAccount;
try {
  serviceAccount = require(SERVICE_ACCOUNT_PATH);
} catch {
  console.error('❌  No se encontró service-account.json en la raíz del proyecto.');
  console.error('   Descargalo desde: Firebase Console → Project Settings → Service Accounts → Generate new private key');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth      = admin.auth();
const firestore = admin.firestore();

const ADMIN_EMAIL    = 'develop@gmail.com';
const ADMIN_PASSWORD = '123456';
const ADMIN_NAME     = 'Super Admin';

async function run() {
  let uid;

  // 1. Crear (o recuperar) el usuario en Firebase Auth
  try {
    const existing = await auth.getUserByEmail(ADMIN_EMAIL);
    uid = existing.uid;
    console.log(`ℹ️  El usuario ya existe en Auth (uid: ${uid}). Continuando...`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      const created = await auth.createUser({
        email:         ADMIN_EMAIL,
        password:      ADMIN_PASSWORD,
        displayName:   ADMIN_NAME,
        emailVerified: true,
      });
      uid = created.uid;
      console.log(`✅  Usuario creado en Auth (uid: ${uid})`);
    } else {
      throw err;
    }
  }

  // 2. Escribir el documento en Firestore users/{uid}
  await firestore.collection('users').doc(uid).set({
    uid,
    email:       ADMIN_EMAIL,
    displayName: ADMIN_NAME,
    role:        'superadmin',
    createdAt:   Date.now(),
    profileComplete: true,
  }, { merge: true });

  console.log(`✅  Documento users/${uid} escrito con role: superadmin`);
  console.log('\n🎉  Superadmin listo.');
  console.log(`   Email   : ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   Ruta    : /admin`);

  process.exit(0);
}

run().catch(err => {
  console.error('❌  Error inesperado:', err.message);
  process.exit(1);
});
