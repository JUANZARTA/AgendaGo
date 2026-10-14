import { computeDayErrors, DaySchedule, generateDaySlots, isRangeInvalid } from './schedule-validation';

const day = (ranges: { open: string; close: string }[], enabled = true): DaySchedule =>
  ({ key: 'lun', label: 'Lunes', enabled, ranges });

describe('schedule-validation', () => {
  it('detecta franjas inválidas', () => {
    expect(isRangeInvalid({ open: '', close: '10:00' })).toBe(true);
    expect(isRangeInvalid({ open: '10:00', close: '10:00' })).toBe(true);
    expect(isRangeInvalid({ open: '10:00', close: '09:00' })).toBe(true);
    expect(isRangeInvalid({ open: '09:00', close: '10:00' })).toBe(false);
  });

  it('reporta cierre anterior a apertura y solapamientos, ignorando días cerrados', () => {
    const errors = computeDayErrors([
      day([{ open: '10:00', close: '09:00' }]),
      { ...day([{ open: '10:00', close: '09:00' }]), key: 'mar', enabled: false },
      { ...day([{ open: '08:00', close: '12:00' }, { open: '11:00', close: '14:00' }]), key: 'mie' },
      { ...day([{ open: '08:00', close: '12:00' }, { open: '12:00', close: '14:00' }]), key: 'jue' },
    ]);
    expect(errors['lun']).toContain('posterior');
    expect(errors['mar']).toBeUndefined();
    expect(errors['mie']).toContain('superponen');
    expect(errors['jue']).toBeUndefined();
  });

  it('genera turnos unificando franjas', () => {
    expect(generateDaySlots(day([{ open: '09:00', close: '10:00' }]), 30)).toEqual(['09:00', '09:30']);
    expect(generateDaySlots(day([{ open: '09:00', close: '10:00' }, { open: '09:30', close: '11:00' }]), 30))
      .toEqual(['09:00', '09:30', '10:00', '10:30']);
    expect(generateDaySlots(day([{ open: '09:00', close: '10:00' }], false), 30)).toEqual([]);
  });
});
