import * as functions from 'firebase-functions/v2';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

export const checkExpiredSubscriptions = functions.scheduler.onSchedule(
  { schedule: 'every day 05:00', timeZone: 'America/Bogota' },
  async () => {
    const db = getFirestore();
    const now = Timestamp.now();
    const batch = db.batch();
    let count = 0;

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

    for (const snap of [...expiredActive.docs, ...expiredTrials.docs]) {
      batch.update(snap.ref, { status: 'expired' });
      batch.update(db.doc(`companies/${snap.id}`), { isActive: false });
      count++;
    }

    if (count > 0) await batch.commit();
  }
);
