import { Component, input, output } from '@angular/core';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Tarjeta de una sección de Configuración: título, contenido proyectado y, si es editable,
 * errores de validación + estado (guardando / guardado / error) + botón Guardar.
 */
@Component({
  selector: 'app-settings-section',
  standalone: true,
  styles: [`
    :host { display: block; margin-bottom: 20px; }
    .card:hover { transform: none; }
    .head { margin-bottom: 16px; }
    .title { font-size: 1rem; font-weight: 800; color: #1a1a2e; margin: 0; }
    .sub { font-size: 12px; color: #888; margin: 3px 0 0; line-height: 1.5; }
    .errors {
      margin: 4px 0 12px; padding: 10px 14px; border-radius: 10px; background: #fef2f2;
      border: 1px solid #fecaca; color: #991b1b; font-size: 13px; list-style: none;
    }
    .errors li + li { margin-top: 4px; }
    .foot { display: flex; align-items: center; justify-content: flex-end; gap: 12px; flex-wrap: wrap; margin-top: 4px; }
    .st { font-size: 12px; font-weight: 600; }
    .st--saved { color: #15803d; }
    .st--error { color: #dc2626; }
    .st--dirty { color: #b45309; }
  `],
  template: `
    <section class="card">
      <div class="head">
        <h2 class="title">{{ title() }}</h2>
        @if (subtitle()) { <p class="sub">{{ subtitle() }}</p> }
      </div>

      <ng-content />

      @if (saveable()) {
        @if (errors().length) {
          <ul class="errors">
            @for (e of errors(); track e) { <li>{{ e }}</li> }
          </ul>
        }
        <div class="foot">
          @switch (state()) {
            @case ('saved') { <span class="st st--saved">✓ Guardado</span> }
            @case ('error') { <span class="st st--error">No se pudo guardar. Prueba de nuevo.</span> }
            @default {
              @if (dirty()) { <span class="st st--dirty">Cambios sin guardar</span> }
            }
          }
          <button type="button" class="btn btn-primary btn-sm" (click)="save.emit()"
            [disabled]="disabled() || state() === 'saving' || !dirty()">
            {{ state() === 'saving' ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      }
    </section>
  `,
})
export class SettingsSectionComponent {
  readonly title    = input.required<string>();
  readonly subtitle = input('');
  readonly saveable = input(true);
  readonly state    = input<SaveState>('idle');
  readonly errors   = input<string[]>([]);
  readonly dirty    = input(false);
  readonly disabled = input(false);

  readonly save = output<void>();
}
