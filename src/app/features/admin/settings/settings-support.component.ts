import { Component, computed } from '@angular/core';
import { AppConfig, mailtoLink, validateSupport, whatsappLink } from '../../../core/domain/app-config';
import { ConfigSection } from './config-section';
import { SettingsSectionComponent } from './settings-section.component';

type SupportForm = AppConfig['support'];

/** WhatsApp y email de soporte: se muestran a las empresas (Facturación, cuenta deshabilitada, pagos). */
@Component({
  selector: 'app-settings-support',
  standalone: true,
  imports: [SettingsSectionComponent],
  styles: [`
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
    .form-group { margin-bottom: 12px; }
    .form-group input { padding: 9px 12px; font-size: 13px; }
    .hint { font-size: 11.5px; color: #888; line-height: 1.45; }
    .hint a { color: var(--purple); font-weight: 600; }
  `],
  template: `
    <app-settings-section
      title="Contacto y soporte"
      subtitle="Se muestra a las empresas donde dice “Escribinos”. Si los dejás vacíos, no se muestra nada."
      [state]="state()" [errors]="errors()" [dirty]="dirty()" [disabled]="!loaded()"
      (save)="save()">
      @if (!loaded()) {
        <p class="hint">Cargando configuración…</p>
      } @else {
        <div class="grid">
          <div class="form-group">
            <label>WhatsApp</label>
            <input type="tel" placeholder="57 300 123 4567" [value]="form().whatsapp"
              (input)="patch({ whatsapp: $any($event.target).value })" />
            <span class="hint">
              Con código de país.
              @if (wa(); as href) { Link: <a [href]="href" target="_blank" rel="noopener">{{ href }}</a> }
            </span>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" placeholder="soporte@agendago.co" [value]="form().email"
              (input)="patch({ email: $any($event.target).value })" />
            @if (mail(); as href) { <span class="hint">Link: <a [href]="href">{{ href }}</a></span> }
          </div>
        </div>
      }
    </app-settings-section>
  `,
})
export class SettingsSupportComponent extends ConfigSection<SupportForm> {
  readonly wa   = computed(() => whatsappLink(this.form().whatsapp));
  readonly mail = computed(() => mailtoLink(this.form().email));

  protected fromConfig(cfg: AppConfig): SupportForm {
    return { ...cfg.support };
  }

  save(): void {
    const f = { whatsapp: this.form().whatsapp.trim(), email: this.form().email.trim() };
    this.persist(validateSupport(f), { support: f });
  }
}
