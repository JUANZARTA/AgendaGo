import { Component } from '@angular/core';
import { AppConfig, LIMITS, validateTimes } from '../../../core/domain/app-config';
import { ConfigSection } from './config-section';
import { SettingsSectionComponent } from './settings-section.component';

type TimesForm = Pick<AppConfig, 'trialMonths' | 'warningDays' | 'graceDays'>;

/** Prueba gratis, días de aviso antes del vencimiento y días de gracia después. */
@Component({
  selector: 'app-settings-times',
  standalone: true,
  imports: [SettingsSectionComponent],
  styles: [`
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .form-group { margin-bottom: 12px; }
    .form-group input { padding: 9px 12px; font-size: 13px; }
    .hint { font-size: 11.5px; color: #888; line-height: 1.45; }
  `],
  template: `
    <app-settings-section
      title="Tiempos de suscripción"
      subtitle="La prueba gratis aplica a las empresas NUEVAS. El aviso y la gracia aplican a todas, al instante."
      [state]="state()" [errors]="errors()" [dirty]="dirty()" [disabled]="!loaded()"
      (save)="save()">
      @if (!loaded()) {
        <p class="hint">Cargando configuración…</p>
      } @else {
        <div class="grid">
          <div class="form-group">
            <label>Prueba gratis (meses)</label>
            <input type="number" step="1" [min]="L.trialMonths.min" [max]="L.trialMonths.max" [value]="form().trialMonths"
              (input)="patch({ trialMonths: num($any($event.target).value) })" />
            <span class="hint">De {{ L.trialMonths.min }} a {{ L.trialMonths.max }}. Se cuenta en meses calendario desde el alta.</span>
          </div>
          <div class="form-group">
            <label>Aviso antes de vencer (días)</label>
            <input type="number" step="1" [min]="L.warningDays.min" [max]="L.warningDays.max" [value]="form().warningDays"
              (input)="patch({ warningDays: num($any($event.target).value) })" />
            <span class="hint">De {{ L.warningDays.min }} a {{ L.warningDays.max }}. La empresa ve el aviso amarillo desde ese día.</span>
          </div>
          <div class="form-group">
            <label>Gracia después de vencer (días)</label>
            <input type="number" step="1" [min]="L.graceDays.min" [max]="L.graceDays.max" [value]="form().graceDays"
              (input)="patch({ graceDays: num($any($event.target).value) })" />
            <span class="hint">De {{ L.graceDays.min }} a {{ L.graceDays.max }}. Durante la gracia la cuenta sigue funcionando.</span>
          </div>
        </div>
      }
    </app-settings-section>
  `,
})
export class SettingsTimesComponent extends ConfigSection<TimesForm> {
  readonly L = LIMITS;

  protected fromConfig(cfg: AppConfig): TimesForm {
    return { trialMonths: cfg.trialMonths, warningDays: cfg.warningDays, graceDays: cfg.graceDays };
  }

  save(): void {
    const f = this.form();
    this.persist(validateTimes(f), { trialMonths: f.trialMonths, warningDays: f.warningDays, graceDays: f.graceDays });
  }
}
