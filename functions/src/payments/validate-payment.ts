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
  const {
    id: wompiId,
    reference,
    status: transactionStatus,
    amount_in_cents: amountCents,
  } = transaction;

  if (!reference || transactionStatus !== 'APPROVED') {
    res.status(200).json({ received: true });
    return;
  }

  // reference = "mensual-{companyId}-{timestamp}" o "semestral-{companyId}-{timestamp}"
  const parts = String(reference).split('-');
  const plan      = parts[0];                    // 'mensual' | 'semestral'
  const companyId = parts.slice(1, -1).join('-'); // en caso de que companyId tenga guiones
  if (!companyId) { res.status(400).json({ error: 'Referencia inválida' }); return; }

  const db       = getFirestore();
  const now      = new Date();
  const days     = plan === 'semestral' ? 180 : 30;
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + days);
  const amount   = Math.round((amountCents ?? 0) / 100);

  // 1. Actualizar suscripción
  await db.collection('subscriptions').doc(companyId).set({
    companyId,
    status:             'active',
    lastPaymentDate:    Timestamp.fromDate(now),
    currentPeriodStart: Timestamp.fromDate(now),
    currentPeriodEnd:   Timestamp.fromDate(periodEnd),
  }, { merge: true });

  // 2. Registrar pago en historial
  await db.collection('payments').add({
    companyId,
    plan,
    amount,
    status:      'approved',
    wompiRef:    reference,
    wompiId:     wompiId ?? null,
    periodStart: Timestamp.fromDate(now),
    periodEnd:   Timestamp.fromDate(periodEnd),
    createdAt:   Timestamp.fromDate(now),
  });

  // 3. Reactivar empresa
  await db.collection('companies').doc(companyId).update({ isActive: true });

  // 4. Notificar al dueño de la empresa
  const companySnap = await db.collection('companies').doc(companyId).get();
  const ownerId     = companySnap.data()?.ownerId;
  if (ownerId) {
    const planLabel = plan === 'semestral' ? 'Semestral' : 'Mensual';
    await db.collection('notifications').add({
      recipientId: ownerId,
      type:        'plan_changed',
      title:       '¡Pago confirmado!',
      body:        `Tu plan ${planLabel} fue activado. Válido hasta el ${periodEnd.toLocaleDateString('es-CO')}.`,
      link:        '/empresa/facturacion',
      read:        false,
      createdAt:   Timestamp.fromDate(now),
    });
  }

  res.status(200).json({ success: true });
});
