import { StaffDaySchedule } from '../../../core/services/staff.service';
import { toMin } from '../../../core/domain/scheduling';

export const DAY_ORDER = ['lun','mar','mie','jue','vie','sab','dom'];
export const DAY_LABELS: Record<string, string> = {
  lun: 'Lunes', mar: 'Martes', mie: 'Miércoles',
  jue: 'Jueves', vie: 'Viernes', sab: 'Sábado', dom: 'Domingo',
};

export function defaultSchedule(): Record<string, StaffDaySchedule> {
  return {
    lun: { enabled: true,  open: '09:00', close: '18:00' },
    mar: { enabled: true,  open: '09:00', close: '18:00' },
    mie: { enabled: true,  open: '09:00', close: '18:00' },
    jue: { enabled: true,  open: '09:00', close: '18:00' },
    vie: { enabled: true,  open: '09:00', close: '18:00' },
    sab: { enabled: false, open: '09:00', close: '14:00' },
    dom: { enabled: false, open: '09:00', close: '14:00' },
  };
}

export interface StaffDraft {
  name: string;
  phone: string;
  photoURL: string;
  serviceIds: string[];
  isActive: boolean;
  useCustomSchedule: boolean;
  schedule: Record<string, StaffDaySchedule>;
}

export const EMPTY_DRAFT: StaffDraft = {
  name: '',
  phone: '',
  photoURL: '',
  serviceIds: [],
  isActive: true,
  useCustomSchedule: false,
  schedule: defaultSchedule(),
};

/** Iniciales (máx. 2) a partir del nombre. */
export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('');
}

/** Devuelve el mensaje de error del primer día inválido, o null si el horario es válido. */
export function scheduleErrorMessage(schedule: Record<string, StaffDaySchedule>): string | null {
  const bad = DAY_ORDER.find(d => {
    const s = schedule[d];
    return s?.enabled && (!s.open || !s.close || toMin(s.close) <= toMin(s.open));
  });
  return bad
    ? `${DAY_LABELS[bad]}: la hora de salida debe ser posterior a la de entrada (12:00 AM es medianoche).`
    : null;
}

/** Estilos compartidos por los componentes con inputs (evita zoom en iOS). */
export const STAFF_INPUT_MEDIA_STYLES = `
    @media (max-width: 640px) {
      input, select, textarea { font-size: 16px !important; }
    }
`;
