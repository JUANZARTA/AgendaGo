import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-schedule-slot-grid',
  standalone: true,
  styles: [`
    :host { display: block; }

    /* ── Slot grid panel ──────────────────────────── */
    .slot-panel {
      overflow: hidden;
      max-height: 0;
      transition: max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.25s;
      opacity: 0;
    }
    .slot-panel.expanded { max-height: 600px; opacity: 1; }
    .slot-grid { display: flex; flex-wrap: wrap; gap: 7px; padding: 14px 0 6px 54px; }

    .slot-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      border-radius: 8px;
      border: 1.5px solid #d4bbff;
      background: #f3eeff;
      color: var(--purple);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      user-select: none;
    }
    .slot-btn:hover { border-color: var(--purple); background: #ebe4ff; }
    .slot-btn.disabled-slot {
      background: #f5f5f5;
      border-color: #e0e0e0;
      color: #bbb;
      opacity: 0.45;
      text-decoration: line-through;
    }
    .slot-btn.disabled-slot:hover { border-color: #ccc; background: #f0f0f0; }

    @media (max-width: 560px) {
      .slot-grid { padding-left: 0; }
    }
    @media (max-width: 400px) {
      .slot-grid { padding-left: 0; }
    }
  `],
  template: `
              <!-- Panel de turnos individuales -->
              <div class="slot-panel" [class.expanded]="expanded()">
                <div class="slot-grid">
                  @for (slot of slots(); track slot) {
                    <button
                      class="slot-btn"
                      [class.disabled-slot]="isSlotDisabled(slot)"
                      (click)="toggleSlot.emit(slot)">
                      @if (isSlotDisabled(slot)) {
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      }
                      {{ slot }}
                    </button>
                  }
                </div>
              </div>
  `,
})
export class ScheduleSlotGridComponent {
  dayKey        = input.required<string>();
  slots         = input.required<string[]>();
  expanded      = input.required<boolean>();
  disabledSlots = input.required<Record<string, boolean>>();

  toggleSlot = output<string>();

  isSlotDisabled(slot: string): boolean {
    return !!this.disabledSlots()[`${this.dayKey()}-${slot}`];
  }
}
