/**
 * Planes pagos. Mismos valores que functions/src/payments/validate-payment.ts (webhook de Wompi,
 * no desplegado en plan Spark): si cambian precios o duración, cambiar en ambos lados.
 * Los links de pago dependen del entorno (pruebas / real): están en environments/.
 */
export type PlanKey = 'mensual' | 'semestral';

export interface Plan {
  key: PlanKey;
  label: string;
  /** Días que suma cada pago al período. */
  days: number;
  /** Precio en COP. */
  amount: number;
}

export const PLANS: Record<PlanKey, Plan> = {
  mensual:   { key: 'mensual',   label: 'Mensual',   days: 30,  amount: 29_000 },
  semestral: { key: 'semestral', label: 'Semestral', days: 180, amount: 156_600 },
};

export function formatCop(amount: number): string {
  return '$' + amount.toLocaleString('es-CO');
}

/**
 * Fin del nuevo período: se extiende desde max(ahora, fin actual) para no perder días
 * si la empresa renueva antes de vencer.
 */
export function nextPeriodEnd(currentEnd: Date | null, days: number, now = new Date()): { start: Date; end: Date } {
  const start = currentEnd && currentEnd.getTime() > now.getTime() ? currentEnd : now;
  const end = new Date(start.getTime());
  end.setDate(end.getDate() + days);
  return { start, end };
}

/** Plan que corresponde a un monto cobrado por Wompi (en centavos, COP). null si no coincide con ninguno. */
export function planFromAmount(amountInCents: number, currency: string): PlanKey | null {
  if (currency !== 'COP') return null;
  const plan = Object.values(PLANS).find(p => p.amount * 100 === amountInCents);
  return plan?.key ?? null;
}

/** Datos de una transacción de Wompi que usa la app (API pública /v1/transactions/{id}). */
export interface WompiTransaction {
  id: string;
  status: 'APPROVED' | 'PENDING' | 'DECLINED' | 'VOIDED' | 'ERROR' | string;
  amountInCents: number;
  currency: string;
  reference: string;
  customerEmail: string | null;
  createdAt: string;
  /** Datos extra que muestra el admin (no se usan para decidir). */
  customerName?: string | null;
  customerPhone?: string | null;
  /** NEQUI, CARD, PSE, BANCOLOMBIA_TRANSFER, ... */
  paymentMethod?: string | null;
  paymentLinkId?: string | null;
  finalizedAt?: string | null;
  statusMessage?: string | null;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CARD: 'Tarjeta', NEQUI: 'Nequi', PSE: 'PSE', BANCOLOMBIA_TRANSFER: 'Transferencia Bancolombia',
  BANCOLOMBIA_COLLECT: 'Corresponsal Bancolombia', DAVIPLATA: 'Daviplata', BANCOLOMBIA_QR: 'QR Bancolombia',
};

export function paymentMethodLabel(type: string | null | undefined): string {
  return type ? (PAYMENT_METHOD_LABELS[type] ?? type) : '—';
}

export type PaymentCheck =
  | { ok: true; plan: PlanKey }
  | { ok: false; reason: string };

/** ¿La transacción alcanza para activar un plan? Aprobada, en COP y por el monto exacto de un plan. */
export function checkWompiPayment(tx: WompiTransaction): PaymentCheck {
  if (tx.status !== 'APPROVED') {
    const label: Record<string, string> = {
      PENDING: 'pendiente', DECLINED: 'rechazada', VOIDED: 'anulada', ERROR: 'con error',
    };
    return { ok: false, reason: `Wompi dice: ${label[tx.status] ?? tx.status}` };
  }
  const plan = planFromAmount(tx.amountInCents, tx.currency);
  if (!plan) {
    return { ok: false, reason: `El monto ${tx.currency} ${tx.amountInCents / 100} no corresponde a ningún plan` };
  }
  return { ok: true, plan };
}
