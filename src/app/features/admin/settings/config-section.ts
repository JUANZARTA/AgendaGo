import { Directive, WritableSignal, effect, inject, signal, untracked } from '@angular/core';
import { AppConfigService } from '../../../core/services/app-config.service';
import { AppConfig } from '../../../core/domain/app-config';
import { SaveState } from './settings-section.component';

/**
 * Base de cada sección editable de Configuración: borrador en un signal (la app es zoneless),
 * se sincroniza con config/app mientras no haya cambios sin guardar, y guarda con merge.
 */
@Directive()
export abstract class ConfigSection<T> {
  protected appConfig = inject(AppConfigService);

  /** Hasta que llega el primer snapshot no se edita: guardar defaults pisaría lo real. */
  readonly loaded = this.appConfig.loaded;
  readonly form: WritableSignal<T>;
  readonly dirty  = signal(false);
  readonly state  = signal<SaveState>('idle');
  readonly errors = signal<string[]>([]);

  protected abstract fromConfig(cfg: AppConfig): T;

  constructor() {
    this.form = signal(this.fromConfig(this.appConfig.config()));
    effect(() => {
      const cfg = this.appConfig.config();
      if (!untracked(this.dirty)) this.form.set(this.fromConfig(cfg));
    });
  }

  /** Cambia campos del borrador. */
  patch(p: Partial<T>): void {
    this.form.update(f => ({ ...f, ...p }));
    this.dirty.set(true);
    if (this.state() !== 'saving') this.state.set('idle');
  }

  /** Descarta el borrador y vuelve a lo guardado. */
  discard(): void {
    this.dirty.set(false);
    this.errors.set([]);
    this.state.set('idle');
    this.form.set(this.fromConfig(this.appConfig.config()));
  }

  /** Guarda (si no hay errores de validación). Devuelve true si guardó. */
  protected async persist(errors: string[], data: Partial<AppConfig>): Promise<boolean> {
    this.errors.set(errors);
    if (errors.length) return false;
    this.state.set('saving');
    try {
      await this.appConfig.save(data);
      this.dirty.set(false);
      this.state.set('saved');
      // La escritura local ya actualizó config(): el borrador queda igual a lo guardado (normalizado)
      this.form.set(this.fromConfig(this.appConfig.config()));
      return true;
    } catch (err) {
      console.error('[AdminSettings] Error guardando config/app:', err);
      this.state.set('error');
      return false;
    }
  }

  /** Número desde un input (vacío → NaN, que la validación rechaza). */
  protected num(v: unknown): number {
    return v === '' || v === null || v === undefined ? NaN : Number(v);
  }
}
