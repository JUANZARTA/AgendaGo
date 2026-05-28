import { Component, OnDestroy, inject, signal, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService, AppNotification } from '../../core/services/notification.service';

interface NavItem {
  label: string;
  route: string;
  icon: 'bar-chart' | 'home' | 'users' | 'credit-card';
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">

      <!-- ── SIDEBAR (desktop) ───────────────────────────────────── -->
      <aside class="sidebar">

        <!-- Branding -->
        <div class="logo">
          <svg class="logo-icon" viewBox="0 0 24 24" fill="none"
               stroke="white" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <circle cx="6" cy="6" r="3"/>
            <circle cx="18" cy="6" r="3"/>
            <line x1="8.5" y1="8.5" x2="18" y2="18"/>
            <line x1="5.5" y1="8.5" x2="15" y2="18"/>
            <line x1="12" y1="16" x2="12" y2="22"/>
          </svg>
          <div class="logo-text-group">
            <span class="logo-text">Agenda Co</span>
            <span class="logo-sub">Admin Panel</span>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="nav">
          @for (item of navItems; track item.route) {
            <a
              class="nav-item"
              [routerLink]="item.route"
              routerLinkActive="nav-item--active"
              [routerLinkActiveOptions]="{ exact: false }"
            >
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                @switch (item.icon) {
                  @case ('bar-chart') {
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6"  y1="20" x2="6"  y2="14"/>
                  }
                  @case ('home') {
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  }
                  @case ('users') {
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  }
                  @case ('credit-card') {
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  }
                }
              </svg>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          }
        </nav>

        <!-- Notificaciones -->
        <button class="nav-item" (click)="notifPanelOpen.set(!notifPanelOpen())"
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
          <span class="admin-email">{{ authSvc.currentUser()?.email }}</span>
          <button class="logout-btn" (click)="logout()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesión
          </button>
        </div>

      </aside>

      <!-- ── MAIN CONTENT ────────────────────────────────────────── -->
      <main class="content">
        <router-outlet/>
      </main>

      <!-- ── BOTTOM BAR (mobile) ────────────────────────────────── -->
      <nav class="bottom-bar">
        @for (item of navItems; track item.route) {
          <a
            class="bottom-item"
            [routerLink]="item.route"
            routerLinkActive="bottom-item--active"
            [routerLinkActiveOptions]="{ exact: false }"
          >
            <svg class="bottom-icon" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              @switch (item.icon) {
                @case ('bar-chart') {
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6"  y1="20" x2="6"  y2="14"/>
                }
                @case ('home') {
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                }
                @case ('users') {
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                }
                @case ('credit-card') {
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                }
              }
            </svg>
            <span class="bottom-label">{{ item.label }}</span>
          </a>
        }
      </nav>

      <!-- ── NOTIFICATION DRAWER ────────────────────────────────── -->
      @if (notifPanelOpen()) {
        <div style="position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:150" (click)="notifPanelOpen.set(false)"></div>
        <div style="position:fixed;top:0;right:0;height:100vh;width:360px;max-width:100vw;background:white;box-shadow:-8px 0 32px rgba(0,0,0,.15);z-index:151;display:flex;flex-direction:column;animation:slideInRight .25s ease">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 20px 14px;border-bottom:1px solid #e0e7ff">
            <h3 style="margin:0;font-size:16px;font-weight:800;color:#1a1a2e">Notificaciones</h3>
            <div style="display:flex;gap:8px;align-items:center">
              <button (click)="markAllRead()" [disabled]="unreadCount() === 0"
                style="font-size:12px;font-weight:600;color:#6366f1;background:none;border:none;cursor:pointer;padding:0;font-family:inherit"
                [style.opacity]="unreadCount() === 0 ? '0.4' : '1'">
                Leer todo
              </button>
              <button (click)="notifPanelOpen.set(false)"
                style="width:28px;height:28px;border-radius:8px;border:none;background:#eef2ff;color:#6366f1;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1">
                ×
              </button>
            </div>
          </div>
          <div style="flex:1;overflow-y:auto">
            @if (notifications().length === 0) {
              <div style="padding:48px 20px;text-align:center;color:#aaa;font-size:13px">Sin notificaciones aún</div>
            }
            @for (n of notifications(); track n.id) {
              <button (click)="markNotifRead(n)"
                style="display:flex;gap:12px;padding:14px 20px;cursor:pointer;border:none;border-bottom:1px solid #fafafa;background:white;width:100%;text-align:left;font-family:inherit;align-items:flex-start;transition:background .12s"
                [style.background]="n.read ? 'white' : '#f5f7ff'">
                <div style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0" [class]="notifIconClass(n.type)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    @switch (n.type) {
                      @case ('new_appointment') {
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      }
                      @case ('appointment_confirmed') { <polyline points="20 6 9 17 4 12"/> }
                      @case ('appointment_cancelled') {
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      }
                      @case ('new_review') {
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      }
                      @case ('new_company') {
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      }
                      @case ('plan_changed') {
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                        <line x1="1" y1="10" x2="23" y2="10"/>
                      }
                      @case ('payment_initiated') {
                        <line x1="12" y1="1" x2="12" y2="23"/>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      }
                      @case ('new_message') {
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      }
                    }
                  </svg>
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:13px;font-weight:700;color:#1a1a2e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ n.title }}</div>
                  <div style="font-size:12px;color:#6b7280;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ n.body }}</div>
                  <div style="font-size:11px;color:#aaa;margin-top:3px">{{ notifTimeAgo(n.createdAt) }}</div>
                </div>
                @if (!n.read) {
                  <div style="width:7px;height:7px;border-radius:50%;background:#6366f1;flex-shrink:0;margin-top:6px"></div>
                }
              </button>
            }
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    /* ── Keyframes ─────────────────────────────────────────────── */
    @keyframes fadeInLeft {
      from { opacity: 0; transform: translateX(-24px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }

    .icon-appointment { background: #ede9fe; color: #7c3aed; }
    .icon-confirmed   { background: #d1fae5; color: #065f46; }
    .icon-cancelled   { background: #fee2e2; color: #991b1b; }
    .icon-review      { background: #fef3c7; color: #92400e; }
    .icon-company     { background: #e0f2fe; color: #0369a1; }

    /* ── Shell ──────────────────────────────────────────────────── */
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
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

    /* ── Main content ───────────────────────────────────────────── */
    .content {
      flex: 1;
      overflow-y: auto;
      background: var(--body-bg);
      animation: fadeInUp 0.35s ease 0.1s backwards;
    }

    /* ── Bottom bar (mobile only) ───────────────────────────────── */
    .bottom-bar {
      display: none;
    }

    /* ── Responsive ─────────────────────────────────────────────── */
    @media (max-width: 768px) {
      .sidebar {
        display: none;
      }

      .shell {
        flex-direction: column;
      }

      .content {
        flex: 1;
        padding-bottom: 72px;
      }

      .bottom-bar {
        display: flex;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #ffffff;
        box-shadow: 0 -1px 12px rgba(0, 0, 0, 0.08);
        z-index: 100;
        height: 64px;
        padding: 0 8px;
      }

      .bottom-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        text-decoration: none;
        color: #a0a0b8;
        padding: 8px 4px;
        border-radius: 10px;
        transition: color 0.18s ease;
      }

      .bottom-item--active {
        color: var(--purple);
      }

      .bottom-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      .bottom-label {
        font-size: 0.65rem;
        font-weight: 600;
        letter-spacing: 0.01em;
        white-space: nowrap;
      }
    }
  `],
})
export class AdminShellComponent implements OnDestroy {
  readonly authSvc = inject(AuthService);
  private router   = inject(Router);
  private notifSvc = inject(NotificationService);

  notifPanelOpen = signal(false);
  notifications  = signal<AppNotification[]>([]);
  unreadCount    = computed(() => this.notifications().filter(n => !n.read).length);

  private notifSub: Subscription | null = null;

  constructor() {
    this.notifSub = this.notifSvc.watch('admin').subscribe(list => {
      this.notifications.set(list.slice(0, 30));
    });
  }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe();
  }

  async markNotifRead(n: AppNotification): Promise<void> {
    if (!n.read && n.id) await this.notifSvc.markRead(n.id);
    this.notifPanelOpen.set(false);
  }

  async markAllRead(): Promise<void> {
    await this.notifSvc.markAllRead('admin');
  }

  notifIconClass(type: AppNotification['type']): string {
    return ({
      new_appointment:       'icon-appointment',
      appointment_confirmed: 'icon-confirmed',
      appointment_cancelled: 'icon-cancelled',
      new_review:            'icon-review',
      new_company:           'icon-company',
      plan_changed:          'icon-company',
      payment_initiated:     'icon-appointment',
      new_message:           'icon-appointment',
    } as any)[type] ?? 'icon-appointment';
  }

  notifTimeAgo(ts: any): string {
    if (!ts?.seconds) return '';
    const diff = Math.floor(Date.now() / 1000) - ts.seconds;
    if (diff < 60)    return 'Ahora';
    if (diff < 3600)  return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} d`;
  }

  logout() {
    this.authSvc.logout().subscribe();
    this.router.navigate(['/auth/login']);
  }

  readonly navItems: NavItem[] = [
    { label: 'Métricas',     route: '/admin/metricas',     icon: 'bar-chart'  },
    { label: 'Empresas',     route: '/admin/empresas',     icon: 'home'       },
    { label: 'Usuarios',     route: '/admin/usuarios',     icon: 'users'      },
    { label: 'Facturación',  route: '/admin/facturacion',  icon: 'credit-card'},
  ];
}
