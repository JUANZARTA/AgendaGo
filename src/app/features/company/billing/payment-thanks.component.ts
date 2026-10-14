import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CompanyStore } from '../../../core/services/company-store.service';
import { AuthService } from '../../../core/services/auth.service';
import { WompiService } from '../../../core/services/wompi.service';
import { PaymentClaimService } from '../../../core/services/payment-claim.service';
import { AppConfigService } from '../../../core/services/app-config.service';
import { SupportContactComponent } from '../../../shared/components/support-contact.component';
import { BRAND_OWNER } from '../../../core/domain/brand';
import { PLANS, WompiTransaction, formatCop, planFromAmount } from '../../../core/domain/plans';
import { REPORT_FAILED_TEXT, ReportMessage, reportMessage } from '../../../core/domain/payment-report';

type View = 'loading' | 'approved' | 'pending' | 'declined' | 'notfound' | 'error';

const POLL_MS    = 5000;
const POLL_TRIES = 24;   // ~2 minutos

/**
 * Página de vuelta de Wompi (URL de redirección del link de pago): `/empresa/facturacion/gracias?id=<transacción>`.
 * Muestra el estado REAL de la transacción (consultado a Wompi) y deja el reporte para que el admin lo verifique.
 * Sin `id` no tiene sentido: vuelve a Facturación.
 */
@Component({
  selector: 'app-payment-thanks',
  standalone: true,
  imports: [RouterLink, SupportContactComponent],
  styles: [`
    .wrap { min-height: 70vh; display: flex; align-items: center; justify-content: center; padding: 28px 16px; }
    .card {
      width: 100%; max-width: 460px; background: white; border-radius: 20px; padding: 36px 28px;
      text-align: center; box-shadow: 0 12px 40px rgba(0,0,0,.08); animation: pop .35s ease both;
    }
    @keyframes pop { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }
    .icon {
      width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 18px;
      display: flex; align-items: center; justify-content: center;
    }
    .icon--ok      { background: #d1fae5; color: #059669; }
    .icon--wait    { background: var(--btn-secondary-bg); color: var(--purple); }
    .icon--bad     { background: #fee2e2; color: #dc2626; }
    .title { font-size: 1.35rem; font-weight: 800; color: #1a1a2e; margin: 0 0 8px; }
    .text  { font-size: 14px; color: #666; line-height: 1.6; margin: 0 0 20px; }
    .detail {
      background: #f9fafb; border-radius: 12px; padding: 12px 16px; margin: 0 0 22px;
      font-size: 13px; color: #555; text-align: left; display: flex; flex-direction: column; gap: 6px;
    }
    .detail div { display: flex; justify-content: space-between; gap: 12px; }
    .detail span:last-child { font-weight: 700; color: #1a1a2e; text-align: right; word-break: break-all; }
    .owner-note { font-size: 12px; color: #888; line-height: 1.5; margin: -10px 0 20px; }
    .btn-main {
      display: inline-flex; align-items: center; justify-content: center; width: 100%;
      padding: 12px; border-radius: 12px; border: none; background: var(--gradient); color: white;
      font-size: 14px; font-weight: 700; text-decoration: none; cursor: pointer; font-family: inherit;
    }
    .spinner {
      width: 30px; height: 30px; border-radius: 50%; border: 3px solid currentColor; border-right-color: transparent;
      animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .report-msg { font-size: 13px; line-height: 1.5; color: #15803d; margin: -8px 0 16px; }
    .report-msg--bad { color: #dc2626; }
    .btn-retry {
      width: 100%; margin: -6px 0 14px; padding: 10px; border-radius: 12px; border: 1.5px solid #fca5a5;
      background: #fef2f2; color: #b91c1c; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit;
    }
  `],
  template: `
    <div class="wrap">
      <div class="card">
        @switch (view()) {
          @case ('loading') {
            <div class="icon icon--wait"><div class="spinner"></div></div>
            <p class="title">Verificando tu pago…</p>
            <p class="text">Estamos consultando el estado de la transacción con Wompi.</p>
          }
          @case ('approved') {
            <div class="icon icon--ok">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p class="title">¡Gracias por tu pago! 🎉</p>
            <p class="text">
              Recibimos tu pago{{ planLabel() ? ' del plan ' + planLabel() : '' }}.
              Lo estamos confirmando y tu plan se activa en breve. Te avisamos por notificación.
            </p>
          }
          @case ('pending') {
            <div class="icon icon--wait"><div class="spinner"></div></div>
            <p class="title">Tu pago está en proceso…</p>
            <p class="text">
              Wompi todavía lo está procesando (puede pasar con PSE o transferencias).
              @if (polling()) { Esta página se actualiza sola. } @else { Volvé a revisar en unos minutos desde Facturación. }
            </p>
          }
          @case ('declined') {
            <div class="icon icon--bad">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <p class="title">El pago no se completó</p>
            <p class="text">Wompi informa que la transacción fue {{ statusLabel() }}. No se te cobró este intento. Podés intentarlo de nuevo.</p>
          }
          @case ('notfound') {
            <div class="icon icon--bad">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <p class="title">No encontramos esa transacción</p>
            <p class="text">Si pagaste y ves este mensaje, escribinos con el comprobante de Wompi.</p>
            <app-support-contact text="" />
          }
          @case ('error') {
            <div class="icon icon--bad">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <p class="title">No pudimos verificar el pago</p>
            <p class="text">Hubo un problema consultando a Wompi. Si el pago salió bien, se va a confirmar igual: revisá Facturación en unos minutos.</p>
          }
        }

        @if (tx(); as t) {
          <div class="detail">
            <div><span>Transacción</span><span>{{ t.id }}</span></div>
            <div><span>Valor</span><span>{{ fmtCop(t.amountInCents / 100) }}</span></div>
            <div><span>Aparece como</span><span>{{ brandOwner }}</span></div>
          </div>
          <p class="owner-note">El pago aparece a nombre de {{ brandOwner }} (empresa dueña de AgendaCo) en Wompi, Nequi o tu extracto.</p>
        }

        <!-- Resultado del aviso al admin (mismo criterio y textos que "¿Pagaste y no se activó?") -->
        @if (reportMsg(); as m) {
          <p class="report-msg" [class.report-msg--bad]="!m.ok" role="status">{{ m.text }}</p>
          @if (reportFailed()) {
            <button type="button" class="btn-retry" (click)="retryReport()">Reintentar el aviso</button>
          }
        }

        @if (view() !== 'loading') {
          <a class="btn-main" routerLink="/empresa/facturacion">
            {{ view() === 'declined' ? 'Volver a intentar' : 'Ir a Facturación' }}
          </a>
        }
      </div>
    </div>
  `,
})
export class PaymentThanksComponent implements OnDestroy {
  private route     = inject(ActivatedRoute);
  private router    = inject(Router);
  private store     = inject(CompanyStore);
  private auth      = inject(AuthService);
  private wompi     = inject(WompiService);
  private claims    = inject(PaymentClaimService);
  private appConfig = inject(AppConfigService);

  readonly fmtCop = formatCop;
  readonly brandOwner = BRAND_OWNER;

  view    = signal<View>('loading');
  tx      = signal<WompiTransaction | null>(null);
  polling = signal(false);
  /** Resultado del aviso al admin (null = nada que mostrar). */
  reportMsg    = signal<ReportMessage | null>(null);
  reportFailed = signal(false);

  planLabel = computed(() => {
    const t = this.tx();
    const key = t ? planFromAmount(t.amountInCents, t.currency, this.appConfig.plans()) : null;
    return key ? PLANS[key].label : '';
  });

  statusLabel = computed(() => ({ DECLINED: 'rechazada', VOIDED: 'anulada', ERROR: 'con error' } as Record<string, string>)[this.tx()?.status ?? ''] ?? 'rechazada');

  private readonly txId = this.route.snapshot.queryParamMap.get('id');
  private timer: ReturnType<typeof setTimeout> | null = null;
  private tries    = 0;
  private reported = false;

  constructor() {
    if (!this.wompi.isValidTransactionId(this.txId)) {
      // Sólo tiene sentido en la vuelta de Wompi
      this.router.navigate(['/empresa/facturacion'], { replaceUrl: true });
      return;
    }
    this.check();

    // El reporte necesita la empresa cargada: se crea cuando ambas cosas están listas
    effect(() => {
      const t   = this.tx();
      const cid = this.store.companyId();
      if (t && cid && (t.status === 'APPROVED' || t.status === 'PENDING')) this.report(t, cid);
    });
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }

  private async check(): Promise<void> {
    try {
      const t = await this.wompi.getTransaction(this.txId!);
      if (!t) { this.view.set('notfound'); return; }
      this.tx.set(t);
      if (t.status === 'APPROVED') { this.view.set('approved'); this.polling.set(false); return; }
      if (t.status === 'PENDING') {
        this.view.set('pending');
        this.polling.set(++this.tries < POLL_TRIES);
        if (this.polling()) this.timer = setTimeout(() => this.check(), POLL_MS);
        return;
      }
      this.view.set('declined');
    } catch (err) {
      console.error('[PaymentThanks] Error consultando Wompi:', err);
      this.view.set('error');
    }
  }

  /**
   * Deja el reporte para el admin (una vez) y le avisa. Mismo criterio que el formulario: un monto
   * que no es de ningún plan se reporta igual y se avisa. Si falla la red se muestra y se puede reintentar.
   */
  private async report(t: WompiTransaction, companyId: string): Promise<void> {
    if (this.reported) return;
    this.reported = true;
    this.reportFailed.set(false);
    try {
      const matchesPlan = !!planFromAmount(t.amountInCents, t.currency, this.appConfig.plans());
      const r = await this.claims.reportTransaction(
        t, { id: companyId, name: this.store.company()?.name ?? 'Empresa' }, this.auth.currentUser()?.email ?? '');
      // Caso normal (aviso creado y monto de un plan): la tarjeta ya lo dice, no se repite
      this.reportMsg.set(r === 'created' && matchesPlan ? null : reportMessage(r, matchesPlan, t.amountInCents / 100));
    } catch (err) {
      console.error('[PaymentThanks] No se pudo reportar el pago:', err);
      this.reportMsg.set({ ok: false, text: REPORT_FAILED_TEXT });
      this.reportFailed.set(true);
      this.reported = false;
    }
  }

  retryReport(): void {
    const t = this.tx();
    const cid = this.store.companyId();
    if (t && cid) this.report(t, cid);
  }
}
