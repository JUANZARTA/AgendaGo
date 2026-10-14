import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { Firestore, doc, onSnapshot } from '@angular/fire/firestore';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService, AppNotification } from '../../core/services/notification.service';
import { TourService } from '../../core/services/tour.service';
import { ClientActivityService } from '../../core/services/client-activity.service';
import { ClientOnboardingComponent } from './onboarding/client-onboarding.component';
import { Subscription } from 'rxjs';
import { ClientHeaderComponent } from './shell/client-header.component';
import { ClientBottomNavComponent } from './shell/client-bottom-nav.component';
import { ClientBlockedModalComponent } from './shell/client-blocked-modal.component';

@Component({
  selector: 'app-client-shell',
  standalone: true,
  imports: [RouterOutlet, ClientOnboardingComponent, ClientHeaderComponent, ClientBottomNavComponent, ClientBlockedModalComponent],
  template: `
    @if (authSvc.profileLoaded() && !authSvc.profile()?.profileComplete) {
      <app-client-onboarding />
    } @else {
    <div class="shell" (click)="notifPanelOpen.set(false)">

      <!-- ── HEADER ───────────────────────────────────── -->
      <app-client-header
        [displayName]="authSvc.displayName()"
        [photoUrl]="authSvc.profile()?.photoUrl"
        [initials]="initials()"
        [hasAptNews]="activity.hasAptNews()"
        [hasUnreadMessages]="activity.hasUnreadMessages()"
        [unreadCount]="unreadNotifCount()"
        [notifications]="notifications()"
        [notifPanelOpen]="notifPanelOpen()"
        (toggleNotif)="toggleNotifPanel()"
        (markAllRead)="markAllRead()"
        (openNotif)="openNotif($event)"
        (logout)="logout()" />

      <!-- ── CONTENT ───────────────────────────────────── -->
      <main class="content">
        <router-outlet />
      </main>

      <!-- ── Modal: cuenta suspendida ──────────────────── -->
      @if (isBlocked()) {
        <app-client-blocked-modal (logout)="logout()" />
      }

      <!-- ── BOTTOM NAV (mobile) ───────────────────────── -->
      <app-client-bottom-nav
        [hasAptNews]="activity.hasAptNews()"
        [hasUnreadMessages]="activity.hasUnreadMessages()" />

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

    /* ── Content ──────────────────────────────── */
    .content { flex: 1; overflow-y: auto; }

    @media (max-width: 768px) {
      .content { padding-bottom: calc(68px + env(safe-area-inset-bottom)); }
    }
  `],
})
export class ClientShellComponent implements OnDestroy {
  readonly authSvc  = inject(AuthService);
  private notifSvc  = inject(NotificationService);
  private firestore = inject(Firestore);
  private router    = inject(Router);
  private tourSvc   = inject(TourService);

  isBlocked         = signal(false);
  unreadNotifCount  = signal(0);
  notifications     = signal<AppNotification[]>([]);
  notifPanelOpen    = signal(false);
  private notifSub:  Subscription | null = null;
  private unsubDoc?: () => void;

  readonly activity = inject(ClientActivityService);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );

  initials = computed(() => {
    const name = this.authSvc.displayName() || this.authSvc.profile()?.email || '?';
    return name.split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('');
  });

  constructor() {
    this.tourSvc.startClientTour();

    // Estando en "Mis citas", las novedades de citas se dan por vistas (se apaga el punto)
    effect(() => {
      if (!this.currentUrl().startsWith('/cliente/citas')) return;
      if (this.activity.hasAptNews()) this.activity.markAptNewsSeen();
    });

    // Suscripciones atadas al uid: si la sesión se resuelve después de crear el shell, igual arrancan
    effect(() => {
      const uid = this.authSvc.currentUser()?.uid;
      this.stopWatchers();
      if (!uid) return;

      this.unsubDoc = onSnapshot(doc(this.firestore, 'users', uid), snap => {
        const data = snap.data() as any;
        this.isBlocked.set(data?.isActive === false);
      });

      this.notifSub = this.notifSvc.watch(uid).subscribe({
        next: (notifs) => {
          this.notifications.set(notifs);
          this.unreadNotifCount.set(notifs.filter(n => !n.read).length);
        },
        error: (err) => console.error('[ClientShell] notifications error', err),
      });
    });
  }

  private stopWatchers() {
    this.unsubDoc?.();
    this.unsubDoc = undefined;
    this.notifSub?.unsubscribe();
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

  logout() {
    this.authSvc.logout().subscribe({ complete: () => this.router.navigate(['/']) });
  }

  ngOnDestroy() {
    this.stopWatchers();
  }
}
