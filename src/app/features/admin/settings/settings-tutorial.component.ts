import { Component, computed } from '@angular/core';
import { AppConfig, validateTutorialUrl } from '../../../core/domain/app-config';
import { normalizeYoutubeUrl } from '../../../core/domain/youtube-url';
import { ConfigSection } from './config-section';
import { SettingsSectionComponent } from './settings-section.component';

interface TutorialForm { tutorialUrl: string }

/** Link del video tutorial (YouTube): alimenta el botón "Ver tutorial" de empresas y clientes. */
@Component({
  selector: 'app-settings-tutorial',
  standalone: true,
  imports: [SettingsSectionComponent],
  styles: [`
    .form-group { margin-bottom: 12px; }
    .form-group input { padding: 9px 12px; font-size: 13px; width: 100%; box-sizing: border-box; }
    .hint { font-size: 11.5px; color: #888; line-height: 1.45; }
    .hint a { color: var(--purple); font-weight: 600; }
  `],
  template: `
    <app-settings-section
      title="Video tutorial"
      subtitle="Muestra el botón “Ver tutorial” a empresas y clientes. Si lo dejas vacío, no se muestra nada."
      [state]="state()" [errors]="errors()" [dirty]="dirty()" [disabled]="!loaded()"
      (save)="save()">
      @if (!loaded()) {
        <p class="hint">Cargando configuración…</p>
      } @else {
        <div class="form-group">
          <label>Link del video tutorial (YouTube)</label>
          <input type="url" placeholder="https://www.youtube.com/watch?v=…" [value]="form().tutorialUrl"
            (input)="patch({ tutorialUrl: $any($event.target).value })" />
          <span class="hint">
            Acepta youtube.com/watch?v=…, youtu.be/… y youtube.com/shorts/….
            @if (href(); as url) { <a [href]="url" target="_blank" rel="noopener">Probar link</a> }
          </span>
        </div>
      }
    </app-settings-section>
  `,
})
export class SettingsTutorialComponent extends ConfigSection<TutorialForm> {
  /** Sólo si el link es válido (el href nunca lleva algo que no sea YouTube). */
  readonly href = computed(() => normalizeYoutubeUrl(this.form().tutorialUrl));

  protected fromConfig(cfg: AppConfig): TutorialForm {
    return { tutorialUrl: cfg.tutorialUrl };
  }

  save(): void {
    const tutorialUrl = this.form().tutorialUrl.trim();
    this.persist(validateTutorialUrl(tutorialUrl), { tutorialUrl });
  }
}
