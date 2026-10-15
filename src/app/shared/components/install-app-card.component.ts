import { Component, inject, signal } from '@angular/core';
import { PwaInstallService } from '../../core/services/pwa-install.service';
import { BrandLogoComponent } from './brand-logo.component';

/**
 * Tarjeta fija "Instalar app" (perfil de empresa / cliente, configuración del admin).
 * A diferencia del aviso automático, sigue disponible aunque lo hayan cerrado.
 * Se oculta sola si la app ya corre instalada.
 */
@Component({
  selector: 'app-install-app-card',
  standalone: true,
  imports: [BrandLogoComponent],
  styles: [`
    :host { display: block; }
    .ia-card {
      background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(var(--primary-rgb), .12);
      padding: 18px 20px; margin-bottom: 20px;
    }
    .ia-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .ia-text { flex: 1; min-width: 180px; }
    .ia-title { font-size: 14px; font-weight: 700; color: #1a1a2e; }
    .ia-sub { font-size: 12px; color: #888; margin-top: 2px; }
    .ia-btn {
      padding: 9px 16px; border-radius: 10px; border: none; background: var(--gradient); color: white;
      font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; white-space: nowrap;
    }
    .ia-help {
      margin-top: 14px; padding: 12px 14px; border-radius: 12px; background: var(--btn-secondary-bg);
      font-size: 13px; color: #374151; line-height: 1.6;
    }
    .ia-help ol { margin: 6px 0 0; padding-left: 18px; }
  `],
  template: `
    @if (pwa.available()) {
      <div class="ia-card">
        <div class="ia-row">
          <app-brand-logo variant="tile" [size]="44" />
          <div class="ia-text">
            <div class="ia-title">Instalar AgendaCo</div>
            <div class="ia-sub">Ábrela desde tu pantalla de inicio, como una app más.</div>
          </div>
          <button type="button" class="ia-btn" (click)="install()">Instalar app</button>
        </div>

        @if (help()) {
          <div class="ia-help">
            @if (pwa.isIos()) {
              <strong>En iPhone / iPad (Safari):</strong>
              <ol>
                <li>Toca el botón <strong>Compartir</strong> (el cuadrado con la flecha hacia arriba).</li>
                <li>Elige <strong>Agregar a inicio</strong>.</li>
                <li>Toca <strong>Agregar</strong>.</li>
              </ol>
            } @else {
              <strong>Tu navegador no ofreció la instalación automática.</strong>
              <ol>
                <li><strong>Chrome en Android:</strong> menú ⋮ → <strong>Instalar app</strong> o <strong>Agregar a pantalla principal</strong>.</li>
                <li><strong>Chrome o Edge en la compu:</strong> ícono de instalar a la derecha de la barra de direcciones.</li>
                <li>Si usas otro navegador, abre AgendaCo en Chrome.</li>
              </ol>
            }
          </div>
        }
      </div>
    }
  `,
})
export class InstallAppCardComponent {
  readonly pwa = inject(PwaInstallService);
  readonly help = signal(false);

  async install(): Promise<void> {
    // Con prompt nativo se instala directo; si no (iOS, ya usado, otro navegador), instrucciones
    if (this.pwa.canPrompt()) {
      await this.pwa.prompt();
      return;
    }
    this.help.set(!this.help());
  }
}
