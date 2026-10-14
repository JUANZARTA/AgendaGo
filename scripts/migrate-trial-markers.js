/**
 * Migración BILLING HARDENING — marcadores de "ya usó la prueba gratis" para los dueños EXISTENTES.
 *
 * Las reglas nuevas dan trial sólo si NO existen trials/{uid} NI trialEmails/{correo normalizado}.
 * Los dueños que ya tienen empresa (p. ej. Golden Panda) no tienen marcadores: sin esta migración
 * podrían crear una SEGUNDA empresa con otra prueba gratis. Crea, por cada dueño de empresa:
 *   trials/{ownerId}                 = { companyId, createdAt, migrated: true }
 *   trialEmails/{correo normalizado} = { uid: ownerId, companyId, createdAt, migrated: true }
 * companyId = la empresa más antigua del dueño. El correo sale de users/{ownerId}.email o, si no está,
 * de Firebase Auth. Normalización = normalizeTrialEmail (src/app/core/domain/trial-email.ts) = reglas.
 *
 * IDEMPOTENTE: usa create() (nunca pisa un marcador existente); correrlo dos veces no cambia nada.
 * No toca empresas, suscripciones ni usuarios: las empresas existentes siguen operando igual.
 *
 * Requisito: service-account.json en la raíz del proyecto (ver seed-superadmin.js).
 *
 * Ejecutar:
 *   node scripts/migrate-trial-markers.js           (DRY-RUN: sólo LEE y lista qué crearía)
 *   node scripts/migrate-trial-markers.js --apply   (escribe en Firestore)
 */

const admin = require('firebase-admin');
const path  = require('path');

const APPLY = process.argv.includes('--apply');
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

/** Copia de normalizeTrialEmail (src/app/core/domain/trial-email.ts). */
function normalizeTrialEmail(email) {
  const parts = String(email ?? '').trim().toLowerCase().split('@');
  if (parts.length !== 2 || !parts[1]) return null;
  let [local, domain] = parts;
  local = local.split('+')[0];
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    local = local.replace(/\./g, '');
    domain = 'gmail.com';
  }
  const id = `${local}@${domain}`;
  if (id.includes('/') || id.length > 300) return null;
  return id;
}

const ms = (ts) => (ts && typeof ts.toMillis === 'function' ? ts.toMillis() : Number.MAX_SAFE_INTEGER);

async function ownerEmail(uid) {
  const u = await db.doc(`users/${uid}`).get();
  if (u.exists && u.data().email) return { email: u.data().email, source: 'users' };
  try {
    const a = await admin.auth().getUser(uid);
    if (a.email) return { email: a.email, source: 'auth' };
  } catch { /* usuario inexistente en Auth */ }
  return { email: null, source: '-' };
}

async function run() {
  console.log(APPLY ? 'MODO APPLY: se escribirá en Firestore.\n' : 'MODO DRY-RUN: sólo lectura (usá --apply para escribir).\n');

  const companies = await db.collection('companies').get();
  // Empresa más antigua de cada dueño
  const byOwner = new Map();
  for (const d of companies.docs) {
    const ownerId = d.data().ownerId;
    if (!ownerId) { console.warn(`  Empresa ${d.id} sin ownerId: se omite.`); continue; }
    const prev = byOwner.get(ownerId);
    if (!prev || ms(d.data().createdAt) < ms(prev.data().createdAt)) byOwner.set(ownerId, d);
  }

  const plan = [];
  for (const [ownerId, company] of byOwner) {
    const { email, source } = await ownerEmail(ownerId);
    const emailId = normalizeTrialEmail(email);
    const [t, e] = await Promise.all([
      db.doc(`trials/${ownerId}`).get(),
      emailId ? db.doc(`trialEmails/${emailId}`).get() : Promise.resolve(null),
    ]);
    plan.push({
      ownerId, companyId: company.id, nombre: company.data().name ?? '(sin nombre)',
      email: email ?? '(sin correo)', emailId, source,
      crearTrial: !t.exists, crearEmail: !!emailId && !!e && !e.exists,
    });
  }

  console.log(`Empresas: ${companies.size} | dueños: ${byOwner.size}`);
  console.table(plan.map(p => ({
    dueño: p.ownerId, empresa: `${p.nombre} (${p.companyId})`, correo: p.email, origen: p.source,
    'trials/{uid}': p.crearTrial ? 'CREAR' : 'ya existe',
    'trialEmails/{correo}': !p.emailId ? 'SIN CORREO (sólo uid)' : p.crearEmail ? `CREAR ${p.emailId}` : 'ya existe',
  })));

  const pending = plan.filter(p => p.crearTrial || p.crearEmail);
  if (pending.length === 0) { console.log('Nada para hacer (ya migrado).'); return; }
  if (!APPLY) { console.log('\nDRY-RUN terminado. Ejecutá con --apply para crear estos marcadores.'); return; }

  let created = 0, skipped = 0;
  for (const p of pending) {
    const writes = [];
    if (p.crearTrial) {
      writes.push(db.doc(`trials/${p.ownerId}`).create({ companyId: p.companyId, createdAt: FieldValue.serverTimestamp(), migrated: true }));
    }
    if (p.crearEmail) {
      writes.push(db.doc(`trialEmails/${p.emailId}`).create({ uid: p.ownerId, companyId: p.companyId, createdAt: FieldValue.serverTimestamp(), migrated: true }));
    }
    // create() falla si el doc apareció entre la lectura y la escritura → nunca pisa
    for (const r of await Promise.allSettled(writes)) {
      if (r.status === 'fulfilled') created++;
      else { skipped++; console.warn(`  Omitido (${p.ownerId}): ${r.reason?.message ?? r.reason}`); }
    }
  }
  console.log(`\nListo. Marcadores creados: ${created} | omitidos (ya existían o error): ${skipped}`);
}

run().then(() => process.exit(0)).catch(err => {
  console.error('Error inesperado:', err.message);
  process.exit(1);
});
