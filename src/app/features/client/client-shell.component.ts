import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MessageService } from '../../core/services/message.service';
import { NotificationService, AppNotification } from '../../core/services/notification.service';
import { ClientOnboardingComponent } from './onboarding/client-onboarding.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-client-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ClientOnboardingComponent],
  template: `
    @if (authSvc.profileLoaded() && !authSvc.profile()?.profileComplete) {
      <app-client-onboarding />
    } @else {
    <div class="shell" (click)="notifPanelOpen.set(false)">

      <header class="header">
        <div class="header-inner">
        <!-- Logo -->
        <a routerLink="/cliente/citas" class="header-brand">
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
          <span class="brand-name">Agenda Co</span>
        </a>

        <div style="flex:1"></div>

        <!-- Acciones -->
        <div class="header-actions">

          <!-- Buscar negocios (primario) -->
          <a routerLink="/" class="action-btn action-btn--primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Buscar
          </a>

          <!-- Mis citas -->
          <a routerLink="/cliente/citas" routerLinkActive="action-nav--active" class="action-btn action-btn--nav">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Mis citas
          </a>

          <!-- Mensajes -->
          <a routerLink="/cliente/mensajes" routerLinkActive="action-nav--active"
             class="action-btn action-btn--nav" style="position:relative">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Mensajes
            @if (unreadCount() > 0) {
              <span class="msg-badge">{{ unreadCount() }}</span>
            }
          </a>

          <!-- Notificaciones -->
          <div style="position:relative">
            <button class="icon-btn" title="Notificaciones" (click)="$event.stopPropagation(); toggleNotifPanel()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              @if (unreadNotifCount() > 0) {
                <span class="notif-badge">{{ unreadNotifCount() }}</span>
              }
            </button>

            @if (notifPanelOpen()) {
              <div class="notif-panel" (click)="$event.stopPropagation()">
                <div class="notif-panel-header">
                  <span>Notificaciones</span>
                  @if (unreadNotifCount() > 0) {
                    <button class="notif-mark-all" (click)="markAllRead()">Marcar todas leídas</button>
                  }
                </div>
                @if (notifications().length === 0) {
                  <div class="notif-empty">Sin notificaciones</div>
                }
                @for (n of notifications(); track n.id) {
                  <div class="notif-item" [class.unread]="!n.read" (click)="openNotif(n)">
                    <div class="notif-title">{{ n.title }}</div>
                    <div class="notif-body">{{ n.body }}</div>
                    <div class="notif-time">{{ formatTime(n.createdAt) }}</div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Configuración -->
          <a routerLink="/cliente/perfil" class="icon-btn" title="Configuración">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </a>

          <!-- Avatar → perfil -->
          <a routerLink="/cliente/perfil" class="avatar-btn" [title]="authSvc.displayName()">
            @if (authSvc.profile()?.photoUrl) {
              <img class="avatar-img" [src]="authSvc.profile()!.photoUrl!" alt="foto" />
            } @else {
              <span class="avatar-initials">{{ initials() }}</span>
            }
          </a>

          <!-- Salir -->
          <button class="action-btn action-btn--exit" (click)="logout()">Salir</button>
        </div>
        </div><!-- /header-inner -->
      </header>

      <main class="content">
        <router-outlet />
      </main>

    </div>
    }
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; }

    .shell {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: var(--body-bg);
    }

    /* ── Header ─────────────────────────────────────────── */
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
      gap: 16px;
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

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Shared action button base */
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

    /* Gradient primary (Buscar) */
    .action-btn--primary {
      color: white;
      background: var(--gradient);
      box-shadow: 0 4px 12px rgba(124,58,237,.28);
    }
    .action-btn--primary:hover { opacity: .88; }

    /* Subtle nav link (Mis citas, Mensajes) */
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

    /* Badge no leídos */
    .msg-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      background: var(--pink, #ec4899);
      color: white;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 800;
      padding: 1px 5px;
      min-width: 16px;
      text-align: center;
    }

    /* Salir */
    .action-btn--exit {
      color: #888;
      background: none;
      border: 1.5px solid #e5e7eb;
    }
    .action-btn--exit:hover { border-color: var(--purple); color: var(--purple); }

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
      font-size: 10px;
      font-weight: 800;
      padding: 1px 5px;
      min-width: 16px;
      text-align: center;
    }

    .notif-panel {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 320px;
      background: white;
      border-radius: 14px;
      box-shadow: 0 8px 40px rgba(0,0,0,.14);
      z-index: 500;
      overflow: hidden;
      border: 1px solid #f0ebff;
    }
    .notif-panel-header {
      padding: 14px 16px;
      font-weight: 800;
      font-size: 14px;
      border-bottom: 1px solid #f0ebff;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .notif-mark-all {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 12px;
      color: var(--purple);
      font-weight: 600;
    }
    .notif-empty {
      padding: 24px;
      text-align: center;
      color: #aaa;
      font-size: 13px;
    }
    .notif-item {
      padding: 12px 16px;
      border-bottom: 1px solid #f7f5ff;
      cursor: pointer;
      transition: background .12s;
    }
    .notif-item:hover { background: #faf8ff; }
    .notif-item.unread { background: #f5f0ff; }
    .notif-item.unread:hover { background: #ede9fe; }
    .notif-title { font-size: 13px; font-weight: 700; color: #1a1a2e; margin-bottom: 2px; }
    .notif-body  { font-size: 12px; color: #555; margin-bottom: 4px; }
    .notif-time  { font-size: 11px; color: #aaa; }

    .avatar-btn {
      width: 38px; height: 38px;
      border-radius: 50%;
      background: var(--gradient);
      display: flex; align-items: center; justify-content: center;
      text-decoration: none;
      overflow: hidden;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(124,58,237,.25);
      transition: transform .18s;
    }
    .avatar-btn:hover { transform: scale(1.07); }

    .avatar-img { width: 100%; height: 100%; object-fit: cover; }

    .avatar-initials {
      font-size: 15px;
      font-weight: 800;
      color: white;
    }

    /* ── Content ─────────────────────────────────────────── */
    .content {
      flex: 1;
      overflow-y: auto;
    }
  `],
})
export class ClientShellComponent implements OnDestroy {
  readonly authSvc = inject(AuthService);
  private msgSvc  = inject(MessageService);
  private notifSvc = inject(NotificationService);
  private router  = inject(Router);

  unreadCount      = signal(0);
  unreadNotifCount = signal(0);
  notifications    = signal<AppNotification[]>([]);
  notifPanelOpen   = signal(false);
  private msgSub:   Subscription | null = null;
  private notifSub: Subscription | null = null;

  initials = computed(() => {
    const name = this.authSvc.displayName() || this.authSvc.profile()?.email || '?';
    return name.split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('');
  });

  constructor() {
    const uid = this.authSvc.currentUser()?.uid;
    if (uid) {
      this.msgSub = this.msgSvc.watchByClient(uid).subscribe({
        next: (msgs) => {
          this.unreadCount.set(msgs.filter(m => m.senderRole === 'company' && !m.read).length);
        },
        error: () => {},
      });
      this.notifSub = this.notifSvc.watch(uid).subscribe({
        next: (notifs) => {
          this.notifications.set(notifs);
          this.unreadNotifCount.set(notifs.filter(n => !n.read).length);
        },
        error: () => {},
      });
    }
  }

  toggleNotifPanel() {
    this.notifPanelOpen.update(v => !v);
  }

  async openNotif(n: AppNotification) {
    if (!n.read && n.id) await this.notifSvc.markRead(n.id);
    this.notifPanelOpen.set(false);
    if (n.link) this.router.navigateByUrl(n.link);
  }

  async markAllRead() {
    const uid = this.authSvc.currentUser()?.uid;
    if (uid) await this.notifSvc.markAllRead(uid);
  }

  formatTime(ts: any): string {
    if (!ts) return '';
    const d: Date = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  logout() {
    this.authSvc.logout().subscribe({ complete: () => this.router.navigate(['/']) });
  }

  ngOnDestroy() {
    this.msgSub?.unsubscribe();
    this.notifSub?.unsubscribe();
  }
}
