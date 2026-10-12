/**
 * Helpers PUROS de agenda (sin Angular ni Firebase): conversión de horas,
 * solapamiento y capacidad. Compartidos por AppointmentService y la UI.
 */

export const DAY_KEYS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];

/** Mínimo de una cita para evaluar disponibilidad. */
export interface TimedAppointment {
  startTime: string;
  endTime: string;
  staffId?: string | null;
}

export function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function toTime(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

/** true si [aStart, aEnd) y [bStart, bEnd) se solapan (en minutos). */
export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * ¿Hay cupo para [startMin, endMin)?
 * - `capacity` = cantidad total de profesionales que pueden atender el servicio (>= 1).
 * - Con `staffId`: se rechaza si ese profesional ya está ocupado, o si el total de
 *   citas solapadas (incluidas las "cualquier profesional" sin staffId) agota la capacidad.
 * - Sin `staffId` ("cualquiera"): se rechaza si el total de solapadas agota la capacidad.
 */
export function hasCapacity(
  existing: TimedAppointment[],
  startMin: number,
  endMin: number,
  staffId: string | null | undefined,
  capacity: number,
): boolean {
  const cap = Math.max(1, capacity || 1);
  const overlapping = existing.filter(a => rangesOverlap(toMin(a.startTime), toMin(a.endTime), startMin, endMin));
  if (staffId && overlapping.some(a => a.staffId === staffId)) return false;
  return overlapping.length < cap;
}
