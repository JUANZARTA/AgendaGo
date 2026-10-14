import { availableSlots, hasOwnSchedule, isStaffFree, serviceCapacity, slotsInRange } from './availability';

const company = {
  slotInterval: 30,
  schedule: [
    { key: 'mar', enabled: true,  ranges: [{ open: '09:00', close: '12:00' }] },
    { key: 'dom', enabled: false, ranges: [{ open: '09:00', close: '12:00' }] },
  ],
};
const arturo = { id: 'arturo', schedule: {} };   // usa el horario de la empresa
const luisa  = { id: 'luisa',  schedule: { mar: { enabled: true, open: '09:00', close: '10:00' } } };
const base   = { company, dayKey: 'mar', dateKey: '2030-05-14', duration: 30, apts: [] as { startTime: string; endTime: string; staffId?: string | null }[] };

describe('availability', () => {
  it('hasOwnSchedule: schedule vacío = horario de la empresa', () => {
    expect(hasOwnSchedule(arturo)).toBe(false);
    expect(hasOwnSchedule({ id: 'x' })).toBe(false);
    expect(hasOwnSchedule(luisa)).toBe(true);
    expect(hasOwnSchedule(null)).toBe(false);
  });

  it('serviceCapacity: profesionales asignados o staffCount del servicio', () => {
    expect(serviceCapacity(2, 1)).toBe(2);
    expect(serviceCapacity(0, 3)).toBe(3);
    expect(serviceCapacity(0, null)).toBe(1);
  });

  it('slotsInRange: el servicio tiene que entrar completo antes del cierre', () => {
    expect(slotsInRange('09:00', '10:00', 30, 45, 1, [], null)).toEqual(['09:00']);
    expect(slotsInRange('09:00', '10:00', 15, 30, 1, [], null)).toEqual(['09:00', '09:15', '09:30']);
  });

  describe('isStaffFree', () => {
    it('fuera de su horario propio no está libre', () => {
      expect(isStaffFree(luisa, 'mar', 600, 630, [])).toBe(false);   // 10:00, ella cierra a las 10
      expect(isStaffFree(luisa, 'mar', 570, 600, [])).toBe(true);    // 09:30-10:00
      expect(isStaffFree(luisa, 'lun', 570, 600, [])).toBe(false);   // no trabaja los lunes
    });

    it('con una cita propia solapada no está libre', () => {
      const apts = [{ startTime: '09:00', endTime: '09:15', staffId: 'luisa' }];
      expect(isStaffFree(luisa, 'mar', 540, 555, apts)).toBe(false);
      expect(isStaffFree(arturo, 'mar', 540, 555, apts)).toBe(true);
    });
  });

  describe('availableSlots', () => {
    it('día cerrado o bloqueado: sin horarios', () => {
      expect(availableSlots({ ...base, dayKey: 'dom', staff: [], selectedStaff: null })).toEqual([]);
      expect(availableSlots({
        ...base, company: { ...company, blockedDates: [{ date: '2030-05-14' }] }, staff: [], selectedStaff: null,
      })).toEqual([]);
    });

    it('respeta los horarios deshabilitados por la empresa', () => {
      const slots = availableSlots({
        ...base, company: { ...company, disabledSlots: { 'mar-09:30': true } }, staff: [], selectedStaff: null,
      });
      expect(slots).not.toContain('09:30');
      expect(slots).toContain('09:00');
    });

    it('caso real: Luisa ocupada a las 9, Arturo libre → las 9:00 siguen disponibles', () => {
      const apts = [{ startTime: '09:00', endTime: '09:15', staffId: 'luisa' }];
      const slots = availableSlots({ ...base, duration: 15, staff: [arturo, luisa], selectedStaff: null, apts, serviceStaffCount: 1 });
      expect(slots).toContain('09:00');
    });

    it('si los dos profesionales están ocupados, el horario desaparece', () => {
      const apts = [
        { startTime: '09:00', endTime: '09:30', staffId: 'luisa' },
        { startTime: '09:00', endTime: '09:30', staffId: 'arturo' },
      ];
      expect(availableSlots({ ...base, staff: [arturo, luisa], selectedStaff: null, apts })).not.toContain('09:00');
    });

    it('eligiendo un profesional con horario propio se usa ese horario', () => {
      expect(availableSlots({ ...base, staff: [arturo, luisa], selectedStaff: luisa })).toEqual(['09:00', '09:30']);
    });

    it('eligiendo un profesional, no aparecen sus horarios ocupados', () => {
      const apts = [{ startTime: '09:00', endTime: '09:30', staffId: 'luisa' }];
      expect(availableSlots({ ...base, staff: [arturo, luisa], selectedStaff: luisa, apts })).toEqual(['09:30']);
    });

    it('"cualquiera": fuera del turno de Luisa, el horario depende sólo de Arturo', () => {
      const apts = [{ startTime: '11:00', endTime: '11:30', staffId: 'arturo' }];
      const slots = availableSlots({ ...base, staff: [arturo, luisa], selectedStaff: null, apts });
      expect(slots).not.toContain('11:00');
      expect(slots).toContain('10:30');
    });

    it('hoy: descarta los horarios que ya pasaron (con 10 min de margen)', () => {
      const slots = availableSlots({ ...base, staff: [], selectedStaff: null, nowMin: 9 * 60 + 25 });
      expect(slots[0]).toBe('09:30');
    });
  });
});
