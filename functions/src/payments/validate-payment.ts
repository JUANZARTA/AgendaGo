import * as functions from 'firebase-functions/v2';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as crypto from 'crypto';

function verifyWompiSignature(payload: any, secret: string): boolean {
  const { signature, timestamp } = payload;
  if (!signature?.checksum || !timestamp) return false;
  const props: string[] = signature.properties ?? [];
  const transaction = payload.data?.transaction ?? {};
  const values = props.map((p: string) => {
    const keys = p.split('.');
    return keys.reduce((obj: any, k: string) => obj?.[k], { transaction }) ?? '';
  });
  const integrityStr = [...values, timestamp, secret].join('');
  const expected = crypto.createHash('sha256').update(integrityStr).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature.checksum));
}

export const validatePayment = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }

  const secret = process.env['WOMPI_WEBHOOK_SECRET'] ?? '';
  if (secret && !verifyWompiSignature(req.body, secret)) {
    res.status(401).json({ error: 'Firma inválida' });
    return;
  }

  const transaction = req.body?.data?.transaction ?? {};
  const { reference, status: transactionStatus, amount_in_cents: amount, currency } = transaction;

  if (!reference || transactionStatus !== 'APPROVED') {
    res.status(200).json({ received: true });
    return;
  }

  const parts = String(reference).split('-');
  const plan = parts[0];
  const companyId = parts[1];
  if (!companyId) { res.status(400).json({ error: 'Referencia inválida' }); return; }

  const db = getFirestore();
  const now = new Date();
  const days = plan === 'semestral' ? 180 : 30;
  const nextPeriod = new Date(now);
  nextPeriod.setDate(nextPeriod.getDate() + days);

  await db.collection('subscriptions').doc(companyId).set({
    companyId,
    status: 'active',
    lastPaymentDate: Timestamp.fromDate(now),
    currentPeriodStart: Timestamp.fromDate(now),
    currentPeriodEnd: Timestamp.fromDate(nextPeriod),
  }, { merge: true });

  await db.collection('companies').doc(companyId).update({ isActive: true });

  res.status(200).json({ success: true });
});
