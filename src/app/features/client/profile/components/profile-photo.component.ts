import { Component, input, model, output } from '@angular/core';
import { PROFILE_ACCORDION_STYLES } from './profile.styles';

/** Sección "Foto de perfil" (cuerpo del acordeón). La vista previa vive en el contenedor (model). */
@Component({
  selector: 'app-profile-photo',
  standalone: true,
  styles: [`
    :host { display: contents; }

    ${PROFILE_ACCORDION_STYLES}

    /* ── Photo preview in accordion ──────────────────────── */
    .photo-preview-wrap {
      display: flex; flex-direction: column; align-items: center;
      margin-bottom: 20px;
    }

    .photo-preview {
      width: 88px; height: 88px;
      border-radius: 50%;
      background: var(--gradient);
      display: flex; align-items: center; justify-content: center;
      overflow: hidden; cursor: pointer;
      font-size: 1.6rem; font-weight: 700; color: white;
      box-shadow: 0 4px 16px rgba(124,58,237,.2);
      position: relative;
    }

    .photo-preview img { width: 100%; height: 100%; object-fit: cover; }

    .photo-change-btn {
      margin-top: 10px;
      font-size: 13px; font-weight: 600;
      color: var(--purple, #7c3aed);
      background: none; border: none; cursor: pointer;
      font-family: inherit;
    }
  `],
  template: `
          <div class="accordion-body" style="text-align:center">
            <div class="photo-preview-wrap">
              <div class="photo-preview" (click)="photoFileInput.click()">
                @if (preview()) {
                  <img [src]="preview()" alt="foto" />
                } @else {
                  {{ initials() }}
                }
              </div>
              <button type="button" class="photo-change-btn" (click)="photoFileInput.click()">
                {{ preview() ? 'Cambiar foto' : '+ Agregar foto' }}
              </button>
            </div>
            <input #photoFileInput type="file" accept="image/*" style="display:none" (change)="onPhotoSelected($event)" />
            @if (preview()) {
              <div style="display:flex;gap:10px;max-width:320px;margin:0 auto">
                <button type="button" class="btn btn-primary" style="flex:1" (click)="save.emit()" [disabled]="loading()">
                  @if (loading()) { Guardando... } @else { Guardar foto }
                </button>
                <button type="button" class="btn btn-secondary" style="color:#ef4444;border-color:#fecaca"
                        (click)="remove.emit()">Quitar</button>
              </div>
            }
            @if (success()) { <p class="success-msg" style="margin-top:12px">Foto actualizada.</p> }
          </div>
  `,
})
export class ProfilePhotoComponent {
  readonly preview  = model.required<string>();
  readonly initials = input.required<string>();
  readonly loading  = input.required<boolean>();
  readonly success  = input.required<boolean>();
  readonly save     = output<void>();
  readonly remove   = output<void>();

  onPhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 150; canvas.height = 150;
        const ctx = canvas.getContext('2d')!;
        const size = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 150, 150);
        this.preview.set(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}
