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
import { AdminBottomBarComponent } from './shell/admin-bottom-bar.component';
import { AdminNotificationsPanelComponent } from './shell/admin-notifications-panel.component';
import { safeInternalPath } from '../../core/domain/safe-links';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, AdminSidebarComponent, AdminBottomBarComponent, AdminNotificationsPanelComponent],
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

    /* ── Responsive ─────────────────────────────────────────────── */
    @media (max-width: 768px) {
      .shell {
        flex-direction: column;
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
