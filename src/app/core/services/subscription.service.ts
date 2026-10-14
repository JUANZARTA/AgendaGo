import { Injectable, inject } from '@angular/core';
import {
  Firestore, doc, getDoc, onSnapshot, runTransaction, serverTimestamp, Timestamp,
  collection, getDocs, query, where, writeBatch,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { PLANS, PlanKey, nextPeriodEnd } from '../domain/plans';

/** Duración del trial en meses calendario (igual que functions/src/subscriptions/on-company-created.ts). */
export const TRIAL_MONTHS = 2;

// Cada doc genera 2 operaciones; 220 docs = 440 ops (< límite de 500 por batch)
const DOCS_PER_BATCH = 220;

/**
 * Suma meses calendario sin desbordar: setMonth salta de mes desde el día 31
 * (31-dic + 2 meses -> 3-mar), así que se ajusta al último día del mes destino.
 */
export function addMonthsClamped(from: Date, months: number): Date {
  const d = new Date(from.getTime());
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

export interface OverdueSub {
  companyId: string;
  status: 'trial' | 'active';
  endDate: Date;
}

export interface Subscription {
  companyId: string;
  status: 'trial' | 'active' | 'expired' | 'disabled' | 'free';
  trialStartDate: any;
  trialEndDate: any;
  currentPeriodEnd?: any;
  lastPaymentDate?: any;
  /** Último plan pagado. */
  plan?: PlanKey;
}

export interface ManualPaymentResult {
  periodEnd: Date;
  ownerId: string | null;
  /** La suscripción estaba deshabilitada: se registra el pago pero no se reactiva. */
  disabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private firestore = inject(Firestore);

  async getStatus(companyId: string): Promise<Subscription | null> {
    const snap = await getDoc(doc(this.firestore, 'subscriptions', companyId));
    return snap.exists() ? snap.data() as Subscription : null;
  }

  watchStatus(companyId: string): Observable<Subscription | null> {
    return new Observable((observer) => {
      return onSnapshot(
        doc(this.firestore, 'subscriptions', companyId),
        (snap) => observer.next(snap.exists() ? snap.data() as Subscription : null),
        (err) => {
          console.error('[SubscriptionService] Error observando suscripción:', err);
          observer.error(err);
        },
      );
    });
  }

  /**
   * Crea subscriptions/{companyId} en trial si NO existe (sin Cloud Functions / plan Spark).
   * Misma forma que el antiguo trigger onCompanyCreated. Transacción: nunca pisa un doc existente.
   * Devuelve true si lo creó, false si ya existía.
   */
  async createTrialIfMissing(companyId: string): Promise<boolean> {
    const ref = doc(this.firestore, 'subscriptions', companyId);
    return runTransaction(this.firestore, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) return false;
      tx.set(ref, {
        companyId,
        status: 'trial',
        trialStartDate: serverTimestamp(),
        trialEndDate: Timestamp.fromDate(addMonthsClamped(new Date(), TRIAL_MONTHS)),
      });
      return true;
    });
  }

  /**
   * (Solo superadmin) Suscripciones trial/active cuya fecha de fin ya pasó.
   * Se consulta solo por status y se filtra en memoria: evita índices compuestos.
   */
  /**
   * Registro manual de un pago verificado en Wompi (sustituye al webhook, que no corre en plan Spark).
   * Mismo efecto que functions/src/payments/validate-payment.ts: deja el pago en el historial,
   * extiende el período desde max(ahora, fin actual) y reactiva la empresa.
   * Con referencia, el id del pago se deriva de ella: registrar dos veces el mismo pago falla.
   */
  async registerManualPayment(companyId: string, planKey: PlanKey, reference: string): Promise<ManualPaymentResult> {
    const plan       = PLANS[planKey];
    const ref        = reference.trim();
    const paymentRef = ref
      ? doc(this.firestore, 'payments', 'manual-' + ref.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120))
      : doc(collection(this.firestore, 'payments'));
    const subRef     = doc(this.firestore, 'subscriptions', companyId);
    const companyRef = doc(this.firestore, 'companies', companyId);

    return runTransaction(this.firestore, async (tx) => {
      const [paySnap, subSnap, companySnap] = await Promise.all([
        tx.get(paymentRef), tx.get(subRef), tx.get(companyRef),
      ]);
      if (paySnap.exists()) throw new Error('DUPLICATE_PAYMENT');
      if (!companySnap.exists()) throw new Error('NO_COMPANY');

      const sub        = subSnap.data() as Subscription | undefined;
      const currentEnd = sub?.status === 'active' && sub.currentPeriodEnd?.toDate ? sub.currentPeriodEnd.toDate() : null;
      const { start, end } = nextPeriodEnd(currentEnd, plan.days);

      tx.set(paymentRef, {
        companyId,
        plan:        planKey,
        amount:      plan.amount,
        status:      'approved',
        source:      'manual',
        ...(ref ? { wompiRef: ref } : {}),
        periodStart: Timestamp.fromDate(start),
        periodEnd:   Timestamp.fromDate(end),
        createdAt:   serverTimestamp(),
      });

      const disabled = sub?.status === 'disabled';
      if (!disabled) {
        tx.set(subRef, {
          companyId,
          status:             'active',
          plan:               planKey,
          lastPaymentDate:    serverTimestamp(),
          currentPeriodStart: Timestamp.fromDate(start),
          currentPeriodEnd:   Timestamp.fromDate(end),
        }, { merge: true });
        tx.update(companyRef, { isActive: true });
      }
      return { periodEnd: end, ownerId: (companySnap.data() as any)?.ownerId ?? null, disabled };
    });
  }

  async findOverdue(): Promise<OverdueSub[]> {
    const now = Date.now();
    const out: OverdueSub[] = [];
    for (const status of ['trial', 'active'] as const) {
      const snap = await getDocs(query(collection(this.firestore, 'subscriptions'), where('status', '==', status)));
      for (const d of snap.docs) {
        const data = d.data() as any;
        const raw = status === 'trial' ? data.trialEndDate : data.currentPeriodEnd;
        const end: Date | null = raw?.toDate ? raw.toDate() : null;
        if (end && end.getTime() <= now) out.push({ companyId: d.id, status, endDate: end });
      }
    }
    return out;
  }

  /**
   * (Solo superadmin) Marca como expired + companies.isActive=false en batches.
   * Un chunk fallido no aborta el resto. Devuelve cuántas se procesaron y cuántas fallaron.
   */
  async expireOverdue(items: OverdueSub[]): Promise<{ expired: number; failed: number }> {
    let expired = 0;
    let failed = 0;
    for (let i = 0; i < items.length; i += DOCS_PER_BATCH) {
      const chunk = items.slice(i, i + DOCS_PER_BATCH);
      try {
        const batch = writeBatch(this.firestore);
        for (const it of chunk) {
          batch.update(doc(this.firestore, 'subscriptions', it.companyId), { status: 'expired' });
          // set+merge tolera que la empresa no exista (update abortaría todo el batch)
          batch.set(doc(this.firestore, 'companies', it.companyId), { isActive: false }, { merge: true });
        }
        await batch.commit();
        expired += chunk.length;
      } catch (err) {
        console.error('[SubscriptionService] Falló un chunk de expiración:', err);
        failed += chunk.length;
      }
    }
    return { expired, failed };
  }

  /** True si es trial y la fecha de fin ya pasó (no hay cron en plan Spark: el admin lo marca expired con "Revisar vencimientos"). */
  isTrialExpired(sub: Subscription): boolean {
    if (sub.status !== 'trial') return false;
    const end = sub.trialEndDate?.toDate ? sub.trialEndDate.toDate() : null;
    return !!end && end.getTime() < Date.now();
  }

  /** Estado efectivo: un trial vencido cuenta como expired aunque el cron aún no lo haya actualizado. */
  effectiveStatus(sub: Subscription): Subscription['status'] {
    return this.isTrialExpired(sub) ? 'expired' : sub.status;
  }

  daysRemaining(sub: Subscription): number {
    if (sub.status === 'free') return Infinity;
    const end = sub.status === 'trial' ? sub.trialEndDate?.toDate() : sub.currentPeriodEnd?.toDate();
    if (!end) return 0;
    return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
  }
}
