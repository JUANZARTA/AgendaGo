/**
 * ¿De DÓNDE viene una transacción de Wompi? PURO (sin Angular ni Firebase).
 *
 * checkWompiPayment (plans.ts) dice si el pago está aprobado y por el monto de un plan, pero la API
 * pública de Wompi devuelve transacciones de CUALQUIER comercio y de los dos entornos. Sin este chequeo:
 *  - un atacante abre su propia cuenta de Wompi, se paga 29.000 a sí mismo (la plata vuelve a él)
 *    y reporta ese id → "Aprobada, COP, monto exacto" → plan gratis;
 *  - un atacante paga en el SANDBOX con tarjetas de prueba (gratis) y el admin, desde `ng serve`
 *    (que consulta el sandbox) contra la Firestore REAL, activa el plan.
 *
 * Regla: sólo se acepta si el pago es a NUESTRO comercio (llave pública esperada, comprobada con el
 * link de pago o con el comercio de la transacción) y del entorno de PRODUCCIÓN cuando el build es
 * productivo. Los builds de desarrollo nunca registran pagos salvo contra los emuladores.
 */

export type WompiEnv = 'production' | 'sandbox';

/** Entorno al que pertenece una llave pública de Wompi (pub_prod_… / pub_test_…). */
export function wompiEnvFromKey(key: string | null | undefined): WompiEnv | null {
  if (!key) return null;
  if (key.startsWith('pub_prod_')) return 'production';
  if (key.startsWith('pub_test_')) return 'sandbox';
  return null;
}

/** Entorno según la URL base de la API (https://production.wompi.co/v1 vs https://sandbox.wompi.co/v1). */
export function wompiEnvFromApiUrl(url: string): WompiEnv | null {
  try {
    const host = new URL(url).hostname;
    if (host === 'production.wompi.co') return 'production';
    if (host === 'sandbox.wompi.co') return 'sandbox';
  } catch { /* URL inválida */ }
  return null;
}

/** Id del link de pago a partir de su URL (https://checkout.wompi.co/l/<id>), o null. */
export function paymentLinkIdFromUrl(url: string | null | undefined): string | null {
  const m = /^https:\/\/checkout\.wompi\.co\/l\/([A-Za-z0-9_-]{3,64})\/?$/.exec((url ?? '').trim());
  return m ? m[1] : null;
}

/** Hechos de origen que juntó el servicio (todos vienen de la API de Wompi, no del reporte de la empresa). */
export interface PaymentOriginFacts {
  /** Entorno de la API que respondió la transacción. */
  apiEnv: WompiEnv | null;
  /** merchant.public_key de la transacción, si la API lo informa. */
  txMerchantKey?: string | null;
  /** Link de pago con el que se pagó (payment_link_id). */
  paymentLinkId?: string | null;
  /** merchant_public_key del link de pago (GET /payment_links/{id}), si se pudo consultar. */
  linkMerchantKey?: string | null;
}

export interface PaymentOriginPolicy {
  /** Build de producción (environment.production). */
  production: boolean;
  /** Llave pública de NUESTRO comercio para este build (environment.wompiPublicKey). */
  expectedPublicKey: string;
  /** Se permite el sandbox (sólo con emuladores: nunca toca la base real). */
  allowSandbox: boolean;
}

export type OriginCheck =
  | { ok: true; env: WompiEnv }
  | { ok: false; reason: string };

/** ¿Este build puede registrar pagos/activar planes? Desarrollo sólo contra emuladores. */
export function canRegisterPayments(env: { production: boolean; useEmulators: boolean }): boolean {
  return env.production || env.useEmulators;
}

export function checkPaymentOrigin(f: PaymentOriginFacts, p: PaymentOriginPolicy): OriginCheck {
  const expected = p.expectedPublicKey.trim();
  const expectedEnv = wompiEnvFromKey(expected);
  if (!expectedEnv) {
    return { ok: false, reason: 'La llave pública de Wompi de este build no está configurada: no se puede verificar el comercio.' };
  }
  if (p.production && expectedEnv !== 'production') {
    return { ok: false, reason: 'El build de producción tiene una llave de pruebas: revisá environment.prod.ts.' };
  }

  // 1) Entorno: en producción sólo transacciones consultadas en la API real.
  if (!f.apiEnv) return { ok: false, reason: 'No se sabe contra qué entorno de Wompi se consultó.' };
  if (f.apiEnv === 'sandbox' && (p.production || !p.allowSandbox)) {
    return { ok: false, reason: 'Transacción del SANDBOX de Wompi (pago de prueba, sin dinero real).' };
  }
  if (f.apiEnv !== expectedEnv) {
    return { ok: false, reason: 'El entorno de la API no coincide con la llave del comercio.' };
  }
  if (f.paymentLinkId?.startsWith('test_') && f.apiEnv === 'production') {
    return { ok: false, reason: 'Link de pago de pruebas en una transacción real: inconsistente.' };
  }

  // 2) Comercio: toda llave que informe Wompi tiene que ser la nuestra.
  const keys = [f.txMerchantKey, f.linkMerchantKey].filter((k): k is string => !!k);
  for (const k of keys) {
    if (wompiEnvFromKey(k) === 'sandbox' && p.production) {
      return { ok: false, reason: 'El comercio de la transacción es de pruebas (sandbox).' };
    }
    if (k !== expected) {
      return { ok: false, reason: 'La transacción es de OTRO comercio de Wompi, no del nuestro.' };
    }
  }
  if (keys.length === 0) {
    return {
      ok: false,
      reason: f.paymentLinkId
        ? 'No se pudo comprobar el comercio del link de pago. Intentá de nuevo.'
        : 'La transacción no se hizo con un link de pago y Wompi no informa el comercio: no se puede comprobar que sea nuestra.',
    };
  }
  return { ok: true, env: f.apiEnv };
}
