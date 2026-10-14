import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Appointment } from '../../../../core/services/appointment.service';
import { MODAL_STYLES } from '../dashboard.styles';
import { CANCEL_REASONS } from '../dashboard.utils';

/** Modal para cancelar una cita eligiendo el motivo. El estado del formulario vive acá y se reinicia al reabrirse. */
@Component({
  selector: 'app-cancel-appointment-modal',
  standalone: true,
  imports: [FormsModule],
  styles: [MODAL_STYLES + `
    .reason-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
    .reason-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      cursor: pointer;
      transition: border-color .15s, background .15s;
    }
    .reason-item:hover { background: #f9f5ff; border-color: #c4b5fd; }
    .reason-item.selected { background: #f3f4ff; border-color: var(--purple); }
    .reason-item input[type=radio] { accent-color: var(--purple); width: 16px; height: 16px; flex-shrink: 0; }
    .reason-item span { font-size: 13px; color: #374151; }
  `],
  template: `
    <div class="modal-overlay" (click)="closed.emit()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title" style="display:flex;align-items:center;gap:8px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Cancelar cita
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

        <p style="font-size:13px;color:#374151;margin:0 0 10px;font-weight:600">Motivo de cancelación</p>

        <div class="reason-list">
          @for (reason of cancelReasons; track reason) {
            <label class="reason-item" [class.selected]="cancelReason() === reason">
              <input type="radio" name="cancel-reason" [value]="reason" [(ngModel)]="selectedReason" (change)="cancelReason.set(reason)" />
              <span>{{ reason }}</span>
            </label>
          }
        </div>

        @if (cancelReason() === 'Otro') {
          <div class="form-group">
            <label>Especificá el motivo</label>
            <textarea [(ngModel)]="cancelOtherText" placeholder="Describí el motivo..." (input)="cancelOther.set(cancelOtherText)"></textarea>
          </div>
        }

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closed.emit()">Volver</button>
          <button class="btn btn-danger"
            [disabled]="!cancelReason() || (cancelReason() === 'Otro' && !cancelOther().trim()) || saving()"
            (click)="confirmed.emit()">
            Confirmar cancelación
          </button>
        </div>
      </div>
    </div>
  `,
})
export class CancelAppointmentModalComponent {
  target = input.required<Appointment>();
  saving = input(false);

  closed    = output<void>();
  confirmed = output<void>();

  readonly cancelReasons = CANCEL_REASONS;

  cancelReason = signal('');
  cancelOther  = signal('');

  selectedReason  = '';
  cancelOtherText = '';
}
