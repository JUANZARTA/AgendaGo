/**
 * Backfill de slotLocks — crea/repara el lock diario slotLocks/{companyId}_{date}
 * para las citas futuras (pending/scheduled) creadas antes de que existieran los locks.
 *
 * Contexto: con las reglas nuevas, la disponibilidad pública se calcula SOLO desde slotLocks.
 * Una cita sin entry en el lock aparece como horario libre → posible doble reserva.
 * Correrlo justo ANTES y justo DESPUÉS del deploy de reglas + hosting. Es idempotente.
 *
 * Requisito: service-account.json en la raíz del proyecto (ver seed-superadmin.js).
 *
 * Ejecutar:
 *   node scripts/backfill-slot-locks.js           (DRY-RUN: solo muestra qué haría)
 *   node scripts/backfill-slot-locks.js --apply   (escribe en Firestore)
 */

const admin = require('firebase-admin');
const path  = require('path');

const APPLY        = process.argv.includes('--apply');
const ACTIVE       = ['pending', 'scheduled'];
const MAX_ENTRIES  = 300;
const TIME_ZONE    = 'America/Bogota';

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
const { FieldValue } = admin.firestore;

// Fecha 'YYYY-MM-DD' en hora de Colombia (en-CA formatea como ISO)
function localDateKey(d) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

function toEntry(doc) {
  const a = doc.data();
  return { aptId: doc.id, staffId: a.staffId ?? null, startTime: a.startTime, endTime: a.endTime };
}

async function run() {
  console.log(APPLY ? 'MODO APPLY: se escribirá en Firestore.\n' : 'MODO DRY-RUN: no se escribe nada (usá --apply para aplicar).\n');

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const fromDate = localDateKey(yesterday);

  const snap = await db.collection('appointments')
    .where('date', '>=', fromDate)
    .get();

  // Agrupar citas activas por (companyId, date)
  const groups = new Map();
  for (const doc of snap.docs) {
    const a = doc.data();
    if (!ACTIVE.includes(a.status) || !a.companyId || !a.date || !a.startTime || !a.endTime) continue;
    const key = `${a.companyId}_${a.date}`;
    if (!groups.has(key)) groups.set(key, { companyId: a.companyId, date: a.date, docs: [] });
    groups.get(key).docs.push(doc);
  }

  // Locks existentes en el rango (para limpiar entries de citas canceladas/borradas)
  const lockSnap = await db.collection('slotLocks').where('date', '>=', fromDate).get();
  for (const l of lockSnap.docs) {
    if (!groups.has(l.id)) {
      const d = l.data();
      groups.set(l.id, { companyId: d.companyId, date: d.date, docs: [] });
    }
  }

  const activeIds = new Set(snap.docs.filter(d => ACTIVE.includes(d.data().status)).map(d => d.id));
  const plan = [];

  for (const [lockId, g] of groups) {
    const ref      = db.collection('slotLocks').doc(lockId);
    const existing = lockSnap.docs.find(d => d.id === lockId);
    const current  = existing ? (existing.data().entries ?? []) : [];

    const kept    = current.filter(e => activeIds.has(e.aptId));
    const keptIds = new Set(kept.map(e => e.aptId));
    const added   = g.docs.filter(d => !keptIds.has(d.id)).map(toEntry);
    const removed = current.length - kept.length;
    const entries = [...kept, ...added];

    if (added.length === 0 && removed === 0) continue;
    if (entries.length > MAX_ENTRIES) {
      console.warn(`  ${lockId}: ${entries.length} entries supera el tope de ${MAX_ENTRIES}, se omite.`);
      continue;
    }
    plan.push({ ref, lockId, companyId: g.companyId, date: g.date, entries, added: added.length, removed });
  }

  console.log(`Citas activas desde ${fromDate}: ${activeIds.size} | locks a crear/actualizar: ${plan.length}`);
  if (plan.length === 0) {
    console.log('Nada para hacer.');
    return;
  }

  console.table(plan.map(p => ({ lock: p.lockId, agregadas: p.added, quitadas: p.removed, total: p.entries.length })));

  if (!APPLY) {
    console.log('\nDRY-RUN terminado. Ejecutá con --apply para escribir estos locks.');
    return;
  }

  let ok = 0, failed = 0;
  for (const p of plan) {
    try {
      await p.ref.set({ companyId: p.companyId, date: p.date, entries: p.entries, updatedAt: FieldValue.serverTimestamp() });
      ok++;
    } catch (err) {
      failed++;
      console.warn(`  Falló ${p.lockId}: ${err.message}`);
    }
  }
  console.log(`\nListo. Escritos: ${ok} | fallidos: ${failed}`);
}

run().then(() => process.exit(0)).catch(err => {
  console.error('Error inesperado:', err.message);
  process.exit(1);
});
