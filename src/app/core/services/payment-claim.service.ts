import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

/**
 * Reporte de pago: la empresa avisa "pagué con la transacción X" al volver de Wompi.
 * NO activa nada: el admin lo verifica contra Wompi y recién ahí registra el pago.
 * El id del doc ES el id de la transacción: un mismo pago no se puede reportar dos veces.
 */
export interface PaymentClaim {
  id?: string;
  companyId: string;
  companyName: string;
  ownerEmail: string;
  transactionId: string;
  status: 'pending' | 'registered' | 'rejected';
  /** Copia de lo que informó Wompi al volver (sólo para mostrar; el admin re-verifica). */
  amount?: number;
  plan?: string;
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string;
  paymentMethod?: string;
  paidAt?: string;
  createdAt?: any;
  reviewedAt?: any;
  note?: string;
}

export type ReportResult = 'created' | 'already-reported';

@Injectable({ providedIn: 'root' })
export class PaymentClaimService {
  private firestore = inject(Firestore);
  private col = collection(this.firestore, 'paymentClaims');

  /**
   * Crea el reporte si no existe. Si ya existe (la empresa recargó la página, o el pago
   * ya lo reportó otra cuenta) no se pisa: las reglas sólo permiten crear.
   */
  async report(c: Omit<PaymentClaim, 'id' | 'status' | 'createdAt' | 'reviewedAt' | 'note'>): Promise<ReportResult> {
    const ref = doc(this.col, c.transactionId);
    try {
      if ((await getDoc(ref)).exists()) return 'already-reported';
    } catch {
      // Sin permiso de lectura = existe y es de otra empresa
      return 'already-reported';
    }
    // Firestore no acepta undefined: sólo los campos con valor
    const clean = Object.fromEntries(Object.entries(c).filter(([, v]) => v != null && v !== ''));
    await setDoc(ref, { ...clean, status: 'pending', createdAt: serverTimestamp() });
    return 'created';
  }

  /** Reportes pendientes de verificación (admin). */
  watchPending(): Observable<PaymentClaim[]> {
    const q = query(this.col, where('status', '==', 'pending'));
    return new Observable(observer => onSnapshot(q,
      snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }) as PaymentClaim);
        list.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        observer.next(list);
      },
      err => observer.error(err),
    ));
  }

  async close(transactionId: string, status: 'registered' | 'rejected', note = ''): Promise<void> {
    await updateDoc(doc(this.col, transactionId), {
      status, reviewedAt: serverTimestamp(), ...(note ? { note } : {}),
    });
  }
}
