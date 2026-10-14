import { Appointment } from '../../../core/services/appointment.service';
import { Company } from '../../../core/services/company.service';

export const CANCEL_REASONS = [
  'El cliente no se presentó',
  'El cliente canceló con anticipación',
  'Enfermedad del profesional',
  'Problema con materiales o equipos',
  'Error en el agendamiento',
  'Otro',
];

export const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 8; h < 18; h++) {
    slots.push(`${String(h).padStart(2,'0')}:00`);
    slots.push(`${String(h).padStart(2,'0')}:30`);
  }
  return slots;
})();

const DAY_KEYS = ['dom','lun','mar','mie','jue','vie','sab'];

export interface DaySlot {
  time: string;
  appointments: Appointment[];
}

/** Arma las franjas del día según el horario de la empresa y asigna las citas a cada una. */
export function buildDaySlots(company: Company | null | undefined, date: string, apts: Appointment[]): DaySlot[] {
  if (!company?.schedule?.length) return [];

  const [y, m, d] = date.split('-').map(Number);
  const dayOfWeek  = new Date(y, m - 1, d).getDay();
  const key        = DAY_KEYS[dayOfWeek];
  const sched      = company.schedule.find(s => s.key === key);
  if (!sched?.enabled || !sched.ranges?.length) return [];

  const interval = company.slotInterval ?? 30;
  const slots: DaySlot[] = [];

  for (const range of sched.ranges) {
    const [oh, om] = range.open.split(':').map(Number);
    const [ch, cm] = range.close.split(':').map(Number);
    let cur = oh * 60 + om;
    const close = ch * 60 + cm;
    while (cur + interval <= close) {
      const time = `${String(Math.floor(cur/60)).padStart(2,'0')}:${String(cur%60).padStart(2,'0')}`;
      slots.push({ time, appointments: apts.filter(a => a.startTime === time) });
      cur += interval;
    }
  }

  return slots;
}

export function calcEndTime(start: string, duration: number): string {
  const [h, m] = start.split(':').map(Number);
  const total  = h * 60 + m + duration;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
