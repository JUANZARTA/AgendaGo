/**
 * Backfill de suscripciones — crea un trial para cada empresa que no tenga doc en subscriptions/.
 *
 * Contexto: el proyecto está en plan Spark (sin Cloud Functions), así que onCompanyCreated no corre.
 * El trial empieza HOY y termina HOY + 2 meses calendario (ajustado al último día del mes),
 * para que las empresas existentes no queden bloqueadas de golpe.
 *
 * Requisito: service-account.json en la raíz del proyecto (ver seed-superadmin.js).
 *
 * Ejecutar:
 *   node scripts/backfill-subscriptions.js           (DRY-RUN: solo muestra qué haría)
 *   node scripts/backfill-subscriptions.js --apply   (escribe en Firestore)
 */

const admin = require('firebase-admin');
const path  = require('path');

const APPLY        = process.argv.includes('--apply');
const TRIAL_MONTHS = 2;
const DOCS_PER_BATCH = 400;

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
const { Timestamp } = admin.firestore;

// setMonth desborda desde el día 31 (31-dic -> 3-mar): se ajusta al último día del mes destino
function addMonthsClamped(from, months) {
  const d = new Date(from.getTime());
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

const fmt = (d) => d.toISOString().slice(0, 10);

async function run() {
  console.log(APPLY ? 'MODO APPLY: se escribirá en Firestore.\n' : 'MODO DRY-RUN: no se escribe nada (usá --apply para aplicar).\n');

  const [companies, subs] = await Promise.all([
    db.collection('companies').get(),
    db.collection('subscriptions').get(),
  ]);
  const withSub = new Set(subs.docs.map(d => d.id));
  const missing = companies.docs.filter(d => !withSub.has(d.id));

  const now      = new Date();
  const trialEnd = addMonthsClamped(now, TRIAL_MONTHS);

  console.log(`Empresas: ${companies.size} | con suscripción: ${companies.size - missing.length} | sin suscripción: ${missing.length}`);
  if (missing.length === 0) {
    console.log('Nada para hacer.');
    return;
  }

  console.table(missing.map(d => ({
    companyId: d.id,
    nombre:    d.data().name ?? '(sin nombre)',
    status:    'trial',
    inicio:    fmt(now),
    fin:       fmt(trialEnd),
  })));

  if (!APPLY) {
    console.log('\nDRY-RUN terminado. Ejecutá con --apply para crear estos trials.');
    return;
  }

  let created = 0, skipped = 0;
  for (let i = 0; i < missing.length; i += DOCS_PER_BATCH) {
    const chunk = missing.slice(i, i + DOCS_PER_BATCH);
    // create() falla si el doc ya existe -> nunca pisa una suscripción creada entre la lectura y la escritura
    const results = await Promise.allSettled(chunk.map(d =>
      db.collection('subscriptions').doc(d.id).create({
        companyId:      d.id,
        status:         'trial',
        trialStartDate: Timestamp.fromDate(now),
        trialEndDate:   Timestamp.fromDate(trialEnd),
      })
    ));
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') created++;
      else { skipped++; console.warn(`  Omitida ${chunk[idx].id}: ${r.reason?.message ?? r.reason}`); }
    });
  }
  console.log(`\nListo. Creadas: ${created} | omitidas (ya existían o error): ${skipped}`);
}

run().then(() => process.exit(0)).catch(err => {
  console.error('Error inesperado:', err.message);
  process.exit(1);
});
