import { Component, signal } from '@angular/core';
import { APP_VERSION } from '../../../core/version';
import { CHANGELOG, ChangelogEntry } from '../../../core/changelog';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  template: `
    <div class="page">
      <div style="margin-bottom:24px">
        <h1 style="font-size:1.4rem;margin:0 0 4px">Configuración</h1>
        <p style="color:#888;font-size:13px;margin:0">Historial de versiones de AgendaGo</p>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px">
        @for (entry of changelog; track entry.version) {
          <button
            type="button"
            (click)="selected.set(entry)"
            class="card"
            style="padding:14px 16px;text-align:left;cursor:pointer;background:white;font-family:inherit;transition:transform .15s,box-shadow .15s"
            [style.border]="entry.version === APP_VERSION ? '2px solid #7c3aed' : '1px solid #eee'"
            onmouseover="this.style.transform='translateY(-2px)'"
            onmouseout="this.style.transform='translateY(0)'"
          >
            <p style="font-weight:800;color:#1a1a2e;margin:0">v{{ entry.version }}</p>
            <p style="font-size:12px;color:#aaa;margin:2px 0 0">{{ entry.fecha }}</p>
            @if (entry.version === APP_VERSION) {
              <p style="font-size:11px;font-weight:700;color:#7c3aed;margin:6px 0 0">Actual</p>
            }
          </button>
        }
      </div>

      @if (selected(); as entry) {
        <div style="position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:24px" (click)="selected.set(null)">
          <div style="background:white;border-radius:16px;padding:28px;max-width:420px;width:100%;max-height:80vh;overflow-y:auto;box-shadow:0 16px 48px rgba(0,0,0,.18);position:relative" (click)="$event.stopPropagation()">
            <button
              type="button"
              (click)="selected.set(null)"
              title="Cerrar"
              aria-label="Cerrar"
              style="position:absolute;top:14px;right:14px;background:none;border:none;cursor:pointer;color:#aaa;font-size:20px;line-height:1;padding:4px"
            >×</button>

            <h3 style="font-size:1.1rem;font-weight:800;color:#1a1a2e;margin:0 0 4px">v{{ entry.version }}</h3>
            <p style="font-size:12px;color:#aaa;margin:0 0 16px">
              {{ entry.fecha }}
              @if (entry.version === APP_VERSION) {
                <span style="margin-left:8px;font-weight:700;color:#7c3aed">Actual</span>
              }
            </p>

            <ul style="margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px">
              @for (cambio of entry.cambios; track cambio) {
                <li style="font-size:13px;color:#444;display:flex;gap:8px">
                  <span style="color:#7c3aed">•</span><span>{{ cambio }}</span>
                </li>
              }
            </ul>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminSettingsComponent {
  readonly APP_VERSION = APP_VERSION;
  readonly changelog = CHANGELOG;
  readonly selected = signal<ChangelogEntry | null>(null);
}
