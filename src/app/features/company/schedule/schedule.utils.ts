import { DaySchedule } from '../../../core/domain/schedule-validation';

export interface BlockedDate {
  id: string;
  date: string;
  reason: string;
}

export const DEFAULT_SCHEDULE: DaySchedule[] = [
  { key: 'lun', label: 'Lunes',     enabled: true,  ranges: [{ open: '08:00', close: '18:00' }] },
  { key: 'mar', label: 'Martes',    enabled: true,  ranges: [{ open: '08:00', close: '18:00' }] },
  { key: 'mie', label: 'Miércoles', enabled: true,  ranges: [{ open: '08:00', close: '18:00' }] },
  { key: 'jue', label: 'Jueves',    enabled: true,  ranges: [{ open: '08:00', close: '18:00' }] },
  { key: 'vie', label: 'Viernes',   enabled: true,  ranges: [{ open: '08:00', close: '19:00' }] },
  { key: 'sab', label: 'Sábado',    enabled: true,  ranges: [{ open: '09:00', close: '16:00' }] },
  { key: 'dom', label: 'Domingo',   enabled: false, ranges: [{ open: '09:00', close: '14:00' }] },
];

export const SLOT_DURATIONS = [15, 20, 30, 45, 60] as const;

export function ampm(t: string): string {
  if (!t) return '';
  const [h] = t.split(':').map(Number);
  return h < 12 ? 'AM' : 'PM';
}
