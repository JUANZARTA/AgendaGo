import { Component, computed, input, output } from '@angular/core';
import { DaySchedule, generateDaySlots, isRangeInvalid } from '../../../../core/domain/schedule-validation';
import { ampm } from '../schedule.utils';
import { SCHEDULE_ERROR_STYLES } from '../schedule.styles';
import { ScheduleSlotGridComponent } from './schedule-slot-grid.component';

export interface RangeChange {
  idx: number;
  field: 'open' | 'close';
  value: string;
}

@Component({
  selector: 'app-schedule-day-row',
  standalone: true,
  imports: [ScheduleSlotGridComponent],
  styles: [`
    :host { display: block; }
    ${SCHEDULE_ERROR_STYLES}

    /* ── Day rows ─────────────────────────────────── */
    .day-row {
      border-bottom: 1px solid var(--btn-secondary-bg);
      padding: 14px 0;
    }
    :host(:last-child) .day-row { border-bottom: none; }

    /* Top bar: toggle + label + chevron */
    .day-top {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    /* ── Toggle switch ────────────────────────────── */
    .toggle-wrap { flex-shrink: 0; display: flex; align-items: center; }
    .toggle-input { display: none; }
    .toggle-pill {
      display: inline-block;
      width: 40px; height: 22px;
      border-radius: 11px;
      background: #ddd;
      position: relative;
      cursor: pointer;
      transition: background 0.2s;
    }
    .toggle-pill::after {
      content: '';
      position: absolute;
      top: 3px; left: 3px;
      width: 16px; height: 16px;
      border-radius: 50%;
      background: white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      transition: transform 0.2s;
    }
    .toggle-input:checked + .toggle-pill { background: var(--purple); }
    .toggle-input:checked + .toggle-pill::after { transform: translateX(18px); }

    .day-label {
      font-weight: 700;
      font-size: 14px;
      color: #1a1a2e;
      min-width: 86px;
    }
    .day-label.disabled { color: #aaa; }

    .day-closed {
      flex: 1;
      font-size: 13px;
      color: #bbb;
      font-style: italic;
    }

    /* ── Ranges area ──────────────────────────────── */
    .day-body {
      margin-top: 10px;
      padding-left: 54px; /* align under day label */
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .range-row {
      display: flex;
      align-items: center;
      gap: 8px;
      animation: fadeSlideIn 0.2s ease both;
    }
    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .time-input {
      padding: 6px 10px;
      border: 2px solid var(--form-border);
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #1a1a2e;
      background: #fdfbff;
      width: 96px;
      transition: border-color 0.15s;
      cursor: pointer;
    }
    .time-input.time-invalid { border-color: #ef4444; background: #fef2f2; }
    .time-input:focus { outline: none; border-color: var(--purple); }

    .time-sep { font-size: 13px; color: #aaa; font-weight: 500; }

    .remove-range-btn {
      width: 26px; height: 26px;
      border-radius: 6px;
      border: 1.5px solid #fecdd3;
      background: #fff1f2;
      color: var(--pink);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
      flex-shrink: 0;
    }
    .remove-range-btn:hover { background: #ffe4e8; border-color: #f43f5e; }

    .add-range-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      border-radius: 7px;
      border: 1.5px dashed #c4b5fd;
      background: transparent;
      color: var(--purple);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      align-self: flex-start;
    }
    .add-range-btn:hover { border-color: var(--purple); background: var(--btn-secondary-bg); }

    /* ── Chevron expand ───────────────────────────── */
    .expand-btn {
      margin-left: auto;
      background: none;
      border: none;
      cursor: pointer;
      color: #bbb;
      display: flex;
      align-items: center;
      padding: 4px;
      border-radius: 6px;
      transition: color 0.15s, background 0.15s, transform 0.22s;
    }
    .expand-btn:hover { color: var(--purple); background: var(--btn-secondary-bg); }
    .expand-btn.open { transform: rotate(180deg); color: var(--purple); }

    @media (max-width: 560px) {
      .day-body { padding-left: 0; }
      .day-label { min-width: 70px; font-size: 13px; }
      .time-input { width: 84px; font-size: 12px; }
    }

    /* 2. Time inputs en <400px */
    @media (max-width: 400px) {
      .time-input { width: 76px; font-size: 12px; padding: 5px 6px; }
      .day-label { min-width: 62px; font-size: 13px; }
      .day-body { padding-left: 0; }
    }

    /* 3. add-range-btn y range-row en mobile */
    @media (max-width: 480px) {
      .add-range-btn { font-size: 11px; padding: 4px 10px; }
      .range-row { flex-wrap: wrap; gap: 6px; }
    }

    /* 4. font-size 16px para evitar zoom en iOS */
    @media (max-width: 640px) {
      .time-input { font-size: 16px; }
    }
  `],
  template: `
            <div class="day-row">

              <!-- Fila superior: toggle + nombre + chevron -->
              <div class="day-top">
                <div class="toggle-wrap" (click)="toggleDay.emit()">
                  <input
                    class="toggle-input"
                    type="checkbox"
                    [id]="'tog-' + day().key"
                    [checked]="day().enabled"
                    (change)="toggleDay.emit()" />
                  <label class="toggle-pill" [for]="'tog-' + day().key"></label>
                </div>

                <span class="day-label" [class.disabled]="!day().enabled">{{ day().label }}</span>

                @if (!day().enabled) {
                  <span class="day-closed">Cerrado</span>
                }

                @if (day().enabled) {
                  <button
                    class="expand-btn"
                    [class.open]="expandedDay() === day().key"
                    (click)="toggleExpand.emit()"
                    title="Ver turnos disponibles">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                }
              </div>

              <!-- Franjas horarias -->
              @if (day().enabled) {
                <div class="day-body">
                  @for (range of day().ranges; track $index; let i = $index) {
                    <div class="range-row">
                      <input
                        class="time-input"
                        type="time"
                        [class.time-invalid]="isRangeInvalid(range)"
                        [value]="range.open"
                        (change)="rangeChange.emit({ idx: i, field: 'open', value: $any($event.target).value })" />
                      <span style="font-size:10px;font-weight:700;color:#888;min-width:20px">{{ ampm(range.open) }}</span>
                      <span class="time-sep">—</span>
                      <input
                        class="time-input"
                        type="time"
                        [class.time-invalid]="isRangeInvalid(range)"
                        [value]="range.close"
                        (change)="rangeChange.emit({ idx: i, field: 'close', value: $any($event.target).value })" />
                      <span style="font-size:10px;font-weight:700;color:#888;min-width:20px">{{ ampm(range.close) }}</span>

                      @if (day().ranges.length > 1) {
                        <button
                          class="remove-range-btn"
                          title="Eliminar franja"
                          (click)="removeRange.emit(i)">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      }
                    </div>
                  }

                  @if (error(); as err) {
                    <div class="range-error">{{ err }}</div>
                  }

                  <button class="add-range-btn" (click)="addRange.emit()">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Agregar franja
                  </button>
                </div>
              }

              <app-schedule-slot-grid
                [dayKey]="day().key"
                [slots]="slots()"
                [expanded]="expandedDay() === day().key && day().enabled"
                [disabledSlots]="disabledSlots()"
                (toggleSlot)="toggleSlot.emit($event)" />

            </div>
  `,
})
export class ScheduleDayRowComponent {
  day           = input.required<DaySchedule>();
  expandedDay   = input.required<string | null>();
  error         = input<string | undefined>();
  slotInterval  = input.required<number>();
  disabledSlots = input.required<Record<string, boolean>>();

  toggleDay    = output<void>();
  toggleExpand = output<void>();
  rangeChange  = output<RangeChange>();
  addRange     = output<void>();
  removeRange  = output<number>();
  toggleSlot   = output<string>();

  slots = computed(() => generateDaySlots(this.day(), this.slotInterval()));

  readonly isRangeInvalid = isRangeInvalid;
  readonly ampm = ampm;
}
