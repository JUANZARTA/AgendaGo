import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AppNotification } from '../../../core/services/notification.service';
import { APP_VERSION } from '../../../core/version';
import { ClientNotificationsPanelComponent } from './client-notifications-panel.component';

/** Header del área cliente: marca, navegación desktop, campana, ajustes, avatar y salir (presentacional). */
@Component({
  selector: 'app-client-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ClientNotificationsPanelComponent],
  template: `
      <header class="header">
        <div class="header-inner">

          <a id="ctour-brand" routerLink="/" class="header-brand">
            <div class="brand-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="6" y1="3" x2="6" y2="15"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="6" r="3"/>
                <line x1="18" y1="9" x2="18" y2="21"/>
                <line x1="18" y1="3" x2="6" y2="15"/>
              </svg>
            </div>
            <span class="brand-name">AgendaCo</span>
            <span class="header-version desktop-only">v{{ APP_VERSION }}</span>
          </a>

          <div style="flex:1"></div>

          <!-- Desktop nav -->
          <div class="header-actions desktop-only">
            <a id="ctour-search-desktop" routerLink="/" class="action-btn action-btn--primary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Buscar
            </a>
            <a id="ctour-citas-desktop" routerLink="/cliente/citas" routerLinkActive="action-nav--active" class="action-btn action-btn--nav" style="position:relative">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Mis citas
              @if (hasAptNews()) { <span class="nav-dot" aria-label="Novedades"></span> }
            </a>
            <a id="ctour-mensajes-desktop" routerLink="/cliente/mensajes" routerLinkActive="action-nav--active"
               class="action-btn action-btn--nav" style="position:relative">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Mensajes
              @if (hasUnreadMessages()) { <span class="nav-dot" aria-label="Mensajes sin leer"></span> }
            </a>
          </div>

          <!-- Bell + gear + avatar (always visible) -->
          <div class="header-icons">
            <div style="position:relative">
              <button id="ctour-notif" class="icon-btn" title="Notificaciones" (click)="$event.stopPropagation(); toggleNotif.emit()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                @if (unreadCount() > 0) { <span class="notif-badge">{{ unreadCount() }}</span> }
              </button>

              @if (notifPanelOpen()) {
                    <app-client-notifications-panel
                      [notifications]="notifications()"
                      [unreadCount]="unreadCount()"
                      (markAllRead)="markAllRead.emit()"
                      (openNotif)="openNotif.emit($event)" />
                  }
            </div>

            <!-- Salir (mobile) -->
            <button class="icon-btn mobile-only" title="Cerrar sesión" (click)="logout.emit()">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
            <a routerLink="/cliente/perfil" class="icon-btn desktop-only" title="Configuración">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </a>

            <a id="ctour-avatar" routerLink="/cliente/perfil" class="avatar-btn" [title]="displayName()">
              @if (photoUrl()) {
                <img class="avatar-img" [src]="photoUrl()!" alt="foto" />
              } @else {
                <span class="avatar-initials">{{ initials() }}</span>
              }
            </a>

            <button class="action-btn action-btn--exit desktop-only" (click)="logout.emit()">Salir</button>
          </div>

        </div>
      </header>
  `,
  styles: [`
    :host { display: contents; }

    /* ── Header ─────────────────────────────── */
    .header {
      background: white;
      border-bottom: 1.5px solid #f0ebff;
      box-shadow: 0 2px 16px rgba(124,58,237,.06);
      flex-shrink: 0;
    }

    .header-inner {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 20px;
      height: 64px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      flex-shrink: 0;
    }

    .brand-icon-wrap {
      width: 36px; height: 36px;
      border-radius: 10px;
      background: var(--gradient);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(124,58,237,.3);
      flex-shrink: 0;
    }

    .brand-name {
      font-weight: 900;
      font-size: 1.1rem;
      background: var(--gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header-version {
      font-size: 0.68rem;
      font-weight: 600;
      color: #c4c4d8;
      margin-left: 6px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-icons {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    /* Shared action button */
    .action-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      border: none;
      cursor: pointer;
      font-family: inherit;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 9px 16px;
      border-radius: 10px;
      transition: all .15s;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .action-btn--primary {
      color: white;
      background: var(--gradient);
      box-shadow: 0 4px 12px rgba(124,58,237,.28);
    }
    .action-btn--primary:hover { opacity: .88; }

    .action-btn--nav {
      color: var(--purple);
      background: var(--btn-secondary-bg);
    }
    .action-btn--nav:hover { background: var(--btn-secondary-hover); }
    .action-nav--active {
      background: var(--gradient) !important;
      color: white !important;
      box-shadow: 0 4px 12px rgba(124,58,237,.2);
    }

    .action-btn--exit {
      color: #888;
      background: none;
      border: 1.5px solid #e5e7eb;
    }
    .action-btn--exit:hover { border-color: var(--purple); color: var(--purple); }

    /* Punto de novedades (estilo Messenger): toma el color del tema */
    .nav-dot {
      position: absolute;
      top: -3px; right: -3px;
      width: 11px; height: 11px;
      border-radius: 50%;
      background: var(--purple);
      box-shadow: 0 0 0 2px #ffffff;
      pointer-events: none;
    }

    .icon-btn {
      width: 36px; height: 36px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #888;
      background: none;
      border: 1.5px solid #e5e7eb;
      text-decoration: none;
      cursor: pointer;
      transition: all .15s;
      flex-shrink: 0;
      position: relative;
    }
    .icon-btn:hover { border-color: var(--purple); color: var(--purple); }

    .notif-badge {
      position: absolute;
      top: -3px; right: -3px;
      background: #ef4444;
      color: white;
      border-radius: 20px;
      font-size: 10px; font-weight: 800;
      padding: 1px 5px; min-width: 16px;
      text-align: center;
    }


    .avatar-btn {
      width: 38px; height: 38px;
      border-radius: 50%;
      background: var(--gradient);
      display: flex; align-items: center; justify-content: center;
      text-decoration: none;
      overflow: hidden; flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(124,58,237,.25);
      transition: transform .18s;
    }
    .avatar-btn:hover { transform: scale(1.07); }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; }
    .avatar-initials { font-size: 15px; font-weight: 800; color: white; }

    /* ── Responsive ───────────────────────────── */
    .mobile-only { display: none; }

    @media (max-width: 768px) {
      .desktop-only { display: none !important; }
      .mobile-only  { display: flex !important; }
    }
  `],
})
export class ClientHeaderComponent {
  readonly APP_VERSION = APP_VERSION;

  displayName       = input<string>('');
  photoUrl          = input<string | null | undefined>(null);
  initials          = input<string>('');
  hasAptNews        = input<boolean>(false);
  hasUnreadMessages = input<boolean>(false);
  unreadCount       = input<number>(0);
  notifications     = input<AppNotification[]>([]);
  notifPanelOpen    = input<boolean>(false);

  toggleNotif = output<void>();
  markAllRead = output<void>();
  openNotif   = output<AppNotification>();
  logout      = output<void>();
}
