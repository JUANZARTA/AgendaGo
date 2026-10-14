import { parseLocalDate, parseLocalDateEndOfDay, toLocalDateKey } from './date.utils';

describe('date.utils', () => {
  it('toLocalDateKey usa la fecha LOCAL (no UTC)', () => {
    expect(toLocalDateKey(new Date(2026, 9, 14, 23, 59))).toBe('2026-10-14');
    expect(toLocalDateKey(new Date(2026, 0, 5, 0, 1))).toBe('2026-01-05');
  });

  it('parseLocalDate parsea a medianoche local', () => {
    const d = parseLocalDate('2026-10-14');
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 9, 14, 0]);
  });

  it('parseLocalDateEndOfDay es el último ms del día', () => {
    const d = parseLocalDateEndOfDay('2026-10-14');
    expect([d.getDate(), d.getHours(), d.getMinutes(), d.getMilliseconds()]).toEqual([14, 23, 59, 999]);
  });

  it('ida y vuelta', () => {
    expect(toLocalDateKey(parseLocalDate('2030-02-28'))).toBe('2030-02-28');
  });
});
