/**
 * Configuración global de la app (doc Firestore config/app), editable por el superadmin.
 * PURO: modelo, valores por defecto, merge campo a campo y validación.
 *
 * Si el doc no existe o le falta (o tiene mal) un campo, se usa el default = lo que estaba
 * fijo en el código antes de que existiera esta pantalla.
 */
import { PLANS, PlanCatalog, PlanKey } from './plans';
import { GRACE_DAYS, RENEWAL_WARNING_DAYS, TimelineOptions } from './subscription-timeline';

export interface PlanLinks {
  /** Link de pago de Wompi en MODO PRUEBAS (sandbox): lo usa `ng serve`. */
  test: string;
  /** Link de pago REAL (producción). */
  prod: string;
}

export interface PlanConfig {
  /** Precio en COP (entero). Wompi cobra el monto fijo del link: tiene que coincidir. */
  amount: number;
  /** Días que suma cada pago. */
  days: number;
  links: PlanLinks;
}

export type AnnouncementLevel = 'info' | 'warning';

export interface AppConfig {
  plans: Record<PlanKey, PlanConfig>;
  /** Meses de prueba gratis al crear la empresa. */
  trialMonths: number;
  /** Días antes del vencimiento en que se avisa. */
  warningDays: number;
  /** Días después del vencimiento en que la cuenta sigue funcionando. */
  graceDays: number;
  support: { whatsapp: string; email: string };
  announcement: { active: boolean; text: string; level: AnnouncementLevel };
}

export const PLAN_KEYS: PlanKey[] = ['mensual', 'semestral'];

/** Todo link de pago válido empieza así. */
export const WOMPI_CHECKOUT_PREFIX = 'https://checkout.wompi.co/';

export const LIMITS = {
  trialMonths: { min: 1, max: 12 },
  warningDays: { min: 0, max: 30 },
  graceDays:   { min: 0, max: 30 },
  announcementText: 500,
} as const;

export const DEFAULT_APP_CONFIG: AppConfig = {
  plans: {
    mensual: {
      amount: PLANS.mensual.amount,
      days:   PLANS.mensual.days,
      links:  { test: 'https://checkout.wompi.co/l/test_WM8ARv', prod: 'https://checkout.wompi.co/l/p5GJth' },
    },
    semestral: {
      amount: PLANS.semestral.amount,
      days:   PLANS.semestral.days,
      links:  { test: '', prod: 'https://checkout.wompi.co/l/3pQr9V' },
    },
  },
  trialMonths: 2,
  warningDays: RENEWAL_WARNING_DAYS,
  graceDays:   GRACE_DAYS,
  support: { whatsapp: '', email: '' },
  announcement: { active: false, text: '', level: 'info' },
};

// ── helpers de tipo ──
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isPosInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0;
const intIn = (v: unknown, lo: number, hi: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;
const str = (v: unknown, def: string): string => (typeof v === 'string' ? v : def);

/**
 * Mezcla lo que vino de Firestore con los defaults, campo a campo.
 * Un valor con tipo inválido (o fuera de rango) se ignora y queda el default.
 */
export function mergeAppConfig(raw: unknown): AppConfig {
  const d = DEFAULT_APP_CONFIG;
  const r = isObj(raw) ? raw : {};
  const rawPlans = isObj(r['plans']) ? r['plans'] : {};

  const plans = {} as Record<PlanKey, PlanConfig>;
  for (const key of PLAN_KEYS) {
    const def = d.plans[key];
    const p = isObj(rawPlans[key]) ? rawPlans[key] : {};
    const links = isObj(p['links']) ? p['links'] : {};
    plans[key] = {
      amount: isPosInt(p['amount']) ? p['amount'] : def.amount,
      days:   isPosInt(p['days'])   ? p['days']   : def.days,
      links:  { test: str(links['test'], def.links.test), prod: str(links['prod'], def.links.prod) },
    };
  }

  const support = isObj(r['support']) ? r['support'] : {};
  const ann = isObj(r['announcement']) ? r['announcement'] : {};
  const L = LIMITS;

  return {
    plans,
    trialMonths: intIn(r['trialMonths'], L.trialMonths.min, L.trialMonths.max) ? r['trialMonths'] : d.trialMonths,
    warningDays: intIn(r['warningDays'], L.warningDays.min, L.warningDays.max) ? r['warningDays'] : d.warningDays,
    graceDays:   intIn(r['graceDays'],   L.graceDays.min,   L.graceDays.max)   ? r['graceDays']   : d.graceDays,
    support: {
      whatsapp: str(support['whatsapp'], d.support.whatsapp),
      email:    str(support['email'],    d.support.email),
    },
    announcement: {
      active: typeof ann['active'] === 'boolean' ? ann['active'] : d.announcement.active,
      text:   str(ann['text'], d.announcement.text),
      level:  ann['level'] === 'warning' || ann['level'] === 'info' ? ann['level'] : d.announcement.level,
    },
  };
}

/** Catálogo de planes (label fijo + monto/días configurados) para planFromAmount, nextPeriodEnd, etc. */
export function planCatalog(cfg: AppConfig): PlanCatalog {
  return {
    mensual:   { ...PLANS.mensual,   amount: cfg.plans.mensual.amount,   days: cfg.plans.mensual.days },
    semestral: { ...PLANS.semestral, amount: cfg.plans.semestral.amount, days: cfg.plans.semestral.days },
  };
}

/** Link de pago a usar: el real en producción, el de pruebas (sandbox) en desarrollo. */
export function checkoutLink(cfg: AppConfig, key: PlanKey, production: boolean): string {
  return (production ? cfg.plans[key].links.prod : cfg.plans[key].links.test).trim();
}

export function timelineOptions(cfg: AppConfig): TimelineOptions {
  return { warningDays: cfg.warningDays, graceDays: cfg.graceDays };
}

// ── validación (lo que el admin intenta guardar) ──

export function validatePlans(plans: Record<PlanKey, PlanConfig>): string[] {
  const errors: string[] = [];
  for (const key of PLAN_KEYS) {
    const p = plans[key];
    const name = PLANS[key].label;
    if (!isPosInt(p.amount)) errors.push(`${name}: el precio tiene que ser un número entero mayor a 0.`);
    if (!isPosInt(p.days))   errors.push(`${name}: los días tienen que ser un número entero mayor a 0.`);
    for (const [kind, label] of [['test', 'de pruebas'], ['prod', 'real']] as const) {
      const link = p.links[kind].trim();
      if (link && !link.startsWith(WOMPI_CHECKOUT_PREFIX)) {
        errors.push(`${name}: el link ${label} tiene que empezar con ${WOMPI_CHECKOUT_PREFIX}`);
      }
    }
  }
  if (plans.mensual.amount === plans.semestral.amount) {
    errors.push('Los dos planes no pueden tener el mismo precio: la app reconoce el plan por el monto cobrado.');
  }
  return errors;
}

export function validateTimes(t: Pick<AppConfig, 'trialMonths' | 'warningDays' | 'graceDays'>): string[] {
  const L = LIMITS;
  const errors: string[] = [];
  if (!intIn(t.trialMonths, L.trialMonths.min, L.trialMonths.max)) errors.push(`La prueba gratis tiene que ser de ${L.trialMonths.min} a ${L.trialMonths.max} meses.`);
  if (!intIn(t.warningDays, L.warningDays.min, L.warningDays.max)) errors.push(`Los días de aviso tienen que estar entre ${L.warningDays.min} y ${L.warningDays.max}.`);
  if (!intIn(t.graceDays,   L.graceDays.min,   L.graceDays.max))   errors.push(`Los días de gracia tienen que estar entre ${L.graceDays.min} y ${L.graceDays.max}.`);
  return errors;
}

export function validateSupport(s: AppConfig['support']): string[] {
  const errors: string[] = [];
  const wa = s.whatsapp.trim();
  if (wa && !/^\+?[\d\s()-]{7,20}$/.test(wa)) errors.push('El WhatsApp tiene que ser un número (con código de país, ej. 57 300 123 4567).');
  const email = s.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('El email de soporte no es válido.');
  return errors;
}

export function validateAnnouncement(a: AppConfig['announcement']): string[] {
  const errors: string[] = [];
  if (a.active && !a.text.trim()) errors.push('Para activar el anuncio escribí un texto.');
  if (a.text.length > LIMITS.announcementText) errors.push(`El anuncio puede tener hasta ${LIMITS.announcementText} caracteres.`);
  if (a.level !== 'info' && a.level !== 'warning') errors.push('Nivel de anuncio inválido.');
  return errors;
}

export function validateAppConfig(cfg: AppConfig): string[] {
  return [
    ...validatePlans(cfg.plans),
    ...validateTimes(cfg),
    ...validateSupport(cfg.support),
    ...validateAnnouncement(cfg.announcement),
  ];
}

/** Planes cuyo precio cambió (requiere un link NUEVO en Wompi con ese monto). */
export function changedPlanAmounts(prev: AppConfig['plans'], next: AppConfig['plans']): PlanKey[] {
  return PLAN_KEYS.filter(k => prev[k].amount !== next[k].amount);
}

// ── contacto ──

/** Link de WhatsApp (wa.me/<sólo dígitos>), o null si no hay número. */
export function whatsappLink(phone: string | null | undefined): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : null;
}

export function mailtoLink(email: string | null | undefined): string | null {
  const e = (email ?? '').trim();
  return e ? `mailto:${e}` : null;
}

/** Hash corto y estable del anuncio: si cambia el texto o el nivel, vuelve a mostrarse aunque lo hayan cerrado. */
export function announcementKey(a: AppConfig['announcement']): string {
  const s = `${a.level}|${a.text}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
