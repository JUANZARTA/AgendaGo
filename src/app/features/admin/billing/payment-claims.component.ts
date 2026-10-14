import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PaymentClaim, PaymentClaimService } from '../../../core/services/payment-claim.service';
import { WompiService } from '../../../core/services/wompi.service';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AppConfigService } from '../../../core/services/app-config.service';
import { CompanyService } from '../../../core/services/company.service';
import { UserService } from '../../../core/services/user.service';
import {
  PLANS, PaymentCheck, WompiTransaction, formatCop, nextPeriodEnd, paymentMethodLabel,
} from '../../../core/domain/plans';

/** Resultado de verificar un reporte contra Wompi (en el navegador del admin). */
interface Verification {
  tx: WompiTransaction | null;
  check: PaymentCheck;
  /** Período que cubriría si se activa. */
  period: { start: Date; end: Date } | null;
  /** El correo de quien pagó en Wompi coincide con el de la cuenta de la empresa. */
  emailMatches: boolean;
  /** Correo REAL del dueño (users/{ownerId}); el ownerEmail del reporte lo escribe la empresa. */
  accountEmail: string | null;
  /** El reporte trae un ownerEmail distinto al de la cuenta: posible reporte manipulado. */
  claimEmailMismatch: boolean;
}

/**
 * "Pagos por confirmar": reportes que dejan las empresas al volver de Wompi.
 * El admin verifica cada transacción contra la API pública de Wompi y recién ahí activa el plan.
 */
@Component({
  selector: 'app-payment-claims',
  standalone: true,
  styles: [`
    :host { display: block; }
    .box { background: white; border: 1.5px solid #fde68a; border-radius: 14px; padding: 18px; margin-bottom: 24px; }
    .head { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 800; color: #92400e; margin: 0 0 14px; }
    .count { background: #f59e0b; color: white; border-radius: 99px; font-size: 11px; padding: 1px 8px; }
    .claim { border: 1.5px solid #f3f4f6; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    .claim + .claim { margin-top: 10px; }
    .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .name { font-weight: 800; color: #1a1a2e; font-size: 14px; }
    .meta { font-size: 12px; color: #888; word-break: break-all; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; font-size: 12px; }
    .grid div { background: #f9fafb; border-radius: 8px; padding: 8px 10px; }
    .grid b { display: block; font-size: 13px; color: #1a1a2e; margin-top: 2px; word-break: break-all; }
    .ok   { color: #15803d; }
    .bad  { color: #dc2626; }
    .warn { color: #b45309; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn {
      padding: 8px 14px; border-radius: 9px; border: none; font-size: 12px; font-weight: 700;
      cursor: pointer; font-family: inherit;
    }
    .btn:disabled { opacity: .5; cursor: default; }
    .btn-verify   { background: var(--btn-secondary-bg); color: var(--purple); }
    .btn-activate { background: #16a34a; color: white; }
    .btn-discard  { background: none; color: #9ca3af; border: 1.5px solid #e5e7eb; }
  `],
  template: `
    @if (claims().length > 0) {
      <div class="box">
        <p class="head">Pagos por confirmar <span class="count">{{ claims().length }}</span></p>

        @for (c of claims(); track c.transactionId) {
          <div class="claim">
            <div class="row">
              <div>
                <div class="name">{{ c.companyName }}</div>
                <div class="meta">Transacción {{ c.transactionId }} · reportado {{ fmtDate(c.createdAt) }}</div>
                @if (c.amount != null) {
                  <div class="meta">
                    {{ fmtCop(c.amount) }}{{ c.plan ? ' · plan ' + planName(c.plan) : '' }}
                    {{ c.payerName ? ' · ' + c.payerName : '' }}{{ c.paymentMethod ? ' · ' + methodLabel(c.paymentMethod) : '' }}
                  </div>
                }
              </div>
              @if (!verifications()[c.transactionId]) {
                <button class="btn btn-verify" (click)="verify(c)" [disabled]="busy() === c.transactionId">
                  {{ busy() === c.transactionId ? 'Consultando Wompi...' : 'Verificar en Wompi' }}
                </button>
              }
            </div>

            @if (verifications()[c.transactionId]; as v) {
              <div class="grid">
                <div>Wompi dice
                  <b [class.ok]="v.check.ok" [class.bad]="!v.check.ok">
                    {{ v.tx ? (v.check.ok ? '✅ Aprobada' : '❌ ' + reason(v.check)) : '❌ No existe en Wompi' }}
                  </b>
                </div>
                @if (v.tx) {
                  <div>Valor <b>{{ fmtCop(v.tx.amountInCents / 100) }}</b></div>
                  <div>Pagó <b>{{ v.tx.customerName || '—' }}</b></div>
                  <div>Correo
                    <b [class.warn]="!v.emailMatches">{{ v.tx.customerEmail || '—' }}</b>
                    @if (!v.emailMatches) { <span class="warn">Distinto a {{ v.accountEmail || 'la cuenta' }}: confirmá con la empresa</span> }
                  </div>
                  @if (v.claimEmailMismatch) {
                    <div><b class="bad">⚠ El reporte dice {{ c.ownerEmail || '—' }}, pero la cuenta es {{ v.accountEmail }}. Posible reporte manipulado.</b></div>
                  }
                  <div>Teléfono <b>{{ v.tx.customerPhone || '—' }}</b></div>
                  <div>Medio de pago <b>{{ methodLabel(v.tx.paymentMethod) }}</b></div>
                  <div>Fecha del pago <b>{{ fmtIso(v.tx.finalizedAt || v.tx.createdAt) }}</b></div>
                }
                @if (v.check.ok && v.period) {
                  <div>Plan <b>{{ planLabel(v.check) }}</b></div>
                  <div>Cubre <b>{{ fmtDay(v.period.start) }} → {{ fmtDay(v.period.end) }}</b></div>
                }
              </div>
            }

            @if (errors()[c.transactionId]) {
              <div class="meta bad">{{ errors()[c.transactionId] }}</div>
            }

            <div class="actions">
              @if (verifications()[c.transactionId]?.check?.ok) {
                <button class="btn btn-activate" (click)="activate(c)" [disabled]="busy() === c.transactionId">
                  {{ busy() === c.transactionId ? 'Activando...' : 'Activar plan' }}
                </button>
              }
              <button class="btn btn-discard" (click)="discard(c)" [disabled]="busy() === c.transactionId">Descartar</button>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class PaymentClaimsComponent {
  private claimSvc = inject(PaymentClaimService);
  private wompi    = inject(WompiService);
  private subSvc   = inject(SubscriptionService);
  private notifSvc = inject(NotificationService);
  private appConfig = inject(AppConfigService);
  private companySvc = inject(CompanyService);
  private userSvc    = inject(UserService);
  /** Catálogo con monto/días configurados (config/app). */
  private get plans() { return this.appConfig.plans(); }

  readonly fmtCop = formatCop;

  /** Si se indica, sólo muestra los reportes de esa empresa (detalle de "Gestionar"). */
  readonly companyId = input<string | null>(null);

  private allClaims = signal<PaymentClaim[]>([]);
  claims = computed(() => {
    const cid = this.companyId();
    return cid ? this.allClaims().filter(c => c.companyId === cid) : this.allClaims();
  });
  verifications = signal<Record<string, Verification>>({});
  errors        = signal<Record<string, string>>({});
  busy          = signal<string | null>(null);

  constructor() {
    this.claimSvc.watchPending()
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe({
        next: list => this.allClaims.set(list),
        error: err => console.error('[PaymentClaims] Error cargando reportes:', err),
      });
  }

  async verify(c: PaymentClaim): Promise<void> {
    this.busy.set(c.transactionId);
    this.setError(c.transactionId, '');
    try {
      // Verificación completa: estado, monto, NUESTRO comercio y entorno de producción
      const { tx, check } = await this.wompi.verify(c.transactionId, this.plans);
      let period: Verification['period'] = null;
      if (check.ok) {
        const sub = await this.subSvc.getStatus(c.companyId);
        const currentEnd = sub?.status === 'active' && sub.currentPeriodEnd?.toDate ? sub.currentPeriodEnd.toDate() : null;
        period = nextPeriodEnd(currentEnd, this.plans[check.plan].days);
      }
      // Se compara contra el correo REAL de la cuenta, no contra el que vino en el reporte
      const norm = (e: string | null | undefined) => (e ?? '').trim().toLowerCase();
      const accountEmail = await this.accountEmailOf(c.companyId);
      const emailMatches = !!tx?.customerEmail && !!accountEmail && norm(tx.customerEmail) === norm(accountEmail);
      const claimEmailMismatch = !!accountEmail && norm(c.ownerEmail) !== norm(accountEmail);
      this.verifications.update(v => ({
        ...v, [c.transactionId]: { tx, check, period, emailMatches, accountEmail, claimEmailMismatch },
      }));
    } catch (err) {
      console.error('[PaymentClaims] Error consultando Wompi:', err);
      this.setError(c.transactionId, 'No se pudo consultar Wompi. Intentá de nuevo.');
    } finally {
      this.busy.set(null);
    }
  }

  /** Re-verifica contra Wompi justo antes de activar (el estado pudo cambiar) y registra el pago. */
  async activate(c: PaymentClaim): Promise<void> {
    this.busy.set(c.transactionId);
    this.setError(c.transactionId, '');
    try {
      const { tx, check } = await this.wompi.verify(c.transactionId, this.plans);
      if (!check.ok) { this.setError(c.transactionId, `No se activó: ${check.reason}`); return; }

      const plan = this.plans[check.plan];
      const r = await this.subSvc.registerManualPayment(c.companyId, plan.key, c.transactionId, {
        payerName:     tx!.customerName,
        payerEmail:    tx!.customerEmail,
        payerPhone:    tx!.customerPhone,
        paymentMethod: tx!.paymentMethod,
        paidAt:        tx!.finalizedAt ?? tx!.createdAt,
        wompiEnv:      tx!.env,
        paymentLinkId: tx!.paymentLinkId,
      });
      await this.claimSvc.close(c.transactionId, 'registered');
      if (r.ownerId && !r.disabled) {
        this.notifSvc.create({
          recipientId: r.ownerId,
          type:        'plan_changed',
          title:       '¡Pago confirmado!',
          body:        `Tu plan ${plan.label} fue activado. Válido hasta el ${r.periodEnd.toLocaleDateString('es-CO')}.`,
          link:        '/empresa/facturacion',
        }).catch(err => console.error('[PaymentClaims] No se pudo notificar a la empresa:', err));
      }
      if (r.disabled) alert('El pago quedó registrado, pero la cuenta está deshabilitada: no se reactivó.');
    } catch (err: any) {
      console.error('[PaymentClaims] Error activando:', err);
      if (err?.message === 'DUPLICATE_PAYMENT') {
        // Ya estaba registrado (ej. a mano desde el modal): cerrar el reporte
        await this.claimSvc.close(c.transactionId, 'registered', 'Ya estaba registrado').catch(() => {});
      } else if (err?.message === 'SANDBOX_BUILD') {
        this.setError(c.transactionId, 'Este build consulta el SANDBOX de Wompi: no puede activar planes contra la base real. Usá la app publicada.');
      } else {
        this.setError(c.transactionId, 'No se pudo activar el plan. Intentá de nuevo.');
      }
    } finally {
      this.busy.set(null);
    }
  }

  /** Correo de la cuenta dueña de la empresa (lectura de superadmin). null si no se pudo averiguar. */
  private async accountEmailOf(companyId: string): Promise<string | null> {
    try {
      const ownerId = (await this.companySvc.getCompany(companyId))?.ownerId;
      return ownerId ? (await this.userSvc.getProfile(ownerId))?.email ?? null : null;
    } catch {
      return null;
    }
  }

  async discard(c: PaymentClaim): Promise<void> {
    if (!confirm(`¿Descartar el reporte de ${c.companyName}? No se activa ningún plan.`)) return;
    this.busy.set(c.transactionId);
    try {
      await this.claimSvc.close(c.transactionId, 'rejected', 'Descartado por el admin');
    } catch (err) {
      console.error('[PaymentClaims] Error descartando:', err);
      this.setError(c.transactionId, 'No se pudo descartar.');
    } finally {
      this.busy.set(null);
    }
  }

  readonly methodLabel = paymentMethodLabel;
  planName(plan: string): string { return PLANS[plan as keyof typeof PLANS]?.label ?? plan; }

  reason(check: PaymentCheck): string { return check.ok ? '' : check.reason; }
  planLabel(check: PaymentCheck): string {
    return check.ok ? `${this.plans[check.plan].label} (${formatCop(this.plans[check.plan].amount)})` : '';
  }

  fmtDay(d: Date): string { return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }); }
  fmtIso(iso: string): string { return iso ? new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—'; }
  fmtDate(ts: any): string { return ts?.toDate ? this.fmtIso(ts.toDate().toISOString()) : 'recién'; }

  private setError(id: string, msg: string) { this.errors.update(e => ({ ...e, [id]: msg })); }
}
