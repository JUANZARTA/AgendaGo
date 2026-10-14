import { Component, input, output } from '@angular/core';
import { Appointment } from '../../../../core/services/appointment.service';
import { MODAL_STYLES } from '../dashboard.styles';

/** Modal de confirmación para eliminar una cita cancelada. */
@Component({
  selector: 'app-delete-appointment-modal',
  standalone: true,
  styles: [MODAL_STYLES],
  template: `
    <div class="modal-overlay" (click)="closed.emit()">
      <div class="modal-card" style="max-width:360px" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title" style="display:flex;align-items:center;gap:8px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
            Eliminar cita
          </h2>
          <button class="modal-close" (click)="closed.emit()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="cancel-target-info">
          <strong>{{ target().clientName }}</strong>
          {{ target().serviceName }} · {{ target().startTime }}
        </div>

        <p style="font-size:13px;color:#374151;margin:0 0 20px">
          Esta acción es permanente y no se puede deshacer. ¿Confirmás que querés eliminar esta cita?
        </p>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closed.emit()">Cancelar</button>
          <button class="btn btn-danger" [disabled]="saving()" (click)="confirmed.emit()">
            {{ saving() ? 'Eliminando...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class DeleteAppointmentModalComponent {
  target = input.required<Appointment>();
  saving = input(false);

  closed    = output<void>();
  confirmed = output<void>();
}
