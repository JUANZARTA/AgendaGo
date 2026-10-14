import { Component } from '@angular/core';
import { APP_VERSION } from '../../../core/version';
import { CHANGELOG } from '../../../core/changelog';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  template: `
    <div class="page">
      <div style="margin-bottom:24px">
        <h1 style="font-size:1.4rem;margin:0 0 4px">Configuración</h1>
        <p style="color:#888;font-size:13px;margin:0">Historial de versiones de AgendaGo</p>
      </div>

      <div class="card" style="margin-bottom:20px;padding:20px;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:13px;color:#888;font-weight:600">Versión actual</span>
        <span style="font-size:1.1rem;font-weight:800;color:#1a1a2e">v{{ APP_VERSION }}</span>
      </div>

      @for (entry of changelog; track entry.version) {
        <div class="card" style="margin-bottom:14px;padding:20px">
          <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:10px">
            <span style="font-size:1rem;font-weight:800;color:#1a1a2e">v{{ entry.version }}</span>
            <span style="font-size:12px;color:#aaa">{{ entry.fecha }}</span>
          </div>
          <ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px">
            @for (cambio of entry.cambios; track cambio) {
              <li style="font-size:13px;color:#444">{{ cambio }}</li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class AdminSettingsComponent {
  readonly APP_VERSION = APP_VERSION;
  readonly changelog = CHANGELOG;
}
