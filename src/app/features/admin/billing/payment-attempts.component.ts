import { Component, DestroyRef, computed, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Firestore, collection, onSnapshot } from '@angular/fire/firestore';
import { PaymentAttempt, PaymentClaim, PaymentClaimService } from '../../../core/services/payment-claim.service';
import { PLANS, formatCop } from '../../../core/domain/plans';

/** Margen: un reporte/pago creado poco antes del intento (relojes distintos) igual lo cubre. */
const SKEW_MS = 60_000;
/** Intentos más viejos no se muestran (Wompi ya los habría liquidado o vencido). */
const MAX_AGE_MS = 45 * 24 * 3600_000;

/**
 * "Intentos de pago sin reporte": la empresa tocó "Pagar" y NO llegó ni reporte ni pago después.
 * Puede que haya pagado y cerrado Wompi sin volver. El admin busca en Wompi → Transacciones por
 * empresa, monto y hora, y lo registra con "Verificar un pago".
 */
@Component({
  selector: 'app-payment-attempts',
  standalone: true,
  styles: [`
    :host { display: block; }
    .box { background: white; border: 1.5px solid #fed7aa; border-radius: 14px; padding: 18px; margin-bottom: 24px; }
    .head { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 800; color: #9a3412; margin: 0 0 4px; }
    .count { background: #f97316; color: white; border-radius: 99px; font-size: 11px; padding: 1px 8px; }
    .sub { font-size: 12px; color: #9a3412; margin: 0 0 12px; opacity: .85; }
    .item {
      display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;
      border: 1.5px solid #f3f4f6; border-radius: 12px; padding: 12px 14px;
    }
    .item + .item { margin-top: 8px; }
    .name { font-weight: 800; color: #1a1a2e; font-size: 14px; }
    .meta { font-size: 12px; color: #666; margin-top: 2px; }
    .actions { display: flex; gap: 8px; }
    .btn { padding: 8px 14px; border-radius: 9px; border: none; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; }
    .btn-find    { background: var(--btn-secondary-bg); color: var(--purple); }
    .btn-dismiss { background: none; color: #9ca3af; border: 1.5px solid #e5e7eb; }
  `],
  template: `
    @if (pending().length > 0) {
      <div class="box">
        <p class="head">Intentos de pago sin reporte <span class="count">{{ pending().length }}</span></p>
        <p class="sub">Abrieron el pago y no volvieron a la app. Buscalos en Wompi → Transacciones por monto y hora.</p>

        @for (a of pending(); track a.id) {
          <div class="item">
            <div>
              <div class="name">{{ a.companyName }}</div>
              <div class="meta">
                Plan {{ planLabel(a.plan) }} · <strong>{{ fmtCop(a.amount) }}</strong> ·
                abrió el pago el <strong>{{ when(a.createdAt) }}</strong> ({{ ago(a.createdAt) }})
              </div>
            </div>
            <div class="actions">
              <button class="btn btn-find" (click)="verify.emit()">Ya lo encontré en Wompi</button>
              <button class="btn btn-dismiss" (click)="dismiss(a)">Descartar</button>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class PaymentAttemptsComponent {
  private claimSvc  = inject(PaymentClaimService);
  private firestore = inject(Firestore);

  /** Abre "Verificar un pago" (lo maneja la página de facturación). */
  readonly verify = output<void>();

  readonly fmtCop = formatCop;

  private attempts = signal<PaymentAttempt[]>([]);
  private claims   = signal<PaymentClaim[]>([]);
  private payments = signal<{ companyId: string; createdAt?: any }[]>([]);

  /** Intentos sin un reporte ni un pago posterior de la misma empresa. */
  pending = computed(() => {
    const now = Date.now();
    const latest = new Map<string, number>();
    const bump = (cid: string, ts: any) => {
      const ms = ms_(ts);
      if (ms) latest.set(cid, Math.max(latest.get(cid) ?? 0, ms));
    };
    this.claims().forEach(c => bump(c.companyId, c.createdAt));
    this.payments().forEach(p => bump(p.companyId, p.createdAt));

    return this.attempts()
      .filter(a => {
        const at = ms_(a.createdAt);
        if (!at || now - at > MAX_AGE_MS) return false;
        return (latest.get(a.companyId) ?? 0) < at - SKEW_MS;
      })
      .sort((x, y) => ms_(y.createdAt) - ms_(x.createdAt));
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.claimSvc.watchOpenAttempts().pipe(takeUntilDestroyed(destroyRef)).subscribe({
      next: list => this.attempts.set(list),
      error: err => console.error('[PaymentAttempts] Error cargando intentos:', err),
    });
    this.claimSvc.watchAll().pipe(takeUntilDestroyed(destroyRef)).subscribe({
      next: list => this.claims.set(list),
      error: err => console.error('[PaymentAttempts] Error cargando reportes:', err),
    });
    const unsub = onSnapshot(collection(this.firestore, 'payments'),
      snap => this.payments.set(snap.docs.map(d => d.data() as { companyId: string; createdAt?: any })),
      err => console.error('[PaymentAttempts] Error cargando pagos:', err));
    destroyRef.onDestroy(unsub);
  }

  async dismiss(a: PaymentAttempt): Promise<void> {
    if (!a.id) return;
    if (!confirm(`¿Descartar el intento de ${a.companyName}? Hacelo sólo si confirmaste que no pagó.`)) return;
    await this.claimSvc.dismissAttempt(a.id).catch(err => console.error('[PaymentAttempts] Error descartando:', err));
  }

  planLabel(plan: string): string { return PLANS[plan as keyof typeof PLANS]?.label ?? plan; }

  when(ts: any): string {
    const ms = ms_(ts);
    return ms ? new Date(ms).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  }

  ago(ts: any): string {
    const min = Math.floor((Date.now() - ms_(ts)) / 60_000);
    if (min < 60) return `hace ${min} min`;
    if (min < 1440) return `hace ${Math.floor(min / 60)} h`;
    return `hace ${Math.floor(min / 1440)} d`;
  }
}

function ms_(ts: any): number {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.seconds === 'number') return ts.seconds * 1000;
  return 0;
}
