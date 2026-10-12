/**
 * Helpers de fecha en hora LOCAL del navegador.
 * Evitar `toISOString().split('T')[0]` (UTC) y `new Date('YYYY-MM-DD')` (parsea en UTC).
 */

/** Fecha local en formato 'YYYY-MM-DD'. */
export function toLocalDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parsea 'YYYY-MM-DD' como fecha local (00:00 hora local). */
export function parseLocalDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Parsea 'YYYY-MM-DD' como fin del día local (23:59:59.999). */
export function parseLocalDateEndOfDay(key: string): Date {
  const date = parseLocalDate(key);
  date.setHours(23, 59, 59, 999);
  return date;
}
