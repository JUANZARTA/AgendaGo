import * as functions from 'firebase-functions/v2';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

async function sendFcm(token: string, title: string, body: string, link?: string): Promise<void> {
  try {
    await getMessaging().send({
      token,
      notification: { title, body },
      webpush: link ? { fcmOptions: { link } } : undefined,
    });
  } catch {}
}

export const onAppointmentCreated = functions.firestore.onDocumentCreated('appointments/{id}', async (event) => {
  const appt = event.data?.data();
  if (!appt) return;
  const db = getFirestore();

  const companyDoc = await db.collection('companies').doc(appt['companyId']).get();
  const ownerId = companyDoc.data()?.['ownerId'];
  if (!ownerId) return;

  const ownerDoc = await db.collection('users').doc(ownerId).get();
  const ownerToken = ownerDoc.data()?.['fcmToken'];
  if (ownerToken) {
    await sendFcm(
      ownerToken,
      'Nueva cita agendada',
      `${appt['clientName']} — ${appt['serviceName']} — ${appt['date']} ${appt['startTime']}`,
      '/empresa/dashboard',
    );
  }

  if (appt['clientId']) {
    const clientDoc = await db.collection('users').doc(appt['clientId']).get();
    const clientToken = clientDoc.data()?.['fcmToken'];
    if (clientToken) {
      await sendFcm(
        clientToken,
        'Cita recibida',
        `Tu cita en ${appt['companyName']} el ${appt['date']} a las ${appt['startTime']}`,
        '/cliente/citas',
      );
    }
  }
});
