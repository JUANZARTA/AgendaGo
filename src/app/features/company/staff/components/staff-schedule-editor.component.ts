import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DAY_LABELS, DAY_ORDER, STAFF_INPUT_MEDIA_STYLES, StaffDraft } from '../staff.utils';

/** Toggle empresa/propio + editor de días y horas. Muta el `draft` del contenedor (igual que antes). */
@Component({
  selector: 'app-staff-schedule-editor',
  standalone: true,
  imports: [FormsModule],
  styles: [`
    :host { display: contents; }

    .toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .toggle-track {
      width: 38px; height: 22px; border-radius: 11px; background: #e5e7eb;
      position: relative; transition: background .2s; flex-shrink: 0; cursor: pointer;
    }
    .toggle-track.on { background: var(--purple); }
    .toggle-thumb {
      width: 16px; height: 16px; border-radius: 50%; background: white;
      position: absolute; top: 3px; left: 3px;
      transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.2);
    }
    .toggle-track.on .toggle-thumb { transform: translateX(16px); }
    ${STAFF_INPUT_MEDIA_STYLES}
  `],
  template: `
    <!-- Toggle: empresa vs personalizado -->
    <div class="toggle-row" style="background:#f9f5ff;border:1.5px solid #f0e8ff;border-radius:12px;padding:12px 14px;margin-bottom:10px">
      <div>
        @if (draft.useCustomSchedule) {
          <div style="font-size:13px;font-weight:700;color:#1a1a2e">Horario propio</div>
          <div style="font-size:11px;color:#888;margin-top:2px">Este profesional tiene días y horarios distintos</div>
        } @else {
          <div style="font-size:13px;font-weight:700;color:#1a1a2e">Horario de la empresa</div>
          <div style="font-size:11px;color:#888;margin-top:2px">Activa si tiene días u horas diferentes</div>
        }
      </div>
      <div class="toggle-track" [class.on]="draft.useCustomSchedule" (click)="draft.useCustomSchedule = !draft.useCustomSchedule">
        <div class="toggle-thumb"></div>
      </div>
    </div>

    <!-- Editor de horario (solo si personalizado) -->
    @if (draft.useCustomSchedule) {
      <div style="display:flex;flex-direction:column;gap:5px">
        @for (day of dayOrder; track day) {
          <div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:10px;border:1.5px solid #e5e7eb;flex-wrap:wrap">
            <label style="display:flex;align-items:center;gap:7px;cursor:pointer;min-width:88px;flex-shrink:0">
              <input type="checkbox" [(ngModel)]="draft.schedule[day].enabled"
                     style="width:15px;height:15px;cursor:pointer;accent-color:var(--purple)" />
              <span style="font-size:13px;font-weight:600;color:#374151">{{ dayLabels[day] }}</span>
            </label>
            @if (draft.schedule[day].enabled) {
              <div style="display:flex;align-items:center;gap:6px;flex:1">
                <input type="time" [(ngModel)]="draft.schedule[day].open"
                       style="border:1.5px solid #e5e7eb;border-radius:8px;padding:4px 8px;font-size:13px;color:#1a1a2e;background:white;outline:none;flex:1;min-width:0" />
                <span style="color:#aaa;font-size:13px;flex-shrink:0">–</span>
                <input type="time" [(ngModel)]="draft.schedule[day].close"
                       style="border:1.5px solid #e5e7eb;border-radius:8px;padding:4px 8px;font-size:13px;color:#1a1a2e;background:white;outline:none;flex:1;min-width:0" />
              </div>
            } @else {
              <span style="font-size:12px;color:#ccc;flex:1">No trabaja</span>
            }
          </div>
        }
      </div>
    }
  `,
})
export class StaffScheduleEditorComponent {
  @Input({ required: true }) draft!: StaffDraft;

  readonly dayOrder  = DAY_ORDER;
  readonly dayLabels = DAY_LABELS;
}
