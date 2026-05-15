import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeSwitcherComponent } from '../../shared/components/theme-switcher.component';
import { ClientOnboardingComponent } from './onboarding/client-onboarding.component';

@Component({
  selector: 'app-client-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ThemeSwitcherComponent, ClientOnboardingComponent],
  template: `
    @if (authSvc.profileLoaded() && !authSvc.profile()?.profileComplete) {
      <app-client-onboarding />
    } @else {
    <div class="shell">

      <!-- ── HEADER ──────────────────────────────────────────── -->
      <header class="header">
        <div class="header-brand">
          <svg class="brand-icon" viewBox="0 0 24 24" fill="none"
               stroke="white" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <circle cx="6" cy="6" r="3"/>
            <circle cx="18" cy="6" r="3"/>
            <line x1="8.5" y1="8.5" x2="18" y2="18"/>
            <line x1="5.5" y1="8.5" x2="15" y2="18"/>
            <line x1="12" y1="16" x2="12" y2="22"/>
          </svg>
          <span class="brand-name">Agenda Co</span>
        </div>

        <div class="header-actions">
          <app-theme-switcher />
          <a routerLink="/cliente/perfil" class="avatar-btn" [title]="authSvc.displayName()">
            @if (authSvc.profile()?.photoUrl) {
              <img class="avatar-img" [src]="authSvc.profile()!.photoUrl!" alt="foto de perfil" />
            } @else {
              <span class="avatar-initials">{{ initials() }}</span>
            }
          </a>
        </div>
      </header>

      <!-- ── CONTENT ─────────────────────────────────────────── -->
      <main class="content">
        <router-outlet />
      </main>

      <!-- ── BOTTOM NAV ──────────────────────────────────────── -->
      <nav class="bottom-nav">
        <a class="bottom-item"
           routerLink="/cliente/citas"
           routerLinkActive="bottom-item--active"
           [routerLinkActiveOptions]="{ exact: false }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>Mis citas</span>
        </a>

        <a class="bottom-item"
           routerLink="/"
           routerLinkActive="bottom-item--active"
           [routerLinkActiveOptions]="{ exact: true }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span>Buscar</span>
        </a>

        <a class="bottom-item"
           routerLink="/cliente/perfil"
           routerLinkActive="bottom-item--active"
           [routerLinkActiveOptions]="{ exact: false }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
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
    :host { display: block; height: 100vh; overflow: hidden; }

    .shell {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: var(--body-bg);
    }

    /* ── Header ──────────────────────────────────────────────── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      height: 56px;
      background: var(--sidebar-bg);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      flex-shrink: 0;
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand-icon {
      width: 26px;
      height: 26px;
      flex-shrink: 0;
    }

    .brand-name {
      font-size: 1rem;
      font-weight: 700;
      background: var(--sidebar-logo-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.02em;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .avatar-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      overflow: hidden;
      flex-shrink: 0;
      border: 2px solid rgba(255, 255, 255, 0.18);
      transition: transform 0.18s;
    }

    .avatar-btn:hover { transform: scale(1.08); }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-initials {
      font-size: 0.78rem;
      font-weight: 700;
      color: white;
      letter-spacing: 0.02em;
    }

    /* ── Content ─────────────────────────────────────────────── */
    .content {
      flex: 1;
      overflow-y: auto;
      padding-bottom: 72px;
    }

    /* ── Bottom nav ──────────────────────────────────────────── */
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 64px;
      background: var(--body-bg, #fff);
      border-top: 1px solid rgba(0, 0, 0, 0.07);
      display: flex;
      z-index: 100;
      box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
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
      font-size: 0.65rem;
      font-weight: 600;
      padding: 8px 4px;
      transition: color 0.18s;
    }

    .bottom-item--active { color: var(--purple); }
  `],
})
export class ClientShellComponent {
  readonly authSvc = inject(AuthService);

  initials = computed(() => {
    const name = this.authSvc.displayName() || this.authSvc.profile()?.email || '?';
    return name.split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('');
  });
}
