import * as functions from 'firebase-functions/v2';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

export const onAppointmentCancelled = functions.firestore.onDocumentUpdated('appointments/{id}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  if (before['status'] === after['status']) return;
  if (after['status'] !== 'cancelled') return;

  const db = getFirestore();
  const cancelledBy = after['cancelledBy'];

  // Notificar a empresa si canceló el cliente
  if (cancelledBy === 'client') {
    const companyDoc = await db.collection('companies').doc(after['companyId']).get();
    const ownerId = companyDoc.data()?.['ownerId'];
    if (ownerId) {
      const ownerDoc = await db.collection('users').doc(ownerId).get();
      const token = ownerDoc.data()?.['fcmToken'];
      if (token) {
        await getMessaging().send({
          token,
          notification: {
            title: 'Cita cancelada',
            body: `${after['clientName']} canceló su cita del ${after['date']} a las ${after['startTime']}`,
          },
        });
      }
    }
  }

  // Notificar al cliente si canceló la empresa
  if (cancelledBy === 'company' && after['clientId']) {
    const clientDoc = await db.collection('users').doc(after['clientId']).get();
    const token = clientDoc.data()?.['fcmToken'];
    if (token) {
      await getMessaging().send({
        token,
        notification: {
          title: 'Cita cancelada',
          body: `Tu cita en ${after['companyName']} del ${after['date']} fue cancelada.`,
        },
      });
    }
  }
});
