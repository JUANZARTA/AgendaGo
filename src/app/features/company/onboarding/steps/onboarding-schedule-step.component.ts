import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OB_SHARED_STYLES } from '../onboarding.styles';
import { SLOT_OPTIONS, StepNavigation } from '../onboarding.constants';

@Component({
  selector: 'app-onboarding-schedule-step',
  standalone: true,
  imports: [FormsModule],
  styles: [OB_SHARED_STYLES, `
    :host { display: block; }
    /* Schedule editor (step 4) */
    .day-rows { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
    .day-row {
      display: flex; align-items: center; gap: 10px;
      background: #fafafa; border-radius: 12px; padding: 10px 14px;
      border: 1.5px solid #f0e8ff; transition: opacity .18s;
    }
    .day-row.off { opacity: .45; }
    .day-name { font-size: 13px; font-weight: 700; color: #1a1a2e; width: 84px; flex-shrink: 0; }
    .time-input {
      border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 6px 10px;
      font-size: 13px; font-family: inherit; color: #1a1a2e; outline: none;
      width: 88px; transition: border-color .15s;
    }
    .time-input:focus { border-color: var(--purple); }
    .time-sep { color: #bbb; font-size: 13px; }
    @media (max-width: 500px) {
      .day-row { flex-wrap: wrap; gap: 8px; }
    }
  `],
  template: `
    <!-- ══ PASO 4: ¿Configurar horarios? ══ -->
    @if (step() === 4) {
        <div class="anim">
          <button class="ob-btn-back" (click)="navigate.emit({ to: 3 })">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Volver
          </button>
  
          <div class="ob-step-label">Paso 3 de 4 — Horarios</div>
          <h1 class="ob-title">¿Configuras tus horarios ahora?</h1>
          <p class="ob-subtitle">Si prefieres, puedes hacerlo después desde el panel de Horarios</p>
  
          <div class="choice-grid">
            <!-- Configurar ahora -->
            <button class="choice-card primary-choice" (click)="navigate.emit({ to: 5, prev: 4 })">
              <div class="choice-icon" style="background:rgba(255,255,255,.2)">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div class="choice-title">Configurar ahora</div>
              <div class="choice-desc">Define días y horarios de atención</div>
            </button>
  
            <!-- Después -->
            <button class="choice-card" (click)="navigate.emit({ to: 6, prev: 4 })">
              <div class="choice-icon" style="background:#f0e8ff">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div class="choice-title" style="color:#1a1a2e">Hacerlo después</div>
              <div class="choice-desc">Empezar con horarios por defecto</div>
            </button>
          </div>
  
          @if (error()) { <div class="error-box" style="margin-top:16px">{{ error() }}</div> }
        </div>
    }

    <!-- ══ PASO 5: Editor de horarios ══ -->
    @if (step() === 5) {
        <div class="anim">
          <button class="ob-btn-back" (click)="navigate.emit({ to: 4 })">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Volver
          </button>
  
          <div class="ob-step-label">Paso 3 de 4 — Horarios</div>
          <h1 class="ob-title">Configura tus horarios</h1>
          <p class="ob-subtitle">Puedes ajustar esto en detalle desde el panel de Horarios</p>
  
          <!-- Intervalo y staff -->
          <div class="ob-form-group">
            <label>Intervalo entre turnos</label>
            <p style="font-size:12px;color:#888;margin:0 0 6px">Cada cuánto muestras opciones de hora. La duración real viene de cada servicio.</p>
            <select [(ngModel)]="slotInterval">
              @for (opt of slotOptions; track opt.value) {
                <option [ngValue]="opt.value">{{ opt.label }}</option>
              }
            </select>
          </div>
  
  
          <!-- Días y horas -->
          <div class="day-rows">
            @for (day of scheduleLocal(); track day.key) {
              <div class="day-row" [class.off]="!day.enabled">
                <!-- Toggle -->
                <div class="toggle-wrap" (click)="day.enabled = !day.enabled">
                  <div class="toggle-track" [class.on]="day.enabled">
                    <div class="toggle-thumb"></div>
                  </div>
                </div>
  
                <span class="day-name">{{ day.label }}</span>
  
                @if (day.enabled) {
                  <input type="time" class="time-input" [(ngModel)]="day.ranges[0].open"  />
                  <span class="time-sep">–</span>
                  <input type="time" class="time-input" [(ngModel)]="day.ranges[0].close" />
                } @else {
                  <span style="font-size:12px;color:#bbb;margin-left:4px">Cerrado</span>
                }
              </div>
            }
          </div>
  
          <div style="height:24px"></div>
  
          @if (error()) { <div class="error-box">{{ error() }}</div> }
  
          <button class="ob-btn-primary" (click)="navigate.emit({ to: 6, prev: 5 })" [disabled]="creating()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            Continuar
          </button>
        </div>
    }
  `,
})
export class OnboardingScheduleStepComponent {
  readonly slotOptions = SLOT_OPTIONS;

  /** Sub-paso del contenedor: 4 = pregunta, 5 = editor */
  readonly step = input.required<number>();
  // Objeto mutado in situ por ngModel: se comparte por referencia con el contenedor
  readonly scheduleLocal = input.required<{ key: string; label: string; enabled: boolean; ranges: { open: string; close: string }[] }[]>();
  readonly slotInterval = model<number>(30);
  readonly error = input<string>('');
  readonly creating = input<boolean>(false);

  readonly navigate = output<StepNavigation>();
}
