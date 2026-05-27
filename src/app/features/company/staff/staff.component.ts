import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffMember, StaffDaySchedule, StaffService } from '../../../core/services/staff.service';
import { ServiceCatalogService, ServiceItem } from '../../../core/services/service-catalog.service';
import { CompanyStore } from '../../../core/services/company-store.service';

const DAY_ORDER = ['lun','mar','mie','jue','vie','sab','dom'];
const DAY_LABELS: Record<string, string> = {
  lun: 'Lunes', mar: 'Martes', mie: 'Miércoles',
  jue: 'Jueves', vie: 'Viernes', sab: 'Sábado', dom: 'Domingo',
};

function defaultSchedule(): Record<string, StaffDaySchedule> {
  return {
    lun: { enabled: true,  open: '09:00', close: '18:00' },
    mar: { enabled: true,  open: '09:00', close: '18:00' },
    mie: { enabled: true,  open: '09:00', close: '18:00' },
    jue: { enabled: true,  open: '09:00', close: '18:00' },
    vie: { enabled: true,  open: '09:00', close: '18:00' },
    sab: { enabled: false, open: '09:00', close: '14:00' },
    dom: { enabled: false, open: '09:00', close: '14:00' },
  };
}

interface StaffDraft {
  name: string;
  phone: string;
  photoURL: string;
  serviceIds: string[];
  isActive: boolean;
  useCustomSchedule: boolean;
  schedule: Record<string, StaffDaySchedule>;
}

const EMPTY_DRAFT: StaffDraft = {
  name: '',
  phone: '',
  photoURL: '',
  serviceIds: [],
  isActive: true,
  useCustomSchedule: false,
  schedule: defaultSchedule(),
};

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    :host { display: block; }

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

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 600;
    }

    .badge-active   { background: #d1fae5; color: #065f46; }
    .badge-inactive { background: #fee2e2; color: #991b1b; }

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

    @media (max-width: 480px) {
      .staff-card { flex-wrap: wrap !important; }
      .staff-actions { width: 100%; justify-content: flex-end; margin-top: 6px; }
    }

    @media (max-width: 640px) {
      input, select, textarea { font-size: 16px !important; }
    }
  `],
  template: `
    <div class="page" style="max-width:700px;margin:0 auto">
      <div class="flex-between" style="margin-bottom:24px;flex-wrap:wrap;gap:10px">
        <h1 style="font-size:1.4rem">Equipo</h1>
        <button class="btn btn-primary btn-sm" (click)="openNew()" [disabled]="!companyId()">
          + Agregar
        </button>
      </div>

      @if (storeLoading()) {
        <div class="card" style="text-align:center;padding:40px;color:#aaa">Cargando...</div>
      } @else if (!companyId()) {
        <div class="card" style="text-align:center;padding:40px;color:#aaa">
          Iniciá sesión para gestionar tu equipo.
        </div>
      } @else {
        <div class="card" style="margin-bottom:16px">
          <p style="color:#888;font-size:13px">{{ activeCount() }} activos · {{ staff().length }} en total</p>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px">
          @for (member of staff(); track member.id) {
            <div
              class="card staff-card"
              style="display:flex;align-items:center;gap:16px"
              [style.opacity]="member.isActive ? '1' : '0.6'"
            >
              @if (member.photoURL) {
                <img [src]="member.photoURL" [alt]="member.name" class="avatar" />
              } @else {
                <div class="avatar-initials">{{ initials(member.name) }}</div>
              }

              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:15px">{{ member.name }}</div>
                @if (member.phone) {
                  <div style="color:#888;font-size:12px;margin-top:2px">{{ member.phone }}</div>
                }
                <div style="display:flex;align-items:center;gap:10px;margin-top:6px;flex-wrap:wrap">
                  <span style="font-size:12px;color:#555">{{ member.serviceIds.length }} {{ member.serviceIds.length === 1 ? 'servicio asignado' : 'servicios asignados' }}</span>
                  <span class="badge" [class]="member.isActive ? 'badge-active' : 'badge-inactive'">
                    {{ member.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>
              </div>

              <div class="staff-actions" style="display:flex;gap:6px;flex-shrink:0">
                <button class="btn btn-secondary btn-sm" (click)="openEdit(member)">Editar</button>
                <button
                  class="btn btn-sm"
                  [class]="member.isActive ? 'btn-danger' : 'btn-primary'"
                  (click)="toggle(member)"
                  [disabled]="saving()"
                >
                  {{ member.isActive ? 'Desactivar' : 'Activar' }}
                </button>
              </div>
            </div>
          }

          @if (!loading() && staff().length === 0) {
            <div class="card" style="text-align:center;padding:40px;color:#aaa">
              Sin integrantes aún. Agregá el primero.
            </div>
          }
        </div>
      }
    </div>

    @if (showModal()) {
      <div
        style="position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px;overflow-y:auto"
        (click)="close()"
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
                <div style="font-weight:700;font-size:13px;color:#92400e">Para activar, asigná al menos un servicio</div>
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
                  (change)="onPhotoChange($event)"
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

            <!-- Toggle: empresa vs personalizado -->
            <div class="toggle-row" style="background:#f9f5ff;border:1.5px solid #f0e8ff;border-radius:12px;padding:12px 14px;margin-bottom:10px">
              <div>
                @if (draft.useCustomSchedule) {
                  <div style="font-size:13px;font-weight:700;color:#1a1a2e">Horario propio</div>
                  <div style="font-size:11px;color:#888;margin-top:2px">Este profesional tiene días y horarios distintos</div>
                } @else {
                  <div style="font-size:13px;font-weight:700;color:#1a1a2e">Horario de la empresa</div>
                  <div style="font-size:11px;color:#888;margin-top:2px">Activá si tiene días u horas diferentes</div>
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
          </div>

          <div style="display:flex;gap:10px;margin-top:8px">
            <button
              class="btn btn-primary"
              style="flex:1"
              (click)="save()"
              [disabled]="!draft.name.trim() || saving()"
            >
              {{ saving() ? 'Guardando...' : 'Guardar' }}
            </button>
            <button class="btn btn-secondary" (click)="close()">Cancelar</button>
            @if (editId()) {
              <button class="btn btn-danger" (click)="remove()" [disabled]="saving()">Eliminar</button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class StaffComponent {
  private companyStore = inject(CompanyStore);
  private staffSvc     = inject(StaffService);
  private catalogSvc   = inject(ServiceCatalogService);

  companyId    = this.companyStore.companyId;
  storeLoading = this.companyStore.loading;

  staff            = signal<StaffMember[]>([]);
  services         = signal<ServiceItem[]>([]);
  showModal        = signal(false);
  editId           = signal<string | null>(null);
  loading          = signal(false);
  saving           = signal(false);
  photoFile        = signal<File | null>(null);
  photoPreview     = signal<string | null>(null);
  noServiceWarning = signal(false);

  draft: StaffDraft = { ...EMPTY_DRAFT };

  activeCount = computed(() => this.staff().filter(m => m.isActive).length);

  constructor() {
    effect(() => {
      const id = this.companyStore.companyId();
      if (id) {
        this.loadStaff(id);
        this.loadServices(id);
      }
    });
  }

  private async loadStaff(companyId: string): Promise<void> {
    this.loading.set(true);
    try {
      this.staff.set(await this.staffSvc.getStaff(companyId));
    } finally {
      this.loading.set(false);
    }
  }

  private async loadServices(companyId: string): Promise<void> {
    try {
      this.services.set(await this.catalogSvc.getServices(companyId));
    } catch {
      // non-critical — services list is just for assignment UI
    }
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0])
      .join('');
  }

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

  onPhotoChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.photoFile.set(file);
    this.photoPreview.set(URL.createObjectURL(file));
  }

  readonly dayOrder  = DAY_ORDER;
  readonly dayLabels = DAY_LABELS;

  openNew(): void {
    this.editId.set(null);
    this.draft = { ...EMPTY_DRAFT, serviceIds: [], schedule: defaultSchedule() };
    this.photoFile.set(null);
    this.photoPreview.set(null);
    this.showModal.set(true);
  }

  openEdit(member: StaffMember): void {
    this.editId.set(member.id!);
    const hasCustom = !!(member.schedule && Object.keys(member.schedule).length > 0);
    this.draft = {
      name:              member.name,
      phone:             member.phone     ?? '',
      photoURL:          member.photoURL  ?? '',
      serviceIds:        [...member.serviceIds],
      isActive:          member.isActive,
      useCustomSchedule: hasCustom,
      schedule:          hasCustom ? JSON.parse(JSON.stringify(member.schedule)) : defaultSchedule(),
    };
    this.photoFile.set(null);
    this.photoPreview.set(member.photoURL ?? null);
    this.showModal.set(true);
  }

  async save(): Promise<void> {
    const cid = this.companyStore.companyId();
    if (!cid || !this.draft.name.trim()) return;

    this.saving.set(true);
    try {
      const id = this.editId();
      // Determine the staffId to use for photo upload (existing or temporary new one)
      const draftId = id ?? `new_${Date.now()}`;
      let photoURL = this.draft.photoURL;

      if (this.photoFile()) {
        photoURL = await this.staffSvc.uploadPhoto(cid, id ?? draftId, this.photoFile()!);
      }

      const hasServices = this.draft.serviceIds.length > 0;
      const payload: Omit<StaffMember, 'id'> = {
        name:       this.draft.name.trim(),
        phone:      this.draft.phone.trim() || undefined,
        photoURL:   photoURL || undefined,
        serviceIds: this.draft.serviceIds,
        isActive:   hasServices ? this.draft.isActive : false,
        schedule:   this.draft.useCustomSchedule ? this.draft.schedule : {},
      };

      if (id) {
        await this.staffSvc.updateStaff(cid, id, payload);
      } else {
        await this.staffSvc.createStaff(cid, payload);
      }

      await this.loadStaff(cid);
      this.close();
    } finally {
      this.saving.set(false);
    }
  }

  async remove(): Promise<void> {
    const cid = this.companyStore.companyId();
    const id  = this.editId();
    if (!cid || !id) return;

    this.saving.set(true);
    try {
      await this.staffSvc.deleteStaff(cid, id);
      await this.loadStaff(cid);
      this.close();
    } finally {
      this.saving.set(false);
    }
  }

  async toggle(member: StaffMember): Promise<void> {
    const cid = this.companyStore.companyId();
    if (!cid || !member.id) return;

    if (!member.isActive && member.serviceIds.length === 0) {
      this.openEdit(member);
      this.draft.isActive = true;
      this.noServiceWarning.set(true);
      return;
    }

    await this.staffSvc.updateStaff(cid, member.id, { isActive: !member.isActive });
    await this.loadStaff(cid);
  }

  close(): void {
    this.showModal.set(false);
    this.editId.set(null);
    this.noServiceWarning.set(false);
    // Revoke any object URL to avoid memory leaks
    const preview = this.photoPreview();
    if (preview?.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    this.photoPreview.set(null);
    this.photoFile.set(null);
  }
}
