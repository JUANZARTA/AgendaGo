/**
 * Planes pagos. Mismos valores que functions/src/payments/validate-payment.ts (webhook de Wompi,
 * no desplegado en plan Spark): si cambian precios o duración, cambiar en ambos lados.
 */
export type PlanKey = 'mensual' | 'semestral';

export interface Plan {
  key: PlanKey;
  label: string;
  /** Días que suma cada pago al período. */
  days: number;
  /** Precio en COP. */
  amount: number;
  /** Link de pago de Wompi; se le agrega `?reference=...`. */
  checkoutUrl: string;
}

export const PLANS: Record<PlanKey, Plan> = {
  mensual:   { key: 'mensual',   label: 'Mensual',   days: 30,  amount: 29_000,  checkoutUrl: 'https://checkout.wompi.co/l/6btIw2' },
  semestral: { key: 'semestral', label: 'Semestral', days: 180, amount: 156_600, checkoutUrl: 'https://checkout.wompi.co/l/3pQr9V' },
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
