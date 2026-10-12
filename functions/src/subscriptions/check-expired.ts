import * as functions from 'firebase-functions/v2';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Cada doc genera 2 operaciones; 220 docs = 440 ops (< límite de 500 por batch)
const DOCS_PER_BATCH = 220;

export const checkExpiredSubscriptions = functions.scheduler.onSchedule(
  { schedule: 'every day 05:00', timeZone: 'America/Bogota' },
  async () => {
    const db = getFirestore();
    const now = Timestamp.now();

    const [expiredActive, expiredTrials] = await Promise.all([
      db.collection('subscriptions')
        .where('status', '==', 'active')
        .where('currentPeriodEnd', '<=', now)
        .get(),
      db.collection('subscriptions')
        .where('status', '==', 'trial')
        .where('trialEndDate', '<=', now)
        .get(),
    ]);

    const docs = [...expiredActive.docs, ...expiredTrials.docs];

    for (let i = 0; i < docs.length; i += DOCS_PER_BATCH) {
      const chunk = docs.slice(i, i + DOCS_PER_BATCH);
      try {
        const batch = db.batch();
        for (const snap of chunk) {
          batch.update(snap.ref, { status: 'expired' });
          // set+merge tolera que la empresa no exista (update fallaría y abortaría el batch)
          batch.set(db.doc(`companies/${snap.id}`), { isActive: false }, { merge: true });
        }
        await batch.commit();
      } catch (err) {
        // Un chunk fallido no debe abortar el resto de la corrida
        console.error(`[checkExpiredSubscriptions] Falló el chunk ${i / DOCS_PER_BATCH}`, err);
      }
    }
  }
);
