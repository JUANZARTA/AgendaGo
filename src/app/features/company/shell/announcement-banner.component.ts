import { Component, computed, inject, signal } from '@angular/core';
import { AppConfigService } from '../../../core/services/app-config.service';
import { announcementKey } from '../../../core/domain/app-config';

const STORAGE_KEY = 'agenda_announcement_closed';

/**
 * Anuncio general que publica el superadmin (config/app.announcement) arriba del contenido
 * de la empresa: azul (info) o amarillo (warning). Se puede cerrar por sesión; si el admin
 * cambia el texto o el nivel, vuelve a aparecer (se guarda un hash, no un booleano).
 */
@Component({
  selector: 'app-announcement-banner',
  standalone: true,
  styles: [`
    :host { display: block; }
    .banner {
      display: flex; align-items: center; gap: 12px;
      margin: 16px 20px 0; padding: 12px 16px; border-radius: 12px;
      font-size: 13px; line-height: 1.5; border: 1.5px solid;
    }
    .banner--info    { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
    .banner--warning { background: #fffbeb; border-color: #fde68a; color: #92400e; }
    .icon { font-size: 18px; flex-shrink: 0; }
    .text { flex: 1; min-width: 0; white-space: pre-line; word-break: break-word; }
    .close {
      flex-shrink: 0; background: none; border: none; cursor: pointer; font-size: 20px; line-height: 1;
      padding: 2px 4px; color: inherit; opacity: .6; font-family: inherit;
    }
    .close:hover { opacity: 1; }
    @media (max-width: 768px) { .banner { margin: 12px 12px 0; } }
  `],
  template: `
    @if (visible()) {
      <div class="banner" [class.banner--info]="ann().level === 'info'" [class.banner--warning]="ann().level === 'warning'" role="status">
        <span class="icon">{{ ann().level === 'warning' ? '⚠️' : '📢' }}</span>
        <span class="text">{{ ann().text }}</span>
        <button type="button" class="close" (click)="close()" title="Cerrar" aria-label="Cerrar aviso">×</button>
      </div>
    }
  `,
})
export class AnnouncementBannerComponent {
  private appConfig = inject(AppConfigService);

  readonly ann = computed(() => this.appConfig.config().announcement);
  private readonly key = computed(() => announcementKey(this.ann()));
  private readonly closedKey = signal<string | null>(readClosed());

  readonly visible = computed(() =>
    this.ann().active && !!this.ann().text.trim() && this.closedKey() !== this.key());

  close(): void {
    const k = this.key();
    this.closedKey.set(k);
    try { sessionStorage.setItem(STORAGE_KEY, k); } catch { /* modo privado: sólo en memoria */ }
  }
}

function readClosed(): string | null {
  try { return sessionStorage.getItem(STORAGE_KEY); } catch { return null; }
}
