/**
 * Lógica PURA de horarios de atención (sin Angular ni Firebase):
 * validación de franjas y generación de turnos.
 */
import { toMin } from './scheduling';

export interface TimeRange {
  open: string;
  close: string;
}

export interface DaySchedule {
  key: string;
  label: string;
  enabled: boolean;
  ranges: TimeRange[];
}

/** Franja inválida: vacía o con cierre <= apertura. */
export function isRangeInvalid(r: { open: string; close: string }): boolean {
  return !r.open || !r.close || toMin(r.close) <= toMin(r.open);
}

/** Errores por día activo: franja con cierre <= apertura (ej. "12:00 AM" = medianoche) o franjas solapadas. */
export function computeDayErrors(days: DaySchedule[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const day of days) {
    if (!day.enabled) continue;
    if (day.ranges.some(r => isRangeInvalid(r))) {
      errors[day.key] = 'La hora de cierre debe ser posterior a la de apertura. Ojo: 12:00 AM es medianoche; para mediodía usa 12:00 PM.';
      continue;
    }
    const sorted = [...day.ranges].sort((a, b) => toMin(a.open) - toMin(b.open));
    if (sorted.some((r, i) => i > 0 && toMin(r.open) < toMin(sorted[i - 1].close))) {
      errors[day.key] = 'Las franjas de este día se superponen.';
    }
  }
  return errors;
}

/** Turnos de un día (une todas sus franjas, sin duplicados, ordenados). */
export function generateDaySlots(day: DaySchedule, duration: number): string[] {
  if (!day.enabled) return [];
  const set = new Set<string>();

  for (const range of day.ranges) {
    const [openH, openM] = range.open.split(':').map(Number);
    const [closeH, closeM] = range.close.split(':').map(Number);
    const start = openH * 60 + openM;
    const end   = closeH * 60 + closeM;
    for (let m = start; m < end; m += duration) {
      const hh = String(Math.floor(m / 60)).padStart(2, '0');
      const mm = String(m % 60).padStart(2, '0');
      set.add(`${hh}:${mm}`);
    }
  }

  return [...set].sort();
}
