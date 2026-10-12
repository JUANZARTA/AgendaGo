/**
 * Expiración de suscripciones — reemplaza al cron checkExpiredSubscriptions (no corre en plan Spark).
 *
 * Marca status='expired' en subscriptions con status trial/active cuya fecha de fin
 * (trialEndDate / currentPeriodEnd) ya pasó, y pone companies.isActive=false.
 * Misma lógica que el botón "Revisar vencimientos" del panel admin. No toca 'free' ni 'disabled'.
 *
 * Requisito: service-account.json en la raíz del proyecto (ver seed-superadmin.js).
 *
 * Ejecutar:
 *   node scripts/expire-subscriptions.js           (DRY-RUN: solo lista)
 *   node scripts/expire-subscriptions.js --apply   (escribe en Firestore)
 */

const admin = require('firebase-admin');
const path  = require('path');

const APPLY = process.argv.includes('--apply');
// Cada doc genera 2 operaciones; 220 docs = 440 ops (< límite de 500 por batch)
const DOCS_PER_BATCH = 220;

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'service-account.json');

let serviceAccount;
try {
  serviceAccount = require(SERVICE_ACCOUNT_PATH);
} catch {
  console.error('No se encontró service-account.json en la raíz del proyecto.');
  console.error('Descargalo desde: Firebase Console → Project Settings → Service Accounts → Generate new private key');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  console.log(APPLY ? 'MODO APPLY: se escribirá en Firestore.\n' : 'MODO DRY-RUN: no se escribe nada (usá --apply para aplicar).\n');

  const now = Date.now();
  const overdue = [];

  // Solo filtro por status (sin índice compuesto) y comparo fechas en memoria
  for (const [status, field] of [['trial', 'trialEndDate'], ['active', 'currentPeriodEnd']]) {
    const snap = await db.collection('subscriptions').where('status', '==', status).get();
    for (const d of snap.docs) {
      const end = d.data()[field]?.toDate?.();
      if (end && end.getTime() <= now) overdue.push({ ref: d.ref, id: d.id, status, end });
    }
  }

  if (overdue.length === 0) {
    console.log('No hay suscripciones vencidas. Nada para hacer.');
    return;
  }

  const names = {};
  await Promise.all(overdue.map(async o => {
    const c = await db.collection('companies').doc(o.id).get();
    names[o.id] = c.exists ? (c.data().name ?? '(sin nombre)') : '(empresa inexistente)';
  }));

  console.log(`Suscripciones vencidas: ${overdue.length}`);
  console.table(overdue.map(o => ({
    companyId: o.id,
    nombre:    names[o.id],
    estado:    o.status,
    venció:    o.end.toISOString().slice(0, 10),
    accion:    "status -> expired, companies.isActive -> false",
  })));

  if (!APPLY) {
    console.log('\nDRY-RUN terminado. Ejecutá con --apply para aplicar.');
    return;
  }

  let ok = 0, failed = 0;
  for (let i = 0; i < overdue.length; i += DOCS_PER_BATCH) {
    const chunk = overdue.slice(i, i + DOCS_PER_BATCH);
    try {
      const batch = db.batch();
      for (const o of chunk) {
        batch.update(o.ref, { status: 'expired' });
        // set+merge tolera que la empresa no exista (update abortaría todo el batch)
        batch.set(db.doc(`companies/${o.id}`), { isActive: false }, { merge: true });
      }
      await batch.commit();
      ok += chunk.length;
    } catch (err) {
      failed += chunk.length;
      console.error(`Falló el chunk ${i / DOCS_PER_BATCH}:`, err.message);
    }
  }
  console.log(`\nListo. Expiradas: ${ok} | con error: ${failed}`);
}

run().then(() => process.exit(0)).catch(err => {
  console.error('Error inesperado:', err.message);
  process.exit(1);
});
