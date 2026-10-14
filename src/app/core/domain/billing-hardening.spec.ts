/**
 * BILLING HARDENING (lógica pura): empresa sin suscripción, revisión de vencimientos, formato único
 * del link de Wompi, referencia obligatoria del pago manual, modales de plan del admin y reportes.
 * Las reglas equivalentes se prueban en tests/rules/rules.test.mjs (sección BILLING HARDENING).
 */
import { DEFAULT_APP_CONFIG, WOMPI_PAYMENT_LINK_RE, validatePlans, wompiPaymentLinkId } from './app-config';
import { isWompiCheckoutUrl } from './safe-links';
import { paymentLinkIdFromUrl } from './payment-origin';
import { canUseApp, daysRemainingOf, overdueItems, subscriptionTimeline } from './subscription-timeline';
import { buildAdminPlanUpdate, planChangedNotice, subscriptionAllowsEnabling } from './admin-plan';
import { manualPaymentId } from './payment-history';
import { reportMessage } from './payment-report';
import { normalizeTrialEmail } from './trial-email';

const ts = (d: Date) => ({ toDate: () => d });
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

describe('BILLING HARDENING', () => {
  describe('[1] empresa SIN suscripción = requiere pago', () => {
    it('subscriptionTimeline(null) → missing (antes: ok) y no puede usar la app', () => {
      const t = subscriptionTimeline(null);
      expect(t.phase).toBe('missing');
      expect(canUseApp(t)).toBe(false);
      expect(canUseApp(subscriptionTimeline(undefined))).toBe(false);
    });

    it('una empresa recién creada con trial SÍ puede usar la app', () => {
      const now = at(2026, 10, 14);
      const trial = { status: 'trial', trialEndDate: ts(at(2026, 12, 14)) };
      expect(canUseApp(subscriptionTimeline(trial, now))).toBe(true);
    });

    it('la empresa que nace sin trial (expired, fin = ahora) no puede usar la app', () => {
      const now = at(2026, 10, 14);
      expect(canUseApp(subscriptionTimeline({ status: 'expired', currentPeriodEnd: ts(now) }, now))).toBe(false);
    });
  });

  describe('[1] revisión de vencimientos (overdueItems)', () => {
    const now = at(2026, 10, 14);
    const subs = [
      { id: 'vencida',  data: { status: 'active', currentPeriodEnd: ts(at(2026, 10, 1)) } },
      { id: 'gracia',   data: { status: 'active', currentPeriodEnd: ts(at(2026, 10, 12)) } },
      { id: 'trialOld', data: { status: 'trial',  trialEndDate: ts(at(2026, 9, 1)) } },
      { id: 'vigente',  data: { status: 'trial',  trialEndDate: ts(at(2026, 12, 1)) } },
      { id: 'free',     data: { status: 'free' } },
      { id: 'yaExp',    data: { status: 'expired', currentPeriodEnd: ts(at(2026, 1, 1)) } },
      { id: 'disabled', data: { status: 'disabled' } },
    ];

    it('detecta empresas ACTIVAS sin suscripción (antes nunca vencían)', () => {
      const out = overdueItems(subs, ['vigente', 'huérfana', 'free'], now, 5);
      expect(out.find(o => o.companyId === 'huérfana')).toEqual({ companyId: 'huérfana', status: 'missing', endDate: null });
    });

    it('respeta la gracia configurada y no toca free / expired / disabled / vigentes', () => {
      const ids = overdueItems(subs, [], now, 5).map(o => o.companyId).sort();
      expect(ids).toEqual(['trialOld', 'vencida']);                 // 'gracia' venció hace 2 días: sigue en gracia
      expect(overdueItems(subs, [], now, 0).map(o => o.companyId)).toContain('gracia');
    });

    it('una empresa inactiva sin suscripción no se lista (ya está suspendida)', () => {
      expect(overdueItems([], [], now)).toEqual([]);
    });
  });

  describe('[2] trial una sola vez: el contador de días coincide con el timeline', () => {
    it('daysRemainingOf usa días calendario (= daysToEnd), no ms + ceil', () => {
      const end = new Date(2026, 9, 20, 23, 59, 59, 999);
      const now = new Date(2026, 9, 14, 23, 0);
      const sub = { status: 'trial', trialEndDate: ts(end) };
      expect(daysRemainingOf(sub, now)).toBe(subscriptionTimeline(sub, now).daysToEnd);
      expect(daysRemainingOf(sub, now)).toBe(6);
      // Vence hoy: 0 (la cuenta vieja daba 1 y el banner decía "vence hoy")
      expect(daysRemainingOf({ status: 'trial', trialEndDate: ts(new Date(2026, 9, 14, 23, 59)) }, new Date(2026, 9, 14, 9))).toBe(0);
    });

    it('free = Infinity; vencida / sin fecha / sin suscripción = 0', () => {
      expect(daysRemainingOf({ status: 'free' })).toBe(Infinity);
      expect(daysRemainingOf({ status: 'active', currentPeriodEnd: ts(at(2020, 1, 1)) })).toBe(0);
      expect(daysRemainingOf({ status: 'active' })).toBe(0);
      expect(daysRemainingOf(null)).toBe(0);
    });
  });

  describe('[2] marcador por correo: normalizeTrialEmail (= normTrialEmail() de las reglas)', () => {
    it('Gmail: minúsculas, sin puntos, sin +alias, googlemail → gmail', () => {
      const base = 'juanperez@gmail.com';
      for (const e of ['juanperez@gmail.com', 'Juan.Perez@GMAIL.com', 'juan.perez+promo@gmail.com',
                       'J.U.A.N.P.E.R.E.Z@googlemail.com', 'juanperez+a+b@GoogleMail.com']) {
        expect(normalizeTrialEmail(e)).toBe(base);
      }
    });
    it('otros dominios: minúsculas y sin +alias, los puntos SÍ cuentan', () => {
      expect(normalizeTrialEmail('Ana.Lopez+x@Empresa.co')).toBe('ana.lopez@empresa.co');
      expect(normalizeTrialEmail('analopez@empresa.co')).toBe('analopez@empresa.co');
    });
    it('sin correo usable → null (sin trial)', () => {
      expect(normalizeTrialEmail(null)).toBeNull();
      expect(normalizeTrialEmail('')).toBeNull();
      expect(normalizeTrialEmail('sin-arroba')).toBeNull();
      expect(normalizeTrialEmail('a@b@c.co')).toBeNull();
      expect(normalizeTrialEmail('a/b@x.co')).toBeNull();
    });
  });

  describe('[3] habilitar una empresa desde Empresas', () => {
    const now = at(2026, 10, 14);
    it('sólo con suscripción vigente', () => {
      expect(subscriptionAllowsEnabling({ status: 'free' }, now)).toBe(true);
      expect(subscriptionAllowsEnabling({ status: 'active', currentPeriodEnd: ts(at(2026, 11, 1)) }, now)).toBe(true);
      expect(subscriptionAllowsEnabling({ status: 'trial', trialEndDate: ts(at(2026, 11, 1)) }, now)).toBe(true);
    });
    it('vencida, deshabilitada, fecha pasada, sin fecha o sin suscripción → no (usar el modal de plan)', () => {
      expect(subscriptionAllowsEnabling({ status: 'expired', currentPeriodEnd: ts(at(2027, 1, 1)) }, now)).toBe(false);
      expect(subscriptionAllowsEnabling({ status: 'disabled' }, now)).toBe(false);
      expect(subscriptionAllowsEnabling({ status: 'active', currentPeriodEnd: ts(at(2026, 10, 1)) }, now)).toBe(false);
      expect(subscriptionAllowsEnabling({ status: 'active' }, now)).toBe(false);
      expect(subscriptionAllowsEnabling(null, now)).toBe(false);
    });
  });

  describe('[4] link de Wompi: UNA definición (reglas = admin = redirección = id)', () => {
    const ok = [
      'https://checkout.wompi.co/l/p5GJth',          // links actuales de producción (6 alfanuméricos)
      'https://checkout.wompi.co/l/test_WM8ARv',     // links de pruebas (test_<alfanum>)
      'https://checkout.wompi.co/l/Zz9_x',
      'https://checkout.wompi.co/l/abc-123_X',       // con guion: antes las reglas lo rechazaban
      'https://checkout.wompi.co/l/' + 'a'.repeat(64),
    ];
    const bad = [
      'https://checkout.wompi.co/',                  // sin /l/: antes validatePlans lo aceptaba
      'https://checkout.wompi.co/p/abc',
      'https://checkout.wompi.co/l/',
      'https://checkout.wompi.co/l/abc/',            // barra final: antes paymentLinkIdFromUrl la aceptaba
      'https://checkout.wompi.co/l/abc?redirect-url=https://evil.co',
      'https://checkout.wompi.co/l/' + 'a'.repeat(65),
      'https://checkout.wompi.co.evil.co/l/abc',
      'http://checkout.wompi.co/l/abc',
      'https://checkout.wompi.co@evil.com/l/abc',
      'javascript:alert(1)',
    ];

    it('acepta los links actuales y con guion', () => {
      for (const u of ok) {
        expect(WOMPI_PAYMENT_LINK_RE.test(u)).toBe(true);
        expect(isWompiCheckoutUrl(u)).toBe(true);
        expect(paymentLinkIdFromUrl(u)).toBe(u.split('/l/')[1]);
        expect(wompiPaymentLinkId(u)).toBe(u.split('/l/')[1]);
      }
    });

    it('rechaza todo lo demás en las cuatro funciones', () => {
      for (const u of bad) {
        expect(isWompiCheckoutUrl(u)).toBe(false);
        expect(paymentLinkIdFromUrl(u)).toBeNull();
      }
    });

    it('validatePlans (admin) exige el mismo formato que las reglas', () => {
      const p = clone(DEFAULT_APP_CONFIG.plans);
      p.mensual.links.prod = 'https://checkout.wompi.co/';
      expect(validatePlans(p).join(' ')).toMatch(/link real/);
      p.mensual.links.prod = 'https://checkout.wompi.co/l/abc/';
      expect(validatePlans(p)).toHaveLength(1);
      p.mensual.links.prod = 'https://checkout.wompi.co/l/abc-123';
      p.semestral.links.test = 'https://checkout.wompi.co/l/test_WM8ARv';
      expect(validatePlans(p)).toEqual([]);
    });
  });

  describe('[5] reporte de pago: mensajes', () => {
    it('created con plan / sin plan (se reporta igual con aviso) / ya reportado / tomado por otra empresa', () => {
      expect(reportMessage('created', true, 29000)).toEqual({ ok: true, text: expect.stringMatching(/Recibimos tu aviso/) });
      expect(reportMessage('created', false, 12345).text).toMatch(/no corresponde a ningún plan/);
      expect(reportMessage('created', false, 12345).ok).toBe(true);
      expect(reportMessage('already-reported', true, 29000).text).toMatch(/ya estaba avisado/);
      const taken = reportMessage('taken', true, 29000);
      expect(taken.ok).toBe(false);
      expect(taken.text).toMatch(/otra cuenta/);
    });
  });

  describe('[6] pago manual: referencia obligatoria → id determinístico', () => {
    it('misma referencia = mismo id (registrar dos veces falla en vez de duplicar)', () => {
      expect(manualPaymentId('12103138-1791998438-62813')).toBe('manual-12103138-1791998438-62813');
      expect(manualPaymentId('  EFECTIVO-2026-10-14-GOLDENPANDA ')).toBe('manual-EFECTIVO-2026-10-14-GOLDENPANDA');
      expect(manualPaymentId('a/b c')).toBe('manual-a_b_c');
      expect(manualPaymentId('x'.repeat(200))).toHaveLength('manual-'.length + 120);
    });
    it('vacía → null (el servicio lanza REFERENCE_REQUIRED)', () => {
      expect(manualPaymentId('')).toBeNull();
      expect(manualPaymentId('   ')).toBeNull();
      expect(manualPaymentId(undefined)).toBeNull();
    });
  });

  describe('[7] modales de plan del admin (Empresas = Facturación)', () => {
    const now = new Date(2026, 9, 14, 12);
    const input = (status: any, periodEnd = '', note = '') => ({ status, periodEnd, note });

    it('active/trial con fecha pasada → rechazado', () => {
      const r = buildAdminPlanUpdate('c1', input('active', '2026-10-13'), null, now);
      expect(r).toMatchObject({ ok: false, error: 'PAST_DATE' });
      expect(buildAdminPlanUpdate('c1', input('trial', '2025-01-01'), null, now)).toMatchObject({ ok: false, error: 'PAST_DATE' });
    });

    it('active sin fecha y sin vencimiento vigente → "activa sin fecha" (DATE_REQUIRED)', () => {
      expect(buildAdminPlanUpdate('c1', input('active'), null, now)).toMatchObject({ ok: false, error: 'DATE_REQUIRED' });
      expect(buildAdminPlanUpdate('c1', input('active'), { status: 'expired', currentPeriodEnd: ts(at(2026, 9, 1)) }, now))
        .toMatchObject({ ok: false, error: 'DATE_REQUIRED' });
    });

    it('hoy es válido; sin fecha nueva conserva el vencimiento vigente', () => {
      const today = buildAdminPlanUpdate('c1', input('active', '2026-10-14'), null, now);
      expect(today.ok).toBe(true);
      const keep = buildAdminPlanUpdate('c1', input('active'), { status: 'active', currentPeriodEnd: ts(at(2026, 12, 1)) }, now);
      expect(keep).toMatchObject({ ok: true, isActive: true, data: { companyId: 'c1', status: 'active' } });
      if (keep.ok) expect('currentPeriodEnd' in keep.data).toBe(false);
    });

    it('NUNCA escribe lastPaymentDate (sólo registerManualPayment)', () => {
      for (const s of ['trial', 'active', 'expired', 'disabled', 'free'] as const) {
        const r = buildAdminPlanUpdate('c1', input(s, '2026-12-31', 'nota'), null, now);
        if (r.ok) expect('lastPaymentDate' in r.data).toBe(false);
      }
    });

    it('trial escribe trialEndDate; active currentPeriodEnd; isActive sincronizado', () => {
      const t = buildAdminPlanUpdate('c1', input('trial', '2026-12-31'), null, now);
      expect(t.ok && t.data['trialEndDate'] instanceof Date).toBe(true);
      const a = buildAdminPlanUpdate('c1', input('active', '2026-12-31'), null, now);
      expect(a.ok && a.data['currentPeriodEnd'] instanceof Date && a.isActive).toBe(true);
      expect(buildAdminPlanUpdate('c1', input('expired'), null, now)).toMatchObject({ ok: true, isActive: false });
      expect(buildAdminPlanUpdate('c1', input('disabled', '2020-01-01'), null, now)).toMatchObject({ ok: true, isActive: false });
    });

    it('free: sin vencimiento, nota marcada, activa', () => {
      const r = buildAdminPlanUpdate('c1', input('free', '', 'beneficiario'), null, now);
      expect(r).toMatchObject({ ok: true, isActive: true, data: { currentPeriodEnd: null, adminNote: 'beneficiario [Cuenta gratuita otorgada por admin]' } });
    });

    it('mismo texto de notificación desde los dos modales', () => {
      const n = planChangedNotice('active', new Date(2026, 11, 31));
      expect(n.title).toBe('Tu plan fue actualizado');
      expect(n.body).toMatch(/^El administrador cambió tu suscripción a: Plan activo\. Vence el /);
      expect(planChangedNotice('expired', null).body).toBe('El administrador cambió tu suscripción a: Vencida.');
    });
  });
});
