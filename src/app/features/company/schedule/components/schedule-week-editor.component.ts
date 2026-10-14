import { Component, input, output } from '@angular/core';
import { DaySchedule } from '../../../../core/domain/schedule-validation';
import { SCHEDULE_SECTION_STYLES } from '../schedule.styles';
import { RangeChange, ScheduleDayRowComponent } from './schedule-day-row.component';

@Component({
  selector: 'app-schedule-week-editor',
  standalone: true,
  imports: [ScheduleDayRowComponent],
  styles: [`
    :host { display: block; }
    ${SCHEDULE_SECTION_STYLES}

    /* ── Day rows ─────────────────────────────────── */
    .day-list { display: flex; flex-direction: column; }
  `],
  template: `
      <!-- Configuración semanal -->
      <div class="sch-section">
        <div class="sch-section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Configuración semanal
        </div>

        <div class="day-list">
          @for (day of schedule(); track day.key) {
            <app-schedule-day-row
              [day]="day"
              [expandedDay]="expandedDay()"
              [error]="dayErrors()[day.key]"
              [slotInterval]="slotInterval()"
              [disabledSlots]="disabledSlots()"
              (toggleDay)="toggleDay.emit(day.key)"
              (toggleExpand)="toggleExpand.emit(day.key)"
              (rangeChange)="updateRange.emit({ dayKey: day.key, change: $event })"
              (addRange)="addRange.emit(day.key)"
              (removeRange)="removeRange.emit({ dayKey: day.key, idx: $event })"
              (toggleSlot)="toggleSlot.emit({ dayKey: day.key, slot: $event })" />
          }
        </div>
      </div>
  `,
})
export class ScheduleWeekEditorComponent {
  schedule      = input.required<DaySchedule[]>();
  expandedDay   = input.required<string | null>();
  dayErrors     = input.required<Record<string, string>>();
  slotInterval  = input.required<number>();
  disabledSlots = input.required<Record<string, boolean>>();

  toggleDay    = output<string>();
  toggleExpand = output<string>();
  updateRange  = output<{ dayKey: string; change: RangeChange }>();
  addRange     = output<string>();
  removeRange  = output<{ dayKey: string; idx: number }>();
  toggleSlot   = output<{ dayKey: string; slot: string }>();
}
