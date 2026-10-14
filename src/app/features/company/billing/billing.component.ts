import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { Subscription as RxSubscription } from 'rxjs';
import {
  Firestore, collection, query, where, orderBy, onSnapshot,
} from '@angular/fire/firestore';
import { SubscriptionService, Subscription } from '../../../core/services/subscription.service';
import { CompanyStore } from '../../../core/services/company-store.service';
import { PLANS, PlanKey, formatCop, nextPeriodEnd } from '../../../core/domain/plans';
import { subscriptionTimeline } from '../../../core/domain/subscription-timeline';
import { environment } from '../../../../environments/environment';
import { Payment, SubViewModel } from './billing.models';
import { ClaimDocLike, buildPaymentHistory } from '../../../core/domain/payment-history';
import { formatTimestamp } from './billing.utils';
import { BillingStatusCardComponent } from './components/billing-status-card.component';
import { BillingPlanCardsComponent } from './components/billing-plan-cards.component';
import { BillingPaymentHistoryComponent } from './components/billing-payment-history.component';
import { ReportPaymentComponent } from './components/report-payment.component';
import { PaymentClaimService } from '../../../core/services/payment-claim.service';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [BillingStatusCardComponent, BillingPlanCardsComponent, BillingPaymentHistoryComponent, ReportPaymentComponent],
  styles: [`
    .page { max-width: 860px; margin: 0 auto; padding: 28px 20px; }
    .page-title { font-size: 1.45rem; font-weight: 800; margin: 0 0 4px; }
    .page-sub   { font-size: 13px; color: #888; margin: 0 0 28px; }

    @media (max-width: 640px) {
      .page { padding: 16px 12px; }
    }

    .rn-overlay {
      position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,.45);
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .rn-modal { width: 100%; max-width: 440px; background: white; border-radius: 18px; padding: 26px 24px; box-shadow: 0 16px 48px rgba(0,0,0,.18); }
    .rn-title { font-size: 1.15rem; font-weight: 800; color: #1a1a2e; margin: 0 0 10px; }
    .rn-text  { font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 20px; }
    .rn-actions { display: flex; gap: 10px; }
    .rn-btn {
      flex: 1; padding: 11px; border-radius: 10px; border: none; background: var(--gradient); color: white;
      font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit;
    }
    .rn-btn--ghost { background: none; color: #888; border: 1.5px solid #e5e7eb; }
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

      <!-- ── HISTORIAL primero; abajo, los planes para renovar ── -->
      <div style="margin-bottom:32px">
        <app-billing-payment-history [rows]="historyRows()" />
      </div>

      <!-- ── ¿Pagaste y no volviste a la app? ── -->
      @if (sub().status !== 'free') {
        <div style="margin-bottom:32px">
          <app-report-payment />
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

    </div>

    @if (renewal(); as r) {
      <div class="rn-overlay" (click)="confirmPlan.set(null)">
        <div class="rn-modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <p class="rn-title">{{ r.isTrial ? '¿Pagar ahora?' : '¿Renovar tu plan?' }}</p>
          @if (r.isTrial) {
            <p class="rn-text">
              Tu prueba gratis sigue activa hasta el <strong>{{ day(r.current) }}</strong>.
              Si pagás ahora, el plan <strong>{{ r.plan.label }}</strong> arranca hoy y queda activo hasta el
              <strong>{{ day(r.newEnd) }}</strong>.
            </p>
          } @else {
            <p class="rn-text">
              Ya tenés el plan activo hasta el <strong>{{ day(r.current) }}</strong>.
              Si pagás el plan <strong>{{ r.plan.label }}</strong> ({{ fmtCop(r.plan.amount) }}) ahora, se <strong>suma</strong>:
              quedaría activo hasta el <strong>{{ day(r.newEnd) }}</strong>. No perdés ningún día.
            </p>
          }
          <div class="rn-actions">
            <button class="rn-btn rn-btn--ghost" (click)="confirmPlan.set(null)">Cancelar</button>
            <button class="rn-btn" (click)="confirmRenewal()">{{ r.isTrial ? 'Sí, pagar ahora' : 'Sí, renovar' }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class BillingComponent implements OnDestroy {
  private subscriptionService = inject(SubscriptionService);
  private companyStore        = inject(CompanyStore);
  private firestore           = inject(Firestore);
  private claimSvc            = inject(PaymentClaimService);

  loading  = signal(true);
  noSubscription = signal(false);
  loadError      = signal(false);
  /** Los botones de pago se habilitan solo cuando el companyId ya cargó */
  companyReady   = computed(() => !!this.companyStore.companyId());
  payments = signal<Payment[]>([]);
  claims   = signal<ClaimDocLike[]>([]);
  /** Historial: pagos confirmados + reportes que todavía no confirmó el admin. */
  historyRows = computed(() => buildPaymentHistory(this.payments(), this.claims()));

  /** Suscripción tal cual (fechas) para el modal de renovación. */
  rawSub  = signal<Subscription | null>(null);
  /** Plan elegido esperando confirmación ("ya tenés el plan activo"). */
  confirmPlan = signal<PlanKey | null>(null);
  renewal = computed(() => {
    const key = this.confirmPlan();
    const sub = this.rawSub();
    if (!key || !sub) return null;
    const t = subscriptionTimeline(sub);
    const current = t.endDate && t.endDate.getTime() > Date.now() ? t.endDate : null;
    return {
      plan:      PLANS[key],
      isTrial:   sub.status === 'trial',
      current,
      newEnd:    nextPeriodEnd(sub.status === 'active' ? current : null, PLANS[key].days).end,
    };
  });

  sub = signal<SubViewModel>({
    status:    'trial',
    plan:      'Gratuito (Trial)',
    trialEnd:  '—',
    daysLeft:  0,
    trialUsed: true,
  });

  private rxSub: RxSubscription | null = null;
  private unsubPayments?: () => void;
  private unsubClaims?: () => void;
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
          this.rawSub.set(subscription);

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
        snap => this.payments.set(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Payment)),
        err => console.error('[Billing] Error cargando pagos:', err),
      );

      // Reportes que dejó la empresa al volver de Wompi (aparecen como "Por confirmar")
      this.unsubClaims?.();
      this.unsubClaims = onSnapshot(
        query(collection(this.firestore, 'paymentClaims'), where('companyId', '==', companyId)),
        snap => this.claims.set(snap.docs.map(d => ({ id: d.id, ...d.data() }) as ClaimDocLike)),
        err => console.error('[Billing] Error cargando reportes de pago:', err),
      );
    });
  }

  payMonthly(): void   { this.askPay('mensual'); }
  paySemestral(): void { this.askPay('semestral'); }

  /**
   * Con el plan o la prueba todavía vigentes se pide confirmación (no pagar dos veces sin querer).
   * En gracia o vencida se paga directo: es lo que hay que hacer.
   */
  private askPay(planKey: PlanKey): void {
    const sub = this.rawSub();
    const phase = sub ? subscriptionTimeline(sub).phase : null;
    const vigente = (sub?.status === 'active' || sub?.status === 'trial')
      && (phase === 'ok' || phase === 'warning' || phase === 'due-today');
    if (vigente) this.confirmPlan.set(planKey);
    else this.pay(planKey);
  }

  confirmRenewal(): void {
    const key = this.confirmPlan();
    this.confirmPlan.set(null);
    if (key) this.pay(key);
  }

  day(d: Date | null): string {
    return d ? d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  }

  paying = signal(false);
  readonly fmtCop = formatCop;

  /**
   * Anota el intento (para que el admin lo vea si la empresa nunca vuelve de Wompi) y abre el checkout.
   * El intento se guarda ANTES de navegar: con location.assign la página se descarga y una escritura
   * en vuelo se perdería. Si Firestore tarda, se espera hasta 3 s y se sigue igual (no bloquea el pago).
   */
  private async pay(planKey: PlanKey): Promise<void> {
    const companyId = this.companyStore.companyId();
    if (!companyId || this.paying()) return;
    const plan = PLANS[planKey];
    const url  = environment.wompi.checkout[planKey];
    if (!url) {
      // Desarrollo sin link de PRUEBAS configurado: nunca caer a un link real
      alert('Falta configurar el link de pago de pruebas de Wompi en src/environments/environment.ts.');
      return;
    }
    this.paying.set(true);
    const attempt = this.claimSvc.recordAttempt({
      companyId,
      companyName: this.companyStore.company()?.name ?? 'Empresa',
      plan:        planKey,
      amount:      plan.amount,
    }).catch(err => console.error('[Billing] No se pudo anotar el intento de pago:', err));
    await Promise.race([attempt, new Promise(r => setTimeout(r, 3000))]);
    // Misma pestaña: al terminar, Wompi redirige a /empresa/facturacion/gracias
    window.location.assign(url);
  }

  ngOnDestroy(): void {
    this.rxSub?.unsubscribe();
    this.unsubPayments?.();
    this.unsubClaims?.();
  }

  private formatTimestamp(ts: any): string {
    return formatTimestamp(ts);
  }
}
