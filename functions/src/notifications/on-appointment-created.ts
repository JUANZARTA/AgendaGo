import * as functions from 'firebase-functions/v2';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

export const onAppointmentCreated = functions.firestore.onDocumentCreated('appointments/{id}', async (event) => {
  const appt = event.data?.data();
  if (!appt) return;
  const db = getFirestore();

  // Notificar a la empresa
  const ownerQuery = await db.collection('users').where('role', '==', 'company').get();
  const companyUsers = ownerQuery.docs.filter((d) => {
    const companies = d.data();
    return true; // Se filtra por companyId en una implementación más completa
  });

  // Buscar el owner de la empresa
  const companyDoc = await db.collection('companies').doc(appt['companyId']).get();
  const ownerId = companyDoc.data()?.['ownerId'];
  if (!ownerId) return;

  const ownerDoc = await db.collection('users').doc(ownerId).get();
  const fcmToken = ownerDoc.data()?.['fcmToken'];

  if (fcmToken) {
    await getMessaging().send({
      token: fcmToken,
      notification: {
        title: 'Nueva cita agendada',
        body: `${appt['clientName']} — ${appt['serviceName']} — ${appt['startTime']}`,
      },
      data: { appointmentId: event.params['id'] },
    });
  }

  // Notificar al cliente registrado
  if (appt['clientId']) {
    const clientDoc = await db.collection('users').doc(appt['clientId']).get();
    const clientToken = clientDoc.data()?.['fcmToken'];
    if (clientToken) {
      await getMessaging().send({
        token: clientToken,
        notification: {
          title: 'Cita confirmada',
          body: `Tu cita en ${appt['companyName']} el ${appt['date']} a las ${appt['startTime']}`,
        },
      });
    }
  }
});
