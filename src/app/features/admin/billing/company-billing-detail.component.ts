import { Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import {
  Firestore, collection, onSnapshot, orderBy, query, where,
} from '@angular/fire/firestore';
import { AdminSub, STATUS_CLASS, STATUS_LABEL } from './admin-billing.models';
import { formatCop, paymentMethodLabel } from '../../../core/domain/plans';
import { ClaimDocLike, HistoryRow, HistoryStatus, PaymentDocLike, buildPaymentHistory } from '../../../core/domain/payment-history';
import { PaymentDetailModalComponent } from '../../../shared/components/payment-detail-modal.component';
import { PaymentClaimsComponent } from './payment-claims.component';

/**
 * Detalle de facturación de UNA empresa (admin): estado de la suscripción, historial completo
 * de pagos y reportes que hizo al volver de Wompi. Los cambios se hacen desde el modal "Gestionar".
 */
@Component({
  selector: 'app-company-billing-detail',
  standalone: true,
  imports: [PaymentDetailModalComponent, PaymentClaimsComponent],
  styles: [`
    :host { display: block; }
    .back {
      display: inline-flex; align-items: center; gap: 6px; background: none; border: none; padding: 0;
      color: var(--purple); font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; margin-bottom: 16px;
    }
    .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
    .name { font-size: 1.35rem; font-weight: 800; color: #1a1a2e; margin: 0 0 4px; }
    .email { font-size: 13px; color: #888; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .summary .card { padding: 16px; }
    .k { font-size: 11px; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
    .v { font-size: 1.05rem; font-weight: 800; color: #1a1a2e; margin-top: 4px; }
    .section { font-size: 14px; font-weight: 800; color: #1a1a2e; margin: 0 0 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 10px 12px; color: #888; font-weight: 600; border-bottom: 2px solid #f0f0f0; white-space: nowrap; }
    td { padding: 10px 12px; border-bottom: 1px solid #f5f5f5; vertical-align: top; }
    .muted { color: #999; font-size: 12px; }
    .mono { font-family: ui-monospace, monospace; font-size: 11px; color: #666; word-break: break-all; }
    .empty { text-align: center; padding: 28px; color: #aaa; }
    .strong { font-weight: 700; color: #1a1a2e; }
    .nowrap { white-space: nowrap; }
    .history td { font-size: 13px; }
    .history .actions { text-align: right; white-space: nowrap; }

    /* Pantallas chicas: cada pago es una tarjeta (sin scroll horizontal) */
    @media (max-width: 820px) {
      .history thead { display: none; }
      .history, .history tbody, .history tr, .history td { display: block; width: 100%; }
      .history tr { border: 1.5px solid #f0f0f0; border-radius: 12px; padding: 6px 4px; margin-bottom: 10px; }
      .history td { border: none; padding: 6px 10px; display: flex; justify-content: space-between; gap: 12px; text-align: right; }
      .history td::before { content: attr(data-label); color: #888; font-size: 12px; font-weight: 600; text-align: left; flex-shrink: 0; }
      .history td > * { text-align: right; }
      .history .actions { justify-content: flex-end; }
    }
  `],
  template: `
    <button class="back" (click)="back.emit()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      Volver a todas las empresas
    </button>

    <div class="head">
      <div>
        <p class="name">{{ sub().companyName }}</p>
        <div class="email">{{ sub().ownerEmail }}</div>
      </div>
      <button class="btn btn-sm btn-primary" (click)="manage.emit()">Registrar pago / cambiar estado</button>
    </div>

    <div class="summary">
      <div class="card"><div class="k">Estado</div>
        <div class="v"><span class="badge" [class]="statusClass()">{{ statusLabel() }}</span></div>
      </div>
      <div class="card"><div class="k">Vence / Venció</div><div class="v">{{ sub().status === 'trial' ? sub().trialEndLabel : sub().periodEndLabel }}</div></div>
      <div class="card"><div class="k">Último pago</div><div class="v">{{ sub().lastPaymentLabel }}</div></div>
      <div class="card"><div class="k">Total pagado</div><div class="v">{{ fmtCop(totalPaid()) }}</div></div>
      <div class="card"><div class="k">Pagos</div><div class="v">{{ approvedCount() }}</div></div>
    </div>

    <!-- Pagos de esta empresa esperando confirmación: verificar en Wompi y activar -->
    <app-payment-claims [companyId]="sub().companyId" />

    <!-- Historial: pagos confirmados + reportes por confirmar / descartados -->
    <div class="card" style="overflow-x:auto">
      <p class="section">Historial de pagos</p>
      @if (loading()) {
        <div class="empty">Cargando...</div>
      } @else if (rows().length === 0) {
        <div class="empty">Esta empresa todavía no tiene pagos ni reportes de pago.</div>
      } @else {
        <table class="history">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Plan y valor</th>
              <th>Período cubierto</th>
              <th>Pagó</th>
              <th>Transacción</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (r of rows(); track r.key) {
              <tr>
                <td data-label="Fecha">
                  <span class="strong">{{ day(r.date) }}</span>
                  <div class="muted">{{ time(r.date) }}</div>
                </td>
                <td data-label="Plan y valor">
                  <span class="strong">{{ r.planLabel }}</span>
                  <div>{{ r.amount != null ? fmtCop(r.amount) : '—' }}</div>
                </td>
                <td data-label="Período">
                  @if (r.periodStart) {
                    <span class="nowrap">{{ day(r.periodStart) }}</span>
                    <div class="muted nowrap">→ {{ day(r.periodEnd) }}</div>
                  } @else {
                    <span class="muted">{{ r.status === 'to-confirm' ? 'Al confirmar' : '—' }}</span>
                  }
                </td>
                <td data-label="Pagó">
                  {{ r.payerName || '—' }}
                  <div class="muted">{{ methodLabel(r.paymentMethod) }}{{ r.payerEmail ? ' · ' + r.payerEmail : '' }}</div>
                </td>
                <td data-label="Transacción">
                  <span class="mono" [title]="r.transactionId || ''">{{ shortTx(r.transactionId) }}</span>
                  <div class="muted">{{ r.origin }}</div>
                </td>
                <td data-label="Estado">
                  <span class="badge nowrap" [class]="badge(r.status)">{{ r.statusLabel }}</span>
                </td>
                <td class="actions">
                  <button class="btn btn-sm btn-secondary" (click)="selected.set(r)">Ver</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    @if (selected(); as r) {
      <app-payment-detail-modal [row]="r" (closed)="selected.set(null)" />
    }
  `,
})
export class CompanyBillingDetailComponent {
  private firestore = inject(Firestore);

  readonly sub    = input.required<AdminSub>();
  readonly back   = output<void>();
  readonly manage = output<void>();

  readonly fmtCop      = formatCop;
  readonly methodLabel = paymentMethodLabel;

  loading  = signal(true);
  payments = signal<PaymentDocLike[]>([]);
  claims   = signal<ClaimDocLike[]>([]);
  rows     = computed<HistoryRow[]>(() => buildPaymentHistory(this.payments(), this.claims()));
  selected = signal<HistoryRow | null>(null);

  statusLabel   = computed(() => STATUS_LABEL[this.sub().status] ?? this.sub().status);
  statusClass   = computed(() => STATUS_CLASS[this.sub().status] ?? 'badge-blue');
  approved      = computed(() => this.payments().filter(p => p.status === 'approved'));
  totalPaid     = computed(() => this.approved().reduce((sum, p) => sum + (p.amount || 0), 0));
  approvedCount = computed(() => this.approved().length);

  constructor() {
    let unsubs: (() => void)[] = [];
    inject(DestroyRef).onDestroy(() => unsubs.forEach(u => u()));

    // Se re-suscribe si cambia la empresa mostrada
    effect(() => {
      const companyId = this.sub().companyId;
      unsubs.forEach(u => u());
      this.loading.set(true);

      const payQ = query(collection(this.firestore, 'payments'), where('companyId', '==', companyId), orderBy('createdAt', 'desc'));
      const claimQ = query(collection(this.firestore, 'paymentClaims'), where('companyId', '==', companyId));
      unsubs = [
        onSnapshot(payQ,
          snap => { this.payments.set(snap.docs.map(d => ({ id: d.id, ...d.data() }) as PaymentDocLike)); this.loading.set(false); },
          err => { console.error('[CompanyBillingDetail] Error cargando pagos:', err); this.loading.set(false); }),
        onSnapshot(claimQ,
          snap => this.claims.set(snap.docs.map(d => ({ id: d.id, ...d.data() }) as ClaimDocLike)),
          err => console.error('[CompanyBillingDetail] Error cargando reportes:', err)),
      ];
    });
  }

  badge(status: HistoryStatus): string {
    return status === 'approved' ? 'badge-green'
      : status === 'pending' || status === 'to-confirm' ? 'badge-yellow' : 'badge-red';
  }
  day(d: Date | null): string {
    return d ? d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  }
  time(d: Date | null): string {
    return d ? d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '';
  }
  /** Id de Wompi abreviado (el completo queda en el tooltip y en "Ver"). */
  shortTx(id: string | null): string {
    if (!id) return '—';
    return id.length > 14 ? '…' + id.slice(-10) : id;
  }
  dateTime(d: Date | null): string {
    return d ? d.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  }
}
