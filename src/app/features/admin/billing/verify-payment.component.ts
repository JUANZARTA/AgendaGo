import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminSub } from './admin-billing.models';
import { WompiService } from '../../../core/services/wompi.service';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { PaymentClaimService } from '../../../core/services/payment-claim.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AppConfigService } from '../../../core/services/app-config.service';
import {
  PaymentCheck, WompiTransaction, checkWompiPayment, formatCop, nextPeriodEnd, paymentMethodLabel,
} from '../../../core/domain/plans';

/**
 * "Verificar un pago" (admin): para pagos que NO llegaron como reporte (la empresa cerró Wompi
 * sin volver, se le cerró la sesión, pagó otra persona…). Con el número de transacción del
 * comprobante se consulta a Wompi, se elige la empresa y se registra igual que un reporte.
 * La API pública de Wompi sólo busca por id (buscar por correo o referencia requiere la llave privada).
 */
@Component({
  selector: 'app-verify-payment',
  standalone: true,
  imports: [FormsModule],
  styles: [`
    .overlay {
      position: fixed; inset: 0; z-index: 1100; background: rgba(0,0,0,.45);
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .modal {
      width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; background: white;
      border-radius: 18px; padding: 26px 24px; box-shadow: 0 16px 48px rgba(0,0,0,.18); position: relative;
    }
    .close {
      position: absolute; top: 14px; right: 14px; width: 32px; height: 32px; border-radius: 8px;
      border: none; background: none; color: #9ca3af; cursor: pointer; font-size: 20px; line-height: 1;
    }
    .title { font-size: 1.1rem; font-weight: 800; color: #1a1a2e; margin: 0 0 4px; }
    .sub { font-size: 13px; color: #888; margin: 0 0 18px; line-height: 1.5; }
    .row { display: flex; gap: 8px; }
    input, select {
      width: 100%; padding: 10px 12px; border: 1.5px solid #ddd; border-radius: 10px;
      font-size: 14px; font-family: inherit; box-sizing: border-box;
    }
    .btn {
      padding: 10px 16px; border-radius: 10px; border: none; font-size: 13px; font-weight: 700;
      cursor: pointer; font-family: inherit; white-space: nowrap;
    }
    .btn:disabled { opacity: .5; cursor: default; }
    .btn-search   { background: var(--gradient); color: white; }
    .btn-activate { background: #16a34a; color: white; width: 100%; margin-top: 14px; padding: 12px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 8px; margin-top: 16px; font-size: 12px; }
    .grid div { background: #f9fafb; border-radius: 8px; padding: 8px 10px; color: #888; }
    .grid b { display: block; font-size: 13px; color: #1a1a2e; margin-top: 2px; word-break: break-all; }
    .ok   { color: #15803d !important; }
    .bad  { color: #dc2626 !important; }
    .warn { color: #b45309; font-size: 12px; }
    .label { font-size: 12px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: .05em; margin: 16px 0 6px; display: block; }
    .msg { font-size: 13px; margin-top: 12px; }
    .done { background: #f0fdf4; color: #166534; border-radius: 10px; padding: 12px; font-size: 13px; margin-top: 14px; }
    @media (max-width: 480px) {
      .modal { padding: 22px 18px; }
      .row { flex-direction: column; }
    }
  `],
  template: `
    <div class="overlay" (click)="closed.emit()">
      <div class="modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
        <button class="close" title="Cerrar" aria-label="Cerrar" (click)="closed.emit()">×</button>

        <p class="title">Verificar un pago</p>
        <p class="sub">
          Para pagos que no aparecen en "Pagos por confirmar". Pegá el <strong>número de transacción</strong>
          del comprobante de Wompi (ej. 12103138-1791998238-22034).
        </p>

        <div class="row">
          <input [(ngModel)]="txId" placeholder="Número de transacción" (keyup.enter)="search()" />
          <button class="btn btn-search" (click)="search()" [disabled]="!txId.trim() || busy()">
            {{ busy() ? 'Consultando…' : 'Buscar en Wompi' }}
          </button>
        </div>

        @if (error()) { <p class="msg bad">{{ error() }}</p> }

        @if (tx(); as t) {
          <div class="grid">
            <div>Wompi dice
              <b [class.ok]="check()?.ok" [class.bad]="!check()?.ok">{{ check()?.ok ? '✅ Aprobada' : '❌ ' + reason() }}</b>
            </div>
            <div>Valor <b>{{ fmtCop(t.amountInCents / 100) }}</b></div>
            <div>Plan <b>{{ planLabel() || '—' }}</b></div>
            <div>Fecha del pago <b>{{ iso(t.finalizedAt || t.createdAt) }}</b></div>
            <div>Pagó <b>{{ t.customerName || '—' }}</b></div>
            <div>Correo <b>{{ t.customerEmail || '—' }}</b></div>
            <div>Teléfono <b>{{ t.customerPhone || '—' }}</b></div>
            <div>Medio <b>{{ methodLabel(t.paymentMethod) }}</b></div>
          </div>

          @if (check()?.ok && !done()) {
            <label class="label">¿De qué empresa es este pago?</label>
            <select [ngModel]="companyId()" (ngModelChange)="companyId.set($event)">
              <option value="">Elegí la empresa…</option>
              @for (s of companies(); track s.companyId) {
                <option [value]="s.companyId">{{ s.companyName }} — {{ s.ownerEmail }}</option>
              }
            </select>
            @if (emailMatch()) {
              <p class="warn" style="color:#15803d">El correo del pago coincide con la cuenta de {{ emailMatch()!.companyName }}: la preseleccioné.</p>
            } @else if (companyId()) {
              <p class="warn">El correo del pago no coincide con el de esta empresa. Confirmá con la empresa antes de activar.</p>
            }
            @if (period(); as p) {
              <p class="msg">Va a cubrir <strong>{{ day(p.start) }} → {{ day(p.end) }}</strong>.</p>
            }
            <button class="btn btn-activate" (click)="activate()" [disabled]="!companyId() || busy()">
              {{ busy() ? 'Registrando…' : 'Registrar pago y activar plan' }}
            </button>
          }

          @if (done()) { <div class="done">{{ done() }}</div> }
        }
      </div>
    </div>
  `,
})
export class VerifyPaymentComponent {
  private wompi    = inject(WompiService);
  private subSvc   = inject(SubscriptionService);
  private claimSvc = inject(PaymentClaimService);
  private notifSvc = inject(NotificationService);
  private appConfig = inject(AppConfigService);
  /** Catálogo con monto/días configurados (config/app). */
  private get plans() { return this.appConfig.plans(); }

  readonly companies = input.required<AdminSub[]>();
  readonly closed    = output<void>();

  readonly fmtCop      = formatCop;
  readonly methodLabel = paymentMethodLabel;

  txId      = '';
  busy      = signal(false);
  error     = signal('');
  done      = signal('');
  tx        = signal<WompiTransaction | null>(null);
  companyId = signal('');

  check     = computed<PaymentCheck | null>(() => { const t = this.tx(); return t ? checkWompiPayment(t, this.plans) : null; });
  planLabel = computed(() => { const c = this.check(); return c?.ok ? `${this.plans[c.plan].label} (${formatCop(this.plans[c.plan].amount)})` : ''; });
  /** Empresa cuyo correo de cuenta coincide con el de quien pagó. */
  emailMatch = computed(() => {
    const email = this.tx()?.customerEmail?.trim().toLowerCase();
    if (!email) return null;
    const match = this.companies().find(s => s.ownerEmail?.trim().toLowerCase() === email);
    return match && match.companyId === this.companyId() ? match : null;
  });
  period = computed(() => {
    const c = this.check();
    const sub = this.companies().find(s => s.companyId === this.companyId());
    if (!c?.ok || !sub) return null;
    const currentEnd = sub.status === 'active' && sub.periodEndMs ? new Date(sub.periodEndMs) : null;
    return nextPeriodEnd(currentEnd, this.plans[c.plan].days);
  });

  reason(): string { const c = this.check(); return c && !c.ok ? c.reason : ''; }

  async search(): Promise<void> {
    const id = this.txId.trim();
    this.error.set(''); this.done.set(''); this.tx.set(null); this.companyId.set('');
    if (!this.wompi.isValidTransactionId(id)) { this.error.set('Ese no parece un número de transacción de Wompi.'); return; }
    this.busy.set(true);
    try {
      const t = await this.wompi.getTransaction(id);
      if (!t) { this.error.set('Wompi no encontró esa transacción.'); return; }
      this.tx.set(t);
      // Preseleccionar la empresa si el correo del pago es el de su cuenta
      const email = t.customerEmail?.trim().toLowerCase();
      const match = email ? this.companies().find(s => s.ownerEmail?.trim().toLowerCase() === email) : null;
      if (match) this.companyId.set(match.companyId);
    } catch {
      this.error.set('No se pudo consultar a Wompi. Intentá de nuevo.');
    } finally {
      this.busy.set(false);
    }
  }

  /** Re-consulta a Wompi y registra (mismo camino que "Pagos por confirmar"; el id evita duplicados). */
  async activate(): Promise<void> {
    const sub = this.companies().find(s => s.companyId === this.companyId());
    const id  = this.tx()?.id;
    if (!sub || !id) return;
    this.busy.set(true); this.error.set('');
    try {
      const t = await this.wompi.getTransaction(id);
      const c = t ? checkWompiPayment(t, this.plans) : null;
      if (!t || !c?.ok) { this.error.set(`No se activó: ${c && !c.ok ? c.reason : 'Wompi no encontró la transacción'}`); return; }

      const plan = this.plans[c.plan];
      const r = await this.subSvc.registerManualPayment(sub.companyId, plan.key, t.id, {
        payerName: t.customerName, payerEmail: t.customerEmail, payerPhone: t.customerPhone,
        paymentMethod: t.paymentMethod, paidAt: t.finalizedAt ?? t.createdAt,
      });
      // Si la empresa también lo había reportado, cerrar ese reporte
      await this.claimSvc.close(t.id, 'registered', 'Verificado por número de transacción').catch(() => {});
      if (r.ownerId && !r.disabled) {
        this.notifSvc.create({
          recipientId: r.ownerId,
          type:        'plan_changed',
          title:       '¡Pago confirmado!',
          body:        `Tu plan ${plan.label} fue activado. Válido hasta el ${r.periodEnd.toLocaleDateString('es-CO')}.`,
          link:        '/empresa/facturacion',
        }).catch(() => {});
      }
      this.done.set(r.disabled
        ? `Pago registrado a ${sub.companyName}, pero la cuenta está deshabilitada: no se reactivó.`
        : `✅ Pago registrado. ${sub.companyName} queda activa hasta el ${this.day(r.periodEnd)}.`);
    } catch (err: any) {
      this.error.set(err?.message === 'DUPLICATE_PAYMENT'
        ? 'Ese pago ya estaba registrado: no se registró de nuevo.'
        : 'No se pudo registrar el pago. Intentá de nuevo.');
    } finally {
      this.busy.set(false);
    }
  }

  day(d: Date): string { return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }); }
  iso(v: string | null | undefined): string {
    const d = v ? new Date(v) : null;
    return d && !isNaN(d.getTime()) ? d.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  }
}
