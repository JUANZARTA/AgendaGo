import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CompanyStore } from '../../../../core/services/company-store.service';
import { AuthService } from '../../../../core/services/auth.service';
import { WompiService } from '../../../../core/services/wompi.service';
import { PaymentClaimService } from '../../../../core/services/payment-claim.service';
import { REPORT_FAILED_TEXT, reportMessage } from '../../../../core/domain/payment-report';
import { AppConfigService } from '../../../../core/services/app-config.service';
import { SupportContactComponent } from '../../../../shared/components/support-contact.component';
import { planFromAmount } from '../../../../core/domain/plans';

/**
 * "¿Pagaste y no se activó?": la empresa ingresa el número de transacción del comprobante que
 * Wompi le mandó por correo (para cuando cerró Wompi sin tocar "Volver al comercio").
 * Crea el mismo reporte que la página de gracias: NO activa nada, el admin lo verifica.
 */
@Component({
  selector: 'app-report-payment',
  standalone: true,
  imports: [FormsModule, SupportContactComponent],
  styles: [`
    :host { display: block; }
    .box {
      background: white; border-radius: 14px; box-shadow: var(--shadow); padding: 16px 18px;
      border-left: 4px solid var(--purple);
    }
    .toggle {
      background: none; border: none; padding: 0; cursor: pointer; font-family: inherit;
      font-size: 14px; font-weight: 700; color: var(--purple); display: flex; align-items: center; gap: 8px;
    }
    .text { font-size: 13px; color: #666; line-height: 1.5; margin: 10px 0 12px; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; }
    input {
      flex: 1; min-width: 220px; padding: 10px 12px; border: 1.5px solid #e5e7eb; border-radius: 10px;
      font-size: 14px; font-family: inherit;
    }
    input:focus { outline: none; border-color: var(--purple); }
    .btn {
      padding: 10px 16px; border-radius: 10px; border: none; background: var(--gradient); color: white;
      font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; white-space: nowrap;
    }
    .btn:disabled { opacity: .5; cursor: default; }
    .msg { font-size: 13px; margin: 10px 0 0; }
    .ok  { color: #15803d; }
    .bad { color: #dc2626; }
  `],
  template: `
    <div class="box">
      <button class="toggle" (click)="open.set(!open())">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        ¿Pagaste y tu plan no se activó?
      </button>

      @if (open()) {
        <p class="text">
          Ingresá el <strong>número de transacción</strong> del comprobante que Wompi te mandó por correo
          (ej. 12103138-1791998438-62813). Lo verificamos y activamos tu plan.
        </p>
        <div class="row">
          <input [(ngModel)]="txId" placeholder="Número de transacción" (keyup.enter)="send()" />
          <button class="btn" (click)="send()" [disabled]="!txId.trim() || busy()">
            {{ busy() ? 'Verificando…' : 'Avisar mi pago' }}
          </button>
        </div>
        @if (message(); as m) {
          <p class="msg" [class.ok]="m.ok" [class.bad]="!m.ok">{{ m.text }}</p>
          @if (!m.ok) {
            <div style="margin-top:8px"><app-support-contact align="left" /></div>
          }
        }
      }
    </div>
  `,
})
export class ReportPaymentComponent {
  private store  = inject(CompanyStore);
  private auth   = inject(AuthService);
  private wompi  = inject(WompiService);
  private claims = inject(PaymentClaimService);
  private appConfig = inject(AppConfigService);

  open    = signal(false);
  busy    = signal(false);
  message = signal<{ ok: boolean; text: string } | null>(null);
  txId    = '';

  async send(): Promise<void> {
    const id = this.txId.trim();
    const companyId = this.store.companyId();
    this.message.set(null);
    if (!companyId) return;
    if (!this.wompi.isValidTransactionId(id)) {
      this.message.set({ ok: false, text: 'Ese no parece un número de transacción de Wompi. Copialo tal cual del comprobante.' });
      return;
    }
    this.busy.set(true);
    try {
      const t = await this.wompi.getTransaction(id);
      if (!t) { this.message.set({ ok: false, text: 'Wompi no encontró esa transacción. Revisá el número.' }); return; }
      if (t.status !== 'APPROVED' && t.status !== 'PENDING') {
        this.message.set({ ok: false, text: 'Wompi informa que ese pago no se completó, así que no se te cobró. Podés intentarlo de nuevo.' });
        return;
      }
      // Mismo criterio que la página de gracias: un monto que no es de ningún plan se reporta IGUAL
      // (la plata ya se cobró) y el admin lo revisa a mano.
      const matchesPlan = !!planFromAmount(t.amountInCents, t.currency, this.appConfig.plans());
      const r = await this.claims.reportTransaction(
        t, { id: companyId, name: this.store.company()?.name ?? 'Empresa' }, this.auth.currentUser()?.email ?? '');
      this.message.set(reportMessage(r, matchesPlan, t.amountInCents / 100));
      if (r === 'created') this.txId = '';
    } catch (err) {
      // Red / Firestore: el aviso NO quedó guardado
      console.error('[ReportPayment] Error:', err);
      this.message.set({ ok: false, text: REPORT_FAILED_TEXT });
    } finally {
      this.busy.set(false);
    }
  }
}
