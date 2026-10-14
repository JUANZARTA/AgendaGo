import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Header móvil (oculto en desktop). */
@Component({
  selector: 'app-company-mobile-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="mobile-header">
      <svg width="40" height="40" viewBox="0 0 100 100" fill="none" style="flex-shrink:0">
          <rect width="100" height="100" rx="22" fill="#7c3aed"/>
          <circle cx="30" cy="73" r="12" stroke="white" stroke-width="8.5"/>
          <polyline points="30,61 50,51 80,18" stroke="white" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="70" cy="73" r="12" stroke="white" stroke-width="8.5"/>
          <polyline points="70,61 50,51 20,18" stroke="white" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      <span style="font-weight:900;font-size:1.05rem;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">AgendaZco</span>
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
      <button class="mh-icon-btn" title="Cerrar sesión" (click)="logoutClick.emit()">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
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
