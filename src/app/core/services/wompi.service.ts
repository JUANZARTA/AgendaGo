import { Injectable } from '@angular/core';
import { WompiTransaction } from '../domain/plans';
import { environment } from '../../../environments/environment';

/**
 * API pública de Wompi según el entorno: sandbox en desarrollo, producción en el build de producción
 * (angular.json reemplaza environment.ts por environment.prod.ts). Consultar una transacción no requiere llaves.
 */
const WOMPI_API = environment.wompi.apiUrl;

/** Ids de Wompi: dígitos y guiones (ej. 12345-1700000000-67890). Evita armar URLs con basura. */
const TX_ID = /^[0-9A-Za-z-]{5,64}$/;

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
    };
  }
}
