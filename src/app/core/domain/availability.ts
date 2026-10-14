/**
 * Disponibilidad de turnos para la reserva pública. PURO (sin Angular ni Firebase):
 * lo usa CompanyProfileComponent y se testea en availability.spec.ts.
 */
import { TimedAppointment, hasCapacity, rangesOverlap, toMin, toTime } from './scheduling';

export interface TimeRange { open: string; close: string; }

export interface DayScheduleLike {
  key: string;
  enabled: boolean;
  ranges?: TimeRange[];
}

export interface StaffDayLike { enabled: boolean; open: string; close: string; }

export interface StaffLike {
  id?: string;
  /** `{}` o ausente = usa el horario de la empresa. */
  schedule?: Record<string, StaffDayLike>;
}

export interface CompanyAvailabilityLike {
  slotInterval?: number;
  schedule?: DayScheduleLike[];
  blockedDates?: { date: string }[];
  disabledSlots?: Record<string, boolean>;
}

/** El profesional tiene horario propio (si no, usa el de la empresa). */
export function hasOwnSchedule<T extends StaffLike>(m: T | null | undefined): m is T & { schedule: Record<string, StaffDayLike> } {
  return !!m?.schedule && Object.keys(m.schedule).length > 0;
}

/**
 * Cupo del servicio: si tiene profesionales asignados, son ellos (uno por cita a la vez);
 * si no, el `staffCount` configurado en el servicio.
 */
export function serviceCapacity(assignedStaff: number, serviceStaffCount: number | null | undefined): number {
  return assignedStaff > 0 ? assignedStaff : (serviceStaffCount ?? 1);
}

/** Inicios posibles de [open, close) cada `interval` minutos donde entra `duration` y hay cupo. */
export function slotsInRange(
  open: string, close: string, interval: number, duration: number,
  capacity: number, apts: TimedAppointment[], staffId: string | null,
): string[] {
  const slots: string[] = [];
  const end = toMin(close);
  for (let cur = toMin(open); cur + duration <= end; cur += interval) {
    if (hasCapacity(apts, cur, cur + duration, staffId, capacity)) slots.push(toTime(cur));
  }
  return slots;
}

/**
 * El profesional puede atender [start, end) ese día: trabaja (horario propio o el de la empresa),
 * el servicio entra completo en su horario y no tiene otra cita que se solape.
 */
export function isStaffFree(s: StaffLike, dayKey: string, start: number, end: number, apts: TimedAppointment[]): boolean {
  if (hasOwnSchedule(s)) {
    const day = s.schedule[dayKey];
    if (!day?.enabled) return false;
    if (start < toMin(day.open) || end > toMin(day.close)) return false;
  }
  return !apts.some(a => a.staffId === s.id && rangesOverlap(start, end, toMin(a.startTime), toMin(a.endTime)));
}

export interface AvailableSlotsInput {
  company: CompanyAvailabilityLike;
  dayKey: string;
  dateKey: string;
  /** Duración del servicio en minutos (default: intervalo de la empresa). */
  duration?: number | null;
  /** Profesionales asignados al servicio. */
  staff: StaffLike[];
  /** Profesional elegido; null = "cualquiera". */
  selectedStaff: StaffLike | null;
  /** Ocupación del día (slotLocks). */
  apts: TimedAppointment[];
  /** `staffCount` del servicio, para servicios sin profesionales asignados. */
  serviceStaffCount?: number | null;
  /** Para hoy: minutos desde medianoche (se descartan los ya pasados, con 10 min de margen). */
  nowMin?: number | null;
}

export function availableSlots(i: AvailableSlotsInput): string[] {
  const { company, dayKey, dateKey, staff, selectedStaff, apts } = i;
  const interval = company.slotInterval ?? 30;
  const duration = i.duration ?? interval;
  const capacity = serviceCapacity(staff.length, i.serviceStaffCount);

  if (company.blockedDates?.some(b => b.date === dateKey)) return [];

  let ranges: TimeRange[];
  if (hasOwnSchedule(selectedStaff)) {
    const day = selectedStaff.schedule[dayKey];
    if (!day?.enabled) return [];
    ranges = [{ open: day.open, close: day.close }];
  } else {
    const sched = company.schedule?.find(d => d.key === dayKey);
    if (!sched?.enabled || !sched.ranges?.length) return [];
    ranges = sched.ranges;
  }

  const disabled = company.disabledSlots ?? {};
  let result = ranges
    .flatMap(r => slotsInRange(r.open, r.close, interval, duration, capacity, apts, selectedStaff?.id ?? null))
    .filter(s => !disabled[`${dayKey}-${s}`]);

  // "Cualquier profesional" con staff asignado: el horario sólo sirve si queda alguien libre.
  // Libres = trabajan a esa hora y no tienen cita propia, menos las citas "cualquiera" que ya se solapan.
  if (!selectedStaff && staff.length > 0) {
    result = result.filter(s => {
      const start = toMin(s);
      const end   = start + duration;
      const free  = staff.filter(m => isStaffFree(m, dayKey, start, end, apts)).length;
      const anyBusy = apts.filter(a => !a.staffId && rangesOverlap(start, end, toMin(a.startTime), toMin(a.endTime))).length;
      return free - anyBusy > 0;
    });
  }

  if (i.nowMin != null) {
    const now = i.nowMin;
    result = result.filter(s => toMin(s) + 10 > now);
  }
  return result;
}
