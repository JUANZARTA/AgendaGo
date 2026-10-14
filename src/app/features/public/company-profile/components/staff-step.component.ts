import { Component, input, output } from '@angular/core';
import { ServiceItem } from '../../../../core/services/service-catalog.service';
import { StaffMember } from '../../../../core/services/staff.service';
import { DayOption } from '../company-profile.utils';

/** Paso 3: elegir profesional. */
@Component({
  selector: 'app-cp-staff-step',
  standalone: true,
  styles: [`:host { display: block; }`],
  template: `
          <div class="card" style="animation:fadeInUp .3s ease">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
              <button (click)="back.emit()" class="btn btn-secondary btn-sm" style="display:inline-flex;align-items:center;flex-shrink:0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div>
                <h2 style="font-size:1.05rem;font-weight:800">¿Con quién querés atenderte?</h2>
                <p style="color:var(--purple);font-size:13px;font-weight:600;margin-top:1px">{{ selectedService()!.name }} · {{ selectedDay()!.label }} {{ selectedDay()!.sub }} {{ selectedSlot() }}</p>
              </div>
            </div>

            <!-- Cualquier profesional -->
            <button (click)="staffSelect.emit(null)"
              style="display:flex;align-items:center;gap:14px;width:100%;padding:14px;border-radius:12px;border:2px solid;cursor:pointer;text-align:left;margin-bottom:8px;transition:all .18s;font-family:inherit;background:white"
              [style.borderColor]="selectedStaff() === null ? 'var(--purple)' : 'var(--form-border)'"
              [style.background]="selectedStaff() === null ? 'var(--form-bg)' : 'white'">
              <div style="width:48px;height:48px;border-radius:50%;background:var(--gradient);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:white">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:14px;color:#1a1a2e">Cualquier profesional</div>
                <div style="color:#888;font-size:13px;margin-top:2px">El primero disponible</div>
              </div>
              @if (selectedStaff() === null) {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              }
            </button>

            <!-- Lista de staff -->
            @for (s of availableStaff(); track s.id) {
              <button (click)="staffSelect.emit(s)"
                style="display:flex;align-items:center;gap:14px;width:100%;padding:14px;border-radius:12px;border:2px solid;cursor:pointer;text-align:left;margin-bottom:8px;transition:all .18s;font-family:inherit"
                [style.borderColor]="selectedStaff()?.id === s.id ? 'var(--purple)' : 'var(--form-border)'"
                [style.background]="selectedStaff()?.id === s.id ? 'var(--form-bg)' : 'white'">
                @if (s.photoURL) {
                  <img [src]="s.photoURL" style="width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0" />
                } @else {
                  <div style="width:48px;height:48px;border-radius:50%;background:var(--btn-secondary-bg);color:var(--purple);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;flex-shrink:0">
                    {{ s.name.charAt(0).toUpperCase() }}
                  </div>
                }
                <div style="flex:1">
                  <div style="font-weight:700;font-size:14px;color:#1a1a2e">{{ s.name }}</div>
                  @if (s.phone) {
                    <div style="color:#888;font-size:13px;margin-top:2px">{{ s.phone }}</div>
                  }
                </div>
                @if (selectedStaff()?.id === s.id) {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                }
              </button>
            }

            <button class="btn btn-primary" style="width:100%;margin-top:12px" (click)="next.emit()">
              Continuar
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
  `,
})
export class StaffStepComponent {
  selectedService = input.required<ServiceItem | null>();
  selectedDay = input.required<DayOption | null>();
  selectedSlot = input<string | null>(null);
  selectedStaff = input<StaffMember | null>(null);
  availableStaff = input<StaffMember[]>([]);

  back = output<void>();
  staffSelect = output<StaffMember | null>();
  next = output<void>();
}
