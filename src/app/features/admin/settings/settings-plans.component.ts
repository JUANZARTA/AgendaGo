import { Component, computed, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { AppConfig, PLAN_KEYS, PlanConfig, changedPlanAmounts, validatePlans } from '../../../core/domain/app-config';
import { PLANS, PlanKey, formatCop } from '../../../core/domain/plans';
import { ConfigSection } from './config-section';
import { SettingsSectionComponent } from './settings-section.component';

type PlansForm = AppConfig['plans'];

/**
 * Planes y precios. Precio y link se editan JUNTOS: Wompi cobra el monto fijo del link y la app
 * reconoce el plan por el monto cobrado. Si cambia un precio, se pide confirmación.
 */
@Component({
  selector: 'app-settings-plans',
  standalone: true,
  imports: [SettingsSectionComponent],
  styles: [`
    .warn {
      padding: 12px 14px; border-radius: 10px; background: #fffbeb; border: 1px solid #fde68a;
      color: #92400e; font-size: 12.5px; line-height: 1.55; margin-bottom: 18px;
    }
    .warn strong { color: #78350f; }
    .plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; margin-bottom: 8px; }
    .plan { border: 1.5px solid #f0e8ff; border-radius: 12px; padding: 16px; }
    .plan-name { font-size: 14px; font-weight: 800; color: #1a1a2e; margin: 0 0 12px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-group { margin-bottom: 12px; }
    .form-group input { padding: 9px 12px; font-size: 13px; }
    .hint { font-size: 11.5px; color: #888; }
    .tag {
      display: inline-block; margin-left: 6px; padding: 1px 7px; border-radius: 999px; font-size: 10.5px;
      font-weight: 700; background: #dcfce7; color: #15803d; vertical-align: 1px;
    }
    .confirm {
      margin: 12px 0; padding: 14px 16px; border-radius: 12px; background: #fff7ed; border: 1.5px solid #fb923c;
      color: #7c2d12; font-size: 13px; line-height: 1.6;
    }
    .confirm ul { margin: 6px 0 10px 18px; padding: 0; }
    .confirm-actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
  `],
  template: `
    <app-settings-section
      title="Planes y precios"
      subtitle="Precio en pesos colombianos, días que suma cada pago y link de pago de Wompi."
      [state]="state()" [errors]="errors()" [dirty]="dirty()" [disabled]="!loaded() || !!pending()"
      (save)="askSave()">

      <div class="warn">
        <strong>Importante:</strong> Wompi cobra el monto <strong>FIJO</strong> que tiene cada link, y la app reconoce
        qué plan pagó la empresa <strong>por el monto cobrado</strong>. Por eso el precio y el link van juntos:
        si cambiás un precio, primero creá en Wompi un link <strong>NUEVO</strong> con exactamente ese monto y pegalo acá.
        Los pagos con el precio anterior ya no se reconocen solos (hay que revisarlos a mano).
      </div>

      @if (!loaded()) {
        <p class="hint">Cargando configuración…</p>
      } @else {
        <div class="plans">
          @for (key of keys; track key) {
            <div class="plan">
              <p class="plan-name">{{ label(key) }}</p>
              <div class="row">
                <div class="form-group">
                  <label>Precio (COP)</label>
                  <input type="number" min="1" step="1" [value]="form()[key].amount"
                    (input)="setPlan(key, { amount: num($any($event.target).value) })" />
                  <span class="hint">{{ fmt(form()[key].amount) }}</span>
                </div>
                <div class="form-group">
                  <label>Días por pago</label>
                  <input type="number" min="1" step="1" [value]="form()[key].days"
                    (input)="setPlan(key, { days: num($any($event.target).value) })" />
                </div>
              </div>
              <div class="form-group">
                <label>Link real (producción) @if (production) { <span class="tag">en uso acá</span> }</label>
                <input type="url" placeholder="https://checkout.wompi.co/l/…" [value]="form()[key].links.prod"
                  (input)="setLink(key, 'prod', $any($event.target).value)" />
              </div>
              <div class="form-group">
                <label>Link de pruebas (sandbox, usado en ng serve) @if (!production) { <span class="tag">en uso acá</span> }</label>
                <input type="url" placeholder="https://checkout.wompi.co/l/test_…" [value]="form()[key].links.test"
                  (input)="setLink(key, 'test', $any($event.target).value)" />
                <span class="hint">Vacío = el botón "Pagar" avisa que no hay link (nunca usa el de la otra modalidad).</span>
              </div>
            </div>
          }
        </div>
      }

      @if (pending(); as changed) {
        <div class="confirm" role="alertdialog">
          <strong>Vas a cambiar el precio de:</strong>
          <ul>
            @for (c of changed; track c.key) {
              <li>
                {{ label(c.key) }}: {{ fmt(c.from) }} → <strong>{{ fmt(c.to) }}</strong>
                @if (!c.linkChanged) { — <strong>¡no cambiaste su link!</strong> }
              </li>
            }
          </ul>
          El link de pago tiene que ser uno <strong>NUEVO</strong> creado en Wompi con ese mismo monto.
          Si no, Wompi va a cobrar el precio viejo y la app no va a reconocer el pago. ¿Guardar igual?
          <div class="confirm-actions" style="margin-top:10px">
            <button type="button" class="btn btn-secondary btn-sm" (click)="pending.set(null)">Cancelar</button>
            <button type="button" class="btn btn-primary btn-sm" (click)="doSave()">Sí, guardar</button>
          </div>
        </div>
      }
    </app-settings-section>
  `,
})
export class SettingsPlansComponent extends ConfigSection<PlansForm> {
  readonly keys = PLAN_KEYS;
  readonly production = environment.production;

  /** Cambios de precio esperando confirmación. */
  readonly pending = signal<{ key: PlanKey; from: number; to: number; linkChanged: boolean }[] | null>(null);

  private readonly saved = computed(() => this.appConfig.config().plans);

  protected fromConfig(cfg: AppConfig): PlansForm {
    return structuredClone(cfg.plans);
  }

  label(key: PlanKey): string { return PLANS[key].label; }
  fmt(n: number): string { return Number.isFinite(n) ? formatCop(n) : '—'; }

  setPlan(key: PlanKey, p: Partial<PlanConfig>): void {
    this.patch({ [key]: { ...this.form()[key], ...p } } as Partial<PlansForm>);
  }

  setLink(key: PlanKey, kind: 'test' | 'prod', value: string): void {
    this.setPlan(key, { links: { ...this.form()[key].links, [kind]: value } });
  }

  askSave(): void {
    const next = this.normalized();
    const errors = validatePlans(next);
    this.errors.set(errors);
    if (errors.length) return;
    const prev = this.saved();
    const changed = changedPlanAmounts(prev, next);
    if (changed.length) {
      this.pending.set(changed.map(key => ({
        key, from: prev[key].amount, to: next[key].amount,
        linkChanged: prev[key].links.prod !== next[key].links.prod || prev[key].links.test !== next[key].links.test,
      })));
      return;
    }
    this.doSave();
  }

  async doSave(): Promise<void> {
    this.pending.set(null);
    const next = this.normalized();
    await this.persist(validatePlans(next), { plans: next });
  }

  private normalized(): PlansForm {
    const f = this.form();
    const out = {} as PlansForm;
    for (const key of PLAN_KEYS) {
      out[key] = {
        amount: f[key].amount,
        days:   f[key].days,
        links:  { test: f[key].links.test.trim(), prod: f[key].links.prod.trim() },
      };
    }
    return out;
  }
}
