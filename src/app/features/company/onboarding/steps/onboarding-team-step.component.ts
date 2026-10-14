import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fileToSquareDataUrl } from '../../../../core/utils/image.utils';
import { OB_SHARED_STYLES } from '../onboarding.styles';
import { PendingStaff } from '../onboarding.constants';

@Component({
  selector: 'app-onboarding-team-step',
  standalone: true,
  imports: [FormsModule],
  styles: [OB_SHARED_STYLES, `
    :host { display: block; }
    .staff-photo-pick {
      width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0; cursor: pointer; overflow: hidden;
      border: 1.5px dashed #d1d5db; background: white; color: #9ca3af;
      display: flex; align-items: center; justify-content: center; transition: border-color .15s, color .15s;
    }
    .staff-photo-pick:hover { border-color: var(--purple); color: var(--purple); }
    .staff-photo-pick img { width: 100%; height: 100%; object-fit: cover; }
  `],
  template: `
      <div class="anim">
        <button class="ob-btn-back" (click)="back.emit()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver
        </button>

        <div class="ob-step-label">Paso 2 de 4 — Tu equipo</div>
        <h1 class="ob-title">¿Trabajás con equipo?</h1>
        <p class="ob-subtitle">Agregá tus profesionales ahora o hacelo después desde el panel</p>

        <!-- Lista de integrantes agregados -->
        @if (pendingStaff().length > 0) {
          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
            @for (m of pendingStaff(); track $index) {
              <div style="display:flex;align-items:center;gap:10px;background:#f9f5ff;border:1.5px solid #f0e8ff;border-radius:12px;padding:10px 14px">
                <div style="width:36px;height:36px;border-radius:50%;background:var(--gradient);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">
                  @if (m.photoURL) {
                    <img [src]="m.photoURL" [alt]="m.name" style="width:100%;height:100%;object-fit:cover" />
                  } @else {
                    <span style="color:white;font-weight:800;font-size:14px">{{ m.name.charAt(0).toUpperCase() }}</span>
                  }
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:13px;font-weight:700;color:#1a1a2e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ m.name }}</div>
                  @if (m.phone) {
                    <div style="font-size:11px;color:#888">{{ m.phone }}</div>
                  }
                </div>
                <button (click)="removed.emit($index)" style="background:none;border:none;cursor:pointer;color:#bbb;padding:4px;display:flex;align-items:center" title="Eliminar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            }
          </div>
        }

        <!-- Formulario inline para agregar integrante -->
        <div style="background:#fafafa;border:1.5px dashed #e5e7eb;border-radius:16px;padding:16px;margin-bottom:20px">
          <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px">Agregar integrante</div>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
            <label class="staff-photo-pick" title="Foto (opcional)">
              @if (newStaffPhoto()) {
                <img [src]="newStaffPhoto()!" alt="Foto del profesional" />
              } @else {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>
              }
              <input type="file" accept="image/*" (change)="onStaffPhoto($event)" hidden />
            </label>
            <div style="font-size:12px;color:#888;line-height:1.4">
              Foto <span style="color:#bbb">(opcional)</span>
              @if (newStaffPhoto()) {
                <button type="button" (click)="newStaffPhoto.set(null)" style="display:block;background:none;border:none;padding:0;color:#dc2626;font-size:12px;cursor:pointer;font-family:inherit">Quitar</button>
              }
            </div>
          </div>
          <div class="ob-form-group" style="margin-bottom:10px">
            <input [(ngModel)]="newStaffName" placeholder="Nombre del profesional *" style="width:100%;border:1.5px solid #e5e7eb;border-radius:10px;padding:10px 13px;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box" />
          </div>
          <div class="ob-form-group" style="margin-bottom:12px">
            <input [(ngModel)]="newStaffPhone" placeholder="Teléfono (opcional)" type="tel" style="width:100%;border:1.5px solid #e5e7eb;border-radius:10px;padding:10px 13px;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box" />
          </div>
          <button (click)="addStaffMember()"
                  [disabled]="!newStaffName().trim()"
                  style="display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:10px;border:none;background:var(--gradient);color:white;font-size:13px;font-weight:700;cursor:pointer;opacity:1;font-family:inherit"
                  [style.opacity]="!newStaffName().trim() ? '0.5' : '1'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Agregar
          </button>
        </div>

        <button class="ob-btn-primary" (click)="next.emit()">
          {{ pendingStaff().length > 0 ? 'Continuar con ' + pendingStaff().length + (pendingStaff().length === 1 ? ' integrante' : ' integrantes') : 'Continuar sin equipo' }}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
  `,
})
export class OnboardingTeamStepComponent {
  // El array vive en el contenedor (doCreate lo recorre): acá solo se lee; las mutaciones salen por outputs
  readonly pendingStaff = input.required<PendingStaff[]>();

  readonly added = output<PendingStaff>();
  readonly removed = output<number>();
  readonly back = output<void>();
  readonly next = output<void>();

  // Borradores: viven en el contenedor para sobrevivir a la navegación entre pasos
  readonly newStaffPhoto = model<string | null>(null);
  readonly newStaffName  = model<string>('');
  readonly newStaffPhone = model<string>('');

  async onStaffPhoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      this.newStaffPhoto.set(await fileToSquareDataUrl(file));
    } catch {
      alert('No se pudo leer la imagen.');
    }
  }

  addStaffMember() {
    const name = this.newStaffName().trim();
    if (!name) return;
    this.added.emit({ name, phone: this.newStaffPhone().trim(), photoURL: this.newStaffPhoto() ?? undefined });
    this.newStaffName.set('');
    this.newStaffPhone.set('');
    this.newStaffPhoto.set(null);
  }
}
