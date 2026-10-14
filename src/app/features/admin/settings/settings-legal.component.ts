import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppConfig, LIMITS, validateLegal } from '../../../core/domain/app-config';
import { DEFAULT_PRIVACY, DEFAULT_TERMS, SUPPORT_EMAIL_TOKEN } from '../../../core/domain/legal';
import { ConfigSection } from './config-section';
import { SettingsSectionComponent } from './settings-section.component';

type LegalForm = Pick<AppConfig['legal'], 'terms' | 'privacy'>;

/**
 * Términos y condiciones + Política de tratamiento de datos (Ley 1581 de 2012).
 * Texto plano: las páginas públicas lo muestran con saltos de línea, sin HTML.
 */
@Component({
  selector: 'app-settings-legal',
  standalone: true,
  imports: [SettingsSectionComponent, RouterLink],
  styles: [`
    .form-group { margin-bottom: 16px; }
    .form-group textarea {
      padding: 12px 14px; font-size: 13px; line-height: 1.6; resize: vertical; font-family: inherit;
      min-height: 320px;
    }
    .label-row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
    .label-row a { font-size: 12px; color: var(--purple); font-weight: 700; }
    .hint { font-size: 11.5px; color: #888; line-height: 1.45; }
    .hint code { background: #f3f4f6; padding: 1px 5px; border-radius: 4px; font-size: 11px; }
    .meta { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
    .reset { background: none; border: none; padding: 0; cursor: pointer; font-family: inherit; font-size: 11.5px; color: #888; text-decoration: underline; }
    .reset:hover { color: var(--purple); }
  `],
  template: `
    <app-settings-section
      title="Términos y privacidad"
      subtitle="Textos públicos de Términos y condiciones y Política de tratamiento de datos (Ley 1581 de 2012). Se aceptan al registrarse."
      [state]="state()" [errors]="errors()" [dirty]="dirty()" [disabled]="!loaded()"
      (save)="save()">
      @if (!loaded()) {
        <p class="hint">Cargando configuración…</p>
      } @else {
        <p class="hint" style="margin:0 0 14px">
          Texto plano: dejá una línea en blanco entre párrafos. Donde escribas <code>{{ token }}</code> se muestra el email
          de “Contacto y soporte”.
          @if (updatedAt(); as d) { Última actualización: {{ d }}. } @else { Todavía no se guardaron: se muestran los borradores por defecto. }
        </p>

        <div class="form-group">
          <div class="label-row">
            <label for="legal-terms">Términos y condiciones</label>
            <a routerLink="/terminos" target="_blank" rel="noopener">Ver página ↗</a>
          </div>
          <textarea id="legal-terms" rows="16" [attr.maxlength]="max"
            [value]="form().terms" (input)="patch({ terms: $any($event.target).value })"></textarea>
          <div class="meta">
            <span class="hint">{{ form().terms.length.toLocaleString('es-CO') }} / {{ max.toLocaleString('es-CO') }}</span>
            <button type="button" class="reset" (click)="patch({ terms: defaultTerms })">Restaurar borrador por defecto</button>
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label for="legal-privacy">Política de privacidad (tratamiento de datos)</label>
            <a routerLink="/privacidad" target="_blank" rel="noopener">Ver página ↗</a>
          </div>
          <textarea id="legal-privacy" rows="16" [attr.maxlength]="max"
            [value]="form().privacy" (input)="patch({ privacy: $any($event.target).value })"></textarea>
          <div class="meta">
            <span class="hint">{{ form().privacy.length.toLocaleString('es-CO') }} / {{ max.toLocaleString('es-CO') }}</span>
            <button type="button" class="reset" (click)="patch({ privacy: defaultPrivacy })">Restaurar borrador por defecto</button>
          </div>
        </div>
      }
    </app-settings-section>
  `,
})
export class SettingsLegalComponent extends ConfigSection<LegalForm> {
  readonly max = LIMITS.legalText;
  readonly token = SUPPORT_EMAIL_TOKEN;
  readonly defaultTerms = DEFAULT_TERMS;
  readonly defaultPrivacy = DEFAULT_PRIVACY;

  readonly updatedAt = computed(() => {
    const d = this.appConfig.config().legal.updatedAt;
    return d ? d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  });

  protected fromConfig(cfg: AppConfig): LegalForm {
    return { terms: cfg.legal.terms, privacy: cfg.legal.privacy };
  }

  save(): void {
    const f = { terms: this.form().terms.trim(), privacy: this.form().privacy.trim() };
    // updatedAt lo reemplaza AppConfigService.save por serverTimestamp()
    this.persist(validateLegal(f), { legal: { ...f, updatedAt: null } });
  }
}
