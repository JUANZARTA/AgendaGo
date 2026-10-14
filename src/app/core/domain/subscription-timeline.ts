/**
 * Ciclo de vencimiento de una suscripción (trial o plan pago). PURO: lo usan el guard,
 * los avisos de la empresa, Facturación y "Revisar vencimientos" del admin.
 *
 *   … ok … | aviso (5 días antes) | vence HOY | gracia (5 días) | suspendida
 */

/** Días antes del vencimiento en que se empieza a avisar. */
export const RENEWAL_WARNING_DAYS = 5;
/** Días después del vencimiento en que la cuenta sigue funcionando. */
export const GRACE_DAYS = 5;

const DAY_MS = 86_400_000;

/** Días de aviso y de gracia (el admin los configura en config/app; default = constantes). */
export interface TimelineOptions {
  warningDays?: number;
  graceDays?: number;
}

export type SubscriptionPhase =
  | 'free'        // beneficiario: nunca vence
  | 'disabled'    // deshabilitada por el admin
  | 'expired'     // marcada vencida (por el admin, tras la gracia)
  | 'ok'          // vigente, lejos del vencimiento
  | 'warning'     // vence en ≤ warningDays días (no hoy)
  | 'due-today'   // vence hoy (día calendario local)
  | 'grace'       // venció, pero sigue funcionando hasta graceEnd
  | 'suspended';  // venció y pasó la gracia (aunque el admin aún no la marcó)

export interface SubscriptionTimeline {
  phase: SubscriptionPhase;
  /** Fin del trial o del período pago. */
  endDate: Date | null;
  /** Último momento de la gracia (fin del día local endDate + GRACE_DAYS). */
  graceEnd: Date | null;
  /** Días calendario hasta el vencimiento (0 = hoy; negativo = ya venció). */
  daysToEnd: number | null;
  /** Días calendario que quedan de gracia (sólo en 'grace'). */
  graceDaysLeft: number | null;
}

export interface SubscriptionLike {
  status: string;
  trialEndDate?: any;
  currentPeriodEnd?: any;
}

function toDate(v: any): Date | null {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate();
  if (v instanceof Date) return v;
  return null;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Diferencia en días calendario locales (b - a). */
function dayDiff(a: Date, b: Date): number {
  return Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS);
}

export function graceEndOf(endDate: Date, graceDays = GRACE_DAYS): Date {
  const g = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + graceDays);
  g.setHours(23, 59, 59, 999);
  return g;
}

export function subscriptionTimeline(
  sub: SubscriptionLike | null | undefined,
  now = new Date(),
  opts: TimelineOptions = {},
): SubscriptionTimeline {
  const warningDays = opts.warningDays ?? RENEWAL_WARNING_DAYS;
  const graceDays   = opts.graceDays ?? GRACE_DAYS;
  const none = { endDate: null, graceEnd: null, daysToEnd: null, graceDaysLeft: null };
  if (!sub) return { phase: 'ok', ...none };
  if (sub.status === 'free')     return { phase: 'free', ...none };
  if (sub.status === 'disabled') return { phase: 'disabled', ...none };

  const endDate = toDate(sub.status === 'trial' ? sub.trialEndDate : sub.currentPeriodEnd);
  if (sub.status === 'expired') {
    return { phase: 'expired', endDate, graceEnd: endDate ? graceEndOf(endDate, graceDays) : null, daysToEnd: endDate ? dayDiff(now, endDate) : null, graceDaysLeft: null };
  }
  if (!endDate) return { phase: 'ok', ...none };

  const graceEnd  = graceEndOf(endDate, graceDays);
  const daysToEnd = dayDiff(now, endDate);

  let phase: SubscriptionPhase;
  if (now.getTime() > graceEnd.getTime())       phase = 'suspended';
  else if (now.getTime() > endDate.getTime())   phase = daysToEnd === 0 ? 'due-today' : 'grace';
  else if (daysToEnd === 0)                     phase = 'due-today';
  else if (daysToEnd <= warningDays)            phase = 'warning';
  else                                          phase = 'ok';

  return {
    phase, endDate, graceEnd, daysToEnd,
    graceDaysLeft: phase === 'grace' ? dayDiff(now, graceEnd) : null,
  };
}

/** La cuenta puede usar la app (todo menos suspendida / vencida / deshabilitada). */
export function canUseApp(t: SubscriptionTimeline): boolean {
  return t.phase !== 'suspended' && t.phase !== 'expired' && t.phase !== 'disabled';
}
