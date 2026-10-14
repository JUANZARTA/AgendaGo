import {
  PaymentOriginFacts, PaymentOriginPolicy, canRegisterPayments, checkPaymentOrigin,
  paymentLinkIdFromUrl, wompiEnvFromApiUrl, wompiEnvFromKey,
} from './payment-origin';

const OURS_PROD = 'pub_prod_OURS';
const OURS_TEST = 'pub_test_OURS';
const PROD: PaymentOriginPolicy = { production: true, expectedPublicKey: OURS_PROD, allowSandbox: false };

const facts = (over: Partial<PaymentOriginFacts> = {}): PaymentOriginFacts => ({
  apiEnv: 'production', paymentLinkId: 'p5GJth', linkMerchantKey: OURS_PROD, txMerchantKey: null, ...over,
});

describe('payment-origin: helpers', () => {
  it('wompiEnvFromKey', () => {
    expect(wompiEnvFromKey('pub_prod_x')).toBe('production');
    expect(wompiEnvFromKey('pub_test_x')).toBe('sandbox');
    expect(wompiEnvFromKey('pub_test_placeholder')).toBe('sandbox');
    expect(wompiEnvFromKey('prv_prod_x')).toBeNull();
    expect(wompiEnvFromKey('')).toBeNull();
  });

  it('wompiEnvFromApiUrl sólo reconoce los hosts oficiales', () => {
    expect(wompiEnvFromApiUrl('https://production.wompi.co/v1')).toBe('production');
    expect(wompiEnvFromApiUrl('https://sandbox.wompi.co/v1')).toBe('sandbox');
    expect(wompiEnvFromApiUrl('https://production.wompi.co.evil.com/v1')).toBeNull();
    expect(wompiEnvFromApiUrl('basura')).toBeNull();
  });

  it('paymentLinkIdFromUrl', () => {
    expect(paymentLinkIdFromUrl('https://checkout.wompi.co/l/p5GJth')).toBe('p5GJth');
    expect(paymentLinkIdFromUrl('https://checkout.wompi.co/l/test_WM8ARv')).toBe('test_WM8ARv');
    expect(paymentLinkIdFromUrl('https://evil.com/l/p5GJth')).toBeNull();
    expect(paymentLinkIdFromUrl('')).toBeNull();
  });

  it('canRegisterPayments: desarrollo sólo con emuladores', () => {
    expect(canRegisterPayments({ production: true, useEmulators: false })).toBe(true);
    expect(canRegisterPayments({ production: false, useEmulators: true })).toBe(true);
    expect(canRegisterPayments({ production: false, useEmulators: false })).toBe(false);
  });
});

describe('checkPaymentOrigin', () => {
  it('pago real a nuestro link → ok', () => {
    expect(checkPaymentOrigin(facts(), PROD)).toEqual({ ok: true, env: 'production' });
  });

  it('sin link pero Wompi informa nuestro comercio → ok', () => {
    expect(checkPaymentOrigin(facts({ paymentLinkId: null, linkMerchantKey: null, txMerchantKey: OURS_PROD }), PROD).ok).toBe(true);
  });

  it('ATAQUE: pago a OTRO comercio (el atacante se paga a sí mismo) → rechazado', () => {
    const r = checkPaymentOrigin(facts({ linkMerchantKey: 'pub_prod_ATTACKER' }), PROD);
    expect(r.ok).toBe(false);
    expect(checkPaymentOrigin(facts({ txMerchantKey: 'pub_prod_ATTACKER' }), PROD).ok).toBe(false);
  });

  it('ATAQUE: transacción del sandbox en producción → rechazada', () => {
    expect(checkPaymentOrigin(facts({ apiEnv: 'sandbox' }), PROD).ok).toBe(false);
    expect(checkPaymentOrigin(facts({ linkMerchantKey: 'pub_test_OURS' }), PROD).ok).toBe(false);
    expect(checkPaymentOrigin(facts({ paymentLinkId: 'test_WM8ARv' }), PROD).ok).toBe(false);
  });

  it('ATAQUE: build de desarrollo (sandbox) contra la base real → rechazado', () => {
    const dev: PaymentOriginPolicy = { production: false, expectedPublicKey: OURS_TEST, allowSandbox: false };
    expect(checkPaymentOrigin(facts({ apiEnv: 'sandbox', linkMerchantKey: OURS_TEST }), dev).ok).toBe(false);
  });

  it('desarrollo con emuladores puede probar el flujo con el sandbox', () => {
    const emu: PaymentOriginPolicy = { production: false, expectedPublicKey: OURS_TEST, allowSandbox: true };
    expect(checkPaymentOrigin(facts({ apiEnv: 'sandbox', paymentLinkId: 'test_x', linkMerchantKey: OURS_TEST }), emu))
      .toEqual({ ok: true, env: 'sandbox' });
  });

  it('sin forma de comprobar el comercio → rechazado (falla cerrado)', () => {
    expect(checkPaymentOrigin(facts({ paymentLinkId: null, linkMerchantKey: null, txMerchantKey: null }), PROD).ok).toBe(false);
    expect(checkPaymentOrigin(facts({ linkMerchantKey: null }), PROD).ok).toBe(false);
  });

  it('configuración rota → rechazado', () => {
    expect(checkPaymentOrigin(facts(), { ...PROD, expectedPublicKey: '' }).ok).toBe(false);
    expect(checkPaymentOrigin(facts(), { ...PROD, expectedPublicKey: OURS_TEST }).ok).toBe(false);
    expect(checkPaymentOrigin(facts({ apiEnv: null }), PROD).ok).toBe(false);
  });
});
