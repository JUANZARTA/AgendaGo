import { Component, effect, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceItem } from '../../../../core/services/service-catalog.service';
import { StaffMember } from '../../../../core/services/staff.service';
import { MODAL_STYLES } from '../dashboard.styles';
import { TIME_SLOTS } from '../dashboard.utils';

/** Datos que el modal emite al guardar una cita manual. */
export interface NewAppointmentForm {
  client: string;
  phone: string;
  serviceId: string;
  staffId: string;
  date: string;
  time: string;
  note: string;
}

/** Modal para crear una cita manual. El formulario vive acá (se descarta al cerrarse) y se emite al guardar. */
@Component({
  selector: 'app-new-appointment-modal',
  standalone: true,
  imports: [DecimalPipe, FormsModule],
  styles: [MODAL_STYLES],
  template: `
    <div class="modal-overlay" (click)="closed.emit()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title" style="display:flex;align-items:center;gap:8px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Nueva cita
          </h2>
          <button class="modal-close" (click)="closed.emit()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="form-group">
          <label>Nombre del cliente</label>
          <input [(ngModel)]="newClient" placeholder="Nombre completo" />
        </div>

        <div class="form-group">
          <label>Teléfono</label>
          <input [(ngModel)]="newPhone" placeholder="3001234567" type="tel" />
        </div>

        <div class="form-group">
          <label>Servicio</label>
          <select [(ngModel)]="newServiceId">
            @for (svc of services(); track svc.id) {
              <option [value]="svc.id">{{ svc.name }} — {{ svc.duration }} min / \${{ (svc.price ?? 0) | number }}</option>
            }
          </select>
        </div>

        <div class="form-group">
          <label>Profesional <span style="color:#aaa;font-weight:400">(opcional)</span></label>
          <select [(ngModel)]="newStaffId">
            <option value="">Cualquier profesional</option>
            @for (s of staff(); track s.id) {
              <option [value]="s.id">{{ s.name }}</option>
            }
          </select>
        </div>

        <div class="form-group">
          <label>Fecha</label>
          <input type="date" [(ngModel)]="newDate" />
        </div>

        <div class="form-group">
          <label>Hora</label>
          <select [(ngModel)]="newTime">
            @for (slot of timeSlots; track slot) {
              <option [value]="slot">{{ slot }}</option>
            }
          </select>
        </div>

        <div class="form-group">
          <label>Nota interna <span style="font-weight:400;color:#aaa">(opcional)</span></label>
          <textarea [(ngModel)]="newNote" placeholder="Preferencias, indicaciones, etc."></textarea>
        </div>

        @if (formError()) {
          <div style="background:#fef2f2;border:1.5px solid #fecaca;color:#b91c1c;border-radius:10px;padding:10px 14px;margin-top:8px;font-size:13px;font-weight:600">
            {{ formError() }}
          </div>
        }

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closed.emit()">Cancelar</button>
          <button class="btn btn-primary" (click)="save()"
                  [disabled]="!newClient.trim() || saving()">
            {{ saving() ? 'Guardando...' : 'Guardar cita' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class NewAppointmentModalComponent {
  services  = input.required<ServiceItem[]>();
  staff     = input.required<StaffMember[]>();
  saving    = input(false);
  formError = input('');

  closed = output<void>();
  saved  = output<NewAppointmentForm>();

  readonly timeSlots = TIME_SLOTS;

  newClient    = '';
  newPhone     = '';
  newServiceId = '';
  newStaffId   = '';
  newDate      = '';
  newTime      = '08:00';
  newNote      = '';

  constructor() {
    // Preselecciona el primer servicio apenas haya catálogo (si el usuario aún no eligió uno)
    effect(() => {
      const svcs = this.services();
      if (svcs.length && !this.newServiceId) this.newServiceId = svcs[0].id!;
    });
  }

  save() {
    this.saved.emit({
      client:    this.newClient,
      phone:     this.newPhone,
      serviceId: this.newServiceId,
      staffId:   this.newStaffId,
      date:      this.newDate,
      time:      this.newTime,
      note:      this.newNote,
    });
  }
}
