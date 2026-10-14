import { Component, input, output } from '@angular/core';
import { StaffMember } from '../../../../core/services/staff.service';
import { initials } from '../staff.utils';

@Component({
  selector: 'app-staff-card',
  standalone: true,
  styles: [`
    :host { display: contents; }

    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .avatar-initials {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--purple);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
      flex-shrink: 0;
      text-transform: uppercase;
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 600;
    }

    .badge-active   { background: #d1fae5; color: #065f46; }
    .badge-inactive { background: #fee2e2; color: #991b1b; }

    @media (max-width: 480px) {
      .staff-card { flex-wrap: wrap !important; }
      .staff-actions { width: 100%; justify-content: flex-end; margin-top: 6px; }
    }
  `],
  template: `
    <div
      class="card staff-card"
      style="display:flex;align-items:center;gap:16px"
      [style.opacity]="member().isActive ? '1' : '0.6'"
    >
      @if (member().photoURL) {
        <img [src]="member().photoURL" [alt]="member().name" class="avatar" />
      } @else {
        <div class="avatar-initials">{{ initials(member().name) }}</div>
      }

      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:15px">{{ member().name }}</div>
        @if (member().phone) {
          <div style="color:#888;font-size:12px;margin-top:2px">{{ member().phone }}</div>
        }
        <div style="display:flex;align-items:center;gap:10px;margin-top:6px;flex-wrap:wrap">
          <span style="font-size:12px;color:#555">{{ member().serviceIds.length }} {{ member().serviceIds.length === 1 ? 'servicio asignado' : 'servicios asignados' }}</span>
          <span class="badge" [class]="member().isActive ? 'badge-active' : 'badge-inactive'">
            {{ member().isActive ? 'Activo' : 'Inactivo' }}
          </span>
        </div>
      </div>

      <div class="staff-actions" style="display:flex;gap:6px;flex-shrink:0">
        <button class="btn btn-secondary btn-sm" (click)="edit.emit()">Editar</button>
        <button
          class="btn btn-sm"
          [class]="member().isActive ? 'btn-danger' : 'btn-primary'"
          (click)="toggleActive.emit()"
          [disabled]="saving()"
        >
          {{ member().isActive ? 'Desactivar' : 'Activar' }}
        </button>
      </div>
    </div>
  `,
})
export class StaffCardComponent {
  member = input.required<StaffMember>();
  saving = input(false);

  edit         = output<void>();
  toggleActive = output<void>();

  initials = initials;
}
