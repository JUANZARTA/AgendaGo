import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { Subscription as RxSubscription } from 'rxjs';
import { CompanyStore } from '../../core/services/company-store.service';
import { CompanyOnboardingComponent } from './onboarding/company-onboarding.component';
import { AuthService } from '../../core/services/auth.service';
import { SubscriptionService, Subscription } from '../../core/services/subscription.service';
import { NotificationService, AppNotification } from '../../core/services/notification.service';
import { TourService } from '../../core/services/tour.service';
import { MessageService } from '../../core/services/message.service';
import { SupportService } from '../../core/services/support.service';
import { ShareLinkModalComponent } from '../../shared/components/share-link-modal.component';
import { NavItem } from './shell/nav-item.model';
import { CompanySidebarComponent } from './shell/company-sidebar.component';
import { CompanyMobileHeaderComponent } from './shell/company-mobile-header.component';
import { CompanyBottomBarComponent } from './shell/company-bottom-bar.component';
import { NotificationsPanelComponent } from './shell/notifications-panel.component';
import { DisabledAccountModalComponent } from './shell/disabled-account-modal.component';
import { SubscriptionBannerComponent } from './shell/subscription-banner.component';
import { AnnouncementBannerComponent } from './shell/announcement-banner.component';

const APPOINTMENT_NOTIF_TYPES: AppNotification['type'][] = [
  'new_appointment', 'appointment_confirmed', 'appointment_cancelled',
];

/**
 * Contenedor del área de empresa: concentra suscripciones, efectos, routing y logout.
 * La UI vive en ./shell (componentes presentacionales con input()/output()).
 */
@Component({
  selector: 'app-company-shell',
  standalone: true,
  imports: [
    RouterOutlet, CompanyOnboardingComponent, ShareLinkModalComponent,
    CompanySidebarComponent, CompanyMobileHeaderComponent, CompanyBottomBarComponent,
    NotificationsPanelComponent, DisabledAccountModalComponent, SubscriptionBannerComponent, AnnouncementBannerComponent,
  ],
  template: `
    @if (companyStore.loading()) {
      <!-- Pantalla de carga inicial -->
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--body-bg)">
        <div style="text-align:center">
          <div class="spinner"></div>
          <p style="color:#888;font-size:14px;margin-top:16px">Cargando...</p>
        </div>
      </div>

    } @else if (!companyStore.company()) {
      <!-- Primera vez: wizard de configuración -->
      <app-company-onboarding />

    } @else {
      <!-- Shell normal con sidebar -->
      <div class="shell">

        <!-- ── SIDEBAR (desktop) ───────────────────────────────────── -->
        <app-company-sidebar
          [navItems]="navItems"
          [dotRoutes]="dotRoutes()"
          [unreadCount]="unreadCount()"
          [companyName]="companyStore.company()?.name"
          [subStatus]="sub()?.status"
          [subDaysLeft]="subDaysLeft()"
          (shareClick)="shareOpen.set(true)"
          (notificationsToggle)="notifPanelOpen.set(!notifPanelOpen())"
          (logoutClick)="logout()"
        />

        @if (shareOpen() && companyStore.companyId()) {
          <app-share-link-modal [companyId]="companyStore.companyId()!" (closed)="shareOpen.set(false)" />
        }

        <!-- ── MOBILE HEADER (hidden on desktop) ────────────────────── -->
        <app-company-mobile-header
          [unreadCount]="unreadCount()"
          (notificationsToggle)="notifPanelOpen.set(!notifPanelOpen())"
          (logoutClick)="logout()"
        />

        <!-- ── MAIN CONTENT ────────────────────────────────────────── -->
        <main class="content">
          <app-announcement-banner />
          <app-subscription-banner [subscription]="sub()" />
          <router-outlet/>
        </main>

        <!-- ── BOTTOM BAR (mobile) ────────────────────────────────── -->
        <app-company-bottom-bar
          [mainItems]="mainNavItems"
          [extraItems]="extraNavItems"
          [dotRoutes]="dotRoutes()"
          [unreadCount]="unreadCount()"
          (notificationsOpen)="notifPanelOpen.set(true)"
        />

        <!-- ── NOTIFICATION DRAWER ────────────────────────────────── -->
        @if (notifPanelOpen()) {
          <app-notifications-panel
            [notifications]="notifications()"
            [unreadCount]="unreadCount()"
            (closed)="notifPanelOpen.set(false)"
            (markAllRead)="markAllRead()"
            (notificationClick)="markNotifRead($event)"
          />
        }

      </div>

      <!-- ── Modal: empresa deshabilitada ──────────────────────────── -->
      @if (showDisabledModal()) {
        <app-disabled-account-modal (billingClick)="goToBilling()" (logoutClick)="logout()" />
      }

    }
  `,
  styles: [`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 3px solid #ede9fe;
      border-top-color: var(--purple);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin: 0 auto;
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
export class CompanyShellComponent implements OnDestroy {
  readonly companyStore        = inject(CompanyStore);
  private auth                 = inject(AuthService);
  private subscriptionService  = inject(SubscriptionService);
  private router               = inject(Router);
  private notifSvc             = inject(NotificationService);
  private messageSvc           = inject(MessageService);
  private tourSvc              = inject(TourService);
  private supportSvc           = inject(SupportService);

  sub              = signal<Subscription | null>(null);
  notifPanelOpen   = signal(false);
  shareOpen        = signal(false);
  notifications    = signal<AppNotification[]>([]);
  unreadCount      = computed(() => this.notifications().filter(n => !n.read).length);

  /** Citas nuevas/confirmadas/canceladas sin ver → punto en Dashboard. */
  private unreadAptNotifs = computed(() =>
    this.notifications().filter(n => !n.read && APPOINTMENT_NOTIF_TYPES.includes(n.type))
  );
  /** Mensajes de clientes sin leer → punto en Mensajes. */
  unreadMessages   = signal(false);
  /** Respuestas de soporte sin leer → punto en Facturación (ahí vive el chat de soporte). */
  unreadSupport    = signal(false);

  /** Rutas de navegación que muestran el punto de "novedades". */
  dotRoutes = computed(() => {
    const routes: string[] = [];
    if (this.unreadAptNotifs().length > 0) routes.push('/empresa/dashboard');
    if (this.unreadMessages())             routes.push('/empresa/mensajes');
    if (this.unreadSupport())              routes.push('/empresa/facturacion');
    return routes;
  });

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );

  showDisabledModal = computed(() =>
    this.companyStore.company()?.isActive === false &&
    !this.currentUrl().includes('/empresa/facturacion')
  );

  goToBilling() { this.router.navigate(['/empresa/facturacion']); }

  private rxSub: RxSubscription | null    = null;
  private notifSub: RxSubscription | null = null;
  private msgSub: RxSubscription | null   = null;
  private supportSub: RxSubscription | null = null;

  constructor() {
    effect(() => {
      const company = this.companyStore.company();
      if (company) this.tourSvc.startCompanyTour();
    });

    effect(() => {
      const companyId = this.companyStore.companyId();
      if (!companyId) return;

      this.rxSub?.unsubscribe();

      this.rxSub = this.subscriptionService.watchStatus(companyId).subscribe({
        next: (subscription) => this.sub.set(subscription),
        error: (err) => console.error('[CompanyShell] watchStatus error', err),
      });
    });

    effect(() => {
      const owner = this.companyStore.company()?.ownerId;
      if (!owner) return;
      this.notifSub?.unsubscribe();
      this.notifSub = this.notifSvc.watch(owner).subscribe(list => {
        this.notifications.set(list.slice(0, 30));
      });
    });

    effect(() => {
      const companyId = this.companyStore.companyId();
      if (!companyId) return;
      this.msgSub?.unsubscribe();
      this.msgSub = this.messageSvc.watchConversations(companyId).subscribe({
        next: msgs => this.unreadMessages.set(msgs.some(m => m.senderRole === 'client' && !m.read && !m.deleted)),
        error: err => console.error('[CompanyShell] watchConversations error', err),
      });
    });

    effect(() => {
      const companyId = this.companyStore.companyId();
      if (!companyId) return;
      this.supportSub?.unsubscribe();
      this.supportSub = this.supportSvc.watchCompanyThreads(companyId).subscribe({
        next: threads => this.unreadSupport.set(threads.some(t => t.unreadByCompany)),
        error: err => console.error('[CompanyShell] support threads error', err),
      });
    });

    // Estando en el Dashboard, las novedades de citas se dan por vistas (se apaga el punto)
    effect(() => {
      if (!this.currentUrl().startsWith('/empresa/dashboard')) return;
      const pending = this.unreadAptNotifs();
      pending.forEach(n => { if (n.id) this.notifSvc.markRead(n.id).catch(() => {}); });
    });
  }

  subDaysLeft = computed((): number => {
    const s = this.sub();
    if (!s) return 30;
    return this.subscriptionService.daysRemaining(s as any);
  });

  ngOnDestroy(): void {
    this.rxSub?.unsubscribe();
    this.notifSub?.unsubscribe();
    this.msgSub?.unsubscribe();
    this.supportSub?.unsubscribe();
  }

  async markNotifRead(n: AppNotification): Promise<void> {
    if (!n.read && n.id) await this.notifSvc.markRead(n.id);
    this.notifPanelOpen.set(false);
    const dest = n.link ?? this.routeForNotifType(n.type);
    if (dest) this.router.navigateByUrl(dest);
  }

  private routeForNotifType(type: AppNotification['type']): string {
    switch (type) {
      case 'new_appointment':
      case 'appointment_confirmed':
      case 'appointment_cancelled': return '/empresa/dashboard';
      case 'new_review':            return '/empresa/resenas';
      default:                      return '/empresa/dashboard';
    }
  }

  async markAllRead(): Promise<void> {
    const owner = this.companyStore.company()?.ownerId;
    if (owner) await this.notifSvc.markAllRead(owner);
  }

  logout() {
    this.auth.logout().subscribe();
    this.router.navigate(['/auth/login']);
  }

  readonly navItems: NavItem[] = [
    { label: 'Dashboard',   route: '/empresa/dashboard',   icon: 'grid'        },
    { label: 'Servicios',   route: '/empresa/servicios',   icon: 'list'        },
    { label: 'Horarios',    route: '/empresa/horarios',    icon: 'clock'       },
    { label: 'Perfil',      route: '/empresa/perfil',      icon: 'settings'    },
    { label: 'Equipo',      route: '/empresa/equipo',      icon: 'users'       },
    { label: 'Reseñas',     route: '/empresa/resenas',     icon: 'star'        },
    { label: 'Mensajes',      route: '/empresa/mensajes',      icon: 'message'     },
    { label: 'Estadísticas',  route: '/empresa/estadisticas',  icon: 'bar-chart'   },
    { label: 'Facturación',   route: '/empresa/facturacion',   icon: 'credit-card' },
  ];

  // Bottom bar mobile: 4 main + "Más"
  readonly mainNavItems: NavItem[] = [
    { label: 'Dashboard', route: '/empresa/dashboard', icon: 'grid'    },
    { label: 'Servicios', route: '/empresa/servicios', icon: 'list'    },
    { label: 'Horarios',  route: '/empresa/horarios',  icon: 'clock'   },
    { label: 'Mensajes',  route: '/empresa/mensajes',  icon: 'message' },
  ];

  readonly extraNavItems: NavItem[] = [
    { label: 'Perfil',      route: '/empresa/perfil',      icon: 'settings'    },
    { label: 'Equipo',      route: '/empresa/equipo',      icon: 'users'       },
    { label: 'Reseñas',       route: '/empresa/resenas',       icon: 'star'        },
    { label: 'Estadísticas',  route: '/empresa/estadisticas',  icon: 'bar-chart'   },
    { label: 'Facturación',   route: '/empresa/facturacion',   icon: 'credit-card' },
  ];
}
