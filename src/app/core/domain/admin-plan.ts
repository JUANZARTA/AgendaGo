/**
 * Cambio de plan a mano por el superadmin (modal "Plan" de Empresas y "Gestionar" de Facturación).
 * PURO: una sola definición de qué se escribe y qué se valida, para que los dos modales hagan lo mismo:
 *  - misma escritura (set merge de subscriptions/{id} + companies.isActive sincronizado);
 *  - NUNCA escribe lastPaymentDate (eso es sólo de registerManualPayment: cambiar un estado no es un pago);
 *  - 'active'/'trial' exigen un vencimiento HOY o futuro (avisa "activa sin fecha" y rechaza fechas pasadas);
 *  - el mismo texto de notificación a la empresa.
 */
import { parseLocalDateEndOfDay } from '../utils/date.utils';
import { SubscriptionLike } from './subscription-timeline';

export type AdminPlanStatus = 'trial' | 'active' | 'expired' | 'disabled' | 'free';

export const ADMIN_PLAN_STATUS_LABEL: Record<AdminPlanStatus, string> = {
  trial:    'Prueba gratis',
  active:   'Plan activo',
  expired:  'Vencida',
  disabled: 'Deshabilitada',
  free:     'Gratuita (Beneficiario)',
};

export interface AdminPlanInput {
  status: AdminPlanStatus;
  /** 'YYYY-MM-DD' del input date ('' = no cambiar la fecha). */
  periodEnd: string;
  note: string;
}

export type AdminPlanError = 'DATE_REQUIRED' | 'PAST_DATE';

export type AdminPlanResult =
  | { ok: true; data: Record<string, unknown>; isActive: boolean; endDate: Date | null }
  | { ok: false; error: AdminPlanError; message: string };

function toDate(v: any): Date | null {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate();
  if (v instanceof Date) return v;
  return null;
}

/** Los estados con los que la empresa opera (y figura en la búsqueda). */
export function statusKeepsCompanyActive(status: string): boolean {
  return status === 'active' || status === 'trial' || status === 'free';
}

/**
 * Arma la escritura del modal de plan. 'active'/'trial' necesitan un vencimiento >= hoy:
 * el nuevo (input) o, si no se cambia la fecha, el vigente de ese mismo campo.
 */
export function buildAdminPlanUpdate(
  companyId: string,
  input: AdminPlanInput,
  current: SubscriptionLike | null | undefined,
  now = new Date(),
): AdminPlanResult {
  const status = input.status;
  const note   = input.note.trim();
  const data: Record<string, unknown> = { companyId, status };

  if (status === 'free') {
    data['currentPeriodEnd'] = null;
    data['adminNote'] = (note ? note + ' ' : '') + '[Cuenta gratuita otorgada por admin]';
    return { ok: true, data, isActive: true, endDate: null };
  }

  // En trial la fecha que leen el timeline y la revisión de vencimientos es trialEndDate
  const field  = status === 'trial' ? 'trialEndDate' : 'currentPeriodEnd';
  const picked = input.periodEnd ? parseLocalDateEndOfDay(input.periodEnd) : null;

  if (status === 'active' || status === 'trial') {
    if (picked && picked.getTime() < now.getTime()) {
      return { ok: false, error: 'PAST_DATE', message: 'La fecha de vencimiento ya pasó: para activar elige hoy o una fecha futura.' };
    }
    const existing = toDate(status === 'trial' ? current?.trialEndDate : current?.currentPeriodEnd);
    const keepsExisting = !picked && !!existing && existing.getTime() > now.getTime();
    if (!picked && !keepsExisting) {
      return {
        ok: false, error: 'DATE_REQUIRED',
        message: status === 'active'
          ? 'Para activar el plan indica la fecha de vencimiento del período pagado (un plan activo sin fecha no vencería nunca).'
          : 'Para la prueba gratis indica hasta qué fecha dura.',
      };
    }
    if (picked) data[field] = picked;
    if (note) data['adminNote'] = note;
    return { ok: true, data, isActive: true, endDate: picked ?? existing };
  }

  // expired / disabled: la fecha es opcional (sólo informativa)
  if (picked) data[field] = picked;
  if (note) data['adminNote'] = note;
  return { ok: true, data, isActive: false, endDate: picked };
}

/** Texto de la notificación 'plan_changed' (igual desde los dos modales). */
export function planChangedNotice(status: AdminPlanStatus, endDate: Date | null): { title: string; body: string } {
  const until = endDate && (status === 'active' || status === 'trial')
    ? ` Vence el ${endDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}.`
    : '';
  return {
    title: 'Tu plan fue actualizado',
    body:  `El administrador cambió tu suscripción a: ${ADMIN_PLAN_STATUS_LABEL[status] ?? status}.${until}`,
  };
}

/**
 * ¿Se puede "Habilitar" la empresa directo desde Empresas? Sólo si su suscripción está vigente
 * (free, o trial/active con vencimiento futuro). Si no, habilitarla la pondría en la búsqueda y en
 * reservas con el dueño bloqueado por el guard: hay que fijar estado + fecha con el modal de plan.
 */
export function subscriptionAllowsEnabling(sub: SubscriptionLike | null | undefined, now = new Date()): boolean {
  if (!sub) return false;
  if (sub.status === 'free') return true;
  if (sub.status !== 'trial' && sub.status !== 'active') return false;
  const end = toDate(sub.status === 'trial' ? sub.trialEndDate : sub.currentPeriodEnd);
  return !!end && end.getTime() > now.getTime();
}
