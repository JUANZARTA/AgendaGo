import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeSwitcherComponent } from './theme-switcher.component';

@Component({
  selector: 'app-public-nav',
  standalone: true,
  imports: [RouterLink, ThemeSwitcherComponent],
  styles: [`
    .nav-actions { display: flex; align-items: center; gap: 16px; }
    .nav-hamburger {
      display: none;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      background: #f5f0ff;
      border-radius: 10px;
      cursor: pointer;
      color: var(--purple);
      flex-shrink: 0;
    }
    .nav-dropdown {
      display: none;
      flex-direction: column;
      gap: 8px;
      position: absolute;
      top: 64px;
      left: 0;
      right: 0;
      background: white;
      border-bottom: 1.5px solid #f0ebff;
      box-shadow: 0 8px 24px rgba(var(--primary-rgb),.12);
      padding: 12px 20px;
      z-index: 49;
    }
    .nav-dropdown.open { display: flex; }
    @media (max-width: 640px) {
      .nav-actions { display: none !important; }
      .nav-hamburger { display: flex !important; }
    }
  `],
  template: `
    <header style="background:white;border-bottom:1.5px solid #f0ebff;position:sticky;top:0;z-index:50;box-shadow:0 2px 16px rgba(var(--primary-rgb),.08)">
      <div style="max-width:1100px;margin:0 auto;padding:0 20px;height:64px;display:flex;align-items:center;gap:16px">

        <!-- Logo -->
        <a routerLink="/" style="display:flex;align-items:center;gap:10px;text-decoration:none;flex-shrink:0">
          <div style="width:36px;height:36px;border-radius:10px;background:var(--gradient);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(var(--primary-rgb),.3)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><line x1="18" y1="9" x2="18" y2="21"/><line x1="18" y1="3" x2="6" y2="15"/></svg>
          </div>
          <span style="font-weight:900;font-size:1.1rem;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
            Agenda Co
          </span>
        </a>

        <div style="flex:1"></div>

        <!-- Botón hamburguesa (solo mobile) -->
        <button class="nav-hamburger" (click)="menuOpen.set(!menuOpen())" [attr.aria-expanded]="menuOpen()">
          @if (menuOpen()) {
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          } @else {
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          }
        </button>

        <!-- Acciones desktop -->
        <div class="nav-actions">
          <app-theme-switcher/>
          @if (auth.isLoggedIn()) {
            <a routerLink="/perfil"
               title="Configuración"
               style="width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--btn-secondary-bg);color:var(--purple);text-decoration:none;transition:all .15s;flex-shrink:0"
               onmouseover="this.style.background='var(--btn-secondary-hover)'"
               onmouseout="this.style.background='var(--btn-secondary-bg)'">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </a>
            <div style="width:38px;height:38px;border-radius:50%;background:var(--gradient);display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 12px rgba(var(--primary-rgb),.25);flex-shrink:0;color:white;font-weight:800">
              {{ initials() }}
            </div>
            <button (click)="logout()"
              style="padding:9px 18px;border-radius:10px;font-size:14px;font-weight:700;color:var(--purple);background:var(--btn-secondary-bg);border:none;cursor:pointer;transition:all .15s;white-space:nowrap"
              onmouseover="this.style.background='var(--btn-secondary-hover)'"
              onmouseout="this.style.background='var(--btn-secondary-bg)'">
              Salir
            </button>
          } @else {
            <a routerLink="/auth/register"
               [queryParams]="{role:'company'}"
               style="display:flex;align-items:center;gap:8px;background:var(--gradient-soft);border:1.5px solid var(--form-border);border-radius:20px;padding:8px 16px;font-size:13px;font-weight:700;color:var(--purple);text-decoration:none;transition:all .15s;white-space:nowrap"
               onmouseover="this.style.boxShadow='0 4px 14px rgba(var(--primary-rgb),.2)'"
               onmouseout="this.style.boxShadow='none'">
              <span style="display:inline-flex;align-items:center;flex-shrink:0"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span> ¿Tenés un negocio? <span style="color:var(--pink)">Registrate gratis</span>
            </a>
            <a routerLink="/auth/login"
               style="padding:9px 18px;border-radius:10px;font-size:14px;font-weight:700;color:var(--purple);background:var(--btn-secondary-bg);text-decoration:none;transition:all .15s;white-space:nowrap"
               onmouseover="this.style.background='var(--btn-secondary-hover)'"
               onmouseout="this.style.background='var(--btn-secondary-bg)'">
              Iniciar sesión
            </a>
            <a routerLink="/auth/register"
               style="padding:9px 18px;border-radius:10px;font-size:14px;font-weight:700;color:white;background:var(--gradient);text-decoration:none;box-shadow:0 4px 12px rgba(var(--primary-rgb),.3);transition:all .15s;white-space:nowrap"
               onmouseover="this.style.opacity='.9'"
               onmouseout="this.style.opacity='1'">
              Registrate
            </a>
          }
        </div>

      </div>

      <!-- Dropdown mobile -->
      <nav class="nav-dropdown" [class.open]="menuOpen()">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0 8px;border-bottom:1px solid #f0ebff;margin-bottom:4px">
          <span style="font-size:12px;font-weight:700;color:#888;letter-spacing:.04em;text-transform:uppercase">Tema</span>
          <app-theme-switcher/>
        </div>
        @if (auth.isLoggedIn()) {
          <a routerLink="/perfil" (click)="menuOpen.set(false)"
             style="padding:12px 4px;font-size:15px;font-weight:700;color:var(--purple);text-decoration:none;border-bottom:1px solid #f0ebff">
            Configuración
          </a>
          <button (click)="logout(); menuOpen.set(false)"
            style="padding:12px 4px;font-size:15px;font-weight:700;color:var(--purple);background:none;border:none;cursor:pointer;text-align:left">
            Salir
          </button>
        } @else {
          <a routerLink="/auth/register" [queryParams]="{role:'company'}" (click)="menuOpen.set(false)"
             style="padding:12px 4px;font-size:14px;font-weight:700;color:var(--purple);text-decoration:none;border-bottom:1px solid #f0ebff">
            ¿Tenés un negocio? <span style="color:var(--pink)">Registrate gratis</span>
          </a>
          <a routerLink="/auth/login" (click)="menuOpen.set(false)"
             style="padding:12px 16px;font-size:14px;font-weight:700;color:var(--purple);background:var(--btn-secondary-bg);text-decoration:none;border-radius:10px;text-align:center">
            Iniciar sesión
          </a>
          <a routerLink="/auth/register" (click)="menuOpen.set(false)"
             style="padding:12px 16px;font-size:14px;font-weight:700;color:white;background:var(--gradient);text-decoration:none;border-radius:10px;text-align:center;box-shadow:0 4px 12px rgba(var(--primary-rgb),.3)">
            Registrate
          </a>
        }
      </nav>
    </header>
  `,
})
export class PublicNavComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  menuOpen = signal(false);

  initials() {
    const user = this.auth.currentUser();
    if (!user) return '?';
    const name = user.displayName || user.email || '';
    return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  }

  logout() {
    this.auth.logout().subscribe({ complete: () => this.router.navigate(['/']) });
  }
}
