import * as functions from 'firebase-functions/v2';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

export const checkExpiredSubscriptions = functions.scheduler.onSchedule(
  { schedule: 'every day 05:00', timeZone: 'America/Bogota' },
  async () => {
    const db = getFirestore();
    const now = Timestamp.now();

    const expired = await db.collection('subscriptions')
      .where('status', 'in', ['active', 'trial'])
      .where('currentPeriodEnd', '<=', now)
      .get();

    if (expired.empty) return;

    const batch = db.batch();
    for (const snap of expired.docs) {
      batch.update(snap.ref, { status: 'expired' });
      batch.update(db.doc(`companies/${snap.id}`), { isActive: false });
    }
    await batch.commit();
  }
);
