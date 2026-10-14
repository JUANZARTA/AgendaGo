import { Component, output } from '@angular/core';
import { PROFILE_SETTINGS_STYLES } from './profile.styles';

/** Sección "Cuenta" (acciones deshabilitadas) y botón de cerrar sesión. */
@Component({
  selector: 'app-profile-account',
  standalone: true,
  styles: [`
    :host { display: contents; }

    ${PROFILE_SETTINGS_STYLES}

    /* ── Logout ──────────────────────────────────────────── */
    .logout-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; padding: 13px 16px; margin-top: 4px;
      background: #fef2f2; color: #ef4444;
      border: 1.5px solid #fecaca; border-radius: 12px;
      font-size: 14px; font-weight: 700;
      font-family: inherit; cursor: pointer;
      transition: background .15s;
    }
    .logout-btn:hover { background: #fee2e2; }
  `],
  template: `
      <!-- ── CUENTA ─────────────────────────────────────── -->
      <div class="group-label">Cuenta</div>
      <div class="settings-list">
        <button class="s-row disabled" disabled>
          <div class="row-icon" style="background:#eff6ff">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div class="row-text">
            <div class="row-label">Restablecer contraseña</div>
            <div class="row-sub">Próximamente</div>
          </div>
        </button>

        <button class="s-row disabled" style="color:#ef4444" disabled>
          <div class="row-icon" style="background:#fef2f2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
          </div>
          <div class="row-text">
            <div class="row-label">Eliminar cuenta</div>
            <div class="row-sub">Próximamente</div>
          </div>
        </button>
      </div>

      <!-- Logout -->
      <div style="padding:16px 16px 0">
        <button class="logout-btn" (click)="logout.emit()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Cerrar sesión
        </button>
      </div>
  `,
})
export class ProfileAccountComponent {
  readonly logout = output<void>();
}
