import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Appointment } from '../../../../core/services/appointment.service';
import { PROFILE_SETTINGS_STYLES } from './profile.styles';

/** Sección "Próximas citas" del perfil (presentacional). */
@Component({
  selector: 'app-profile-appointments',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    :host { display: contents; }

    ${PROFILE_SETTINGS_STYLES}

    /* ── Upcoming appointments ───────────────────────────── */
    .apt-row {
      display: flex; align-items: center; gap: 12px;
      padding: 11px 16px;
      border-bottom: 1px solid rgba(0,0,0,.05);
    }
    .apt-row:last-child { border-bottom: none; }
    .apt-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--gradient); flex-shrink: 0; }
  `],
  template: `
      <!-- ── PRÓXIMAS CITAS ─────────────────────────────── -->
      <div class="group-label">Próximas citas</div>
      <div class="settings-list">
        @if (loading()) {
          <div style="padding:14px 16px;color:#aaa;font-size:13px">Cargando...</div>
        } @else if (appointments().length === 0) {
          <div style="padding:14px 16px;font-size:13px;color:#aaa;display:flex;align-items:center;justify-content:space-between">
            <span>Sin citas programadas</span>
            <a routerLink="/" style="color:var(--purple);font-weight:600;font-size:13px">Buscar →</a>
          </div>
        } @else {
          @for (apt of appointments(); track apt.id) {
            <div class="apt-row">
              <div class="apt-dot"></div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ apt.companyName }}</div>
                <div style="font-size:12px;color:#888">{{ apt.serviceName }}</div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <div style="font-size:12px;font-weight:600">{{ formatDate(apt.date) }}</div>
                <div style="font-size:11px;color:#888">{{ apt.startTime }}</div>
              </div>
            </div>
          }
          <a routerLink="/cliente/citas"
             style="display:flex;align-items:center;justify-content:center;padding:11px 16px;font-size:13px;font-weight:700;color:var(--purple);text-decoration:none;gap:4px">
            Ver todas mis citas
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </a>
        }
      </div>
  `,
})
export class ProfileAppointmentsComponent {
  readonly loading      = input.required<boolean>();
  readonly appointments = input.required<Appointment[]>();

  formatDate(date: string): string {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  }
}
