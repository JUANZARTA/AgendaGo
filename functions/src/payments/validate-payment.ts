import * as functions from 'firebase-functions/v2';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// HTTP trigger que recibe el webhook de la pasarela de pagos
export const validatePayment = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }

  // TODO: validar firma/secret de la pasarela (Wompi/PayU/Mercado Pago)
  const { companyId, status } = req.body;

  if (!companyId || status !== 'APPROVED') {
    res.status(400).json({ error: 'Pago no aprobado o datos faltantes' });
    return;
  }

  const db = getFirestore();
  const now = new Date();
  const nextPeriod = new Date(now);
  nextPeriod.setDate(nextPeriod.getDate() + 30);

  await db.collection('subscriptions').doc(companyId).update({
    status: 'active',
    lastPaymentDate: Timestamp.fromDate(now),
    currentPeriodStart: Timestamp.fromDate(now),
    currentPeriodEnd: Timestamp.fromDate(nextPeriod),
  });

  await db.collection('companies').doc(companyId).update({ isActive: true });

  res.status(200).json({ success: true });
});
