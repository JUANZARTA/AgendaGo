import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/**
 * "Cerrar sesión" visible con texto al final del perfil / configuración.
 * En mobile el sidebar está oculto: sin esto el admin no tenía cómo salir.
 */
@Component({
  selector: 'app-logout-card',
  standalone: true,
  styles: [`
    :host { display: block; }
    .lo-btn {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 13px 16px; margin-bottom: 20px; border-radius: 14px; cursor: pointer; font-family: inherit;
      background: white; border: 1.5px solid #fecaca; color: #dc2626; font-size: 14px; font-weight: 700;
      transition: background .15s;
    }
    .lo-btn:hover { background: #fef2f2; }
  `],
  template: `
    <button type="button" class="lo-btn" (click)="logout()">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      Cerrar sesión
    </button>
  `,
})
export class LogoutCardComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.auth.logout().subscribe({ complete: () => this.router.navigate(['/auth/login']) });
  }
}
