import {
  DEFAULT_APP_CONFIG, announcementKey, changedPlanAmounts, checkoutLink, mailtoLink, mergeAppConfig,
  planCatalog, timelineOptions, validateAnnouncement, validateAppConfig, validatePlans, validateSupport,
  validateLegal, validateTimes, whatsappLink, LIMITS,
} from './app-config';
import { DEFAULT_PRIVACY, DEFAULT_TERMS, SUPPORT_EMAIL_FALLBACK, SUPPORT_EMAIL_TOKEN, renderLegalText } from './legal';
import { PLANS, planFromAmount } from './plans';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

describe('app-config', () => {
  describe('defaults', () => {
    it('= valores que estaban fijos en el código', () => {
      const d = DEFAULT_APP_CONFIG;
      expect(d.plans.mensual).toMatchObject({ amount: 29_000, days: 30 });
      expect(d.plans.semestral).toMatchObject({ amount: 156_600, days: 180 });
      expect(d.plans.mensual.links.prod).toBe('https://checkout.wompi.co/l/p5GJth');
      expect(d.plans.mensual.links.test).toBe('https://checkout.wompi.co/l/test_WM8ARv');
      expect(d).toMatchObject({ trialMonths: 2, warningDays: 5, graceDays: 5 });
      expect(d.announcement.active).toBe(false);
      expect(validateAppConfig(d)).toEqual([]);
    });
  });

  describe('mergeAppConfig', () => {
    it('sin doc: defaults', () => {
      expect(mergeAppConfig(undefined)).toEqual(DEFAULT_APP_CONFIG);
      expect(mergeAppConfig(null)).toEqual(DEFAULT_APP_CONFIG);
      expect(mergeAppConfig({})).toEqual(DEFAULT_APP_CONFIG);
    });

    it('merge campo a campo: lo que falta queda en default', () => {
      const c = mergeAppConfig({
        plans: { mensual: { amount: 35_000, links: { prod: 'https://checkout.wompi.co/l/nuevo' } } },
        graceDays: 3,
        support: { email: 'hola@agendago.co' },
      });
      expect(c.plans.mensual).toEqual({
        amount: 35_000, days: 30,
        links: { test: DEFAULT_APP_CONFIG.plans.mensual.links.test, prod: 'https://checkout.wompi.co/l/nuevo' },
      });
      expect(c.plans.semestral).toEqual(DEFAULT_APP_CONFIG.plans.semestral);
      expect(c.graceDays).toBe(3);
      expect(c.warningDays).toBe(5);
      expect(c.support).toEqual({ whatsapp: '', email: 'hola@agendago.co' });
    });

    it('tipos o rangos inválidos se ignoran', () => {
      const c = mergeAppConfig({
        plans: { mensual: { amount: '30000', days: -1 }, semestral: 'x' },
        trialMonths: 40, warningDays: 2.5, graceDays: '5',
        announcement: { active: 'yes', text: 7, level: 'danger' },
      });
      expect(c.plans).toEqual(DEFAULT_APP_CONFIG.plans);
      expect(c).toMatchObject({ trialMonths: 2, warningDays: 5, graceDays: 5 });
      expect(c.announcement).toEqual(DEFAULT_APP_CONFIG.announcement);
    });

    it('acepta 0 días de aviso / gracia', () => {
      expect(mergeAppConfig({ warningDays: 0, graceDays: 0 })).toMatchObject({ warningDays: 0, graceDays: 0 });
    });
  });

  it('planCatalog: labels fijos con monto y días configurados', () => {
    const cat = planCatalog(mergeAppConfig({ plans: { semestral: { amount: 170_000, days: 182 } } }));
    expect(cat.semestral).toEqual({ key: 'semestral', label: 'Semestral', amount: 170_000, days: 182 });
    expect(cat.mensual).toEqual(PLANS.mensual);
    expect(planFromAmount(17_000_000, 'COP', cat)).toBe('semestral');
  });

  it('checkoutLink: prod en producción, pruebas en desarrollo', () => {
    const c = DEFAULT_APP_CONFIG;
    expect(checkoutLink(c, 'mensual', true)).toBe('https://checkout.wompi.co/l/p5GJth');
    expect(checkoutLink(c, 'mensual', false)).toBe('https://checkout.wompi.co/l/test_WM8ARv');
    expect(checkoutLink(c, 'semestral', false)).toBe('');
  });

  it('timelineOptions', () => {
    expect(timelineOptions(mergeAppConfig({ warningDays: 7, graceDays: 1 }))).toEqual({ warningDays: 7, graceDays: 1 });
  });

  describe('validación', () => {
    it('planes: montos/días enteros > 0, links de Wompi, montos distintos', () => {
      const p = clone(DEFAULT_APP_CONFIG.plans);
      expect(validatePlans(p)).toEqual([]);
      p.mensual.amount = 0;
      p.semestral.days = 1.5;
      p.mensual.links.test = 'http://evil.com/pay';
      expect(validatePlans(p)).toHaveLength(3);

      const same = clone(DEFAULT_APP_CONFIG.plans);
      same.semestral.amount = same.mensual.amount;
      expect(validatePlans(same).join(' ')).toMatch(/mismo precio/);

      const empty = clone(DEFAULT_APP_CONFIG.plans);
      empty.mensual.links = { test: '', prod: '' };
      expect(validatePlans(empty)).toEqual([]);
    });

    it('tiempos: rangos', () => {
      expect(validateTimes({ trialMonths: 1, warningDays: 0, graceDays: 30 })).toEqual([]);
      expect(validateTimes({ trialMonths: 0, warningDays: 31, graceDays: -1 })).toHaveLength(3);
      expect(validateTimes({ trialMonths: 13, warningDays: 5, graceDays: 5 })).toHaveLength(1);
    });

    it('soporte: vacío ok; número y email con formato', () => {
      expect(validateSupport({ whatsapp: '', email: '' })).toEqual([]);
      expect(validateSupport({ whatsapp: '+57 300 123 4567', email: 'a@b.co' })).toEqual([]);
      expect(validateSupport({ whatsapp: 'llamame', email: 'nope' })).toHaveLength(2);
    });

    it('anuncio: activo necesita texto', () => {
      expect(validateAnnouncement({ active: true, text: '  ', level: 'info' })).toHaveLength(1);
      expect(validateAnnouncement({ active: false, text: '', level: 'warning' })).toEqual([]);
      expect(validateAnnouncement({ active: true, text: 'x'.repeat(501), level: 'info' })).toHaveLength(1);
    });
  });

  it('changedPlanAmounts', () => {
    const next = clone(DEFAULT_APP_CONFIG.plans);
    expect(changedPlanAmounts(DEFAULT_APP_CONFIG.plans, next)).toEqual([]);
    next.semestral.amount = 160_000;
    next.mensual.days = 31;
    expect(changedPlanAmounts(DEFAULT_APP_CONFIG.plans, next)).toEqual(['semestral']);
  });

  it('links de contacto', () => {
    expect(whatsappLink('+57 300 123-4567')).toBe('https://wa.me/573001234567');
    expect(whatsappLink('3128622945')).toBe('https://wa.me/573128622945');
    expect(whatsappLink('312 862 2945')).toBe('https://wa.me/573128622945');
    expect(whatsappLink('')).toBeNull();
    expect(whatsappLink(undefined)).toBeNull();
    expect(mailtoLink(' hola@agendago.co ')).toBe('mailto:hola@agendago.co');
    expect(mailtoLink('')).toBeNull();
  });

  it('announcementKey cambia con el texto o el nivel', () => {
    const a = { active: true, text: 'Mantenimiento el sábado', level: 'info' as const };
    expect(announcementKey(a)).toBe(announcementKey({ ...a }));
    expect(announcementKey(a)).not.toBe(announcementKey({ ...a, text: 'Mantenimiento el domingo' }));
    expect(announcementKey(a)).not.toBe(announcementKey({ ...a, level: 'warning' }));
  });

  describe('legal (Términos y Privacidad)', () => {
    it('defaults: borradores no vacíos, válidos y con el token del email de soporte', () => {
      const l = DEFAULT_APP_CONFIG.legal;
      expect(l.terms).toBe(DEFAULT_TERMS);
      expect(l.privacy).toBe(DEFAULT_PRIVACY);
      expect(l.updatedAt).toBeNull();
      expect(l.privacy).toContain(SUPPORT_EMAIL_TOKEN);
      expect(l.privacy).toContain('1581');
      expect(validateLegal(l)).toEqual([]);
    });

    it('merge: usa lo guardado; vacío o tipo inválido → borrador por defecto', () => {
      const ts = { toDate: () => new Date('2026-10-14T12:00:00Z') };
      const c = mergeAppConfig({ legal: { terms: 'Mis términos', privacy: '   ', updatedAt: ts } });
      expect(c.legal.terms).toBe('Mis términos');
      expect(c.legal.privacy).toBe(DEFAULT_PRIVACY);
      expect(c.legal.updatedAt?.toISOString()).toBe('2026-10-14T12:00:00.000Z');
      expect(mergeAppConfig({ legal: { terms: 5, updatedAt: 'ayer' } }).legal)
        .toEqual({ terms: DEFAULT_TERMS, privacy: DEFAULT_PRIVACY, updatedAt: null });
    });

    it('validación: no vacíos y tope de largo', () => {
      expect(validateLegal({ terms: '', privacy: 'x' })).toHaveLength(1);
      expect(validateLegal({ terms: 'x', privacy: 'x'.repeat(LIMITS.legalText + 1) })).toHaveLength(1);
      expect(validateLegal({ terms: 'x'.repeat(LIMITS.legalText), privacy: 'x' })).toEqual([]);
    });

    it('renderLegalText reemplaza el token por el email de soporte (o un texto genérico)', () => {
      const t = `Escribí a ${SUPPORT_EMAIL_TOKEN}. O a ${SUPPORT_EMAIL_TOKEN}.`;
      expect(renderLegalText(t, ' soporte@agendaco.co ')).toBe('Escribí a soporte@agendaco.co. O a soporte@agendaco.co.');
      expect(renderLegalText(t, '')).toBe(`Escribí a ${SUPPORT_EMAIL_FALLBACK}. O a ${SUPPORT_EMAIL_FALLBACK}.`);
      expect(renderLegalText('<b>hola</b>', null)).toBe('<b>hola</b>');
    });
  });
});
