import { PLANS, WompiTransaction, checkWompiPayment, formatCop, nextPeriodEnd, planFromAmount } from './plans';

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

describe('verificación de pagos de Wompi', () => {
  const tx = (over: Partial<WompiTransaction> = {}): WompiTransaction => ({
    id: '1-1', status: 'APPROVED', amountInCents: 2_900_000, currency: 'COP',
    reference: 'ref', customerEmail: 'a@a.co', createdAt: '2026-10-14T00:00:00Z', ...over,
  });

  it('planFromAmount: el monto en centavos define el plan', () => {
    expect(planFromAmount(2_900_000, 'COP')).toBe('mensual');
    expect(planFromAmount(15_660_000, 'COP')).toBe('semestral');
    expect(planFromAmount(100_000, 'COP')).toBeNull();
    expect(planFromAmount(2_900_000, 'USD')).toBeNull();
  });

  it('aprobada por el monto exacto: activa el plan', () => {
    expect(checkWompiPayment(tx())).toEqual({ ok: true, plan: 'mensual' });
    expect(checkWompiPayment(tx({ amountInCents: 15_660_000 }))).toEqual({ ok: true, plan: 'semestral' });
  });

  it('no aprobada: no activa y dice el estado', () => {
    for (const [status, word] of [['PENDING', 'pendiente'], ['DECLINED', 'rechazada'], ['VOIDED', 'anulada'], ['ERROR', 'con error']]) {
      const r = checkWompiPayment(tx({ status }));
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toContain(word);
    }
  });

  it('aprobada por otro monto o moneda: no activa', () => {
    expect(checkWompiPayment(tx({ amountInCents: 100_000 })).ok).toBe(false);
    expect(checkWompiPayment(tx({ currency: 'USD' })).ok).toBe(false);
  });
});
