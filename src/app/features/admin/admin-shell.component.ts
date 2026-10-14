import { Component, OnDestroy, inject, signal, computed } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService, AppNotification } from '../../core/services/notification.service';
import { SupportService } from '../../core/services/support.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { APP_VERSION } from '../../core/version';
import { AdminNavItem } from './shell/admin-nav-item.model';
import { AdminSidebarComponent } from './shell/admin-sidebar.component';
import { BrandLogoComponent } from '../../shared/components/brand-logo.component';
import { AdminBottomBarComponent } from './shell/admin-bottom-bar.component';
import { AdminNotificationsPanelComponent } from './shell/admin-notifications-panel.component';
import { safeInternalPath } from '../../core/domain/safe-links';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [BrandLogoComponent, RouterOutlet, AdminSidebarComponent, AdminBottomBarComponent, AdminNotificationsPanelComponent],
  template: `
    <div class="shell">

      <!-- ── SIDEBAR (desktop) ───────────────────────────────────── -->
      <app-admin-sidebar
        [navItems]="navItems"
        [unreadCount]="unreadCount()"
        [badges]="navBadges()"
        [email]="authSvc.currentUser()?.email"
        [version]="APP_VERSION"
        (notificationsToggle)="notifPanelOpen.set(!notifPanelOpen())"
        (logoutClick)="logout()"
      />

      <!-- ── HEADER (mobile): el sidebar está oculto, sin esto no hay campana ni salir ── -->
      <header class="m-header">
        <app-brand-logo variant="tile" [size]="34" />
        <span class="m-title">Admin</span>
        <div style="flex:1"></div>
        <button class="m-btn" title="Notificaciones" (click)="notifPanelOpen.set(!notifPanelOpen())">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          @if (unreadCount() > 0) { <span class="m-badge">{{ unreadCount() }}</span> }
        </button>
        <button class="m-btn m-btn--out" (click)="logout()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Salir
        </button>
      </header>

      <!-- ── MAIN CONTENT ────────────────────────────────────────── -->
      <main class="content">
        <router-outlet/>
      </main>

      <!-- ── BOTTOM BAR (mobile) ────────────────────────────────── -->
      <app-admin-bottom-bar [navItems]="navItems" [badges]="navBadges()" />

      <!-- ── NOTIFICATION DRAWER ────────────────────────────────── -->
      @if (notifPanelOpen()) {
        <app-admin-notifications-panel
          [notifications]="notifications()"
          [unreadCount]="unreadCount()"
          (closed)="notifPanelOpen.set(false)"
          (markAllRead)="markAllRead()"
          (notificationClick)="markNotifRead($event)"
        />
      }

    </div>
  `,
  styles: [`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Shell ──────────────────────────────────────────────────── */
    .shell {
      display: flex;
      height: 100vh;
      height: 100dvh;
      overflow: hidden;
    }

    /* ── Main content ───────────────────────────────────────────── */
    .content {
      flex: 1;
      overflow-y: auto;
      background: var(--body-bg);
      animation: fadeInUp 0.35s ease 0.1s backwards;
    }

    .m-header { display: none; }

    /* ── Responsive ─────────────────────────────────────────────── */
    @media (max-width: 768px) {
      .shell {
        flex-direction: column;
      }

      .m-header {
        display: flex; align-items: center; gap: 10px; flex-shrink: 0;
        padding: 10px 14px; padding-top: calc(10px + env(safe-area-inset-top));
        background: var(--sidebar-bg); color: white;
      }
      .m-title { font-weight: 900; font-size: 1rem; }
      .m-btn {
        position: relative; display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 10px;
        border-radius: 10px; border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.06);
        color: white; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit;
      }
      .m-btn--out { color: #fca5a5; border-color: rgba(252,165,165,.35); }
      .m-badge {
        position: absolute; top: -4px; right: -4px; background: #f43f5e; color: white; border-radius: 99px;
        font-size: 9px; font-weight: 700; padding: 1px 4px; min-width: 14px; text-align: center;
      }

      .content {
        flex: 1;
        padding-bottom: calc(72px + env(safe-area-inset-bottom));
      }
    }
  `],
})
export class AdminShellComponent implements OnDestroy {
  readonly APP_VERSION = APP_VERSION;
  readonly authSvc = inject(AuthService);
  private router   = inject(Router);
  private notifSvc = inject(NotificationService);
  private supportSvc = inject(SupportService);
  private subSvc     = inject(SubscriptionService);

  notifPanelOpen = signal(false);
  notifications  = signal<AppNotification[]>([]);
  unreadCount    = computed(() => this.notifications().filter(n => !n.read).length);

  /** Hilos de soporte sin leer por el admin → contador en "Soporte". */
  supportUnread = signal(0);
  navBadges     = computed<Record<string, number>>(() => ({ '/admin/soporte': this.supportUnread() }));

  private notifSub: Subscription | null = null;
  private supportSub: Subscription | null = null;

  constructor() {
    this.notifSub = this.notifSvc.watch('admin').subscribe(list => {
      this.notifications.set(list.slice(0, 30));
    });
    this.supportSub = this.supportSvc.watchAllThreads().subscribe({
      next: threads => this.supportUnread.set(threads.filter(t => t.unreadByAdmin).length),
      error: err => console.error('[AdminShell] support threads error', err),
    });
    this.expireOverdueSilently();
  }

  /**
   * Sin cron (plan Spark): al entrar al panel se marcan solas como vencidas las suscripciones
   * que pasaron la gracia → la empresa sale de la búsqueda y deja de recibir reservas.
   */
  private async expireOverdueSilently(): Promise<void> {
    try {
      const overdue = await this.subSvc.findOverdue();
      if (!overdue.length) return;
      const { expired, failed } = await this.subSvc.expireOverdue(overdue);
      console.info(`[AdminShell] Vencimientos automáticos: ${expired} marcadas` + (failed ? `, ${failed} con error` : ''));
    } catch (err) {
      console.error('[AdminShell] Error revisando vencimientos:', err);
    }
  }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe();
    this.supportSub?.unsubscribe();
  }

  async markNotifRead(n: AppNotification): Promise<void> {
    if (!n.read && n.id) await this.notifSvc.markRead(n.id);
    this.notifPanelOpen.set(false);
    // Ej: payment_initiated -> /admin/facturacion para activar el plan manualmente
    const dest = safeInternalPath(n.link);
    if (dest?.startsWith('/admin')) this.router.navigateByUrl(dest);
  }

  async markAllRead(): Promise<void> {
    await this.notifSvc.markAllRead('admin');
  }

  logout() {
    this.authSvc.logout().subscribe();
    this.router.navigate(['/auth/login']);
  }

  readonly navItems: AdminNavItem[] = [
    { label: 'Métricas',     route: '/admin/metricas',     icon: 'bar-chart'  },
    { label: 'Empresas',     route: '/admin/empresas',     icon: 'home'       },
    { label: 'Usuarios',     route: '/admin/usuarios',     icon: 'users'      },
    { label: 'Facturación',  route: '/admin/facturacion',  icon: 'credit-card'},
    { label: 'Soporte',      route: '/admin/soporte',      icon: 'message'    },
    { label: 'Configuración',route: '/admin/configuracion',icon: 'settings'   },
  ];
}
