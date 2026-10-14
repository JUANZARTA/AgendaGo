import { toLocalDateKey } from '../../../core/utils/date.utils';

export const PAYMENT_METHODS = ['Efectivo', 'Nequi', 'Daviplata', 'Transferencia bancaria', 'Tarjeta débito/crédito'];

export interface DayOption {
  date: string;
  dateObj: Date;
  label: string;
  sub: string;
  dayOfWeek: number;
}

export function buildDays(n: number): DayOption[] {
  const days: DayOption[] = [];
  const NAMES  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const today  = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = toLocalDateKey(d);
    days.push({
      date: iso,
      dateObj: d,
      label: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : NAMES[d.getDay()],
      sub: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
      dayOfWeek: d.getDay(),
    });
  }
  return days;
}
