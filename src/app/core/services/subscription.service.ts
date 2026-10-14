import { Injectable, inject } from '@angular/core';
import {
  Firestore, doc, getDoc, getDocFromServer, onSnapshot, runTransaction, serverTimestamp, Timestamp,
  collection, getDocs, query, where, writeBatch,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { PlanKey, nextPeriodEnd } from '../domain/plans';
import { AppConfigService } from './app-config.service';
import { NotificationService } from './notification.service';
import {
  OverdueItem, SubscriptionLike, daysRemainingOf, overdueItems, subscriptionTimeline,
} from '../domain/subscription-timeline';
import { PaymentDocLike, manualPaymentId, paidUntil } from '../domain/payment-history';
import { canRegisterPayments } from '../domain/payment-origin';
import { AdminPlanInput, AdminPlanResult, buildAdminPlanUpdate, planChangedNotice } from '../domain/admin-plan';
import { environment } from '../../../environments/environment';

/** Datos de quien pagó según Wompi, para el historial (opcionales). */
export interface PaymentPayer {
  payerName?: string | null;
  payerEmail?: string | null;
  payerPhone?: string | null;
  paymentMethod?: string | null;
  paidAt?: string | null;
  /** Auditoría de la verificación: entorno de la API de Wompi y link de pago con que se pagó. */
  wompiEnv?: 'production' | 'sandbox' | null;
  paymentLinkId?: string | null;
}

/**
 * Duración del trial POR DEFECTO en meses calendario (igual que functions/src/subscriptions/on-company-created.ts).
 * El valor efectivo es config/app.trialMonths (lo edita el superadmin).
 */
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

/** Ítem de la revisión de vencimientos ('missing' = empresa activa sin suscripción). */
export type OverdueSub = OverdueItem;

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
  private appConfig = inject(AppConfigService);
  private notifSvc  = inject(NotificationService);

  /** fromServer: ignora la caché local (para confirmar que el doc de verdad no existe). */
  async getStatus(companyId: string, fromServer = false): Promise<Subscription | null> {
    const ref  = doc(this.firestore, 'subscriptions', companyId);
    const snap = fromServer ? await getDocFromServer(ref) : await getDoc(ref);
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

  /** (Solo superadmin) Hasta cuándo cubren los pagos aprobados de la empresa, o null si no hay. */
  async paidUntil(companyId: string): Promise<Date | null> {
    const snap = await getDocs(query(collection(this.firestore, 'payments'), where('companyId', '==', companyId)));
    return paidUntil(snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentDocLike)));
  }

  /**
   * Registro manual de un pago verificado en Wompi (sustituye al webhook, que no corre en plan Spark).
   * Mismo efecto que functions/src/payments/validate-payment.ts: deja el pago en el historial,
   * extiende el período desde max(ahora, fin actual) y reactiva la empresa.
   * La referencia es OBLIGATORIA: el id del pago se deriva de ella, así registrar dos veces el mismo
   * pago falla (DUPLICATE_PAYMENT). Sin referencia el id sería aleatorio y un doble clic o un
   * reintento duplicaría el período pagado.
   */
  async registerManualPayment(companyId: string, planKey: PlanKey, reference: string, payer: PaymentPayer = {}): Promise<ManualPaymentResult> {
    // `ng serve` consulta el SANDBOX de Wompi pero escribe en la Firestore REAL: nunca activa planes
    // (un pago de prueba es gratis). Sólo el build de producción o los emuladores.
    if (!canRegisterPayments(environment)) throw new Error('SANDBOX_BUILD');
    const ref = (reference ?? '').trim();
    if (!ref) throw new Error('REFERENCE_REQUIRED');
    // Monto y días configurados por el admin (config/app)
    const plan       = this.appConfig.plans()[planKey];
    const paymentRef = doc(this.firestore, 'payments', manualPaymentId(ref)!);
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
        wompiRef:    ref,
        // Sólo campos con valor (Firestore no acepta undefined)
        ...Object.fromEntries(Object.entries(payer).filter(([, v]) => v != null && v !== '')),
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

  /**
   * (Solo superadmin) Qué hay que suspender: suscripciones trial/active que pasaron la gracia y
   * empresas ACTIVAS sin doc de suscripción (si no, nunca vencerían). Lee todas las suscripciones
   * y las empresas con isActive == true y decide en memoria (overdueItems, puro): sin índices compuestos.
   */
  async findOverdue(): Promise<OverdueSub[]> {
    await this.appConfig.ready();
    const graceDays = this.appConfig.timeline().graceDays;
    const [subsSnap, activeSnap] = await Promise.all([
      getDocs(collection(this.firestore, 'subscriptions')),
      getDocs(query(collection(this.firestore, 'companies'), where('isActive', '==', true))),
    ]);
    return overdueItems(
      subsSnap.docs.map(d => ({ id: d.id, data: d.data() as Subscription })),
      activeSnap.docs.map(d => d.id),
      new Date(),
      graceDays,
    );
  }

  /**
   * (Solo superadmin) Marca como expired + companies.isActive=false en batches.
   * Empresa sin suscripción ('missing'): se le crea { companyId, status: 'expired' } (set merge,
   * por si apareció entre la lectura y la escritura) para que vea "vencida" y pueda pagar.
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
          const subRef = doc(this.firestore, 'subscriptions', it.companyId);
          if (it.status === 'missing') batch.set(subRef, { companyId: it.companyId, status: 'expired' }, { merge: true });
          else batch.update(subRef, { status: 'expired' });
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


  /**
   * Estado efectivo: 'expired' si pasó la gracia aunque la revisión de vencimientos (automática al
   * entrar el admin, o "Revisar vencimientos") todavía no la marcó (trial o plan pago).
   */
  effectiveStatus(sub: Subscription): Subscription['status'] {
    return subscriptionTimeline(sub, new Date(), this.appConfig.timeline()).phase === 'suspended' ? 'expired' : sub.status;
  }

  /** Días que quedan: misma cuenta (días calendario) que el timeline y el banner. */
  daysRemaining(sub: Subscription): number {
    return daysRemainingOf(sub);
  }

  /**
   * (Solo superadmin) Cambio de plan a mano: lo usan el modal "Plan" de Empresas y "Gestionar" de
   * Facturación, así los dos escriben y validan igual (buildAdminPlanUpdate). NO escribe lastPaymentDate
   * (sólo registerManualPayment). Avisa a la empresa con el mismo texto. Si la validación falla no escribe nada.
   */
  async adminSetPlan(
    companyId: string,
    input: AdminPlanInput,
    current: SubscriptionLike | null,
    ownerId?: string | null,
  ): Promise<AdminPlanResult> {
    const r = buildAdminPlanUpdate(companyId, input, current);
    if (!r.ok) return r;

    const batch = writeBatch(this.firestore);
    batch.set(doc(this.firestore, 'subscriptions', companyId), r.data, { merge: true });
    // set+merge tolera que el doc de la empresa no exista (update abortaría el batch)
    batch.set(doc(this.firestore, 'companies', companyId), { isActive: r.isActive }, { merge: true });
    await batch.commit();

    try {
      const owner = ownerId ?? ((await getDoc(doc(this.firestore, 'companies', companyId))).data() as any)?.ownerId;
      if (owner) {
        await this.notifSvc.create({
          recipientId: owner,
          type:        'plan_changed',
          ...planChangedNotice(input.status, r.endDate),
          link:        '/empresa/facturacion',
        });
      }
    } catch (err) {
      // El cambio ya quedó guardado: la notificación es best-effort
      console.error('[SubscriptionService] No se pudo notificar el cambio de plan:', err);
    }
    return r;
  }
}
