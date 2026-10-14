import { Component, input } from '@angular/core';
import { SubViewModel } from '../billing.models';

/** Banner de estado de la suscripción (cargando / error / estado actual). Presentacional. */
@Component({
  selector: 'app-billing-status-card',
  standalone: true,
  styles: [`
    :host { display: contents; }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: .6; }
    }

    /* ── Loading ── */
    .loading-banner {
      border-radius: 16px;
      padding: 24px 28px;
      background: #f8f9fa;
      border: 2px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;
      animation: pulse 1.5s ease infinite;
    }
    .loading-text { font-size: 14px; color: #888; }

    /* ── Status banner ── */
    .status-banner {
      border-radius: 16px;
      padding: 24px 28px;
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
      margin-bottom: 32px;
      animation: fadeInUp .4s ease both;
    }
    .status-banner.trial    { background: linear-gradient(135deg,#fffbeb,#fff7ed); border: 2px solid #fde68a; }
    .status-banner.active   { background: linear-gradient(135deg,#d1fae5,#ecfdf5); border: 2px solid #6ee7b7; }
    .status-banner.expired  { background: linear-gradient(135deg,#fee2e2,#fff5f5); border: 2px solid #fca5a5; }
    .status-banner.disabled { background: #f1f5f9; border: 2px solid #e2e8f0; }
    .status-banner.free     { background: linear-gradient(135deg,#f5f3ff,#fdf4ff); border: 2px solid #e9d5ff; }

    .status-icon {
      width: 56px; height: 56px;
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .status-icon.trial    { background: #fef3c7; color: #92400e; }
    .status-icon.active   { background: #d1fae5; color: #065f46; }
    .status-icon.expired  { background: #fee2e2; color: #991b1b; }
    .status-icon.free     { background: #f5f3ff; color: #6d28d9; font-size: 26px; line-height: 1; }
    .status-icon.disabled { background: #e2e8f0; color: #64748b; }

    .status-body { flex: 1; min-width: 0; }
    .status-label { font-size: 1rem; font-weight: 800; margin: 0 0 4px; }
    .status-desc  { font-size: 13px; color: #666; margin: 0; }

    .days-pill {
      display: flex; flex-direction: column; align-items: center;
      padding: 12px 22px; border-radius: 14px; flex-shrink: 0;
    }
    .days-pill.trial   { background: #fef3c7; }
    .days-pill.active  { background: #d1fae5; }
    .days-pill.expired { background: #fee2e2; }
    .days-number { font-size: 2rem; font-weight: 900; line-height: 1; }
    .days-number.trial   { color: #92400e; }
    .days-number.active  { color: #065f46; }
    .days-number.expired { color: #991b1b; }
    .days-label { font-size: 11px; font-weight: 600; color: #888; margin-top: 2px; text-align: center; }
    @media (max-width: 640px) {
      .status-banner { padding: 18px 16px; }
    }
  `],
  template: `
  @if (loading()) {
    <!-- ── LOADING STATE ── -->
    <div class="loading-banner">
      <span class="loading-text">Cargando información de suscripción...</span>
    </div>
  } @else if (loadError() || noSubscription()) {
    <!-- ── SIN SUSCRIPCIÓN / ERROR ── -->
    <div class="status-banner disabled">
      <div class="status-body">
        <p class="status-label">
          {{ loadError() ? 'No pudimos cargar tu suscripción' : 'Todavía no tenés una suscripción registrada' }}
        </p>
        <p class="status-desc">
          {{ loadError()
              ? 'Revisá tu conexión y recargá la página. Si el problema continúa, contactá a soporte.'
              : 'Podés elegir un plan abajo para activar tu cuenta. Si creés que es un error, contactá a soporte.' }}
        </p>
      </div>
    </div>
  } @else {
    <!-- ── BANNER DE ESTADO ── -->
    <div class="status-banner" [class]="sub().status">
      <div class="status-icon" [class]="sub().status">
        @switch (sub().status) {
          @case ('trial') {
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          }
          @case ('active') {
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          }
          @case ('expired') {
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          }
          @case ('free') { ⭐ }
        }
      </div>

      <div class="status-body">
        <p class="status-label">
          @switch (sub().status) {
            @case ('trial')    { Período de prueba activo }
            @case ('active')   { Suscripción activa }
            @case ('expired')  { Suscripción vencida }
            @case ('disabled') { Cuenta deshabilitada }
            @case ('free')     { Plan gratuito · Beneficiario }
          }
        </p>
        <p class="status-desc">
          @switch (sub().status) {
            @case ('trial')   { Plan gratuito · Vence el {{ sub().trialEnd }} · Renovar antes de que expire para no perder tu agenda }
            @case ('active')  { {{ sub().plan }} · Próxima renovación el {{ sub().trialEnd }} }
            @case ('expired') { Tu suscripción venció. Elegí un plan para reactivar tu cuenta }
            @case ('free')    { Fuiste seleccionado como beneficiario de AgendaZco. Tenés acceso ilimitado y gratuito a todas las funciones de la plataforma. }
          }
        </p>
      </div>

      @if (sub().status !== 'disabled' && sub().status !== 'free') {
        <div class="days-pill" [class]="sub().status">
          <span class="days-number" [class]="sub().status">{{ sub().daysLeft }}</span>
          <span class="days-label">días<br>restantes</span>
        </div>
      }
    </div>
  }
  `,
})
export class BillingStatusCardComponent {
  readonly loading        = input.required<boolean>();
  readonly loadError      = input.required<boolean>();
  readonly noSubscription = input.required<boolean>();
  readonly sub            = input.required<SubViewModel>();
}
