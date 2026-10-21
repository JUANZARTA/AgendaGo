import { Component, computed, inject } from '@angular/core';
import { normalizeYoutubeUrl } from '../../core/domain/youtube-url';
import { AppConfigService } from '../../core/services/app-config.service';
import { BrandLogoComponent } from './brand-logo.component';

/**
 * Tarjeta "Ver tutorial" (perfil de empresa / cliente, configuración del admin).
 * El link lo define el superadmin en config/app.tutorialUrl; sin link (o inválido) no se dibuja nada.
 */
@Component({
  selector: 'app-tutorial-card',
  standalone: true,
  imports: [BrandLogoComponent],
  styles: [`
    :host { display: block; }
    .tc-card {
      background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(var(--primary-rgb), .12);
      padding: 18px 20px; margin-bottom: 20px;
    }
    .tc-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .tc-text { flex: 1; min-width: 180px; }
    .tc-title { font-size: 14px; font-weight: 700; color: #1a1a2e; }
    .tc-sub { font-size: 12px; color: #888; margin-top: 2px; }
    .tc-btn {
      padding: 9px 16px; border-radius: 10px; border: none; background: var(--gradient); color: white;
      font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; white-space: nowrap;
      text-decoration: none; display: inline-block;
    }
  `],
  template: `
    @if (url(); as href) {
      <div class="tc-card">
        <div class="tc-row">
          <app-brand-logo variant="tile" [size]="44" />
          <div class="tc-text">
            <div class="tc-title">¿Cómo funciona AgendaCo?</div>
            <div class="tc-sub">Mira el video tutorial paso a paso.</div>
          </div>
          <a class="tc-btn" [href]="href" target="_blank" rel="noopener">Ver tutorial</a>
        </div>
      </div>
    }
  `,
})
export class TutorialCardComponent {
  private readonly appConfig = inject(AppConfigService);
  readonly url = computed(() => normalizeYoutubeUrl(this.appConfig.config().tutorialUrl));
}
