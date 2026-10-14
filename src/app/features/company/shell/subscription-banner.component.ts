import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { SubscriptionLike, subscriptionTimeline } from '../../../core/domain/subscription-timeline';

/**
 * Aviso de vencimiento arriba del contenido de la empresa:
 * amarillo (vence en ≤5 días) · naranja (vence HOY) · rojo (venció, en gracia).
 * Fuera de esas fases no muestra nada.
 */
@Component({
  selector: 'app-subscription-banner',
  standalone: true,
  styles: [`
    :host { display: block; }
    .banner {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      margin: 16px 20px 0; padding: 12px 16px; border-radius: 12px;
      font-size: 13px; line-height: 1.5; border: 1.5px solid;
    }
    .banner--warning { background: #fffbeb; border-color: #fde68a; color: #92400e; }
    .banner--today   { background: #fff7ed; border-color: #fb923c; color: #9a3412; }
    .banner--grace   { background: #fef2f2; border-color: #fca5a5; color: #991b1b; }
    .icon { font-size: 18px; flex-shrink: 0; }
    .text { flex: 1; min-width: 200px; }
    .cta {
      flex-shrink: 0; padding: 8px 14px; border-radius: 9px; font-size: 12px; font-weight: 700;
      text-decoration: none; color: white; white-space: nowrap;
    }
    .banner--warning .cta { background: #d97706; }
    .banner--today   .cta { background: #ea580c; }
    .banner--grace   .cta { background: #dc2626; }
    @media (max-width: 768px) { .banner { margin: 12px 12px 0; } }
  `],
  template: `
    @switch (t().phase) {
      @case ('warning') {
        <div class="banner banner--warning" role="status">
          <span class="icon">⚠️</span>
          <span class="text">
            Tu {{ label() }} vence en <strong>{{ t().daysToEnd }} {{ t().daysToEnd === 1 ? 'día' : 'días' }}</strong>
            ({{ day(t().endDate) }}). Renovalo para no perder el acceso.
          </span>
          <a class="cta" href="/empresa/facturacion#planes" (click)="goToPlans($event)">Renovar</a>
        </div>
      }
      @case ('due-today') {
        <div class="banner banner--today" role="alert">
          <span class="icon">⏰</span>
          <span class="text">
            <strong>Tu {{ label() }} vence hoy.</strong> Pagá hoy para seguir usando AgendaGo sin interrupciones.
          </span>
          <a class="cta" href="/empresa/facturacion#planes" (click)="goToPlans($event)">Pagar ahora</a>
        </div>
      }
      @case ('grace') {
        <div class="banner banner--grace" role="alert">
          <span class="icon">🔴</span>
          <span class="text">
            Tu {{ label() }} venció el {{ day(t().endDate) }}. Tenés hasta el <strong>{{ day(t().graceEnd) }}</strong>
            ({{ t().graceDaysLeft === 0 ? 'hoy es el último día' : 'quedan ' + t().graceDaysLeft + (t().graceDaysLeft === 1 ? ' día' : ' días') }})
            para pagar antes de que se suspenda la cuenta.
          </span>
          <a class="cta" href="/empresa/facturacion#planes" (click)="goToPlans($event)">Pagar ahora</a>
        </div>
      }
    }
  `,
})
export class SubscriptionBannerComponent {
  private router = inject(Router);
  readonly subscription = input<SubscriptionLike | null>(null);

  t = computed(() => subscriptionTimeline(this.subscription()));
  label = computed(() => this.subscription()?.status === 'trial' ? 'prueba gratis' : 'plan');

  /** Va a Facturación (aunque ya estés ahí) y baja hasta los planes cuando se renderizan. */
  async goToPlans(e: Event): Promise<void> {
    e.preventDefault();
    await this.router.navigate(['/empresa/facturacion'], { fragment: 'planes' });
    const started = Date.now();
    const tryScroll = () => {
      const el = document.getElementById('planes');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else if (Date.now() - started < 3000) requestAnimationFrame(tryScroll);
    };
    tryScroll();
  }

  day(d: Date | null): string {
    return d ? d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : '—';
  }
}
