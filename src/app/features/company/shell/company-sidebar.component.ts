import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { APP_VERSION } from '../../../core/version';
import { NavIconComponent } from './nav-icon.component';
import { NavItem } from './nav-item.model';

/** Sidebar de escritorio (oculto en móvil). */
@Component({
  selector: 'app-company-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NavIconComponent],
  template: `
    <aside class="sidebar">

      <!-- Logo -->
      <div class="logo">
        <svg width="44" height="44" viewBox="0 0 100 100" fill="none" style="flex-shrink:0">
            <rect width="100" height="100" rx="22" fill="rgba(255,255,255,0.12)"/>
            <circle cx="30" cy="73" r="12" stroke="white" stroke-width="8.5"/>
            <polyline points="30,61 50,51 80,18" stroke="white" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="70" cy="73" r="12" stroke="white" stroke-width="8.5"/>
            <polyline points="70,61 50,51 20,18" stroke="white" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        <span class="logo-text">AgendaZco</span>
      </div>

      <!-- Navigation -->
      <nav class="nav">
        @for (item of navItems(); track item.route) {
          <a
            class="nav-item"
            [id]="'cnav-' + item.icon"
            [routerLink]="item.route"
            routerLinkActive="nav-item--active"
            [routerLinkActiveOptions]="{ exact: false }"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round"
                 [appNavIcon]="item.icon"></svg>
            <span class="nav-label">{{ item.label }}</span>
            @if (dotRoutes().includes(item.route)) { <span class="nav-dot" aria-label="Novedades"></span> }
          </a>
        }
      </nav>

      <!-- Compartir página pública -->
      <button class="nav-item" (click)="shareClick.emit()"
              style="border:none;background:none;width:100%;cursor:pointer;font-family:inherit;text-align:left">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        <span class="nav-label">Compartir mi página</span>
      </button>

      <!-- Notificaciones -->
      <button class="nav-item" (click)="notificationsToggle.emit()"
              style="border:none;background:none;width:100%;cursor:pointer;font-family:inherit;text-align:left">
        <span style="position:relative;display:flex;align-items:center;justify-content:center;width:18px;height:18px;flex-shrink:0">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          @if (unreadCount() > 0) {
            <span style="position:absolute;top:-6px;right:-8px;min-width:16px;height:16px;background:#f43f5e;color:white;border-radius:99px;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 3px;pointer-events:none">
              {{ unreadCount() > 99 ? '99+' : unreadCount() }}
            </span>
          }
        </span>
        <span class="nav-label">Notificaciones</span>
      </button>

      <!-- Company info -->
      <div class="company-info">
        <span class="company-name">{{ companyName() }}</span>
        <span class="version-tag">v{{ APP_VERSION }}</span>
        @if (subStatus() === 'free') {
          <span class="company-badge company-badge--free">⭐ Beneficiario</span>
        } @else if (subStatus() === 'active') {
          <span class="company-badge company-badge--active">Plan activo</span>
        } @else if (subStatus() === 'expired') {
          <span class="company-badge company-badge--expired">Suscripción vencida</span>
        } @else {
          <span class="company-badge">Trial · {{ subDaysLeft() }} días</span>
        }
        <button class="logout-btn" (click)="logoutClick.emit()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Cerrar sesión
        </button>
      </div>

    </aside>
  `,
  styles: [`
    :host { display: contents; }

    @keyframes fadeInLeft {
      from { opacity: 0; transform: translateX(-24px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    .sidebar {
      width: 220px;
      min-width: 220px;
      background: var(--sidebar-bg);
      border-right: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      flex-direction: column;
      padding: 24px 12px 20px;
      gap: 8px;
      animation: fadeInLeft 0.35s ease both;
    }

    /* Logo */
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 8px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      margin-bottom: 8px;
    }

    .logo-icon {
      width: 28px;
      height: 28px;
      flex-shrink: 0;
    }

    .logo-text {
      font-size: 1.05rem;
      font-weight: 700;
      background: var(--sidebar-logo-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.02em;
    }

    /* Nav */
    .nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      overflow-y: auto;
      min-height: 0;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.1) transparent;
    }
    .nav::-webkit-scrollbar { width: 4px; }
    .nav::-webkit-scrollbar-track { background: transparent; }
    .nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      color: #a0a0b8;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: background 0.18s ease, color 0.18s ease;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }

    .nav-item--active {
      background: var(--gradient);
      color: #ffffff;
      box-shadow: 0 4px 14px var(--nav-active-shadow);
    }

    .nav-item--active:hover {
      background: var(--gradient);
    }

    /* Punto de novedades (estilo Messenger): toma el color del tema; sobre el ítem activo va en blanco */
    .nav-item { position: relative; }
    .nav-dot {
      position: absolute;
      top: 8px;
      left: 29px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--purple);
      box-shadow: 0 0 0 2px var(--sidebar-bg);
      pointer-events: none;
    }
    .nav-item--active .nav-dot { background: #ffffff; box-shadow: none; }

    .nav-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .nav-label {
      white-space: nowrap;
    }

    /* Company info */
    .company-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 16px 12px 4px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      margin-top: auto;
    }

    .version-tag {
      font-size: 0.68rem;
      font-weight: 500;
      color: rgba(160, 160, 184, 0.55);
    }

    .company-name {
      font-size: 0.8rem;
      font-weight: 600;
      color: #e2e2f0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .company-badge {
      font-size: 0.7rem;
      font-weight: 600;
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 20px;
      padding: 2px 10px;
      width: fit-content;
      letter-spacing: 0.02em;
    }

    .company-badge--active {
      color: #10b981;
      background: rgba(16, 185, 129, 0.12);
      border-color: rgba(16, 185, 129, 0.25);
    }

    .company-badge--expired {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.12);
      border-color: rgba(239, 68, 68, 0.25);
    }

    .company-badge--free {
      color: #7c3aed;
      background: rgba(124, 58, 237, 0.12);
      border-color: rgba(124, 58, 237, 0.25);
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 8px 12px;
      color: #a0a0b8;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: all 0.18s;
      margin-top: 6px;
      font-family: inherit;
    }
    .logout-btn:hover {
      background: rgba(239, 68, 68, 0.12);
      border-color: rgba(239, 68, 68, 0.3);
      color: #ef4444;
    }

    @media (max-width: 768px) {
      .sidebar {
        display: none;
      }
    }
  `],
})
export class CompanySidebarComponent {
  readonly APP_VERSION = APP_VERSION;

  readonly navItems     = input.required<NavItem[]>();
  readonly dotRoutes    = input.required<string[]>();
  readonly unreadCount  = input.required<number>();
  readonly companyName  = input<string | undefined>();
  readonly subStatus    = input<string | undefined>();
  readonly subDaysLeft  = input.required<number>();

  readonly shareClick          = output<void>();
  readonly notificationsToggle = output<void>();
  readonly logoutClick         = output<void>();
}
