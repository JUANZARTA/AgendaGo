/**
 * "Mis negocios" del cliente: lógica PURA para armar la lista de Recientes
 * (negocios con los que interactuó por citas o mensajes y que NO están en favoritos).
 */

export interface AptInteraction {
  companyId: string;
  /** YYYY-MM-DD */
  date: string;
  startTime?: string;
  hiddenByClient?: boolean;
}

export interface MsgInteraction {
  companyId: string;
  /** createdAt en ms (null si todavía no llegó el serverTimestamp). */
  at: number | null;
}

export interface RecentEntry {
  companyId: string;
  /** Momento de la interacción más reciente (ms). */
  at: number;
  kind: 'appointment' | 'message';
  /** Sólo para kind 'appointment': fecha de la cita (YYYY-MM-DD). */
  date?: string;
}

export const MAX_RECENTS = 20;

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DAY_MS = 864e5;

/** Fecha+hora local de una cita en ms (NaN si la fecha es inválida). */
export function aptMillis(date: string, startTime = '00:00'): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? '');
  if (!m) return NaN;
  const [h, min] = (/^\d{2}:\d{2}$/.test(startTime) ? startTime : '00:00').split(':').map(Number);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), h, min).getTime();
}

/**
 * Un registro por negocio con su interacción más reciente, excluyendo favoritos
 * y citas ocultadas por el cliente. Orden: más reciente primero; máximo `max`.
 */
export function buildRecents(
  apts: AptInteraction[],
  msgs: MsgInteraction[],
  favoriteIds: ReadonlySet<string>,
  max = MAX_RECENTS,
): RecentEntry[] {
  const byCompany = new Map<string, RecentEntry>();
  const consider = (e: RecentEntry) => {
    if (!e.companyId || favoriteIds.has(e.companyId) || !Number.isFinite(e.at)) return;
    const prev = byCompany.get(e.companyId);
    if (!prev || e.at > prev.at) byCompany.set(e.companyId, e);
  };
  for (const a of apts) {
    if (a.hiddenByClient) continue;
    consider({ companyId: a.companyId, at: aptMillis(a.date, a.startTime), kind: 'appointment', date: a.date });
  }
  for (const m of msgs) {
    // Mensaje recién enviado sin timestamp del servidor: cuenta como "ahora"
    consider({ companyId: m.companyId, at: m.at ?? Date.now(), kind: 'message' });
  }
  return [...byCompany.values()].sort((a, b) => b.at - a.at).slice(0, max);
}

/** "12 oct" (agrega el año si no es el actual). */
export function shortDate(date: string, now: Date = new Date()): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? '');
  if (!m) return '';
  const base = `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] ?? ''}`;
  return Number(m[1]) === now.getFullYear() ? base : `${base} ${m[1]}`;
}

/** "hoy", "ayer", "hace 3 días", "hace 2 semanas", "hace 5 meses", "hace más de un año". */
export function relativeDays(at: number, now: Date = new Date()): string {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(new Date(at))) / DAY_MS);
  if (days <= 0)  return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 7)   return `hace ${days} días`;
  if (days < 30)  { const w = Math.floor(days / 7);  return w === 1 ? 'hace 1 semana' : `hace ${w} semanas`; }
  if (days < 365) { const mo = Math.floor(days / 30); return mo === 1 ? 'hace 1 mes' : `hace ${mo} meses`; }
  return 'hace más de un año';
}

/** Texto de la tarjeta: "Última cita: 12 oct" / "Próxima cita: 20 oct" / "Conversaste hace 3 días". */
export function recentLabel(e: RecentEntry, now: Date = new Date()): string {
  if (e.kind === 'appointment' && e.date) {
    return `${e.at > now.getTime() ? 'Próxima cita' : 'Última cita'}: ${shortDate(e.date, now)}`;
  }
  return `Conversaste ${relativeDays(e.at, now)}`;
}
