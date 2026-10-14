import { Component, effect, inject, input, output, signal } from '@angular/core';
import { HistoryRow } from '../../core/domain/payment-history';
import { PLANS, WompiTransaction, formatCop, paymentMethodLabel, planFromAmount } from '../../core/domain/plans';
import { WompiService } from '../../core/services/wompi.service';
import { AppConfigService } from '../../core/services/app-config.service';

const WOMPI_STATUS: Record<string, string> = {
  APPROVED: 'Aprobada', PENDING: 'En proceso', DECLINED: 'Rechazada', VOIDED: 'Anulada', ERROR: 'Con error',
};

/**
 * Detalle de un pago del historial (empresa y admin). Muestra lo guardado y, si hay número
 * de transacción, consulta a Wompi en vivo (quién pagó, medio, estado real).
 */
@Component({
  selector: 'app-payment-detail-modal',
  standalone: true,
  styles: [`
    .overlay {
      position: fixed; inset: 0; z-index: 1100; background: rgba(0,0,0,.45);
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .modal {
      position: relative; width: 100%; max-width: 480px; max-height: 88vh; overflow-y: auto;
      background: white; border-radius: 18px; padding: 26px 24px; box-shadow: 0 16px 48px rgba(0,0,0,.18);
    }
    .close {
      position: absolute; top: 14px; right: 14px; width: 32px; height: 32px; border-radius: 8px;
      border: none; background: none; color: #9ca3af; cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .close:hover { background: rgba(0,0,0,.06); color: #374151; }
    .title { font-size: 1.1rem; font-weight: 800; color: #1a1a2e; margin: 0 0 4px; }
    .amount { font-size: 1.8rem; font-weight: 900; color: #1a1a2e; margin: 6px 0 4px; }
    .chip { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
    .chip-approved   { background: #d1fae5; color: #065f46; }
    .chip-pending, .chip-to-confirm { background: #fef3c7; color: #92400e; }
    .chip-failed, .chip-rejected    { background: #fee2e2; color: #991b1b; }
    .section { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: .05em; margin: 18px 0 8px; }
    .rows { display: flex; flex-direction: column; gap: 8px; font-size: 13px; }
    .row { display: flex; justify-content: space-between; gap: 14px; }
    .row span:first-child { color: #888; flex-shrink: 0; }
    .row span:last-child { color: #1a1a2e; font-weight: 600; text-align: right; overflow-wrap: anywhere; min-width: 0; }
    .hint { font-size: 12px; color: #92400e; background: #fffbeb; border-radius: 10px; padding: 10px 12px; margin-top: 14px; }
    .muted { font-size: 12px; color: #aaa; }
  `],
  template: `
    <div class="overlay" (click)="closed.emit()">
      <div class="modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
        <button type="button" class="close" title="Cerrar" aria-label="Cerrar" (click)="closed.emit()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <p class="title">Detalle del pago</p>
        <div class="amount">{{ amountLabel() }}</div>
        <span class="chip" [class]="'chip chip-' + row().status">{{ row().statusLabel }}</span>

        <p class="section">Suscripción</p>
        <div class="rows">
          <div class="row"><span>Plan</span><span>{{ row().planLabel !== '—' ? row().planLabel : (wompiPlanHint() || '—') }}</span></div>
          <div class="row"><span>Período cubierto</span><span>{{ day(row().periodStart) }} → {{ day(row().periodEnd) }}</span></div>
          <div class="row"><span>Fecha</span><span>{{ dateTime(row().date) }}</span></div>
          <div class="row"><span>Origen</span><span>{{ row().origin }}</span></div>
          @if (row().note) { <div class="row"><span>Nota</span><span>{{ row().note }}</span></div> }
        </div>

        <p class="section">Pago en Wompi</p>
        @if (!row().transactionId) {
          <p class="muted">Este pago se registró sin número de transacción.</p>
        } @else if (loading()) {
          <p class="muted">Consultando a Wompi…</p>
        } @else {
          <div class="rows">
            <div class="row"><span>Transacción</span><span>{{ row().transactionId }}</span></div>
            @if (tx(); as t) {
              <div class="row"><span>Estado en Wompi</span><span>{{ wompiStatus(t.status) }}</span></div>
              <div class="row"><span>Pagó</span><span>{{ t.customerName || row().payerName || '—' }}</span></div>
              <div class="row"><span>Correo</span><span>{{ t.customerEmail || row().payerEmail || '—' }}</span></div>
              <div class="row"><span>Teléfono</span><span>{{ t.customerPhone || row().payerPhone || '—' }}</span></div>
              <div class="row"><span>Medio de pago</span><span>{{ methodLabel(t.paymentMethod || row().paymentMethod) }}</span></div>
              <div class="row"><span>Fecha en Wompi</span><span>{{ iso(t.finalizedAt || t.createdAt) }}</span></div>
              @if (t.status !== 'APPROVED' && t.statusMessage) {
                <div class="row"><span>Mensaje</span><span>{{ t.statusMessage }}</span></div>
              }
            } @else {
              <div class="row"><span>Pagó</span><span>{{ row().payerName || '—' }}</span></div>
              <div class="row"><span>Medio de pago</span><span>{{ methodLabel(row().paymentMethod) }}</span></div>
              <p class="muted">{{ wompiError() || 'Wompi no encontró esta transacción.' }}</p>
            }
          </div>
        }

        @if (row().status === 'to-confirm') {
          <p class="hint">Recibimos el aviso de este pago. Se confirma en breve y tu plan se activa automáticamente al confirmarse.</p>
        }
      </div>
    </div>
  `,
})
export class PaymentDetailModalComponent {
  private wompi = inject(WompiService);
  private appConfig = inject(AppConfigService);

  readonly row    = input.required<HistoryRow>();
  readonly closed = output<void>();

  readonly methodLabel = paymentMethodLabel;

  loading    = signal(false);
  tx         = signal<WompiTransaction | null>(null);
  wompiError = signal('');

  constructor() {
    effect(() => {
      const id = this.row().transactionId;
      this.tx.set(null);
      this.wompiError.set('');
      if (!id) return;
      this.loading.set(true);
      this.wompi.getTransaction(id)
        .then(t => this.tx.set(t))
        .catch(() => this.wompiError.set('No se pudo consultar a Wompi en este momento.'))
        .finally(() => this.loading.set(false));
    });
  }

  amountLabel(): string {
    const stored = this.row().amount;
    if (stored != null) return formatCop(stored);
    const t = this.tx();
    return t ? formatCop(t.amountInCents / 100) : '—';
  }

  /** Para reportes sin confirmar: el plan que corresponde al monto que dice Wompi. */
  wompiPlanHint(): string {
    const t = this.tx();
    const key = t ? planFromAmount(t.amountInCents, t.currency, this.appConfig.plans()) : null;
    return key ? PLANS[key].label : '';
  }

  wompiStatus(s: string): string { return WOMPI_STATUS[s] ?? s; }
  day(d: Date | null): string {
    return d ? d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  }
  dateTime(d: Date | null): string {
    return d ? d.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  }
  iso(v: string | null | undefined): string {
    const d = v ? new Date(v) : null;
    return d && !isNaN(d.getTime()) ? this.dateTime(d) : '—';
  }
}
