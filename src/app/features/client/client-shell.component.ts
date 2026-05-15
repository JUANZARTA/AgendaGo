import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeSwitcherComponent } from '../../shared/components/theme-switcher.component';
import { ClientOnboardingComponent } from './onboarding/client-onboarding.component';

@Component({
  selector: 'app-client-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, ThemeSwitcherComponent, ClientOnboardingComponent],
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
          <app-theme-switcher />

          <!-- Buscar -->
          <a routerLink="/" class="action-btn action-btn--text">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Buscar
          </a>

          <!-- Gear → perfil -->
          <a routerLink="/cliente/perfil" class="action-btn action-btn--icon" title="Configuración"
             onmouseover="this.style.background='var(--btn-secondary-hover)'"
             onmouseout="this.style.background='var(--btn-secondary-bg)'">
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
          <button class="action-btn action-btn--text" (click)="logout()">Salir</button>
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
      transition: all .15s;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* Text+icon style (Buscar, Salir) */
    .action-btn--text {
      padding: 9px 14px;
      border-radius: 10px;
      font-size: 14px;
      color: var(--purple);
      background: var(--btn-secondary-bg);
    }
    .action-btn--text:hover { background: var(--btn-secondary-hover); }

    /* Icon-only style (gear) */
    .action-btn--icon {
      width: 38px; height: 38px;
      border-radius: 50%;
      justify-content: center;
      color: var(--purple);
      background: var(--btn-secondary-bg);
    }

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
export class ClientShellComponent {
  readonly authSvc = inject(AuthService);
  private router = inject(Router);

  initials = computed(() => {
    const name = this.authSvc.displayName() || this.authSvc.profile()?.email || '?';
    return name.split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('');
  });

  logout() {
    this.authSvc.logout().subscribe({ complete: () => this.router.navigate(['/']) });
  }
}
