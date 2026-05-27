import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MessageService } from '../../core/services/message.service';
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
    <div class="shell">

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
  private msgSvc = inject(MessageService);
  private router = inject(Router);

  unreadCount = signal(0);
  private msgSub: Subscription | null = null;

  initials = computed(() => {
    const name = this.authSvc.displayName() || this.authSvc.profile()?.email || '?';
    return name.split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('');
  });

  constructor() {
    // Watch unread messages from companies
    const uid = this.authSvc.currentUser()?.uid;
    if (uid) {
      this.msgSub = this.msgSvc.watchByClient(uid).subscribe({
        next: (msgs) => {
          this.unreadCount.set(msgs.filter(m => m.senderRole === 'company' && !m.read).length);
        },
        error: () => {},
      });
    }
  }

  logout() {
    this.authSvc.logout().subscribe({ complete: () => this.router.navigate(['/']) });
  }

  ngOnDestroy() { this.msgSub?.unsubscribe(); }
}
