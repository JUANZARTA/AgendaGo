import { Component, computed, effect, inject, signal } from '@angular/core';
import { fileToSquareDataUrl } from '../../../core/utils/image.utils';
import { CommonModule } from '@angular/common';
import { StaffMember, StaffService, hasOwnSchedule } from '../../../core/services/staff.service';
import { ServiceCatalogService, ServiceItem } from '../../../core/services/service-catalog.service';
import { CompanyStore } from '../../../core/services/company-store.service';
import { EMPTY_DRAFT, StaffDraft, defaultSchedule, scheduleErrorMessage } from './staff.utils';
import { StaffCardComponent } from './components/staff-card.component';
import { StaffEditModalComponent } from './components/staff-edit-modal.component';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, StaffCardComponent, StaffEditModalComponent],
  styles: [`
    :host { display: block; }
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
            <app-staff-card
              [member]="member"
              [saving]="saving()"
              (edit)="openEdit(member)"
              (toggleActive)="toggle(member)"
            />
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
      <app-staff-edit-modal
        [draft]="draft"
        [editId]="editId()"
        [noServiceWarning]="noServiceWarning()"
        [photoPreview]="photoPreview()"
        [services]="services()"
        [saving]="saving()"
        [scheduleError]="scheduleError()"
        (photoChange)="onPhotoChange($event)"
        (saved)="save()"
        (closed)="close()"
        (removed)="remove()"
      />
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
  scheduleError    = signal('');

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

  async onPhotoChange(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      this.photoPreview.set(await fileToSquareDataUrl(file));
      this.photoFile.set(file);
    } catch {
      alert('No se pudo leer la imagen.');
    }
  }

  openNew(): void {
    this.editId.set(null);
    this.draft = { ...EMPTY_DRAFT, serviceIds: [], schedule: defaultSchedule() };
    this.photoFile.set(null);
    this.photoPreview.set(null);
    this.showModal.set(true);
  }

  openEdit(member: StaffMember): void {
    this.editId.set(member.id!);
    const hasCustom = hasOwnSchedule(member);
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

    if (this.draft.useCustomSchedule) {
      const error = scheduleErrorMessage(this.draft.schedule);
      if (error) {
        this.scheduleError.set(error);
        return;
      }
    }
    this.scheduleError.set('');

    this.saving.set(true);
    try {
      const id = this.editId();
      // Foto: se guarda como base64 en Firestore (igual que empresa)
      const photoURL = this.photoPreview() ?? this.draft.photoURL;

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
