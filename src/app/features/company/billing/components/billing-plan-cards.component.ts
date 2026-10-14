import { Component, input, output } from '@angular/core';
import { PLANS, formatCop } from '../../../../core/domain/plans';
import { SubViewModel } from '../billing.models';

/** Título + grilla de planes (gratuito / mensual / semestral). Presentacional. */
@Component({
  selector: 'app-billing-plan-cards',
  standalone: true,
  styles: [`
    :host { display: contents; }

    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.92); }
      to   { opacity: 1; transform: scale(1); }
    }

    /* ── Plans grid ── */
    .plans-title { font-size: 1rem; font-weight: 800; margin: 0 0 16px; }
    .plans-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 36px;
    }

    .plan-card {
      background: white;
      border-radius: 18px;
      border: 2px solid #f0e8ff;
      padding: 24px 20px;
      display: flex; flex-direction: column; gap: 14px;
      position: relative;
      transition: box-shadow .2s ease, transform .2s ease;
      animation: scaleIn .4s ease both;
    }
    .plan-card:nth-child(1) { animation-delay: .05s; }
    .plan-card:nth-child(2) { animation-delay: .12s; }
    .plan-card:nth-child(3) { animation-delay: .19s; }
    .plan-card:hover { box-shadow: var(--shadow-hover); transform: translateY(-3px); }
    .plan-card.featured {
      border-color: var(--purple);
      box-shadow: 0 0 0 1px var(--purple), var(--shadow);
    }
    .plan-card.dimmed { opacity: .55; pointer-events: none; }

    .plan-badge {
      position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
      background: var(--gradient); color: white;
      font-size: 11px; font-weight: 700;
      padding: 4px 14px; border-radius: 20px;
      white-space: nowrap; letter-spacing: .04em;
    }
    .plan-name  { font-size: .85rem; font-weight: 700; color: #888; letter-spacing: .04em; text-transform: uppercase; }
    .plan-price-row { display: flex; align-items: baseline; gap: 4px; }
    .plan-price { font-size: 2.1rem; font-weight: 900; line-height: 1; background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .plan-price.free { font-size: 2.1rem; color: #10b981; -webkit-text-fill-color: #10b981; background: none; }
    .plan-period { font-size: 13px; color: #888; font-weight: 500; }
    .plan-saving { font-size: 11px; font-weight: 700; color: #065f46; background: #d1fae5; border-radius: 20px; padding: 2px 10px; align-self: flex-start; }
    .plan-effective { font-size: 12px; color: #888; }

    .plan-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
    .plan-features li { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #444; }
    .plan-features li svg { flex-shrink: 0; color: #10b981; }
    .plan-features li.dimmed-feat svg { color: #cbd5e1; }
    .plan-features li.dimmed-feat { color: #aaa; }

    .plan-footer { margin-top: auto; }
    .plan-used-tag {
      text-align: center; font-size: 12px; font-weight: 700;
      color: #888; background: #f1f5f9; border-radius: 8px; padding: 10px;
    }
    .plan-cta { width: 100%; }
    @media (max-width: 640px) {
      .plans-grid { grid-template-columns: 1fr; }
    }
  `],
  template: `
  <p class="plans-title">Elegí tu plan</p>
  <div class="plans-grid">

    <!-- Gratuito -->
    <div class="plan-card" [class.dimmed]="sub().trialUsed && sub().status !== 'trial'">
      <div class="plan-name">Gratuito</div>
      <div class="plan-price-row">
        <span class="plan-price free">$0</span>
      </div>
      <div style="font-size:12px;color:#888;margin-top:-8px">60 días · una sola vez</div>
      <ul class="plan-features">
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Agenda completa</li>
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Servicios ilimitados</li>
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Gestión de horarios</li>
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Equipo y staff</li>
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Mensajes con clientes</li>
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Reseñas de clientes</li>
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Notificaciones push</li>
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Estadísticas del negocio</li>
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Soporte prioritario</li>
      </ul>
      <div class="plan-footer">
        @if (noSubscription() || loadError()) {
          <div class="plan-used-tag">No disponible</div>
        } @else if (sub().status === 'trial') {
          <div class="plan-used-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;margin-right:4px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Trial en curso ({{ sub().daysLeft }} días restantes)
          </div>
        } @else {
          <div class="plan-used-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;margin-right:4px"><polyline points="20 6 9 17 4 12"/></svg>
            Ya utilizado
          </div>
        }
      </div>
    </div>

    <!-- Mensual -->
    <div class="plan-card">
      <div class="plan-name">Mensual</div>
      <div class="plan-price-row">
        <span class="plan-price">{{ fmtCop(plans.mensual.amount) }}</span>
        <span class="plan-period">/mes</span>
      </div>
      <ul class="plan-features">
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Agenda completa</li>
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Servicios ilimitados</li>
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Gestión de horarios</li>
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Equipo y staff</li>
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Mensajes con clientes</li>
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Reseñas de clientes</li>
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Notificaciones push</li>
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Estadísticas del negocio</li>
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Soporte prioritario</li>
      </ul>
      <div class="plan-footer">
        <button class="btn btn-primary plan-cta" (click)="payMonthly.emit()" [disabled]="!companyReady()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          Pagar {{ fmtCop(plans.mensual.amount) }}
        </button>
      </div>
    </div>

    <!-- Semestral -->
    <div class="plan-card featured">
      <div class="plan-badge">Mejor precio</div>
      <div class="plan-name">Semestral</div>
      <div class="plan-price-row">
        <span class="plan-price">{{ fmtCop(plans.semestral.amount) }}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">
        <span class="plan-saving">Ahorrás $17.400</span>
        <span class="plan-effective">$26.100/mes efectivo</span>
      </div>
      <ul class="plan-features">
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Todo lo del plan mensual</li>
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> 6 meses sin preocupaciones</li>
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> 10% de descuento aplicado</li>
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Factura única</li>
        <li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Soporte prioritario</li>
      </ul>
      <div class="plan-footer">
        <button class="btn btn-primary plan-cta" (click)="paySemestral.emit()" [disabled]="!companyReady()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          Pagar {{ fmtCop(plans.semestral.amount) }}
        </button>
      </div>
    </div>

  </div>
  `,
})
export class BillingPlanCardsComponent {
  readonly sub            = input.required<SubViewModel>();
  readonly noSubscription = input.required<boolean>();
  readonly loadError      = input.required<boolean>();
  readonly companyReady   = input.required<boolean>();

  readonly payMonthly   = output<void>();
  readonly paySemestral = output<void>();

  readonly plans  = PLANS;
  readonly fmtCop = formatCop;
}
