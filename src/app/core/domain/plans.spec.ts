import { PLANS, formatCop, nextPeriodEnd } from './plans';

describe('plans', () => {
  it('precios y duración iguales al webhook de Wompi', () => {
    expect(PLANS.mensual).toMatchObject({ amount: 29_000, days: 30 });
    expect(PLANS.semestral).toMatchObject({ amount: 156_600, days: 180 });
  });

  it('formatCop usa separador de miles colombiano', () => {
    expect(formatCop(156_600)).toBe('$156.600');
  });

  describe('nextPeriodEnd', () => {
    const now = new Date(2026, 9, 14, 12, 0);

    it('sin período vigente arranca desde ahora', () => {
      const { start, end } = nextPeriodEnd(null, 30, now);
      expect(start).toEqual(now);
      expect(end).toEqual(new Date(2026, 10, 13, 12, 0));
    });

    it('renovación anticipada: suma desde el fin actual (no pierde días)', () => {
      const currentEnd = new Date(2026, 9, 20, 12, 0);
      expect(nextPeriodEnd(currentEnd, 30, now).end).toEqual(new Date(2026, 10, 19, 12, 0));
    });

    it('período vencido: arranca desde ahora', () => {
      expect(nextPeriodEnd(new Date(2026, 9, 1), 30, now).start).toEqual(now);
    });
  });
});
