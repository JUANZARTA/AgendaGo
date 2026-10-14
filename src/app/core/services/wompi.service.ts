import { Injectable } from '@angular/core';
import { PaymentCheck, PlanCatalog, WompiTransaction, checkWompiPayment } from '../domain/plans';
import { OriginCheck, checkPaymentOrigin, wompiEnvFromApiUrl } from '../domain/payment-origin';
import { environment } from '../../../environments/environment';

/**
 * API pública de Wompi según el entorno: sandbox en desarrollo, producción en el build de producción
 * (angular.json reemplaza environment.ts por environment.prod.ts). Consultar una transacción no requiere llaves.
 */
const WOMPI_API = environment.wompi.apiUrl;
const WOMPI_ENV = wompiEnvFromApiUrl(WOMPI_API);

/** Ids de Wompi: dígitos y guiones (ej. 12345-1700000000-67890). Evita armar URLs con basura. */
const TX_ID = /^[0-9A-Za-z-]{5,64}$/;
const LINK_ID = /^[0-9A-Za-z_-]{3,64}$/;

/** Resultado de la verificación completa que usa el admin antes de activar un plan. */
export interface VerifiedTransaction {
  tx: WompiTransaction | null;
  /** Aprobada + COP + monto de un plan + NUESTRO comercio + entorno correcto. */
  check: PaymentCheck;
}

@Injectable({ providedIn: 'root' })
export class WompiService {
  isValidTransactionId(id: string | null | undefined): id is string {
    return !!id && TX_ID.test(id);
  }

  /** Estado real de la transacción según Wompi. null si no existe. */
  async getTransaction(id: string): Promise<WompiTransaction | null> {
    if (!this.isValidTransactionId(id)) return null;
    const res = await fetch(`${WOMPI_API}/transactions/${encodeURIComponent(id)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`WOMPI_${res.status}`);
    const d = (await res.json())?.data ?? {};
    const merchantKey = d.merchant?.public_key ?? d.merchant_public_key ?? null;
    return {
      id:            String(d.id ?? id),
      status:        String(d.status ?? 'ERROR'),
      amountInCents: Number(d.amount_in_cents ?? 0),
      currency:      String(d.currency ?? ''),
      reference:     String(d.reference ?? ''),
      customerEmail: d.customer_email ?? null,
      createdAt:     String(d.created_at ?? ''),
      customerName:  d.customer_data?.full_name ?? null,
      customerPhone: d.customer_data?.phone_number ?? null,
      paymentMethod: d.payment_method_type ?? null,
      paymentLinkId: d.payment_link_id ?? null,
      finalizedAt:   d.finalized_at ?? null,
      statusMessage: d.status_message ?? null,
      env:           WOMPI_ENV,
      merchantPublicKey: typeof merchantKey === 'string' ? merchantKey : null,
    };
  }

  /** Llave pública del comercio dueño de un link de pago (API pública /payment_links/{id}). null si no existe. */
  async getPaymentLinkMerchantKey(linkId: string): Promise<string | null> {
    if (!LINK_ID.test(linkId)) return null;
    const res = await fetch(`${WOMPI_API}/payment_links/${encodeURIComponent(linkId)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`WOMPI_${res.status}`);
    const key = (await res.json())?.data?.merchant_public_key;
    return typeof key === 'string' ? key : null;
  }

  /** ¿La transacción es de NUESTRO comercio y del entorno correcto para este build? */
  async checkOrigin(tx: WompiTransaction): Promise<OriginCheck> {
    const linkMerchantKey = tx.paymentLinkId ? await this.getPaymentLinkMerchantKey(tx.paymentLinkId) : null;
    return checkPaymentOrigin(
      { apiEnv: tx.env ?? null, txMerchantKey: tx.merchantPublicKey, paymentLinkId: tx.paymentLinkId, linkMerchantKey },
      { production: environment.production, expectedPublicKey: environment.wompiPublicKey, allowSandbox: environment.useEmulators },
    );
  }

  /**
   * Verificación COMPLETA (la que usa el admin antes de activar): consulta Wompi, chequea estado/moneda/monto
   * y además que el pago sea a nuestro comercio y del entorno de producción. Nunca confía en datos del reporte.
   */
  async verify(id: string, plans: PlanCatalog): Promise<VerifiedTransaction> {
    const tx = await this.getTransaction(id);
    if (!tx) return { tx: null, check: { ok: false, reason: 'No existe en Wompi' } };
    const check = checkWompiPayment(tx, plans);
    if (!check.ok) return { tx, check };
    const origin = await this.checkOrigin(tx);
    return { tx, check: origin.ok ? check : { ok: false, reason: origin.reason } };
  }
}
