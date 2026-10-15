import { Component, input, model } from '@angular/core';
import { SCHEDULE_SECTION_STYLES } from '../schedule.styles';

@Component({
  selector: 'app-schedule-interval',
  standalone: true,
  styles: [`
    :host { display: block; }
    ${SCHEDULE_SECTION_STYLES}

    /* ── Duration selector ────────────────────────── */
    .duration-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .duration-btn {
      padding: 8px 16px;
      border-radius: 8px;
      border: 2px solid var(--form-border);
      background: #fdfbff;
      color: #555;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .duration-btn:hover { border-color: var(--purple); color: var(--purple); }
    .duration-btn.active { border-color: var(--purple); background: #ede9fe; color: var(--purple); }

    /* 5. Duration buttons en mobile */
    @media (max-width: 480px) {
      .duration-btn { padding: 6px 12px; font-size: 12px; }
    }
  `],
  template: `
      <!-- Intervalo de slots + Staff -->
      <div class="sch-section">
        <div class="sch-section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          Intervalo entre turnos
        </div>
        <p style="font-size:12px;color:#888;margin:0 0 12px">Cada cuánto muestras opciones de hora al cliente. La duración real viene de cada servicio.</p>
        <div class="duration-row">
          @for (d of durations(); track d) {
            <button class="duration-btn" [class.active]="slotInterval() === d" (click)="slotInterval.set(d)">
              {{ d }} min
            </button>
          }
        </div>

      </div>
  `,
})
export class ScheduleIntervalComponent {
  durations = input.required<readonly number[]>();
  slotInterval = model.required<number>();
}
