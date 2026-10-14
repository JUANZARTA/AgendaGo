/**
 * Expiración de suscripciones — reemplaza al cron checkExpiredSubscriptions (no corre en plan Spark).
 *
 * Misma lógica que "Revisar vencimientos" y la revisión automática del admin-shell
 * (overdueItems en src/app/core/domain/subscription-timeline.ts):
 *  - subscriptions trial/active cuya fecha de fin + GRACIA ya pasó (gracia = config/app.graceDays,
 *    default 5; fin de la gracia = fin del día local fin+graceDays, igual que graceEndOf)
 *    → status 'expired' + companies.isActive=false;
 *  - empresas con isActive == true SIN doc de suscripción (nunca vencerían)
 *    → se les crea { companyId, status: 'expired' } + companies.isActive=false.
 * No toca 'free' ni 'disabled'. OJO: "fin del día" usa la zona horaria de la máquina que lo corre.
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

const GRACE_DAYS_DEFAULT = 5;

/** Copia de graceEndOf (subscription-timeline.ts): fin del día local endDate + graceDays. */
function graceEndOf(endDate, graceDays) {
  const g = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + graceDays);
  g.setHours(23, 59, 59, 999);
  return g;
}

async function run() {
  console.log(APPLY ? 'MODO APPLY: se escribirá en Firestore.\n' : 'MODO DRY-RUN: no se escribe nada (usá --apply para aplicar).\n');

  const cfg = await db.doc('config/app').get();
  const g = cfg.exists ? cfg.data().graceDays : undefined;
  const graceDays = Number.isInteger(g) && g >= 0 && g <= 30 ? g : GRACE_DAYS_DEFAULT;
  console.log(`Gracia: ${graceDays} día(s) (config/app.graceDays)\n`);

  const now = Date.now();
  const overdue = [];

  // Todas las suscripciones + empresas activas; fechas comparadas en memoria (sin índices compuestos)
  const [subs, active] = await Promise.all([
    db.collection('subscriptions').get(),
    db.collection('companies').where('isActive', '==', true).get(),
  ]);
  const withSub = new Set();
  for (const d of subs.docs) {
    withSub.add(d.id);
    const status = d.data().status;
    if (status !== 'trial' && status !== 'active') continue;
    const end = d.data()[status === 'trial' ? 'trialEndDate' : 'currentPeriodEnd']?.toDate?.();
    // Durante la gracia la cuenta sigue funcionando
    if (end && graceEndOf(end, graceDays).getTime() < now) overdue.push({ ref: d.ref, id: d.id, status, end });
  }
  for (const d of active.docs) {
    if (!withSub.has(d.id)) overdue.push({ ref: db.doc(`subscriptions/${d.id}`), id: d.id, status: 'missing', end: null });
  }

  if (overdue.length === 0) {
    console.log('No hay suscripciones vencidas (pasada la gracia) ni empresas activas sin suscripción. Nada para hacer.');
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
    venció:    o.end ? o.end.toISOString().slice(0, 10) : '(sin suscripción)',
    accion:    o.status === 'missing' ? 'crear sub expired, companies.isActive -> false' : 'status -> expired, companies.isActive -> false',
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
        if (o.status === 'missing') batch.set(o.ref, { companyId: o.id, status: 'expired' }, { merge: true });
        else batch.update(o.ref, { status: 'expired' });
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
