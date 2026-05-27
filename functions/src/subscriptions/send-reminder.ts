import * as functions from 'firebase-functions/v2';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

export const sendSubscriptionReminder = functions.scheduler.onSchedule(
  { schedule: 'every day 09:00', timeZone: 'America/Bogota' },
  async () => {
    const db = getFirestore();
    const in5 = new Date(Date.now() + 5 * 86400000);
    const in6 = new Date(Date.now() + 6 * 86400000);
    const ts5 = Timestamp.fromDate(in5);
    const ts6 = Timestamp.fromDate(in6);

    const [activeSubs, trialSubs] = await Promise.all([
      db.collection('subscriptions')
        .where('status', '==', 'active')
        .where('currentPeriodEnd', '>=', ts5)
        .where('currentPeriodEnd', '<=', ts6)
        .get(),
      db.collection('subscriptions')
        .where('status', '==', 'trial')
        .where('trialEndDate', '>=', ts5)
        .where('trialEndDate', '<=', ts6)
        .get(),
    ]);

    const messaging = getMessaging();
    for (const snap of [...activeSubs.docs, ...trialSubs.docs]) {
      const companyDoc = await db.collection('companies').doc(snap.id).get();
      const ownerId = companyDoc.data()?.['ownerId'];
      if (!ownerId) continue;
      const ownerDoc = await db.collection('users').doc(ownerId).get();
      const token = ownerDoc.data()?.['fcmToken'];
      if (!token) continue;
      try {
        await messaging.send({
          token,
          notification: {
            title: 'Tu suscripción vence en 5 días',
            body: 'Renovà tu plan para mantener tu agenda activa.',
          },
          webpush: { fcmOptions: { link: '/empresa/facturacion' } },
        });
      } catch {}
    }
  }
);
