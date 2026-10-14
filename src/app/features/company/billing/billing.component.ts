import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { Subscription as RxSubscription } from 'rxjs';
import {
  Firestore, collection, query, where, orderBy, onSnapshot,
} from '@angular/fire/firestore';
import { SubscriptionService, Subscription } from '../../../core/services/subscription.service';
import { CompanyStore } from '../../../core/services/company-store.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PLANS, PlanKey, formatCop } from '../../../core/domain/plans';
import { Payment, SubViewModel } from './billing.models';
import { formatTimestamp } from './billing.utils';
import { BillingStatusCardComponent } from './components/billing-status-card.component';
import { BillingPlanCardsComponent } from './components/billing-plan-cards.component';
import { BillingPaymentHistoryComponent } from './components/billing-payment-history.component';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [BillingStatusCardComponent, BillingPlanCardsComponent, BillingPaymentHistoryComponent],
  styles: [`
    .page { max-width: 860px; margin: 0 auto; padding: 28px 20px; }
    .page-title { font-size: 1.45rem; font-weight: 800; margin: 0 0 4px; }
    .page-sub   { font-size: 13px; color: #888; margin: 0 0 28px; }

    @media (max-width: 640px) {
      .page { padding: 16px 12px; }
    }
  `],
  template: `
    <div class="page">

      <p class="page-title">Facturación</p>
      <p class="page-sub">Gestioná tu plan y revisá el historial de pagos</p>

      <app-billing-status-card
        [loading]="loading()"
        [loadError]="loadError()"
        [noSubscription]="noSubscription()"
        [sub]="sub()" />

      <!-- ── Banner beneficiario ── -->
      @if (sub().status === 'free') {
        <div style="border-radius:16px;padding:28px 32px;background:linear-gradient(135deg,#f5f3ff,#fdf4ff);border:2px solid #e9d5ff;display:flex;align-items:center;gap:20px;margin-bottom:8px">
          <div style="font-size:40px;flex-shrink:0">⭐</div>
          <div>
            <div style="font-size:1rem;font-weight:800;color:#6d28d9;margin-bottom:4px">¡Sos beneficiario de AgendaZco!</div>
            <div style="font-size:13px;color:#7c3aed;line-height:1.6">Tenés acceso <strong>gratuito e ilimitado</strong> a todas las funciones de la plataforma. No necesitás pagar ni renovar ningún plan.</div>
          </div>
        </div>
      }

      <!-- ── PLANES (solo si no es beneficiario) ── -->
      @if (sub().status !== 'free') {
        <app-billing-plan-cards
          [sub]="sub()"
          [noSubscription]="noSubscription()"
          [loadError]="loadError()"
          [companyReady]="companyReady()"
          (payMonthly)="payMonthly()"
          (paySemestral)="paySemestral()" />
      }

      <app-billing-payment-history [payments]="payments()" />

    </div>
  `,
})
export class BillingComponent implements OnDestroy {
  private subscriptionService = inject(SubscriptionService);
  private companyStore        = inject(CompanyStore);
  private notifSvc            = inject(NotificationService);
  private firestore           = inject(Firestore);

  loading  = signal(true);
  noSubscription = signal(false);
  loadError      = signal(false);
  /** Los botones de pago se habilitan solo cuando el companyId ya cargó */
  companyReady   = computed(() => !!this.companyStore.companyId());
  payments = signal<Payment[]>([]);

  sub = signal<SubViewModel>({
    status:    'trial',
    plan:      'Gratuito (Trial)',
    trialEnd:  '—',
    daysLeft:  0,
    trialUsed: true,
  });

  private rxSub: RxSubscription | null = null;
  private unsubPayments?: () => void;
  private prevStatus: Subscription['status'] | null = null;

  constructor() {
    effect(() => {
      const companyId = this.companyStore.companyId();
      if (!companyId) {
        // Sin empresa: si el store ya terminó de cargar, no dejar el spinner colgado
        if (!this.companyStore.loading()) {
          this.noSubscription.set(true);
          this.loading.set(false);
        }
        return;
      }

      this.rxSub?.unsubscribe();
      this.loading.set(true);
      this.loadError.set(false);
      this.noSubscription.set(false);
      this.prevStatus = null;

      this.rxSub = this.subscriptionService.watchStatus(companyId).subscribe({
        next: (subscription) => {
          if (!subscription) {
            // No existe el doc de suscripción: mostrar estado claro en vez de "trial 0 días"
            this.noSubscription.set(true);
            this.loading.set(false);
            return;
          }
          this.noSubscription.set(false);

          // Un trial vencido cuenta como expirado aunque el cron (05:00) aún no lo marcó
          const status   = this.subscriptionService.effectiveStatus(subscription);
          const daysLeft = this.subscriptionService.daysRemaining(subscription);
          const endDate  = subscription.status === 'trial'
            ? subscription.trialEndDate
            : subscription.currentPeriodEnd;
          const trialEnd = this.formatTimestamp(endDate);
          const plan     = status === 'active'
            ? (subscription.plan ? `Plan ${PLANS[subscription.plan]?.label ?? ''}`.trim() : 'Plan activo')
            : 'Gratuito (Trial)';

          this.sub.set({
            status,
            plan,
            trialEnd,
            daysLeft,
            trialUsed: status !== 'trial',
          });

          // Tras un pago aprobado el admin activa el plan: refrescar el CompanyStore
          if (status === 'active' && this.prevStatus !== null && this.prevStatus !== 'active') {
            this.companyStore.refresh().catch(err =>
              console.error('[Billing] Error refrescando CompanyStore:', err));
          }
          this.prevStatus = status;

          this.loading.set(false);
        },
        error: (err) => {
          console.error('[Billing] Error cargando suscripción:', err);
          this.loadError.set(true);
          this.loading.set(false);
        },
      });

      // Cargar historial de pagos real
      this.unsubPayments?.();
      const q = query(
        collection(this.firestore, 'payments'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc'),
      );
      this.unsubPayments = onSnapshot(
        q,
        snap => this.payments.set(snap.docs.map(d => d.data() as Payment)),
        err => console.error('[Billing] Error cargando pagos:', err),
      );
    });
  }

  payMonthly(): void   { this.pay('mensual'); }
  paySemestral(): void { this.pay('semestral'); }

  /**
   * Abre el checkout de Wompi con una referencia única y avisa al admin CON esa referencia,
   * para que la busque en Wompi y registre el pago (sin webhook en plan Spark).
   */
  private pay(planKey: PlanKey): void {
    const companyId = this.companyStore.companyId();
    if (!companyId) return;
    const plan = PLANS[planKey];
    const ref  = `${planKey}-${companyId}-${Date.now()}`;
    window.open(`${plan.checkoutUrl}?reference=${encodeURIComponent(ref)}`, '_blank');

    const name = this.companyStore.company()?.name ?? 'Una empresa';
    this.notifSvc.create({
      recipientId: 'admin',
      type:        'payment_initiated',
      title:       `Pago iniciado — ${name}`,
      body:        `${name} abrió el pago del plan ${plan.label} (${formatCop(plan.amount)}). Referencia: ${ref}. Verificalo en Wompi y registralo desde Facturación.`,
      link:        '/admin/facturacion',
    }).catch(err => console.error('[Billing] No se pudo avisar al admin:', err));
  }

  ngOnDestroy(): void {
    this.rxSub?.unsubscribe();
    this.unsubPayments?.();
  }

  private formatTimestamp(ts: any): string {
    return formatTimestamp(ts);
  }
}
