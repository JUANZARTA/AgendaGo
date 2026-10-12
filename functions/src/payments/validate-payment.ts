import * as functions from 'firebase-functions/v2';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as crypto from 'crypto';

// Planes válidos: se derivan del monto aprobado (en centavos) y la moneda,
// NO del prefijo de la referencia (que el cliente puede manipular).
// Deben coincidir con los precios de billing.component.ts.
const PLANS: Record<string, { label: string; days: number; amountCents: number }> = {
  mensual:   { label: 'Mensual',   days: 30,  amountCents: 29_000 * 100 },
  semestral: { label: 'Semestral', days: 180, amountCents: 156_600 * 100 },
};
const CURRENCY = 'COP';

function resolvePlan(amountCents: unknown, currency: unknown): string | null {
  if (currency !== CURRENCY) return null;
  for (const [key, p] of Object.entries(PLANS)) {
    if (p.amountCents === Number(amountCents)) return key;
  }
  return null;
}

function verifyWompiSignature(payload: any, secret: string): boolean {
  const { signature, timestamp } = payload ?? {};
  if (!signature?.checksum || !timestamp) return false;
  const props: string[] = signature.properties ?? [];
  const transaction = payload.data?.transaction ?? {};
  const values = props.map((p: string) => {
    const keys = p.split('.');
    return keys.reduce((obj: any, k: string) => obj?.[k], { transaction }) ?? '';
  });
  const integrityStr = [...values, timestamp, secret].join('');
  const expected = Buffer.from(crypto.createHash('sha256').update(integrityStr).digest('hex'));
  const received = Buffer.from(String(signature.checksum));
  // timingSafeEqual lanza si las longitudes difieren
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}

export const validatePayment = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }

  // Fail closed: sin secreto no se procesa nada
  const secret = process.env['WOMPI_WEBHOOK_SECRET'] ?? '';
  if (!secret) {
    console.error('[validatePayment] WOMPI_WEBHOOK_SECRET no configurado; webhook rechazado');
    res.status(500).json({ error: 'Webhook no configurado' });
    return;
  }
  if (!verifyWompiSignature(req.body, secret)) {
    res.status(401).json({ error: 'Firma inválida' });
    return;
  }

  const transaction = req.body?.data?.transaction ?? {};
  const {
    id: wompiId,
    reference,
    status: transactionStatus,
    amount_in_cents: amountCents,
    currency,
  } = transaction;

  if (!reference || transactionStatus !== 'APPROVED') {
    res.status(200).json({ received: true });
    return;
  }

  if (!wompiId) {
    res.status(400).json({ error: 'Transacción sin id' });
    return;
  }

  // reference = "mensual-{companyId}-{timestamp}" o "semestral-{companyId}-{timestamp}"
  // Solo se usa para obtener el companyId; el plan sale del monto.
  const parts = String(reference).split('-');
  const companyId = parts.slice(1, -1).join('-'); // en caso de que companyId tenga guiones
  if (!companyId) { res.status(400).json({ error: 'Referencia inválida' }); return; }

  const planKey = resolvePlan(amountCents, currency);
  if (!planKey) {
    console.error(`[validatePayment] Monto/moneda no coincide con ningún plan: ${amountCents} ${currency} (tx ${wompiId})`);
    res.status(200).json({ received: true });
    return;
  }
  const plan   = PLANS[planKey];
  const amount = Math.round(Number(amountCents) / 100);

  const db         = getFirestore();
  const now        = new Date();
  const paymentRef = db.collection('payments').doc(String(wompiId)); // idempotencia por id de Wompi
  const subRef     = db.collection('subscriptions').doc(companyId);
  const companyRef = db.collection('companies').doc(companyId);

  const outcome = await db.runTransaction(async (tx) => {
    // Todas las lecturas antes de cualquier escritura
    const [paymentSnap, subSnap, companySnap] = await Promise.all([
      tx.get(paymentRef), tx.get(subRef), tx.get(companyRef),
    ]);

    if (paymentSnap.exists) return 'duplicate' as const;
    if (!companySnap.exists) return 'no-company' as const;

    // Extender desde max(ahora, fin de periodo actual) para no perder días en renovaciones anticipadas
    const existingEnd: Date | null = subSnap.data()?.['currentPeriodEnd']?.toDate?.() ?? null;
    const base = existingEnd && existingEnd.getTime() > now.getTime() ? existingEnd : now;
    const periodEnd = new Date(base);
    periodEnd.setDate(periodEnd.getDate() + plan.days);

    tx.set(paymentRef, {
      companyId,
      plan: planKey,
      amount,
      status:      'approved',
      wompiRef:    reference,
      wompiId:     String(wompiId),
      periodStart: Timestamp.fromDate(base),
      periodEnd:   Timestamp.fromDate(periodEnd),
      createdAt:   Timestamp.fromDate(now),
    });

    // Un admin deshabilitó la cuenta: se registra el pago pero no se reactiva
    if (subSnap.data()?.['status'] === 'disabled') return 'disabled' as const;

    tx.set(subRef, {
      companyId,
      status:             'active',
      lastPaymentDate:    Timestamp.fromDate(now),
      currentPeriodStart: Timestamp.fromDate(base),
      currentPeriodEnd:   Timestamp.fromDate(periodEnd),
    }, { merge: true });

    tx.update(companyRef, { isActive: true });

    const ownerId = companySnap.data()?.['ownerId'];
    if (ownerId) {
      tx.set(db.collection('notifications').doc(), {
        recipientId: ownerId,
        type:        'plan_changed',
        title:       '¡Pago confirmado!',
        body:        `Tu plan ${plan.label} fue activado. Válido hasta el ${periodEnd.toLocaleDateString('es-CO')}.`,
        link:        '/empresa/facturacion',
        read:        false,
        createdAt:   Timestamp.fromDate(now),
      });
    }
    return 'activated' as const;
  });

  if (outcome === 'duplicate') {
    console.log(`[validatePayment] Pago ${wompiId} ya procesado; se ignora`);
  } else if (outcome === 'no-company') {
    console.error(`[validatePayment] Empresa ${companyId} no existe (tx ${wompiId}); sin cambios`);
  } else if (outcome === 'disabled') {
    console.warn(`[validatePayment] Suscripción de ${companyId} deshabilitada por admin; pago ${wompiId} registrado sin reactivar`);
  }

  res.status(200).json({ success: true });
});
