import { Component } from '@angular/core';
import { AnnouncementLevel, AppConfig, LIMITS, validateAnnouncement } from '../../../core/domain/app-config';
import { ConfigSection } from './config-section';
import { SettingsSectionComponent } from './settings-section.component';

type AnnouncementForm = AppConfig['announcement'];

/** Anuncio general arriba del panel de TODAS las empresas (se puede cerrar por sesión). */
@Component({
  selector: 'app-settings-announcement',
  standalone: true,
  imports: [SettingsSectionComponent],
  styles: [`
    .row { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; margin-bottom: 14px; }
    .check { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #555; cursor: pointer; }
    .check input { width: 16px; height: 16px; cursor: pointer; }
    .lvl { display: flex; gap: 6px; }
    .lvl button {
      padding: 6px 12px; border-radius: 999px; border: 1.5px solid #e5e7eb; background: white;
      font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; color: #666;
    }
    .lvl button.on-info    { background: #eff6ff; border-color: #93c5fd; color: #1e40af; }
    .lvl button.on-warning { background: #fffbeb; border-color: #fcd34d; color: #92400e; }
    .form-group { margin-bottom: 12px; }
    .form-group textarea { padding: 10px 12px; font-size: 13px; resize: vertical; font-family: inherit; }
    .hint { font-size: 11.5px; color: #888; }
    .preview-label { font-size: 11px; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: .04em; margin: 4px 0 6px; }
    .preview {
      display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px;
      font-size: 13px; line-height: 1.5; border: 1.5px solid; margin-bottom: 12px; white-space: pre-line;
    }
    .preview--info    { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
    .preview--warning { background: #fffbeb; border-color: #fde68a; color: #92400e; }
  `],
  template: `
    <app-settings-section
      title="Anuncio general"
      subtitle="Aparece arriba del panel de todas las empresas. Cada empresa lo puede cerrar; si cambiás el texto, vuelve a aparecer."
      [state]="state()" [errors]="errors()" [dirty]="dirty()" [disabled]="!loaded()"
      (save)="save()">
      @if (!loaded()) {
        <p class="hint">Cargando configuración…</p>
      } @else {
        <div class="row">
          <label class="check">
            <input type="checkbox" [checked]="form().active" (change)="patch({ active: $any($event.target).checked })" />
            Mostrar anuncio
          </label>
          <div class="lvl" role="group" aria-label="Tipo de anuncio">
            <button type="button" [class.on-info]="form().level === 'info'" (click)="setLevel('info')">Información</button>
            <button type="button" [class.on-warning]="form().level === 'warning'" (click)="setLevel('warning')">Advertencia</button>
          </div>
        </div>
        <div class="form-group">
          <label>Texto</label>
          <textarea rows="3" [attr.maxlength]="max" placeholder="Ej.: El sábado 10 hay mantenimiento de 2 a 4 a. m."
            [value]="form().text" (input)="patch({ text: $any($event.target).value })"></textarea>
          <span class="hint">{{ form().text.length }} / {{ max }}</span>
        </div>
        @if (form().text.trim()) {
          <p class="preview-label">Vista previa {{ form().active ? '' : '(desactivado: no se muestra)' }}</p>
          <div class="preview" [class.preview--info]="form().level === 'info'" [class.preview--warning]="form().level === 'warning'">
            <span>{{ form().level === 'warning' ? '⚠️' : '📢' }}</span><span>{{ form().text }}</span>
          </div>
        }
      }
    </app-settings-section>
  `,
})
export class SettingsAnnouncementComponent extends ConfigSection<AnnouncementForm> {
  readonly max = LIMITS.announcementText;

  protected fromConfig(cfg: AppConfig): AnnouncementForm {
    return { ...cfg.announcement };
  }

  setLevel(level: AnnouncementLevel): void { this.patch({ level }); }

  save(): void {
    const f = { ...this.form(), text: this.form().text.trim() };
    this.persist(validateAnnouncement(f), { announcement: f });
  }
}
