import * as functions from 'firebase-functions/v2';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

export const sendAppointmentReminders = functions.scheduler.onSchedule(
  { schedule: 'every day 08:00', timeZone: 'America/Bogota' },
  async () => {
    const db = getFirestore();
    const messaging = getMessaging();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const snap = await db.collection('appointments')
      .where('date', '==', tomorrowStr)
      .where('status', 'in', ['scheduled', 'pending'])
      .get();

    for (const doc of snap.docs) {
      const appt = doc.data();
      if (!appt['clientId']) continue;
      const clientDoc = await db.collection('users').doc(appt['clientId']).get();
      const token = clientDoc.data()?.['fcmToken'];
      if (!token) continue;
      try {
        await messaging.send({
          token,
          notification: {
            title: 'Recordatorio de cita mañana',
            body: `${appt['serviceName']} en ${appt['companyName']} a las ${appt['startTime']}`,
          },
          webpush: { fcmOptions: { link: '/cliente/citas' } },
        });
      } catch {}
    }
  }
);
