import * as functions from 'firebase-functions/v2';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

export const sendSubscriptionReminder = functions.scheduler.onSchedule(
  { schedule: 'every day 09:00', timeZone: 'America/Bogota' },
  async () => {
    const db = getFirestore();
    const in5Days = new Date();
    in5Days.setDate(in5Days.getDate() + 5);
    const in6Days = new Date();
    in6Days.setDate(in6Days.getDate() + 6);

    const subs = await db.collection('subscriptions')
      .where('status', 'in', ['active', 'trial'])
      .where('currentPeriodEnd', '>=', Timestamp.fromDate(in5Days))
      .where('currentPeriodEnd', '<=', Timestamp.fromDate(in6Days))
      .get();

    for (const snap of subs.docs) {
      const companyDoc = await db.collection('companies').doc(snap.id).get();
      const ownerId = companyDoc.data()?.['ownerId'];
      if (!ownerId) continue;
      const ownerDoc = await db.collection('users').doc(ownerId).get();
      const token = ownerDoc.data()?.['fcmToken'];
      if (token) {
        await getMessaging().send({
          token,
          notification: {
            title: 'Tu suscripción vence en 5 días',
            body: 'Renovà tu plan para mantener tu agenda activa.',
          },
        });
      }
    }
  }
);
