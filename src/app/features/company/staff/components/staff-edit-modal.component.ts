import { Component, Input, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServiceItem } from '../../../../core/services/service-catalog.service';
import { STAFF_INPUT_MEDIA_STYLES, StaffDraft, initials } from '../staff.utils';
import { StaffScheduleEditorComponent } from './staff-schedule-editor.component';

/** Modal de alta/edición. Muta el `draft` del contenedor (igual que antes). */
@Component({
  selector: 'app-staff-edit-modal',
  standalone: true,
  imports: [FormsModule, StaffScheduleEditorComponent],
  styles: [`
    :host { display: contents; }

    .avatar-preview-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .avatar-preview {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #e5e7eb;
    }

    .avatar-preview-initials {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--purple);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 28px;
      text-transform: uppercase;
      border: 2px solid transparent;
    }

    .service-checkbox-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 160px;
      overflow-y: auto;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      padding: 10px 12px;
    }

    .service-checkbox-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      cursor: pointer;
      user-select: none;
    }

    .service-checkbox-item input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
      accent-color: var(--purple);
    }
    ${STAFF_INPUT_MEDIA_STYLES}
  `],
  template: `
    <div
      style="position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px;overflow-y:auto"
      (click)="closed.emit()"
    >
      <div
        class="card"
        style="width:460px;max-width:min(460px,calc(100vw - 16px));max-height:calc(100vh - 32px);overflow-y:auto"
        (click)="$event.stopPropagation()"
      >
        <h2 style="margin-bottom:16px">{{ editId() ? 'Editar' : 'Nuevo' }} integrante</h2>

        <!-- Banner: activación bloqueada sin servicios -->
        @if (noServiceWarning()) {
          <div style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:12px;padding:12px 14px;margin-bottom:18px;display:flex;gap:10px;align-items:flex-start">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>
              <div style="font-weight:700;font-size:13px;color:#92400e">Para activar, asigna al menos un servicio</div>
              <div style="font-size:12px;color:#b45309;margin-top:3px">Al guardar con servicios asignados, el profesional quedará activo automáticamente.</div>
            </div>
          </div>
        }

        <!-- Photo preview + upload -->
        <div class="form-group">
          <label>Foto de perfil</label>
          <div class="avatar-preview-wrap">
            @if (photoPreview()) {
              <img [src]="photoPreview()!" alt="preview" class="avatar-preview" />
            } @else {
              <div class="avatar-preview-initials">{{ initials(draft.name || '?') }}</div>
            }
            <label class="btn btn-secondary btn-sm" style="cursor:pointer;margin:0">
              {{ photoPreview() ? 'Cambiar foto' : 'Subir foto' }}
              <input
                type="file"
                accept="image/*"
                style="display:none"
                (change)="photoChange.emit($event)"
              />
            </label>
          </div>
        </div>

        <div class="form-group">
          <label>Nombre *</label>
          <input [(ngModel)]="draft.name" placeholder="Ej: María González" />
        </div>

        <div class="form-group">
          <label>Teléfono <span style="font-weight:400;color:#bbb;font-size:12px">(opcional)</span></label>
          <input [(ngModel)]="draft.phone" placeholder="Ej: +54 11 1234-5678" type="tel" />
        </div>

        <div class="form-group">
          <label>Servicios asignados</label>
          @if (services().length === 0) {
            <p style="font-size:13px;color:#aaa;margin:0">No hay servicios cargados aún.</p>
          } @else {
            <div class="service-checkbox-list">
              @for (svc of services(); track svc.id) {
                <label class="service-checkbox-item">
                  <input
                    type="checkbox"
                    [checked]="isServiceSelected(svc.id!)"
                    (change)="toggleService(svc.id!, $event)"
                  />
                  {{ svc.name }}
                  @if (svc.duration) {
                    <span style="color:#aaa;font-size:12px">({{ svc.duration }} min)</span>
                  }
                </label>
              }
            </div>
            @if (draft.serviceIds.length === 0) {
              <p style="font-size:12px;color:#f59e0b;margin:8px 0 0;display:flex;align-items:center;gap:5px">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Sin servicios asignados — se guardará como inactivo
              </p>
            }
          }
        </div>

        <!-- Horario del profesional -->
        <div class="form-group">
          <label style="margin-bottom:10px;display:block">Horario del profesional</label>
          <app-staff-schedule-editor [draft]="draft" />
        </div>

        @if (scheduleError()) {
          <div style="font-size:12px;font-weight:600;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:8px 10px;margin-top:8px">
            {{ scheduleError() }}
          </div>
        }

        <div style="display:flex;gap:10px;margin-top:8px">
          <button
            class="btn btn-primary"
            style="flex:1"
            (click)="saved.emit()"
            [disabled]="!draft.name.trim() || saving()"
          >
            {{ saving() ? 'Guardando...' : 'Guardar' }}
          </button>
          <button class="btn btn-secondary" (click)="closed.emit()">Cancelar</button>
          @if (editId()) {
            <button class="btn btn-danger" (click)="removed.emit()" [disabled]="saving()">Eliminar</button>
          }
        </div>
      </div>
    </div>
  `,
})
export class StaffEditModalComponent {
  @Input({ required: true }) draft!: StaffDraft;

  editId           = input<string | null>(null);
  noServiceWarning = input(false);
  photoPreview     = input<string | null>(null);
  services         = input<ServiceItem[]>([]);
  saving           = input(false);
  scheduleError    = input('');

  photoChange = output<Event>();
  saved       = output<void>();
  closed      = output<void>();
  removed     = output<void>();

  initials = initials;

  isServiceSelected(serviceId: string): boolean {
    return this.draft.serviceIds.includes(serviceId);
  }

  toggleService(serviceId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.draft.serviceIds = [...this.draft.serviceIds, serviceId];
    } else {
      this.draft.serviceIds = this.draft.serviceIds.filter(id => id !== serviceId);
    }
  }
}
