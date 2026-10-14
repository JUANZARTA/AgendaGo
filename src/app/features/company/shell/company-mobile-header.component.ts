import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandLogoComponent } from '../../../shared/components/brand-logo.component';

/** Header móvil (oculto en desktop). */
@Component({
  selector: 'app-company-mobile-header',
  standalone: true,
  imports: [RouterLink, BrandLogoComponent],
  template: `
    <header class="mobile-header">
      <app-brand-logo variant="tile" [size]="40" />
      <span style="font-weight:900;font-size:1.05rem;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">AgendaCo</span>
      <div style="flex:1"></div>
      <!-- Campana -->
      <button class="mh-icon-btn" (click)="notificationsToggle.emit()" style="position:relative">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        @if (unreadCount() > 0) {
          <span style="position:absolute;top:-3px;right:-3px;background:#f43f5e;color:white;border-radius:99px;font-size:9px;font-weight:700;padding:1px 4px;min-width:14px;text-align:center">{{ unreadCount() }}</span>
        }
      </button>
      <!-- Salir -->
      <button class="mh-icon-btn mh-out" title="Cerrar sesión" (click)="logoutClick.emit()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Salir
      </button>
      <!-- Avatar → perfil empresa -->
      <a routerLink="/empresa/perfil" class="mh-avatar" title="Configuración">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </a>
    </header>
  `,
  styles: [`
    :host { display: contents; }

    .mobile-header {
      display: none;
    }

    @media (max-width: 768px) {
      .mobile-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 16px;
        height: 60px;
        background: white;
        border-bottom: 1px solid #f0ebff;
        box-shadow: 0 2px 12px rgba(0,0,0,.06);
        flex-shrink: 0;
      }

      .mh-icon-btn {
        width: 36px; height: 36px;
        border-radius: 50%;
        border: 1.5px solid #e5e7eb;
        background: none;
        display: flex; align-items: center; justify-content: center;
        color: #888;
        cursor: pointer;
        flex-shrink: 0;
      }
      .mh-icon-btn:hover { border-color: var(--purple); color: var(--purple); }
      /* "Salir" con texto: el ícono solo no se entendía */
      .mh-out { width: auto; border-radius: 99px; padding: 0 10px; gap: 5px; font-size: 12px; font-weight: 700; color: #dc2626; font-family: inherit; }

      .mh-avatar {
        width: 36px; height: 36px;
        border-radius: 50%;
        background: var(--gradient);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 4px 10px rgba(var(--primary-rgb),.25);
        text-decoration: none;
      }
    }
  `],
})
export class CompanyMobileHeaderComponent {
  readonly unreadCount = input.required<number>();
  readonly notificationsToggle = output<void>();
  readonly logoutClick = output<void>();
}
