import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-public-nav',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header style="background:white;border-bottom:1.5px solid #f0ebff;position:sticky;top:0;z-index:50;box-shadow:0 2px 16px rgba(124,58,237,.08)">
      <div style="max-width:1100px;margin:0 auto;padding:0 20px;height:64px;display:flex;align-items:center;gap:16px">

        <!-- Logo -->
        <a routerLink="/" style="display:flex;align-items:center;gap:10px;text-decoration:none;flex-shrink:0">
          <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#f43f5e);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(124,58,237,.3)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><line x1="18" y1="9" x2="18" y2="21"/><line x1="18" y1="3" x2="6" y2="15"/></svg>
          </div>
          <span style="font-weight:900;font-size:1.1rem;background:linear-gradient(135deg,#7c3aed,#f43f5e);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
            Agenda Co
          </span>
        </a>

        <div style="flex:1"></div>

        @if (auth.isLoggedIn()) {
          <!-- Usuario logueado -->
          <a routerLink="/perfil"
             title="Configuración"
             style="width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#f5f0ff;color:#7c3aed;text-decoration:none;transition:all .15s;flex-shrink:0"
             onmouseover="this.style.background='#ede9fe'"
             onmouseout="this.style.background='#f5f0ff'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </a>

          <!-- Avatar -->
          <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#f43f5e);display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 12px rgba(124,58,237,.25);flex-shrink:0;color:white;font-weight:800">
            {{ initials() }}
          </div>

          <!-- Salir -->
          <button (click)="logout()"
            style="padding:9px 18px;border-radius:10px;font-size:14px;font-weight:700;color:#7c3aed;background:#f5f0ff;border:none;cursor:pointer;transition:all .15s;white-space:nowrap"
            onmouseover="this.style.background='#ede9fe'"
            onmouseout="this.style.background='#f5f0ff'">
            Salir
          </button>

        } @else {
          <!-- Usuario no logueado -->
          <a routerLink="/auth/register"
             [queryParams]="{role:'company'}"
             style="display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,#f5f0ff,#fff0f4);border:1.5px solid #ede9fe;border-radius:20px;padding:8px 16px;font-size:13px;font-weight:700;color:#7c3aed;text-decoration:none;transition:all .15s;white-space:nowrap"
             onmouseover="this.style.boxShadow='0 4px 14px rgba(124,58,237,.2)'"
             onmouseout="this.style.boxShadow='none'">
            <span style="display:inline-flex;align-items:center;flex-shrink:0"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span> ¿Tenés un negocio? <span style="color:#f43f5e">Registrate gratis</span>
          </a>

          <a routerLink="/auth/login"
             style="padding:9px 18px;border-radius:10px;font-size:14px;font-weight:700;color:#7c3aed;background:#f5f0ff;text-decoration:none;transition:all .15s;white-space:nowrap"
             onmouseover="this.style.background='#ede9fe'"
             onmouseout="this.style.background='#f5f0ff'">
            Iniciar sesión
          </a>

          <a routerLink="/auth/register"
             style="padding:9px 18px;border-radius:10px;font-size:14px;font-weight:700;color:white;background:linear-gradient(135deg,#7c3aed,#f43f5e);text-decoration:none;box-shadow:0 4px 12px rgba(124,58,237,.3);transition:all .15s;white-space:nowrap"
             onmouseover="this.style.opacity='.9'"
             onmouseout="this.style.opacity='1'">
            Registrate
          </a>
        }

      </div>
    </header>
  `,
})
export class PublicNavComponent {
  auth = inject(AuthService);
  private router = inject(Router);

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
