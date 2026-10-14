import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AdminNavItem } from './admin-nav-item.model';
import { AdminNavIconComponent } from './admin-nav-icon.component';

/** Sidebar de escritorio del panel admin: branding, navegación, campana y datos del admin. */
@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AdminNavIconComponent],
  template: `
      <!-- ── SIDEBAR (desktop) ───────────────────────────────────── -->
      <aside class="sidebar">

        <!-- Branding -->
        <div class="logo">
          <svg width="44" height="44" viewBox="0 0 100 100" fill="none" style="flex-shrink:0">
              <rect width="100" height="100" rx="22" fill="rgba(255,255,255,0.12)"/>
              <circle cx="30" cy="73" r="12" stroke="white" stroke-width="8.5"/>
              <polyline points="30,61 50,51 80,18" stroke="white" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="70" cy="73" r="12" stroke="white" stroke-width="8.5"/>
              <polyline points="70,61 50,51 20,18" stroke="white" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          <div class="logo-text-group">
            <span class="logo-text">AgendaCo</span>
            <span class="logo-sub">Admin Panel</span>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="nav">
          @for (item of navItems(); track item.route) {
            <a
              class="nav-item"
              [routerLink]="item.route"
              routerLinkActive="nav-item--active"
              [routerLinkActiveOptions]="{ exact: false }"
            >
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round"
                   [appAdminNavIcon]="item.icon"></svg>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          }
        </nav>

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

        <!-- Admin info -->
        <div class="admin-info">
          <span class="admin-email">{{ email() }}</span>
          <span class="version-tag">v{{ version() }}</span>
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

    /* ── Sidebar ────────────────────────────────────────────────── */
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

    .logo-text-group {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .logo-text {
      font-size: 1.05rem;
      font-weight: 700;
      background: var(--sidebar-logo-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }

    .logo-sub {
      font-size: 0.65rem;
      font-weight: 600;
      color: rgba(160, 160, 184, 0.7);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    /* Nav */
    .nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

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

    .nav-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .nav-label {
      white-space: nowrap;
    }

    /* Admin info */
    .admin-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 16px 12px 4px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      margin-top: auto;
    }

    .admin-email {
      font-size: 0.75rem;
      font-weight: 500;
      color: #a0a0b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .version-tag {
      font-size: 0.68rem;
      font-weight: 500;
      color: rgba(160, 160, 184, 0.55);
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
export class AdminSidebarComponent {
  readonly navItems = input.required<AdminNavItem[]>();
  readonly unreadCount = input.required<number>();
  readonly email = input<string | null | undefined>();
  readonly version = input.required<string>();

  readonly notificationsToggle = output<void>();
  readonly logoutClick = output<void>();
}
