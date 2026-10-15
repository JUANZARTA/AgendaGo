import { Component, input, output } from '@angular/core';
import { ServiceItem } from '../../../../core/services/service-catalog.service';
import { DayOption } from '../company-profile.utils';

/** Paso 2: elegir día y horario. */
@Component({
  selector: 'app-cp-datetime-step',
  standalone: true,
  styles: [`:host { display: block; }`],
  template: `
          <div class="card" style="animation:fadeInUp .3s ease">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
              <button (click)="back.emit()" class="btn btn-secondary btn-sm" style="display:inline-flex;align-items:center;gap:4px;flex-shrink:0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div>
                <h2 style="font-size:1.05rem;font-weight:800">Elige fecha y hora</h2>
                <p style="font-size:13px;font-weight:600;color:var(--purple);margin-top:1px">{{ selectedService()!.name }}</p>
              </div>
            </div>

            <p style="font-size:12px;font-weight:700;color:#a0a0b8;letter-spacing:.06em;margin-bottom:10px">DÍA</p>
            <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;margin-bottom:20px">
              @for (day of days(); track day.sub) {
                <button (click)="daySelect.emit(day)"
                  style="flex-shrink:0;min-width:68px;padding:10px 8px;border-radius:12px;border:2px solid;cursor:pointer;text-align:center;transition:all .18s;font-family:inherit"
                  [style.borderColor]="selectedDay()?.sub === day.sub ? 'var(--purple)' : 'var(--form-border)'"
                  [style.background]="selectedDay()?.sub === day.sub ? 'var(--gradient)' : 'white'"
                  [style.color]="selectedDay()?.sub === day.sub ? 'white' : '#1a1a2e'"
                  [style.boxShadow]="selectedDay()?.sub === day.sub ? '0 4px 14px rgba(var(--primary-rgb),.3)' : 'none'">
                  <div style="font-weight:800;font-size:13px">{{ day.label }}</div>
                  <div style="font-size:11px;margin-top:3px;opacity:.75">{{ day.sub }}</div>
                </button>
              }
            </div>

            @if (selectedDay()) {
              @if (loadingSlots()) {
                <div style="text-align:center;padding:24px;color:#aaa">Cargando disponibilidad...</div>
              } @else {
                <p style="font-size:12px;font-weight:700;color:#a0a0b8;letter-spacing:.06em;margin-bottom:10px">HORA DISPONIBLE</p>
                @if (allSlots().length === 0) {
                  <div style="text-align:center;padding:20px;color:#aaa">No hay turnos disponibles para este día.</div>
                } @else {
                  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:8px">
                    @for (slot of allSlots(); track slot) {
                        <button (click)="slotSelect.emit(slot)"
                          style="padding:10px;border-radius:10px;border:2px solid;cursor:pointer;font-weight:700;font-size:13px;transition:all .18s;font-family:inherit"
                          [style.borderColor]="selectedSlot()===slot ? 'transparent' : 'var(--form-border)'"
                          [style.background]="selectedSlot()===slot ? 'var(--gradient)' : 'var(--btn-secondary-bg)'"
                          [style.color]="selectedSlot()===slot ? 'white' : 'var(--purple)'"
                          [style.boxShadow]="selectedSlot()===slot ? '0 4px 14px rgba(var(--primary-rgb),.35)' : 'none'"
                          [style.transform]="selectedSlot()===slot ? 'scale(1.05)' : 'scale(1)'">
                          {{ slot }}
                        </button>
                    }
                  </div>

                  <div style="display:flex;gap:16px;margin-top:14px">
                    <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#888">
                      <div style="width:12px;height:12px;border-radius:3px;background:var(--btn-secondary-bg);border:1.5px solid var(--form-border)"></div>
                      Disponible
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#888">
                      <div style="width:12px;height:12px;border-radius:3px;background:#fff5f5;border:1.5px solid #fee2e2"></div>
                      Sin cupo
                    </div>
                  </div>
                }
              }

              @if (selectedDay() && selectedSlot()) {
                <button class="btn btn-primary" style="width:100%;margin-top:20px" (click)="next.emit()">
                  Continuar — {{ selectedDay()!.label }} {{ selectedDay()!.sub }} a las {{ selectedSlot() }}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              }
            }
          </div>
  `,
})
export class DateTimeStepComponent {
  selectedService = input.required<ServiceItem | null>();
  days = input.required<DayOption[]>();
  selectedDay = input<DayOption | null>(null);
  selectedSlot = input<string | null>(null);
  loadingSlots = input(false);
  allSlots = input<string[]>([]);

  back = output<void>();
  daySelect = output<DayOption>();
  slotSelect = output<string>();
  next = output<void>();
}
