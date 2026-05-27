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

export const onAppointmentStatusChanged = functions.firestore.onDocumentUpdated('appointments/{id}', async (event) => {
  const before = event.data?.before.data();
  const after  = event.data?.after.data();
  if (!before || !after) return;
  if (before['status'] === after['status']) return;

  const db = getFirestore();

  if (after['status'] === 'scheduled' && after['clientId']) {
    const clientDoc = await db.collection('users').doc(after['clientId']).get();
    const token = clientDoc.data()?.['fcmToken'];
    if (token) {
      await sendFcm(
        token,
        'Cita confirmada ✓',
        `Tu cita en ${after['companyName']} el ${after['date']} a las ${after['startTime']} fue confirmada.`,
        '/cliente/citas',
      );
    }
  }

  if (after['status'] === 'cancelled') {
    const cancelledBy = after['cancelledBy'];

    if (cancelledBy === 'client') {
      const companyDoc = await db.collection('companies').doc(after['companyId']).get();
      const ownerId = companyDoc.data()?.['ownerId'];
      if (ownerId) {
        const ownerDoc = await db.collection('users').doc(ownerId).get();
        const token = ownerDoc.data()?.['fcmToken'];
        if (token) {
          await sendFcm(
            token,
            'Cita cancelada',
            `${after['clientName']} canceló su cita del ${after['date']} a las ${after['startTime']}.`,
            '/empresa/dashboard',
          );
        }
      }
    }

    if (cancelledBy === 'company' && after['clientId']) {
      const clientDoc = await db.collection('users').doc(after['clientId']).get();
      const token = clientDoc.data()?.['fcmToken'];
      if (token) {
        await sendFcm(
          token,
          'Cita cancelada',
          `Tu cita en ${after['companyName']} del ${after['date']} fue cancelada.`,
          '/cliente/citas',
        );
      }
    }
  }
});
