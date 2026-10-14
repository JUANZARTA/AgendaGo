import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { initializeApp } = require('firebase/app');
const F = require('firebase/firestore');
const {
  getFirestore, connectFirestoreEmulator, doc, collection, getDoc, getDocs, query, where, orderBy,
  runTransaction, serverTimestamp, setDoc, updateDoc, deleteDoc, addDoc, Timestamp, writeBatch,
} = F;

const PROJECT = 'demo-agendago';
// emulators:exec define FIRESTORE_EMULATOR_HOST (host:puerto del emulador levantado)
const [HOST, PORT] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080').split(':');
const BASE = `http://${HOST}:${PORT}/v1/projects/${PROJECT}/databases/(default)/documents`;

// ── seed via REST (bypasses rules) ──
function enc(v) {
  if (v === null) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) } };
}
async function seed(path, data) {
  const r = await fetch(`${BASE}/${path}`, {
    method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, enc(v)])) }),
  });
  if (!r.ok) throw new Error('seed ' + path + ' ' + await r.text());
}
async function clear() {
  await fetch(`http://${HOST}:${PORT}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' });
}

let n = 0;
function dbFor(uid) {
  const app = initializeApp({ projectId: PROJECT, apiKey: 'x' }, 'app' + (n++));
  const db = getFirestore(app);
  connectFirestoreEmulator(db, HOST, Number(PORT), uid ? { mockUserToken: { sub: uid, user_id: uid } } : undefined);
  return db;
}

let pass = 0, fail = 0;
const withTimeout = (p, ms = 15000) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('TIMEOUT'), { code: 'timeout' })), ms))]);
async function expectOk(name, fn) {
  try { await withTimeout(fn()); pass++; console.log('  OK   ', name); }
  catch (e) { fail++; console.log('  FAIL ', name, '->', e.code ?? '', e.message); }
}
async function expectDeny(name, fn) {
  try { await withTimeout(fn()); fail++; console.log('  FAIL ', name, '-> was ALLOWED'); }
  catch (e) {
    if (e.code === 'permission-denied' || /PERMISSION_DENIED|permission/i.test(e.message)) { pass++; console.log('  OK   ', name, '(denied)'); }
    else { fail++; console.log('  FAIL ', name, '-> unexpected error', e.code, e.message); }
  }
}

// ── replicas of AppointmentService logic ──
const lockId = (c, d) => `${c}_${d}`;
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
function hasCapacity(existing, s, e, staffId, cap) {
  cap = Math.max(1, cap || 1);
  const ov = existing.filter(a => toMin(a.startTime) < e && toMin(a.endTime) > s);
  if (staffId && ov.some(a => a.staffId === staffId)) return false;
  return ov.length < cap;
}
async function withLockRetry(fn, attempts = 3) {
  for (let i = 1; ; i++) { try { return await fn(); } catch (e) { if (e?.code !== 'permission-denied' || i >= attempts) throw e; } }
}
async function book(db, data, status, staffCount = 1) { return withLockRetry(() => book0(db, data, status, staffCount)); }
async function book0(db, data, status, staffCount = 1) {
  const ref = doc(collection(db, 'appointments'));
  const lockRef = doc(db, 'slotLocks', lockId(data.companyId, data.date));
  await runTransaction(db, async tx => {
    const ls = await tx.get(lockRef);
    const entries = ls.exists() ? (ls.data().entries ?? []) : [];
    if (!hasCapacity(entries, toMin(data.startTime), toMin(data.endTime), data.staffId, staffCount)) throw new Error('SLOT_TAKEN');
    tx.set(lockRef, { companyId: data.companyId, date: data.date,
      entries: [...entries, { aptId: ref.id, staffId: data.staffId ?? null, startTime: data.startTime, endTime: data.endTime }],
      updatedAt: serverTimestamp() });
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    tx.set(ref, { ...clean, status, createdAt: serverTimestamp() });
  });
  return ref.id;
}
async function readLockWithout(tx, db, apt, id) {
  const ref = doc(db, 'slotLocks', lockId(apt.companyId, apt.date));
  const s = await tx.get(ref);
  if (!s.exists()) return null;
  const entries = s.data().entries ?? [];
  const rem = entries.filter(e => e.aptId !== id);
  return rem.length === entries.length ? null : { ref, entries: rem };
}
async function transition(db, id, patchFn) {
  const ref = doc(db, 'appointments', id);
  await withLockRetry(() => runTransaction(db, async tx => {
    const s = await tx.get(ref);
    if (!s.exists()) throw new Error('NOT_FOUND');
    const apt = s.data();
    const patch = patchFn(apt);
    if (!patch) return;
    const lock = patch.status === 'cancelled' ? await readLockWithout(tx, db, apt, id) : null;
    tx.update(ref, { ...patch, updatedAt: serverTimestamp() });
    if (lock) tx.set(lock.ref, { companyId: apt.companyId, date: apt.date, entries: lock.entries, updatedAt: serverTimestamp() });
  }));
}
async function del(db, id) {
  const ref = doc(db, 'appointments', id);
  await runTransaction(db, async tx => {
    const s = await tx.get(ref);
    if (!s.exists()) return;
    const apt = s.data();
    const lock = await readLockWithout(tx, db, apt, id);
    tx.delete(ref);
    if (lock) tx.set(lock.ref, { companyId: apt.companyId, date: apt.date, entries: lock.entries, updatedAt: serverTimestamp() });
  });
}
async function hide(db, id) {
  const ref = doc(db, 'appointments', id);
  await runTransaction(db, async tx => {
    const s = await tx.get(ref);
    if (!s.exists()) return;
    tx.update(ref, { hiddenByClient: true, updatedAt: serverTimestamp() });
  });
}

const D = '2030-05-10';
function aptData(over = {}) {
  return {
    companyId: 'c1', companyName: 'Salon', serviceId: 's1', serviceName: 'Corte', serviceDuration: 30,
    clientName: 'Ana', clientPhone: '300', isGuestClient: true, date: D, startTime: '10:00', endTime: '10:30',
    price: 20000, source: 'app', ...over,
  };
}

async function main() {
  await clear();
  await seed('users/client1', { uid: 'client1', role: 'client', email: 'a@a', displayName: 'Ana', isActive: true });
  await seed('users/client2', { uid: 'client2', role: 'client', email: 'b@b', displayName: 'Bob' });
  await seed('users/owner1',  { uid: 'owner1', role: 'company', email: 'o@o' });
  await seed('users/owner2',  { uid: 'owner2', role: 'company', email: 'o2@o' });
  await seed('users/admin',   { uid: 'admin', role: 'superadmin' });
  await seed('companies/c1', { ownerId: 'owner1', name: 'Salon', isActive: true, isPublic: true, autoConfirm: false, reviewCount: 2, averageRating: 4.5, slotInterval: 30 });
  await seed('companies/c1/staff/st1', { name: 'Pepe', isActive: true, serviceIds: ['s1'], schedule: {} });
  await seed('companies/c1/staff/st2', { name: 'Luisa', isActive: true, serviceIds: ['s1'],
    schedule: { vie: { enabled: true, open: '09:00', close: '12:00' }, sab: { enabled: false, open: '09:00', close: '14:00' } } });
  await seed('companies/c1/staff/st3', { name: 'Baja', isActive: false, serviceIds: ['s1'], schedule: {} });
  await seed('companies/c2', { ownerId: 'owner2', name: 'Off', isActive: false, isPublic: true, autoConfirm: true });
  await seed('companies/c3', { ownerId: 'owner2', name: 'Auto', isActive: true, isPublic: true, autoConfirm: true });
  await seed('appointments/legacy1', { ...aptData({ clientId: 'client1', isGuestClient: false, startTime: '15:00', endTime: '15:30' }), status: 'pending' });
  await seed('appointments/done1', { ...aptData({ clientId: 'client1', isGuestClient: false, date: '2025-01-01' }), status: 'completed' });
  await seed('appointments/done2', { ...aptData({ clientId: 'client1', isGuestClient: false, date: '2025-01-02' }), status: 'completed' });
  await seed('appointments/pend9', { ...aptData({ clientId: 'client1', isGuestClient: false, date: '2025-01-03' }), status: 'pending' });

  const guest = dbFor(null), c1 = dbFor('client1'), c2 = dbFor('client2'), o1 = dbFor('owner1'), o2 = dbFor('owner2'), admin = dbFor('admin');

  console.log('APPOINTMENTS / SLOTLOCKS');
  let guestApt, clientApt, manualApt;
  await expectOk('guest books pending (no login)', async () => { guestApt = await book(guest, aptData(), 'pending'); });
  await expectOk('guest reads slotLocks day doc', async () => {
    const s = await getDoc(doc(guest, 'slotLocks', lockId('c1', D)));
    if (s.data().entries.length !== 1) throw new Error('bad entries');
  });
  await expectDeny('guest cannot read appointment by id', () => getDoc(doc(guest, 'appointments', guestApt)));
  await expectDeny('guest cannot list appointments of company', () => getDocs(query(collection(guest, 'appointments'), where('companyId', '==', 'c1'), where('date', '==', D))));
  await expectDeny('client2 cannot list appointments of company', () => getDocs(query(collection(c2, 'appointments'), where('companyId', '==', 'c1'))));
  await expectOk('client1 books pending with clientId (staff s1)', async () => {
    clientApt = await book(c1, aptData({ clientId: 'client1', isGuestClient: false, staffId: 'st1', staffName: 'Pepe', startTime: '11:00', endTime: '11:30', clientEmail: 'a@a', clientNote: 'hola' }), 'pending');
  });
  await expectDeny('client1 books scheduled when autoConfirm=false', () => book(c1, aptData({ clientId: 'client1', isGuestClient: false, startTime: '12:00', endTime: '12:30' }), 'scheduled'));
  await expectOk('client1 books scheduled on autoConfirm company', () => book(c1, aptData({ companyId: 'c3', clientId: 'client1', isGuestClient: false }), 'scheduled'));
  await expectDeny('client1 books with clientId of client2', () => book(c1, aptData({ clientId: 'client2', isGuestClient: false, startTime: '12:00', endTime: '12:30' }), 'pending'));
  await expectDeny('guest books on inactive company', () => book(guest, aptData({ companyId: 'c2' }), 'pending'));
  await expectDeny('guest books with bad date format', () => book(guest, aptData({ date: '10/05/2030' }), 'pending'));
  await expectDeny('guest books with extra field', () => book(guest, aptData({ startTime: '13:00', endTime: '13:30', hacked: true }), 'pending'));
  await expectDeny('appointment create WITHOUT lock', () => setDoc(doc(collection(guest, 'appointments')), { ...aptData({ startTime: '13:00', endTime: '13:30' }), status: 'pending', createdAt: serverTimestamp() }));
  await expectDeny('fake lock entry (no appointment)', async () => {
    const ref = doc(guest, 'slotLocks', lockId('c1', D));
    const s = await getDoc(ref);
    await setDoc(ref, { companyId: 'c1', date: D, entries: [...s.data().entries, { aptId: 'nope', staffId: null, startTime: '09:00', endTime: '09:30' }], updatedAt: serverTimestamp() });
  });
  await expectDeny('attacker wipes lock entries (active apts)', async () => {
    const ref = doc(guest, 'slotLocks', lockId('c1', D));
    const s = await getDoc(ref);
    await setDoc(ref, { companyId: 'c1', date: D, entries: s.data().entries.slice(1), updatedAt: serverTimestamp() });
  });
  await expectDeny('attacker deletes lock doc', () => deleteDoc(doc(guest, 'slotLocks', lockId('c1', D))));
  await expectOk('owner creates manual scheduled apt', async () => {
    manualApt = await book(o1, aptData({ source: 'manual', startTime: '16:00', endTime: '17:00', serviceDuration: 60 }), 'scheduled');
  });
  await expectDeny('owner2 creates manual apt on c1', () => book(o2, aptData({ source: 'manual', startTime: '18:00', endTime: '18:30' }), 'scheduled'));
  await expectDeny('owner attributes manual apt to client2', () => book(o1, aptData({ source: 'manual', clientId: 'client2', isGuestClient: false, startTime: '18:00', endTime: '18:30' }), 'scheduled'));

  await expectOk('client1 query clientId==uid', () => getDocs(query(collection(c1, 'appointments'), where('clientId', '==', 'client1'))));
  await expectDeny('client1 query clientId==client2', () => getDocs(query(collection(c1, 'appointments'), where('clientId', '==', 'client2'))));
  await expectOk('owner dashboard query companyId+date orderBy startTime', () => getDocs(query(collection(o1, 'appointments'), where('companyId', '==', 'c1'), where('date', '==', D), orderBy('startTime'))));
  await expectOk('owner statistics query companyId only', () => getDocs(query(collection(o1, 'appointments'), where('companyId', '==', 'c1'))));
  await expectDeny('owner2 query c1 appointments', () => getDocs(query(collection(o2, 'appointments'), where('companyId', '==', 'c1'))));
  await expectOk('owner reads guest apt by id (no clientId field)', () => getDoc(doc(o1, 'appointments', guestApt)));
  await expectOk('admin metrics query by date', () => getDocs(query(collection(admin, 'appointments'), where('date', '==', D))));

  await expectOk('owner confirms guest apt', () => transition(o1, guestApt, a => a.status === 'pending' ? { status: 'scheduled' } : null));
  await expectDeny('client1 confirms own apt (not allowed)', () => transition(c1, clientApt, () => ({ status: 'scheduled' })));
  await expectDeny('client1 cancels another client apt', () => transition(c2, clientApt, () => ({ status: 'cancelled', cancelledBy: 'client' })));
  await expectOk('client1 cancels own apt + lock release', () => transition(c1, clientApt, () => ({ status: 'cancelled', cancelledBy: 'client' })));
  await expectOk('lock no longer has cancelled entry', async () => {
    const s = await getDoc(doc(guest, 'slotLocks', lockId('c1', D)));
    if (s.data().entries.some(e => e.aptId === clientApt)) throw new Error('entry still there');
  });
  await expectOk('slot freed: guest re-books 11:00 staff st1', () => book(guest, aptData({ staffId: 'st1', staffName: 'Pepe', startTime: '11:00', endTime: '11:30' }), 'pending'));
  await expectOk('client1 cancels LEGACY apt (no lock doc entry)', () => transition(c1, 'legacy1', () => ({ status: 'cancelled', cancelledBy: 'client' })));
  await expectOk('owner cancels manual apt + lock release', () => transition(o1, manualApt, () => ({ status: 'cancelled', cancelledBy: 'company' })));
  // Motivo de cancelación (cancelReason): opcional, string <= 300, sólo al pasar a 'cancelled'
  let rA, rB, rC;
  await expectOk('setup: 3 apts para motivo de cancelación', async () => {
    rA = await book(c1, aptData({ clientId: 'client1', isGuestClient: false, startTime: '08:00', endTime: '08:30' }), 'pending');
    rB = await book(guest, aptData({ startTime: '08:30', endTime: '09:00' }), 'pending');
    rC = await book(guest, aptData({ startTime: '09:00', endTime: '09:30' }), 'pending');
  });
  await expectDeny('client cancels with reason > 300', () => transition(c1, rA, () => ({ status: 'cancelled', cancelledBy: 'client', cancelReason: 'x'.repeat(301) })));
  await expectDeny('client cancels with non-string reason', () => transition(c1, rA, () => ({ status: 'cancelled', cancelledBy: 'client', cancelReason: 5 })));
  await expectOk('client cancels own apt WITH reason (300 chars)', () => transition(c1, rA, () => ({ status: 'cancelled', cancelledBy: 'client', cancelReason: 'x'.repeat(300) })));
  await expectDeny('client edits reason of already cancelled apt', () => updateDoc(doc(c1, 'appointments', rA), { cancelReason: 'otro', updatedAt: serverTimestamp() }));
  await expectDeny('owner confirms adding cancelReason', () => transition(o1, rB, () => ({ status: 'scheduled', cancelReason: 'nope' })));
  await expectOk('owner cancels WITH reason', () => transition(o1, rB, () => ({ status: 'cancelled', cancelledBy: 'company', cancelReason: 'Enfermedad del profesional' })));
  await expectDeny('owner edits reason after cancel', () => updateDoc(doc(o1, 'appointments', rB), { cancelReason: 'cambio', updatedAt: serverTimestamp() }));
  await expectOk('owner cancels WITHOUT reason (still ok)', () => transition(o1, rC, () => ({ status: 'cancelled', cancelledBy: 'company' })));
  await expectOk('lock released for cancelled-with-reason apts', async () => {
    const s = await getDoc(doc(guest, 'slotLocks', lockId('c1', D)));
    if (s.data().entries.some(e => [rA, rB, rC].includes(e.aptId))) throw new Error('entry still there');
  });
  await expectOk('owner completes guest apt', () => transition(o1, guestApt, () => ({ status: 'completed' })));
  await expectDeny('owner sets completed -> pending', () => transition(o1, guestApt, () => ({ status: 'pending' })));
  await expectDeny('owner edits clientName', () => updateDoc(doc(o1, 'appointments', guestApt), { clientName: 'X' }));

  await expectOk('client hides completed', () => hide(c1, 'done1'));
  await expectDeny('client deletes completed', () => del(c1, 'done2'));
  await expectDeny('client hides pending', () => hide(c1, 'pend9'));
  await expectOk('client deletes cancelled', () => del(c1, clientApt));
  let toDelete;
  await expectOk('guest books 14:00', async () => { toDelete = await book(guest, aptData({ startTime: '14:00', endTime: '14:30' }), 'pending'); });
  await expectOk('owner deletes active apt + lock release', () => del(o1, toDelete));
  await expectOk('lock has no deleted entry', async () => {
    const s = await getDoc(doc(guest, 'slotLocks', lockId('c1', D)));
    if (s.data().entries.some(e => e.aptId === toDelete)) throw new Error('entry still there');
  });
  await expectOk('capacity: 2nd booking same slot rejected client-side (SLOT_TAKEN)', async () => {
    try { await book(guest, aptData({ startTime: '11:00', endTime: '11:30' }), 'pending'); throw new Error('should be taken'); }
    catch (e) { if (e.message !== 'SLOT_TAKEN') throw e; }
  });

  await expectOk('client reads own apt by id', () => getDoc(doc(c1, 'appointments', 'done1')));
  await expectOk('concurrency: 2 parallel bookings same slot -> exactly 1 wins', async () => {
    const g1 = dbFor(null), g2 = dbFor(null);
    const r = await Promise.allSettled([
      book(g1, aptData({ startTime: '19:00', endTime: '19:30' }), 'pending'),
      book(g2, aptData({ startTime: '19:00', endTime: '19:30' }), 'pending'),
    ]);
    const ok = r.filter(x => x.status === 'fulfilled').length;
    const taken = r.filter(x => x.status === 'rejected' && x.reason.message === 'SLOT_TAKEN').length;
    if (ok !== 1 || taken !== 1) throw new Error(JSON.stringify(r.map(x => x.status + ':' + (x.reason?.message ?? ''))));
  });
  await expectOk('concurrency: parallel cancel (client) + delete (owner) of 2 apts same day', async () => {
    const a = await book(c1, aptData({ clientId: 'client1', isGuestClient: false, startTime: '21:00', endTime: '21:30' }), 'pending');
    const b = await book(guest, aptData({ startTime: '21:30', endTime: '22:00' }), 'pending');
    await Promise.all([transition(c1, a, () => ({ status: 'cancelled', cancelledBy: 'client' })), del(o1, b)]);
    const s = await getDoc(doc(guest, 'slotLocks', lockId('c1', D)));
    if (s.data().entries.some(e => e.aptId === a || e.aptId === b)) throw new Error('stale entries');
  });
  await expectOk('capacity 2: two bookings same slot both succeed', async () => {
    await book(guest, aptData({ startTime: '20:00', endTime: '20:30' }), 'pending', 2);
    await book(guest, aptData({ startTime: '20:00', endTime: '20:30' }), 'pending', 2);
  });

  console.log('USERS');
  await expectOk('client updates own profile fields', () => setDoc(doc(c1, 'users', 'client1'), { displayName: 'Ana B', phone: '1', profileComplete: true }, { merge: true }));
  await expectOk('client updates fcmToken', () => updateDoc(doc(c1, 'users', 'client1'), { fcmToken: 'tok' }));
  await expectDeny('client changes role', () => updateDoc(doc(c1, 'users', 'client1'), { role: 'superadmin' }));
  await expectDeny('client changes isActive', () => updateDoc(doc(c1, 'users', 'client1'), { isActive: false }));
  await expectDeny('client changes uid', () => updateDoc(doc(c1, 'users', 'client1'), { uid: 'x' }));
  await expectOk('legacy doc without role sets role once', () => setDoc(doc(c2, 'users', 'client2'), { role: 'client' }, { merge: true }).catch(async e => { throw e; }));
  const newU = dbFor('newuser');
  await expectOk('register: create own doc (merge) with role company', () => setDoc(doc(newU, 'users', 'newuser'), { uid: 'newuser', email: 'n@n', displayName: 'N', role: 'company', createdAt: Date.now() }, { merge: true }));
  const newT = dbFor('newterms');
  await expectOk('register with acceptedTermsAt = serverTimestamp', () => setDoc(doc(newT, 'users', 'newterms'), { uid: 'newterms', email: 't@t', displayName: 'T', role: 'client', createdAt: Date.now(), acceptedTermsAt: serverTimestamp() }, { merge: true }));
  const newT2 = dbFor('newterms2');
  await expectDeny('register with forged acceptedTermsAt (past date)', () => setDoc(doc(newT2, 'users', 'newterms2'), { uid: 'newterms2', role: 'client', acceptedTermsAt: Timestamp.fromDate(new Date('2020-01-01')) }, { merge: true }));
  await expectDeny('user backdates acceptedTermsAt on update', () => updateDoc(doc(newT, 'users', 'newterms'), { acceptedTermsAt: Timestamp.fromDate(new Date('2020-01-01')) }));
  await expectOk('user re-accepts terms (serverTimestamp) on update', () => updateDoc(doc(newT, 'users', 'newterms'), { acceptedTermsAt: serverTimestamp() }));
  const newU2 = dbFor('newuser2');
  await expectDeny('register as superadmin', () => setDoc(doc(newU2, 'users', 'newuser2'), { uid: 'newuser2', role: 'superadmin' }, { merge: true }));
  await expectOk('admin toggles isActive', () => updateDoc(doc(admin, 'users', 'client2'), { isActive: false }));
  await expectOk('admin lists users', () => getDocs(collection(admin, 'users')));

  console.log('STAFF SCHEDULE (reserva con profesional)');
  const D2 = '2030-05-17'; // viernes
  await expectOk('guest books st2 inside her hours (vie 10:00)', () => book(guest, aptData({ date: D2, staffId: 'st2', staffName: 'Luisa', startTime: '10:00', endTime: '10:30' }), 'pending'));
  await expectDeny('guest books st2 past close (vie 11:45-12:15)', () => book(guest, aptData({ date: D2, staffId: 'st2', staffName: 'Luisa', startTime: '11:45', endTime: '12:15' }), 'pending'));
  await expectDeny('guest books st2 before open (vie 08:30)', () => book(guest, aptData({ date: D2, staffId: 'st2', staffName: 'Luisa', startTime: '08:30', endTime: '09:00' }), 'pending'));
  await expectDeny('guest books st2 on disabled day (sab)', () => book(guest, aptData({ date: '2030-05-18', staffId: 'st2', staffName: 'Luisa', startTime: '10:00', endTime: '10:30' }), 'pending'));
  await expectDeny('guest books st2 on day not in schedule (lun)', () => book(guest, aptData({ date: '2030-05-20', staffId: 'st2', staffName: 'Luisa', startTime: '10:00', endTime: '10:30' }), 'pending'));
  await expectDeny('guest books inactive staff st3', () => book(guest, aptData({ date: D2, staffId: 'st3', staffName: 'Baja', startTime: '14:00', endTime: '14:30' }), 'pending'));
  await expectDeny('guest books st1 for service it does not offer', () => book(guest, aptData({ date: D2, serviceId: 's2', staffId: 'st1', staffName: 'Pepe', startTime: '15:00', endTime: '15:30' }), 'pending'));
  await expectDeny('guest books unknown staff', () => book(guest, aptData({ date: D2, staffId: 'ghost', staffName: 'X', startTime: '16:00', endTime: '16:30' }), 'pending'));
  await expectOk('guest books st1 without own schedule (company hours)', () => book(guest, aptData({ date: D2, staffId: 'st1', staffName: 'Pepe', startTime: '18:00', endTime: '18:30' }), 'pending'));
  await expectOk('guest books any professional (no staffId)', () => book(guest, aptData({ date: D2, startTime: '19:00', endTime: '19:30' }), 'pending'));
  await expectOk('owner manual apt with staff outside hours (allowed)', () => book(o1, aptData({ date: D2, source: 'manual', staffId: 'st2', staffName: 'Luisa', startTime: '20:00', endTime: '20:30' }), 'scheduled'));

  console.log('COMPANIES');
  await expectOk('owner updates profile fields', () => updateDoc(doc(o1, 'companies', 'c1'), { name: 'Salon 2', updatedAt: serverTimestamp(), schedule: [], slotInterval: 15 }));
  await expectDeny('owner changes isActive', () => updateDoc(doc(o1, 'companies', 'c1'), { isActive: false }));
  await expectDeny('owner changes ownerId', () => updateDoc(doc(o1, 'companies', 'c1'), { ownerId: 'x' }));
  await expectDeny('client rating update +1 (ya no se escribe)', () => updateDoc(doc(c1, 'companies', 'c1'), { averageRating: 4.7, reviewCount: 3 }));
  await expectDeny('client rating avg only (ya no se escribe)', () => updateDoc(doc(c1, 'companies', 'c1'), { averageRating: 4 }));
  await expectDeny('owner sets own averageRating', () => updateDoc(doc(o1, 'companies', 'c1'), { averageRating: 5 }));
  await expectDeny('client rating +2', () => updateDoc(doc(c1, 'companies', 'c1'), { averageRating: 4.7, reviewCount: 5 }));
  await expectDeny('client rating avg 6', () => updateDoc(doc(c1, 'companies', 'c1'), { averageRating: 6 }));
  await expectDeny('client changes name', () => updateDoc(doc(c1, 'companies', 'c1'), { name: 'pwned' }));
  await expectOk('company user creates own company', () => setDoc(doc(collection(newU, 'companies')), { name: 'New', ownerId: 'newuser', isActive: true, isPublic: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  await expectDeny('company user creates company for other owner', () => setDoc(doc(collection(newU, 'companies')), { name: 'New', ownerId: 'owner1', isActive: true, isPublic: true }));
  await expectDeny('client creates company', () => setDoc(doc(collection(c1, 'companies')), { name: 'New', ownerId: 'client1', isActive: true, isPublic: true }));
  await seed('companies/c4', { ownerId: 'owner2', name: 'NoCount', isActive: true, isPublic: true });
  await expectDeny('rating +1 from missing reviewCount', () => updateDoc(doc(c1, 'companies', 'c4'), { averageRating: 5, reviewCount: 1 }));
  await expectOk('public search query isPublic+isActive', () => getDocs(query(collection(guest, 'companies'), where('isPublic', '==', true), where('isActive', '==', true))));
  await expectOk('admin expires company isActive=false', () => setDoc(doc(admin, 'companies', 'c3'), { isActive: false }, { merge: true }));

  console.log('SUBSCRIPTIONS');
  const addMonths = (m) => { const d = new Date(); d.setMonth(d.getMonth() + m); return d; };
  await expectOk('owner reads non-existing own subscription in tx + creates trial', () => runTransaction(o1, async tx => {
    const ref = doc(o1, 'subscriptions', 'c1');
    const s = await tx.get(ref);
    if (s.exists()) return;
    tx.set(ref, { companyId: 'c1', status: 'trial', trialStartDate: serverTimestamp(), trialEndDate: Timestamp.fromDate(addMonths(2)) });
  }));
  await expectDeny('owner overwrites existing trial', () => setDoc(doc(o1, 'subscriptions', 'c1'), { companyId: 'c1', status: 'trial', trialStartDate: serverTimestamp(), trialEndDate: Timestamp.fromDate(addMonths(2)) }));
  await expectDeny('owner creates active sub', () => setDoc(doc(o2, 'subscriptions', 'c2'), { companyId: 'c2', status: 'active', trialStartDate: serverTimestamp(), trialEndDate: Timestamp.fromDate(addMonths(2)) }));
  await expectDeny('owner creates trial 70 days', () => setDoc(doc(o2, 'subscriptions', 'c2'), { companyId: 'c2', status: 'trial', trialStartDate: serverTimestamp(), trialEndDate: Timestamp.fromDate(new Date(Date.now() + 70 * 86400000)) }));
  await expectDeny('owner creates trial for other company', () => setDoc(doc(o2, 'subscriptions', 'c1x'), { companyId: 'c1x', status: 'trial', trialStartDate: serverTimestamp(), trialEndDate: Timestamp.fromDate(addMonths(2)) }));
  // Tope del trial según config/app (sin doc = 2 meses → 63 días)
  const trial = (cid, months) => ({ companyId: cid, status: 'trial', trialStartDate: serverTimestamp(), trialEndDate: Timestamp.fromDate(addMonths(months)) });
  await expectDeny('owner creates trial 3 months without config (63d cap)', () => setDoc(doc(o2, 'subscriptions', 'c3'), trial('c3', 3)));
  await expectOk('admin sets config trialMonths=3', () => setDoc(doc(admin, 'config', 'app'), { trialMonths: 3, updatedAt: serverTimestamp() }, { merge: true }));
  await expectOk('owner creates trial 3 months with config trialMonths=3', () => setDoc(doc(o2, 'subscriptions', 'c3'), trial('c3', 3)));
  await expectOk(`owner reads own subscription`, () => getDoc(doc(o1, 'subscriptions', 'c1')));
  await expectDeny('client reads subscription', () => getDoc(doc(c1, 'subscriptions', 'c1')));
  await expectOk('admin updates subscription', () => updateDoc(doc(admin, 'subscriptions', 'c1'), { status: 'active' }));

  console.log('CONFIG');
  await expectOk('guest reads config/app', () => getDoc(doc(guest, 'config', 'app')));
  await expectOk('client reads config/app', () => getDoc(doc(c1, 'config', 'app')));
  await expectOk('admin writes full config/app', () => setDoc(doc(admin, 'config', 'app'), {
    plans: { mensual: { amount: 30000, days: 30, links: { test: '', prod: 'https://checkout.wompi.co/l/x' } } },
    trialMonths: 2, warningDays: 7, graceDays: 3,
    support: { whatsapp: '573001234567', email: 'soporte@agendago.co' },
    announcement: { active: true, text: 'Hola', level: 'info' },
    updatedAt: serverTimestamp(),
  }, { merge: true }));
  await expectDeny('admin writes trialMonths out of range', () => setDoc(doc(admin, 'config', 'app'), { trialMonths: 13 }, { merge: true }));
  await expectDeny('admin writes graceDays as string', () => setDoc(doc(admin, 'config', 'app'), { graceDays: '5' }, { merge: true }));
  await expectDeny('company writes config/app', () => setDoc(doc(o1, 'config', 'app'), { trialMonths: 12 }, { merge: true }));
  await expectDeny('client writes config/app', () => setDoc(doc(c1, 'config', 'app'), { announcement: { active: true, text: 'x', level: 'info' } }, { merge: true }));
  await expectDeny('guest writes config/app', () => setDoc(doc(guest, 'config', 'app'), { trialMonths: 12 }, { merge: true }));
  await expectOk('admin writes legal texts', () => setDoc(doc(admin, 'config', 'app'), { legal: { terms: 'T'.repeat(50000), privacy: 'Política', updatedAt: serverTimestamp() }, updatedAt: serverTimestamp() }, { merge: true }));
  await expectOk('guest reads legal texts', async () => {
    const s = await getDoc(doc(guest, 'config', 'app'));
    if (s.data().legal.privacy !== 'Política') throw new Error('bad legal');
  });
  await expectDeny('admin writes legal terms > 50000', () => setDoc(doc(admin, 'config', 'app'), { legal: { terms: 'T'.repeat(50001), privacy: 'P' } }, { merge: true }));
  await expectDeny('admin writes legal with non-string privacy', () => setDoc(doc(admin, 'config', 'app'), { legal: { terms: 'T', privacy: 5 } }, { merge: true }));
  await expectDeny('admin writes legal with extra key', () => setDoc(doc(admin, 'config', 'app'), { legal: { terms: 'T', privacy: 'P', html: '<b>' } }, { merge: true }));
  await expectDeny('admin writes legal as string', () => setDoc(doc(admin, 'config', 'app'), { legal: 'todo' }, { merge: true }));
  await expectDeny('company writes legal', () => setDoc(doc(o1, 'config', 'app'), { legal: { terms: 'T', privacy: 'P' } }, { merge: true }));

  console.log('REVIEWS');
  const rev = (over = {}) => ({ companyId: 'c1', clientId: 'client1', clientName: 'Ana', rating: 5, comment: 'genial', createdAt: Date.now(), appointmentId: 'done1', ...over });
  await expectDeny('review for pending apt', () => setDoc(doc(c1, 'reviews', 'pend9'), rev({ appointmentId: 'pend9' })));
  await expectDeny('review rating 6', () => setDoc(doc(c1, 'reviews', 'done1'), rev({ rating: 6 })));
  await expectDeny('review rating 4.5', () => setDoc(doc(c1, 'reviews', 'done1'), rev({ rating: 4.5 })));
  await expectDeny('review id != appointmentId', () => setDoc(doc(c1, 'reviews', 'randomid'), rev()));
  await expectDeny('client2 reviews client1 apt', () => setDoc(doc(c2, 'reviews', 'done1'), rev({ clientId: 'client2' })));
  await expectOk('review for own completed apt (tx like service)', () => runTransaction(c1, async tx => {
    const ref = doc(c1, 'reviews', 'done1');
    const s = await tx.get(ref);
    if (s.exists()) throw new Error('ALREADY_REVIEWED');
    tx.set(ref, rev({ clientPhotoUrl: 'data:x' }));
  }));
  await expectDeny('duplicate review same apt (overwrite)', () => setDoc(doc(c1, 'reviews', 'done1'), rev({ createdAt: Date.now() + 5 })));
  await expectOk('client edits own review', () => updateDoc(doc(c1, 'reviews', 'done1'), { rating: 4, comment: 'ok', updatedAt: Date.now() }));
  await expectOk('owner replies', () => updateDoc(doc(o1, 'reviews', 'done1'), { reply: 'gracias', replyAt: Date.now() }));
  await expectOk('public reads reviews by company', () => getDocs(query(collection(guest, 'reviews'), where('companyId', '==', 'c1'))));
  await expectOk('client deletes own review', () => deleteDoc(doc(c1, 'reviews', 'done1')));

  console.log('NOTIFICATIONS');
  const notif = (over = {}) => ({ recipientId: 'owner1', type: 'new_appointment', title: 'Nueva cita', body: 'x', link: '/empresa/dashboard', senderId: 'client1', read: false, createdAt: serverTimestamp(), ...over });
  await expectOk('client notifies owner new_appointment', () => addDoc(collection(c1, 'notifications'), notif()));
  await expectOk('owner notifies admin new_company', () => addDoc(collection(o1, 'notifications'), notif({ recipientId: 'admin', type: 'new_company', senderId: 'owner1' })));
  await expectDeny('notification without senderId', () => addDoc(collection(c1, 'notifications'), (({ senderId, ...r }) => r)(notif())));
  await expectDeny('notification spoofed senderId', () => addDoc(collection(c1, 'notifications'), notif({ senderId: 'owner1' })));
  await expectDeny('notification unknown type', () => addDoc(collection(c1, 'notifications'), notif({ type: 'phish' })));
  await expectDeny('client sends plan_changed', () => addDoc(collection(c1, 'notifications'), notif({ type: 'plan_changed' })));
  await expectOk('admin sends plan_changed', () => addDoc(collection(admin, 'notifications'), notif({ type: 'plan_changed', senderId: 'admin' })));
  await expectDeny('guest notification', () => addDoc(collection(guest, 'notifications'), notif({ senderId: 'x' })));
  await expectDeny('client sends new_message to admin', () => addDoc(collection(c1, 'notifications'), notif({ recipientId: 'admin', type: 'new_message' })));
  await expectOk('owner watches + markAllRead', async () => {
    const s = await getDocs(query(collection(o1, 'notifications'), where('recipientId', '==', 'owner1'), where('read', '==', false)));
    const b = writeBatch(o1); s.docs.forEach(d => b.update(d.ref, { read: true })); await b.commit();
  });
  await expectOk('admin watches admin inbox + marks read', async () => {
    const s = await getDocs(query(collection(admin, 'notifications'), where('recipientId', '==', 'admin')));
    for (const d of s.docs) await updateDoc(d.ref, { read: true });
  });

  console.log('MESSAGES');
  let m1, m2;
  await expectOk('client sends message', async () => { m1 = (await addDoc(collection(c1, 'messages'), { companyId: 'c1', companyName: 'Salon', clientId: 'client1', clientName: 'Ana', senderRole: 'client', text: 'hola', createdAt: serverTimestamp(), read: false })).id; });
  await expectDeny('client sends as other client', () => addDoc(collection(c1, 'messages'), { companyId: 'c1', clientId: 'client2', clientName: 'Ana', senderRole: 'client', text: 'hola', createdAt: serverTimestamp(), read: false }));
  await expectDeny('client sends as company', () => addDoc(collection(c1, 'messages'), { companyId: 'c1', clientId: 'client1', clientName: 'Ana', senderRole: 'company', text: 'hola', createdAt: serverTimestamp(), read: false }));
  await expectOk('owner replies', async () => { m2 = (await addDoc(collection(o1, 'messages'), { companyId: 'c1', clientId: 'client1', clientName: 'Ana', senderRole: 'company', text: 'buenas', createdAt: serverTimestamp(), read: false })).id; });
  await expectOk('client watches conversation', () => getDocs(query(collection(c1, 'messages'), where('companyId', '==', 'c1'), where('clientId', '==', 'client1'), orderBy('createdAt', 'asc'))));
  await expectOk('owner watches conversations', () => getDocs(query(collection(o1, 'messages'), where('companyId', '==', 'c1'), orderBy('createdAt', 'desc'))));
  await expectOk('client marks company msg read', () => updateDoc(doc(c1, 'messages', m2), { read: true }));
  await expectOk('client edits own msg', () => updateDoc(doc(c1, 'messages', m1), { text: 'hola!', edited: true, editedAt: serverTimestamp() }));
  await expectDeny('client edits company msg', () => updateDoc(doc(c1, 'messages', m2), { text: 'x', edited: true, editedAt: serverTimestamp() }));
  await expectOk('client soft-deletes own msg', () => updateDoc(doc(c1, 'messages', m1), { deleted: true, text: '' }));
  await expectDeny('client edits deleted msg', () => updateDoc(doc(c1, 'messages', m1), { text: 'revive', edited: true, editedAt: serverTimestamp() }));
  await expectOk('owner deletes conversation', async () => {
    const s = await getDocs(query(collection(o1, 'messages'), where('companyId', '==', 'c1'), where('clientId', '==', 'client1')));
    await Promise.all(s.docs.map(d => deleteDoc(d.ref)));
  });

  console.log('PAYMENTS (registro manual del admin)');
  const manualPay = (db, cid, id) => runTransaction(db, async tx => {
    const payRef = doc(db, 'payments', id), subRef = doc(db, 'subscriptions', cid), coRef = doc(db, 'companies', cid);
    const [p, s, c] = await Promise.all([tx.get(payRef), tx.get(subRef), tx.get(coRef)]);
    if (p.exists()) throw new Error('DUPLICATE_PAYMENT');
    const end = Timestamp.fromDate(new Date(Date.now() + 30 * 864e5));
    tx.set(payRef, { companyId: cid, plan: 'mensual', amount: 29000, status: 'approved', source: 'manual', wompiRef: 'REF1', periodStart: Timestamp.now(), periodEnd: end, createdAt: serverTimestamp() });
    tx.set(subRef, { companyId: cid, status: 'active', plan: 'mensual', lastPaymentDate: serverTimestamp(), currentPeriodStart: Timestamp.now(), currentPeriodEnd: end }, { merge: true });
    tx.update(coRef, { isActive: true });
  });
  await expectOk('admin registers manual payment', () => manualPay(admin, 'c1', 'manual-REF1'));
  await expectDeny('owner registers own payment', () => manualPay(o1, 'c1', 'manual-REF2'));
  await expectOk('owner reads payment history', () => getDocs(query(collection(o1, 'payments'), where('companyId', '==', 'c1'), orderBy('createdAt', 'desc'))));
  await expectDeny('other owner reads c1 payments', () => getDocs(query(collection(o2, 'payments'), where('companyId', '==', 'c1'))));
  await expectOk('admin notifies owner plan_changed', () => addDoc(collection(admin, 'notifications'), { recipientId: 'owner1', type: 'plan_changed', title: 'Pago', body: 'ok', link: '/empresa/facturacion', read: false, createdAt: serverTimestamp(), senderId: 'admin' }));
  await expectDeny('owner sends plan_changed', () => addDoc(collection(o1, 'notifications'), { recipientId: 'owner1', type: 'plan_changed', title: 'Pago', body: 'ok', read: false, createdAt: serverTimestamp(), senderId: 'owner1' }));
  await expectOk('owner notifies admin payment_initiated', () => addDoc(collection(o1, 'notifications'), { recipientId: 'admin', type: 'payment_initiated', title: 'Pago iniciado', body: 'ref', link: '/admin/facturacion', read: false, createdAt: serverTimestamp(), senderId: 'owner1' }));

  console.log('PAYMENT CLAIMS (reporte de la empresa al volver de Wompi)');
  const claim = (over = {}) => ({ companyId: 'c1', companyName: 'Salon', ownerEmail: 'o@o', transactionId: '12345-1700-999', status: 'pending', createdAt: serverTimestamp(), ...over });
  await expectOk('owner reads non-existing claim (pre-check)', () => getDoc(doc(o1, 'paymentClaims', '12345-1700-999')));
  await expectOk('owner reports own payment', () => setDoc(doc(o1, 'paymentClaims', '12345-1700-999'), claim()));
  await expectOk('owner reports with Wompi details', () => setDoc(doc(o1, 'paymentClaims', '88888-1700-999'), claim({ transactionId: '88888-1700-999', amount: 29000, plan: 'mensual', payerName: 'Juan', payerEmail: 'j@j.co', payerPhone: '+573991111111', paymentMethod: 'NEQUI', paidAt: '2026-10-14T17:03:00Z' })));
  await expectDeny('details with wrong types', () => setDoc(doc(o1, 'paymentClaims', '99999-1700-999'), claim({ transactionId: '99999-1700-999', amount: 'mucho' })));
  await expectDeny('owner reports same tx again (update)', () => setDoc(doc(o1, 'paymentClaims', '12345-1700-999'), claim()));
  await expectDeny('other owner reports same tx', () => setDoc(doc(o2, 'paymentClaims', '12345-1700-999'), claim({ companyId: 'c3' })));
  await expectDeny('owner reports for another company', () => setDoc(doc(o1, 'paymentClaims', '22222-1700-999'), claim({ companyId: 'c3', transactionId: '22222-1700-999' })));
  await expectDeny('owner reports as registered', () => setDoc(doc(o1, 'paymentClaims', '33333-1700-999'), claim({ transactionId: '33333-1700-999', status: 'registered' })));
  await expectDeny('id != transactionId', () => setDoc(doc(o1, 'paymentClaims', '44444-1700-999'), claim({ transactionId: '55555-1700-999' })));
  await expectDeny('bad tx id chars', () => setDoc(doc(o1, 'paymentClaims', 'abc$%^'), claim({ transactionId: 'abc$%^' })));
  await expectDeny('extra field', () => setDoc(doc(o1, 'paymentClaims', '66666-1700-999'), { ...claim({ transactionId: '66666-1700-999' }), activated: true }));
  await expectDeny('client reports payment', () => setDoc(doc(c1, 'paymentClaims', '77777-1700-999'), claim({ transactionId: '77777-1700-999' })));
  await expectDeny('owner closes own claim', () => updateDoc(doc(o1, 'paymentClaims', '12345-1700-999'), { status: 'registered' }));
  await expectDeny('other owner reads claim', () => getDoc(doc(o2, 'paymentClaims', '12345-1700-999')));
  await expectOk('owner reads own claim', () => getDoc(doc(o1, 'paymentClaims', '12345-1700-999')));
  await expectOk('admin lists pending claims', () => getDocs(query(collection(admin, 'paymentClaims'), where('status', '==', 'pending'))));
  await expectOk('admin closes claim', () => updateDoc(doc(admin, 'paymentClaims', '12345-1700-999'), { status: 'registered', reviewedAt: serverTimestamp() }));

  console.log('PAYMENT ATTEMPTS (la empresa abrió Wompi)');
  const att = (over = {}) => ({ companyId: 'c1', companyName: 'Salon', plan: 'mensual', amount: 29000, status: 'open', createdAt: serverTimestamp(), ...over });
  let attId;
  await expectOk('owner records attempt', async () => { attId = (await addDoc(collection(o1, 'paymentAttempts'), att())).id; });
  await expectDeny('owner records attempt for other company', () => addDoc(collection(o1, 'paymentAttempts'), att({ companyId: 'c3' })));
  await expectDeny('attempt with unknown plan', () => addDoc(collection(o1, 'paymentAttempts'), att({ plan: 'vip' })));
  await expectDeny('attempt created as dismissed', () => addDoc(collection(o1, 'paymentAttempts'), att({ status: 'dismissed' })));
  await expectDeny('attempt with extra field', () => addDoc(collection(o1, 'paymentAttempts'), { ...att(), paid: true }));
  await expectDeny('client records attempt', () => addDoc(collection(c1, 'paymentAttempts'), att()));
  await expectDeny('owner dismisses own attempt', () => updateDoc(doc(o1, 'paymentAttempts', attId), { status: 'dismissed' }));
  await expectDeny('other owner reads attempt', () => getDoc(doc(o2, 'paymentAttempts', attId)));
  await expectOk('admin lists open attempts', () => getDocs(query(collection(admin, 'paymentAttempts'), where('status', '==', 'open'))));
  await expectOk('admin lists all claims', () => getDocs(collection(admin, 'paymentClaims')));
  await expectOk('admin lists all payments', () => getDocs(collection(admin, 'payments')));
  await expectOk('admin dismisses attempt', () => updateDoc(doc(admin, 'paymentAttempts', attId), { status: 'dismissed' }));

  console.log('SUPPORT (chat Empresa <-> Admin)');
  const thread = (over = {}) => ({ companyId: 'c1', companyName: 'Salon', kind: 'consulta', lastMessage: 'hola',
    lastMessageAt: serverTimestamp(), lastSender: 'company', unreadByAdmin: true, unreadByCompany: false,
    status: 'open', createdAt: serverTimestamp(), ...over });
  const smsg = (over = {}) => ({ sender: 'company', senderUid: 'owner1', text: 'hola', createdAt: serverTimestamp(), ...over });
  const tCol = (db, id) => collection(db, 'supportThreads', id, 'messages');
  await expectOk('owner reads own non-existing thread', () => getDoc(doc(o1, 'supportThreads', 'c1_consulta')));
  await expectOk('owner creates own thread', () => setDoc(doc(o1, 'supportThreads', 'c1_consulta'), thread()));
  await expectOk('owner writes message as company', () => addDoc(tCol(o1, 'c1_consulta'), smsg()));
  await expectOk('owner creates urgente thread + msg in a batch', async () => {
    const b = writeBatch(o1);
    b.set(doc(o1, 'supportThreads', 'c1_urgente'), thread({ kind: 'urgente' }));
    b.set(doc(tCol(o1, 'c1_urgente')), smsg({ text: 'no carga' }));
    await b.commit();
  });
  await expectDeny('thread id != companyId_kind', () => setDoc(doc(o1, 'supportThreads', 'c1_urgente2'), thread({ kind: 'urgente' })));
  await expectDeny('thread with unknown kind', () => setDoc(doc(o1, 'supportThreads', 'c1_otro'), thread({ kind: 'otro' })));
  await expectDeny('owner creates thread for other company', () => setDoc(doc(o1, 'supportThreads', 'c3_consulta'), thread({ companyId: 'c3' })));
  await expectDeny('thread created as resolved', () => setDoc(doc(o2, 'supportThreads', 'c3_consulta'), thread({ companyId: 'c3', status: 'resolved' })));
  await expectDeny('thread with extra field', () => setDoc(doc(o2, 'supportThreads', 'c3_consulta'), { ...thread({ companyId: 'c3' }), vip: true }));
  await expectOk('owner2 creates own thread (c3)', () => setDoc(doc(o2, 'supportThreads', 'c3_consulta'), thread({ companyId: 'c3' })));
  await expectDeny('company A reads company B thread', () => getDoc(doc(o1, 'supportThreads', 'c3_consulta')));
  await expectDeny('company A reads company B messages', () => getDocs(tCol(o1, 'c3_consulta')));
  await expectDeny('company A lists company B threads', () => getDocs(query(collection(o1, 'supportThreads'), where('companyId', '==', 'c3'))));
  await expectDeny('company A lists all threads', () => getDocs(collection(o1, 'supportThreads')));
  await expectOk('owner lists own threads', () => getDocs(query(collection(o1, 'supportThreads'), where('companyId', '==', 'c1'))));
  await expectOk('owner reads own messages', () => getDocs(query(tCol(o1, 'c1_consulta'), orderBy('createdAt', 'asc'))));
  await expectDeny('company writes as admin', () => addDoc(tCol(o1, 'c1_consulta'), smsg({ sender: 'admin' })));
  await expectDeny('company spoofs senderUid', () => addDoc(tCol(o1, 'c1_consulta'), smsg({ senderUid: 'admin' })));
  await expectDeny('company writes in other company thread', () => addDoc(tCol(o1, 'c3_consulta'), smsg()));
  await expectDeny('empty message', () => addDoc(tCol(o1, 'c1_consulta'), smsg({ text: '' })));
  await expectDeny('message too long', () => addDoc(tCol(o1, 'c1_consulta'), smsg({ text: 'x'.repeat(2001) })));
  await expectDeny('message with client createdAt', () => addDoc(tCol(o1, 'c1_consulta'), smsg({ createdAt: Timestamp.now() })));
  await expectDeny('client reads thread', () => getDoc(doc(c1, 'supportThreads', 'c1_consulta')));
  await expectDeny('client reads messages', () => getDocs(tCol(c1, 'c1_consulta')));
  await expectDeny('client writes message', () => addDoc(tCol(c1, 'c1_consulta'), smsg({ senderUid: 'client1' })));
  await expectDeny('client creates thread', () => setDoc(doc(c1, 'supportThreads', 'c1_consulta'), thread()));
  await expectDeny('guest reads thread', () => getDoc(doc(guest, 'supportThreads', 'c1_consulta')));
  await expectDeny('company resolves own thread', () => updateDoc(doc(o1, 'supportThreads', 'c1_consulta'), { status: 'resolved' }));
  await expectDeny('company marks read for admin', () => updateDoc(doc(o1, 'supportThreads', 'c1_consulta'), { unreadByAdmin: false }));
  await expectDeny('company poses as admin in summary', () => updateDoc(doc(o1, 'supportThreads', 'c1_consulta'), { lastMessage: 'x', lastSender: 'admin', lastMessageAt: serverTimestamp() }));
  await expectDeny('company changes kind', () => updateDoc(doc(o1, 'supportThreads', 'c1_consulta'), { kind: 'urgente' }));
  await expectOk('company updates summary', () => updateDoc(doc(o1, 'supportThreads', 'c1_consulta'), { lastMessage: 'otra', lastSender: 'company', lastMessageAt: serverTimestamp(), unreadByAdmin: true }));
  await expectOk('admin lists all threads', () => getDocs(collection(admin, 'supportThreads')));
  await expectOk('admin reads messages', () => getDocs(tCol(admin, 'c3_consulta')));
  await expectOk('admin replies + summary in a batch', async () => {
    const b = writeBatch(admin);
    b.update(doc(admin, 'supportThreads', 'c1_consulta'), { lastMessage: 'listo', lastSender: 'admin', lastMessageAt: serverTimestamp(), unreadByCompany: true, unreadByAdmin: false });
    b.set(doc(tCol(admin, 'c1_consulta')), smsg({ sender: 'admin', senderUid: 'admin', text: 'listo' }));
    await b.commit();
  });
  await expectDeny('admin writes as company', () => addDoc(tCol(admin, 'c1_consulta'), smsg({ senderUid: 'admin' })));
  await expectOk('company marks own thread read', () => updateDoc(doc(o1, 'supportThreads', 'c1_consulta'), { unreadByCompany: false }));
  await expectDeny('company marks unread for itself', () => updateDoc(doc(o1, 'supportThreads', 'c1_consulta'), { unreadByCompany: true }));
  await expectOk('admin resolves thread', () => updateDoc(doc(admin, 'supportThreads', 'c1_consulta'), { status: 'resolved' }));
  await expectDeny('admin sets unknown status', () => updateDoc(doc(admin, 'supportThreads', 'c1_consulta'), { status: 'archived' }));
  await expectOk('company writing reopens resolved thread', () => updateDoc(doc(o1, 'supportThreads', 'c1_consulta'), { lastMessage: 'de nuevo', lastSender: 'company', lastMessageAt: serverTimestamp(), unreadByAdmin: true, status: 'open' }));
  let smsgId;
  await expectOk('owner writes another message', async () => { smsgId = (await addDoc(tCol(o1, 'c1_consulta'), smsg())).id; });
  await expectDeny('company edits message', () => updateDoc(doc(o1, 'supportThreads', 'c1_consulta', 'messages', smsgId), { text: 'cambio' }));
  await expectDeny('company deletes message', () => deleteDoc(doc(o1, 'supportThreads', 'c1_consulta', 'messages', smsgId)));
  await expectDeny('admin deletes message', () => deleteDoc(doc(admin, 'supportThreads', 'c1_consulta', 'messages', smsgId)));
  await expectDeny('company deletes thread', () => deleteDoc(doc(o1, 'supportThreads', 'c1_urgente')));
  await expectOk('company notifies admin support_message', () => addDoc(collection(o1, 'notifications'), { recipientId: 'admin', type: 'support_message', title: 'Urgente de Salon', body: 'no carga', link: '/admin/soporte?hilo=c1_urgente', read: false, createdAt: serverTimestamp(), senderId: 'owner1' }));
  await expectDeny('support_message to a non-admin inbox', () => addDoc(collection(o1, 'notifications'), { recipientId: 'owner2', type: 'support_message', title: 'x', body: 'x', read: false, createdAt: serverTimestamp(), senderId: 'owner1' }));
  await expectOk('admin notifies owner support_reply', () => addDoc(collection(admin, 'notifications'), { recipientId: 'owner1', type: 'support_reply', title: 'Soporte respondio', body: 'listo', link: '/empresa/facturacion?soporte=consulta', read: false, createdAt: serverTimestamp(), senderId: 'admin' }));
  await expectDeny('owner sends support_reply', () => addDoc(collection(o1, 'notifications'), { recipientId: 'owner2', type: 'support_reply', title: 'x', body: 'x', read: false, createdAt: serverTimestamp(), senderId: 'owner1' }));
  await expectOk('admin deletes thread', () => deleteDoc(doc(admin, 'supportThreads', 'c1_urgente')));

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });
