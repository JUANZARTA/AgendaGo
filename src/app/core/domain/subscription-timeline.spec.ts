import { GRACE_DAYS, RENEWAL_WARNING_DAYS, canUseApp, subscriptionTimeline } from './subscription-timeline';

const ts = (d: Date) => ({ toDate: () => d });
// Vence el 13 dic 2026 a fin de día (como lo guarda el admin / el registro de pagos)
const END = new Date(2026, 11, 13, 23, 59, 59, 999);
const active = { status: 'active', currentPeriodEnd: ts(END) };
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m, d, h);

describe('subscriptionTimeline', () => {
  it('constantes acordadas: 5 días de aviso y 5 de gracia', () => {
    expect(RENEWAL_WARNING_DAYS).toBe(5);
    expect(GRACE_DAYS).toBe(5);
  });

  it('lejos del vencimiento: ok', () => {
    expect(subscriptionTimeline(active, at(2026, 11, 1)).phase).toBe('ok');
  });

  it('5 días antes o menos: aviso', () => {
    expect(subscriptionTimeline(active, at(2026, 11, 7)).phase).toBe('ok');       // 6 días
    const t = subscriptionTimeline(active, at(2026, 11, 8));                       // 5 días
    expect(t.phase).toBe('warning');
    expect(t.daysToEnd).toBe(5);
    expect(subscriptionTimeline(active, at(2026, 11, 12)).daysToEnd).toBe(1);
  });

  it('el mismo día: vence hoy', () => {
    expect(subscriptionTimeline(active, at(2026, 11, 13, 9)).phase).toBe('due-today');
    expect(subscriptionTimeline(active, at(2026, 11, 13, 23)).phase).toBe('due-today');
  });

  it('después de vencer: gracia por 5 días, la app sigue andando', () => {
    const t = subscriptionTimeline(active, at(2026, 11, 14));
    expect(t.phase).toBe('grace');
    expect(t.graceDaysLeft).toBe(4);
    expect(t.graceEnd).toEqual(new Date(2026, 11, 18, 23, 59, 59, 999));
    expect(canUseApp(t)).toBe(true);
    expect(subscriptionTimeline(active, at(2026, 11, 18, 22)).phase).toBe('grace');
  });

  it('pasada la gracia: suspendida aunque el admin no la haya marcado', () => {
    const t = subscriptionTimeline(active, at(2026, 11, 19, 0));
    expect(t.phase).toBe('suspended');
    expect(canUseApp(t)).toBe(false);
  });

  it('el trial sigue el mismo ciclo con su fecha de fin', () => {
    const trial = { status: 'trial', trialEndDate: ts(END) };
    expect(subscriptionTimeline(trial, at(2026, 11, 10)).phase).toBe('warning');
    expect(subscriptionTimeline(trial, at(2026, 11, 15)).phase).toBe('grace');
    expect(subscriptionTimeline(trial, at(2026, 11, 20)).phase).toBe('suspended');
  });

  it('gratuita nunca vence; vencida y deshabilitada no pueden usar la app', () => {
    expect(subscriptionTimeline({ status: 'free' }).phase).toBe('free');
    expect(canUseApp(subscriptionTimeline({ status: 'expired', currentPeriodEnd: ts(END) }))).toBe(false);
    expect(canUseApp(subscriptionTimeline({ status: 'disabled' }))).toBe(false);
  });
});
