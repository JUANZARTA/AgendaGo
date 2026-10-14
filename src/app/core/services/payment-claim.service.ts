import { Injectable, inject } from '@angular/core';
import {
  Firestore, addDoc, collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { NotificationService } from './notification.service';
import { AppConfigService } from './app-config.service';
import { WompiTransaction, formatCop, paymentMethodLabel, planFromAmount, PLANS } from '../domain/plans';

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

/**
 * Intento de pago: la empresa tocó "Pagar" y se fue a Wompi. Si nunca vuelve a la app,
 * el admin lo ve como "intento sin reporte" y sabe qué buscar en Wompi (empresa, monto, hora).
 */
export interface PaymentAttempt {
  id?: string;
  companyId: string;
  companyName: string;
  plan: string;
  amount: number;
  status: 'open' | 'dismissed';
  createdAt?: any;
}

@Injectable({ providedIn: 'root' })
export class PaymentClaimService {
  private firestore = inject(Firestore);
  private notifSvc  = inject(NotificationService);
  private appConfig = inject(AppConfigService);
  private col = collection(this.firestore, 'paymentClaims');

  /**
   * Reporta una transacción de Wompi a nombre de la empresa (página de gracias o "¿Ya pagaste?")
   * y avisa al admin. Guarda una copia de lo que dijo Wompi sólo para mostrar.
   */
  async reportTransaction(t: WompiTransaction, company: { id: string; name: string }, ownerEmail: string): Promise<ReportResult> {
    const plan = planFromAmount(t.amountInCents, t.currency, this.appConfig.plans());
    const r = await this.report({
      companyId:     company.id,
      companyName:   company.name,
      ownerEmail,
      transactionId: t.id,
      amount:        t.amountInCents / 100,
      plan:          plan ?? undefined,
      payerName:     t.customerName ?? undefined,
      payerEmail:    t.customerEmail ?? undefined,
      payerPhone:    t.customerPhone ?? undefined,
      paymentMethod: t.paymentMethod ?? undefined,
      paidAt:        t.finalizedAt ?? t.createdAt ?? undefined,
    });
    if (r === 'created') {
      const planTxt = plan ? ` (plan ${PLANS[plan].label}, ${formatCop(t.amountInCents / 100)})` : '';
      const payer   = t.customerName ? `. Pagó: ${t.customerName}` : '';
      const method  = t.paymentMethod ? ` con ${paymentMethodLabel(t.paymentMethod)}` : '';
      await this.notifSvc.create({
        recipientId: 'admin',
        type:        'payment_initiated',
        title:       `Pago reportado — ${company.name}`,
        body:        `${company.name} reportó la transacción ${t.id}${planTxt}${payer}${method}. Verificala en Facturación.`,
        link:        '/admin/facturacion',
      }).catch(err => console.error('[PaymentClaims] No se pudo avisar al admin:', err));
    }
    return r;
  }

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

  /** Anota el intento al abrir Wompi. Best-effort: si falla, no bloquea el pago. */
  async recordAttempt(a: Pick<PaymentAttempt, 'companyId' | 'companyName' | 'plan' | 'amount'>): Promise<void> {
    await addDoc(collection(this.firestore, 'paymentAttempts'), { ...a, status: 'open', createdAt: serverTimestamp() });
  }

  /** Intentos abiertos (admin); cuáles ya tienen reporte o pago lo decide quien los muestra. */
  watchOpenAttempts(): Observable<PaymentAttempt[]> {
    const q = query(collection(this.firestore, 'paymentAttempts'), where('status', '==', 'open'));
    return new Observable(observer => onSnapshot(q,
      snap => observer.next(snap.docs.map(d => ({ id: d.id, ...d.data() }) as PaymentAttempt)),
      err => observer.error(err),
    ));
  }

  /** Todos los reportes (admin): para saber qué intentos ya quedaron cubiertos. */
  watchAll(): Observable<PaymentClaim[]> {
    return new Observable(observer => onSnapshot(this.col,
      snap => observer.next(snap.docs.map(d => ({ id: d.id, ...d.data() }) as PaymentClaim)),
      err => observer.error(err),
    ));
  }

  async dismissAttempt(id: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'paymentAttempts', id), { status: 'dismissed' });
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
