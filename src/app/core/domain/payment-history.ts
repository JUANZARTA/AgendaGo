/**
 * Historial de pagos de una empresa = pagos confirmados (`payments`) + reportes que todavía
 * no se confirmaron (`paymentClaims`). PURO: lo usan Facturación de la empresa y del admin.
 */
import { PLANS, PlanKey } from './plans';

export interface PaymentDocLike {
  id: string;
  plan?: string;
  amount?: number;
  status?: string;
  source?: string;
  wompiRef?: string;
  wompiId?: string;
  periodStart?: any;
  periodEnd?: any;
  createdAt?: any;
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string;
  paymentMethod?: string;
  paidAt?: string;
}

export interface ClaimDocLike {
  id: string;
  transactionId: string;
  status: 'pending' | 'registered' | 'rejected' | string;
  createdAt?: any;
  note?: string;
  amount?: number;
  plan?: string;
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string;
  paymentMethod?: string;
  paidAt?: string;
}

export type HistoryStatus = 'approved' | 'pending' | 'failed' | 'to-confirm' | 'rejected';

export interface HistoryRow {
  key: string;
  kind: 'payment' | 'claim';
  /** Para ordenar (ms). */
  sortMs: number;
  date: Date | null;
  planLabel: string;
  amount: number | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  /** Id de la transacción de Wompi (para consultar el detalle en vivo). */
  transactionId: string | null;
  status: HistoryStatus;
  statusLabel: string;
  payerName: string | null;
  payerEmail: string | null;
  payerPhone: string | null;
  paymentMethod: string | null;
  /** "Confirmado por admin", "Webhook Wompi", "Esperando confirmación"… */
  origin: string;
  note: string | null;
}

const STATUS_LABELS: Record<HistoryStatus, string> = {
  approved: 'Aprobado', pending: 'Pendiente', failed: 'Fallido',
  'to-confirm': 'Por confirmar', rejected: 'Descartado',
};

function toDate(v: any): Date | null {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate();
  if (typeof v.seconds === 'number') return new Date(v.seconds * 1000);
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export function planLabel(plan: string | undefined | null): string {
  return plan ? (PLANS[plan as PlanKey]?.label ?? plan) : '—';
}

export function buildPaymentHistory(payments: PaymentDocLike[], claims: ClaimDocLike[]): HistoryRow[] {
  const rows: HistoryRow[] = payments.map(p => {
    const status: HistoryStatus = p.status === 'approved' ? 'approved' : p.status === 'pending' ? 'pending' : 'failed';
    const date = toDate(p.paidAt) ?? toDate(p.createdAt);
    return {
      key: 'p-' + p.id,
      kind: 'payment',
      sortMs: date?.getTime() ?? 0,
      date,
      planLabel: planLabel(p.plan),
      amount: p.amount ?? null,
      periodStart: toDate(p.periodStart),
      periodEnd: toDate(p.periodEnd),
      transactionId: p.wompiId ?? p.wompiRef ?? null,
      status,
      statusLabel: STATUS_LABELS[status],
      payerName: p.payerName ?? null,
      payerEmail: p.payerEmail ?? null,
      payerPhone: p.payerPhone ?? null,
      paymentMethod: p.paymentMethod ?? null,
      origin: p.source === 'manual' ? 'Confirmado por admin' : 'Confirmado por Wompi',
      note: null,
    };
  });

  // Los reportes ya confirmados ya figuran como pago: sólo se muestran los pendientes y descartados
  const paid = new Set(rows.map(r => r.transactionId).filter(Boolean));
  for (const c of claims) {
    if (c.status === 'registered' || paid.has(c.transactionId)) continue;
    const status: HistoryStatus = c.status === 'rejected' ? 'rejected' : 'to-confirm';
    const date = toDate(c.paidAt) ?? toDate(c.createdAt);
    rows.push({
      key: 'c-' + c.id,
      kind: 'claim',
      sortMs: date?.getTime() ?? Date.now(),
      date,
      planLabel: planLabel(c.plan),
      amount: c.amount ?? null,
      // El período se define al confirmar (depende del vencimiento vigente en ese momento)
      periodStart: null,
      periodEnd: null,
      transactionId: c.transactionId,
      status,
      statusLabel: STATUS_LABELS[status],
      payerName: c.payerName ?? null,
      payerEmail: c.payerEmail ?? null,
      payerPhone: c.payerPhone ?? null,
      paymentMethod: c.paymentMethod ?? null,
      origin: status === 'rejected' ? 'Descartado por el admin' : 'Esperando confirmación',
      note: c.note ?? null,
    });
  }

  return rows.sort((a, b) => b.sortMs - a.sortMs);
}
