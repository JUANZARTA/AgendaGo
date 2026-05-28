import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription as RxSubscription } from 'rxjs';
import { SubscriptionService, Subscription } from '../../../core/services/subscription.service';
import { CompanyStore } from '../../../core/services/company-store.service';
import { NotificationService } from '../../../core/services/notification.service';
import { environment } from '../../../../environments/environment';

interface Payment {
  date: string;
  plan: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
}

interface SubViewModel {
  status: 'trial' | 'active' | 'expired' | 'disabled' | 'free';
  plan: string;
  trialEnd: string;
  daysLeft: number;
  trialUsed: boolean;
}

const MOCK_PAYMENTS: Payment[] = [];

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.92); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: .6; }
    }

    .page { max-width: 860px; margin: 0 auto; padding: 28px 20px; }
    .page-title { font-size: 1.45rem; font-weight: 800; margin: 0 0 4px; }
    .page-sub   { font-size: 13px; color: #888; margin: 0 0 28px; }

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

    /* ── History ── */
    .history-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 14px;
    }
    .history-title { font-size: 1rem; font-weight: 800; margin: 0; }

    .history-table {
      width: 100%; border-collapse: collapse;
      background: white; border-radius: 14px;
      overflow: hidden; box-shadow: var(--shadow);
      animation: fadeInUp .5s ease .15s both;
    }
    .history-table th {
      text-align: left; font-size: 11px; font-weight: 700;
      color: #888; letter-spacing: .06em; text-transform: uppercase;
      padding: 14px 18px; background: #fafafa;
      border-bottom: 1.5px solid #f3f4f6;
    }
    .history-table td {
      padding: 14px 18px; font-size: 14px;
      border-bottom: 1px solid #f7f7f7; color: #333;
    }
    .history-table tr:last-child td { border-bottom: none; }
    .history-table tr:hover td { background: #fafafa; }

    .status-chip {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 700;
    }
    .chip-paid    { background: #d1fae5; color: #065f46; }
    .chip-pending { background: #fef3c7; color: #92400e; }
    .chip-failed  { background: #fee2e2; color: #991b1b; }

    .empty-history {
      text-align: center; padding: 40px 20px;
      background: white; border-radius: 14px; box-shadow: var(--shadow);
      color: #aaa; font-size: 14px;
    }

    @media (max-width: 640px) {
      .page { padding: 16px 12px; }
      .plans-grid { grid-template-columns: 1fr; }
      .status-banner { padding: 18px 16px; }
      .history-table th:nth-child(3),
      .history-table td:nth-child(3) { display: none; }
    }
  `],
  template: `
    <div class="page">

      <p class="page-title">Facturación</p>
      <p class="page-sub">Gestioná tu plan y revisá el historial de pagos</p>

      @if (loading()) {
        <!-- ── LOADING STATE ── -->
        <div class="loading-banner">
          <span class="loading-text">Cargando información de suscripción...</span>
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
                @case ('free')    { Fuiste seleccionado como beneficiario de Agenda Co. Tenés acceso ilimitado y gratuito a todas las funciones de la plataforma. }
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

      <!-- ── Banner beneficiario ── -->
      @if (sub().status === 'free') {
        <div style="border-radius:16px;padding:28px 32px;background:linear-gradient(135deg,#f5f3ff,#fdf4ff);border:2px solid #e9d5ff;display:flex;align-items:center;gap:20px;margin-bottom:8px">
          <div style="font-size:40px;flex-shrink:0">⭐</div>
          <div>
            <div style="font-size:1rem;font-weight:800;color:#6d28d9;margin-bottom:4px">¡Sos beneficiario de Agenda Co!</div>
            <div style="font-size:13px;color:#7c3aed;line-height:1.6">Tenés acceso <strong>gratuito e ilimitado</strong> a todas las funciones de la plataforma. No necesitás pagar ni renovar ningún plan.</div>
          </div>
        </div>
      }

      <!-- ── PLANES (solo si no es beneficiario) ── -->
      @if (sub().status !== 'free') {
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
            @if (sub().status === 'trial') {
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
            <span class="plan-price">$29.000</span>
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
            <button class="btn btn-primary plan-cta" (click)="payMonthly()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              Pagar $29.000
            </button>
          </div>
        </div>

        <!-- Semestral -->
        <div class="plan-card featured">
          <div class="plan-badge">Mejor precio</div>
          <div class="plan-name">Semestral</div>
          <div class="plan-price-row">
            <span class="plan-price">$156.600</span>
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
            <button class="btn btn-primary plan-cta" (click)="paySemestral()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              Pagar $156.600
            </button>
          </div>
        </div>

      </div>
      } <!-- /if not free -->

      <!-- ── HISTORIAL ── -->
      <div class="history-header">
        <p class="history-title">Historial de pagos</p>
      </div>

      @if (payments.length > 0) {
        <table class="history-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Plan</th>
              <th>Valor</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            @for (p of payments; track p.date) {
              <tr>
                <td style="color:#666">{{ formatDate(p.date) }}</td>
                <td style="font-weight:600">{{ p.plan }}</td>
                <td style="font-weight:700">{{ p.amount | number }} COP</td>
                <td>
                  <span class="status-chip"
                        [class.chip-paid]="p.status === 'paid'"
                        [class.chip-pending]="p.status === 'pending'"
                        [class.chip-failed]="p.status === 'failed'">
                    <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
                    @switch (p.status) {
                      @case ('paid')    { Pagado }
                      @case ('pending') { Pendiente }
                      @case ('failed')  { Fallido }
                    }
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <div class="empty-history">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:10px"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          <p>Historial de pagos próximamente.</p>
        </div>
      }

    </div>
  `,
})
export class BillingComponent implements OnDestroy {
  private subscriptionService = inject(SubscriptionService);
  private companyStore        = inject(CompanyStore);
  private notifSvc            = inject(NotificationService);

  loading  = signal(true);
  payments = MOCK_PAYMENTS;

  sub = signal<SubViewModel>({
    status:    'trial',
    plan:      'Gratuito (Trial)',
    trialEnd:  '—',
    daysLeft:  0,
    trialUsed: true,
  });

  private rxSub: RxSubscription | null = null;

  constructor() {
    effect(() => {
      const companyId = this.companyStore.companyId();
      if (!companyId) return;

      this.rxSub?.unsubscribe();
      this.loading.set(true);

      this.rxSub = this.subscriptionService.watchStatus(companyId).subscribe((subscription) => {
        if (!subscription) {
          this.loading.set(false);
          return;
        }

        const daysLeft = this.subscriptionService.daysRemaining(subscription);
        const endDate  = subscription.status === 'trial'
          ? subscription.trialEndDate
          : subscription.currentPeriodEnd;
        const trialEnd = this.formatTimestamp(endDate);
        const plan     = subscription.status === 'active' ? 'Plan activo' : 'Gratuito (Trial)';

        this.sub.set({
          status:    subscription.status,
          plan,
          trialEnd,
          daysLeft,
          trialUsed: subscription.status !== 'trial',
        });

        this.loading.set(false);
      });
    });
  }


  payMonthly(): void {
    const companyId = this.companyStore.companyId() ?? 'unknown';
    const ref = `mensual-${companyId}-${Date.now()}`;
    const url = `https://checkout.wompi.co/l/6btIw2?reference=${ref}`;
    window.open(url, '_blank');
    this.notifyAdminPayment('Mensual', '$29.000');
  }

  paySemestral(): void {
    const companyId = this.companyStore.companyId() ?? 'unknown';
    const ref = `semestral-${companyId}-${Date.now()}`;
    const url = `https://checkout.wompi.co/l/3pQr9V?reference=${ref}`;
    window.open(url, '_blank');
    this.notifyAdminPayment('Semestral', '$156.600');
  }

  private notifyAdminPayment(plan: string, amount: string): void {
    const name = this.companyStore.company()?.name ?? 'Una empresa';
    this.notifSvc.create({
      recipientId: 'admin',
      type:        'payment_initiated',
      title:       `Pago iniciado — ${name}`,
      body:        `${name} inició un pago del plan ${plan} por ${amount}. Verificá en Wompi y activá el plan manualmente.`,
      link:        '/admin/facturacion',
    });
  }

  ngOnDestroy(): void {
    this.rxSub?.unsubscribe();
  }

  private formatTimestamp(ts: any): string {
    if (!ts) return '—';
    const date: Date = ts?.toDate ? ts.toDate() : new Date(ts);
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  formatDate(iso: string): string {
    const [y, m, d] = iso.split('-');
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return `${d} ${months[+m - 1]} ${y}`;
  }
}
