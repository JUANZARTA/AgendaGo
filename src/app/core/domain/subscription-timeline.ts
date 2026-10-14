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
  | 'missing'     // la empresa NO tiene doc de suscripción: requiere pago (antes contaba como 'ok' y nunca vencía)
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
  // Sin suscripción = requiere pago. OJO: quien muestra esto debe distinguir "todavía no llegó el
  // snapshot" (no llamar con null mientras carga) de "no existe el doc".
  if (!sub) return { phase: 'missing', ...none };
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

/** La cuenta puede usar la app (todo menos sin suscripción / suspendida / vencida / deshabilitada). */
export function canUseApp(t: SubscriptionTimeline): boolean {
  return t.phase !== 'missing' && t.phase !== 'suspended' && t.phase !== 'expired' && t.phase !== 'disabled';
}

/**
 * Días que le quedan al trial / período pago, con la MISMA cuenta que el timeline (días calendario
 * locales), para que el contador de Facturación y el banner nunca difieran en 1.
 * free → Infinity; sin fecha, vencida o sin suscripción → 0.
 */
export function daysRemainingOf(sub: SubscriptionLike | null | undefined, now = new Date()): number {
  if (sub?.status === 'free') return Infinity;
  const t = subscriptionTimeline(sub, now);
  return t.daysToEnd === null ? 0 : Math.max(0, t.daysToEnd);
}

// ── Revisión de vencimientos (admin-shell automática, "Revisar vencimientos" y scripts/expire-subscriptions.js) ──

export interface OverdueItem {
  companyId: string;
  /** 'missing' = empresa activa SIN doc de suscripción (nunca vencería). */
  status: 'trial' | 'active' | 'missing';
  /** Fin del trial / período; null si no hay suscripción. */
  endDate: Date | null;
}

/**
 * Qué hay que suspender: trials/planes cuya gracia ya terminó y empresas ACTIVAS sin suscripción.
 * PURO: recibe las suscripciones (id = companyId) y los ids de las empresas con isActive == true.
 */
export function overdueItems(
  subs: { id: string; data: SubscriptionLike }[],
  activeCompanyIds: Iterable<string>,
  now: Date,
  graceDays = GRACE_DAYS,
): OverdueItem[] {
  const out: OverdueItem[] = [];
  const withSub = new Set<string>();
  for (const { id, data } of subs) {
    withSub.add(id);
    if (data.status !== 'trial' && data.status !== 'active') continue;
    const end = toDate(data.status === 'trial' ? data.trialEndDate : data.currentPeriodEnd);
    // Sólo las que pasaron la gracia: durante esos días la cuenta sigue funcionando
    if (end && graceEndOf(end, graceDays).getTime() < now.getTime()) {
      out.push({ companyId: id, status: data.status, endDate: end });
    }
  }
  for (const id of activeCompanyIds) {
    if (!withSub.has(id)) out.push({ companyId: id, status: 'missing', endDate: null });
  }
  return out;
}
