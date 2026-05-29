import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Firestore, doc, onSnapshot } from '@angular/fire/firestore';
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

      <!-- ── HEADER ───────────────────────────────────── -->
      <header class="header">
        <div class="header-inner">

          <a routerLink="/" class="header-brand">
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

          <!-- Desktop nav -->
          <div class="header-actions desktop-only">
            <a routerLink="/" class="action-btn action-btn--primary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Buscar
            </a>
            <a routerLink="/cliente/citas" routerLinkActive="action-nav--active" class="action-btn action-btn--nav">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Mis citas
            </a>
            <a routerLink="/cliente/mensajes" routerLinkActive="action-nav--active"
               class="action-btn action-btn--nav" style="position:relative">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Mensajes
              @if (unreadCount() > 0) { <span class="msg-badge">{{ unreadCount() }}</span> }
            </a>
          </div>

          <!-- Bell + gear + avatar (always visible) -->
          <div class="header-icons">
            <div style="position:relative">
              <button class="icon-btn" title="Notificaciones" (click)="$event.stopPropagation(); toggleNotifPanel()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                @if (unreadNotifCount() > 0) { <span class="notif-badge">{{ unreadNotifCount() }}</span> }
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

            <!-- Salir (mobile) -->
            <button class="icon-btn mobile-only" title="Cerrar sesión" (click)="logout()">
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

            <a routerLink="/cliente/perfil" class="avatar-btn" [title]="authSvc.displayName()">
              @if (authSvc.profile()?.photoUrl) {
                <img class="avatar-img" [src]="authSvc.profile()!.photoUrl!" alt="foto" />
              } @else {
                <span class="avatar-initials">{{ initials() }}</span>
              }
            </a>

            <button class="action-btn action-btn--exit desktop-only" (click)="logout()">Salir</button>
          </div>

        </div>
      </header>

      <!-- ── CONTENT ───────────────────────────────────── -->
      <main class="content">
        <router-outlet />
      </main>

      <!-- ── Modal: cuenta suspendida ──────────────────── -->
      @if (isBlocked()) {
        <div style="position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:24px;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)">
          <div style="max-width:400px;width:100%;background:white;border-radius:20px;padding:40px 32px;text-align:center;box-shadow:0 16px 60px rgba(0,0,0,.2);border-top:4px solid #ef4444">
            <div style="width:64px;height:64px;border-radius:50%;background:#fee2e2;display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
            </div>
            <h2 style="font-size:1.2rem;font-weight:800;color:#1a1a2e;margin-bottom:10px">Cuenta suspendida</h2>
            <p style="font-size:14px;color:#666;line-height:1.6;margin-bottom:28px">
              Tu cuenta fue suspendida. Contactá al administrador para más información.
            </p>
            <div style="display:flex;flex-direction:column;gap:10px">
              <a href="https://wa.me/573128622945?text=Hola%2C%20mi%20cuenta%20de%20cliente%20en%20Agenda%20Co%20fue%20suspendida" target="_blank"
                style="width:100%;padding:13px;border-radius:12px;background:#25d366;color:white;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;box-shadow:0 4px 14px rgba(37,211,102,.3)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Contactar administrador
              </a>
              <button (click)="logout()"
                style="width:100%;padding:11px;border-radius:12px;border:1.5px solid #e5e7eb;background:none;font-size:13px;font-weight:600;color:#888;cursor:pointer;font-family:inherit">
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ── BOTTOM NAV (mobile) ───────────────────────── -->
      <nav class="bottom-nav">
        <a routerLink="/" class="bn-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span>Buscar</span>
        </a>
        <a routerLink="/cliente/citas" routerLinkActive="bn-item--active" class="bn-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>Mis citas</span>
        </a>
        <a routerLink="/cliente/mensajes" routerLinkActive="bn-item--active" class="bn-item" style="position:relative">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          @if (unreadCount() > 0) { <span class="bn-badge">{{ unreadCount() }}</span> }
          <span>Mensajes</span>
        </a>
        <a routerLink="/cliente/perfil" routerLinkActive="bn-item--active" class="bn-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Perfil</span>
        </a>
      </nav>

    </div>
    }
  `,
  styles: [`
    :host { display: block; height: 100vh; height: 100dvh; overflow: hidden; }

    .shell {
      display: flex;
      flex-direction: column;
      height: 100vh;
      height: 100dvh;
      background: var(--body-bg);
    }

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

    .msg-badge {
      position: absolute;
      top: 4px; right: 4px;
      background: var(--pink, #ec4899);
      color: white;
      border-radius: 20px;
      font-size: 10px; font-weight: 800;
      padding: 1px 5px; min-width: 16px;
      text-align: center;
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
      font-weight: 800; font-size: 14px;
      border-bottom: 1px solid #f0ebff;
      display: flex; justify-content: space-between; align-items: center;
    }
    .notif-mark-all {
      background: none; border: none; cursor: pointer;
      font-size: 12px; color: var(--purple); font-weight: 600;
    }
    .notif-empty { padding: 24px; text-align: center; color: #aaa; font-size: 13px; }
    .notif-item {
      padding: 12px 16px;
      border-bottom: 1px solid #f7f5ff;
      cursor: pointer; transition: background .12s;
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
      overflow: hidden; flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(124,58,237,.25);
      transition: transform .18s;
    }
    .avatar-btn:hover { transform: scale(1.07); }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; }
    .avatar-initials { font-size: 15px; font-weight: 800; color: white; }

    /* ── Content ──────────────────────────────── */
    .content { flex: 1; overflow-y: auto; }

    /* ── Bottom nav (hidden on desktop) ──────── */
    .bottom-nav { display: none; }

    /* ── Responsive ───────────────────────────── */
    .mobile-only { display: none; }

    @media (max-width: 768px) {
      .desktop-only { display: none !important; }
      .mobile-only  { display: flex !important; }

      .notif-panel {
        position: fixed;
        top: 70px;
        right: 8px;
        left: 8px;
        width: auto;
      }

      .content { padding-bottom: calc(68px + env(safe-area-inset-bottom)); }

      .bottom-nav {
        display: flex;
        position: fixed;
        bottom: 0; left: 0; right: 0;
        height: calc(64px + env(safe-area-inset-bottom));
        background: white;
        border-top: 1px solid #f0ebff;
        box-shadow: 0 -2px 16px rgba(0,0,0,.07);
        z-index: 100;
        padding: 0 4px;
        padding-bottom: env(safe-area-inset-bottom);
      }

      .bn-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        text-decoration: none;
        color: #aaa;
        font-size: 0.65rem;
        font-weight: 600;
        border-radius: 10px;
        transition: color .15s;
        position: relative;
      }
      .bn-item:hover { color: var(--purple); }
      .bn-item--active { color: var(--purple); }

      .bn-badge {
        position: absolute;
        top: 6px; right: calc(50% - 18px);
        background: #ec4899;
        color: white;
        border-radius: 20px;
        font-size: 9px; font-weight: 800;
        padding: 1px 4px; min-width: 14px;
        text-align: center;
      }
    }
  `],
})
export class ClientShellComponent implements OnDestroy {
  readonly authSvc  = inject(AuthService);
  private msgSvc    = inject(MessageService);
  private notifSvc  = inject(NotificationService);
  private firestore = inject(Firestore);
  private router    = inject(Router);

  isBlocked         = signal(false);
  unreadCount       = signal(0);
  unreadNotifCount  = signal(0);
  notifications     = signal<AppNotification[]>([]);
  notifPanelOpen    = signal(false);
  private msgSub:    Subscription | null = null;
  private notifSub:  Subscription | null = null;
  private unsubDoc?: () => void;

  initials = computed(() => {
    const name = this.authSvc.displayName() || this.authSvc.profile()?.email || '?';
    return name.split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('');
  });

  constructor() {
    const uid = this.authSvc.currentUser()?.uid;
    if (uid) {
      this.unsubDoc = onSnapshot(doc(this.firestore, 'users', uid), snap => {
        const data = snap.data() as any;
        this.isBlocked.set(data?.isActive === false);
      });

      this.msgSub = this.msgSvc.watchByClient(uid).subscribe({
        next: (msgs) => this.unreadCount.set(msgs.filter(m => m.senderRole === 'company' && !m.read).length),
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

  toggleNotifPanel() { this.notifPanelOpen.update(v => !v); }

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
    this.unsubDoc?.();
    this.msgSub?.unsubscribe();
    this.notifSub?.unsubscribe();
  }
}
