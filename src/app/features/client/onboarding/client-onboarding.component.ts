import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-client-onboarding',
  standalone: true,
  imports: [FormsModule],
  styles: [`
    .onboarding {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 28px 16px 56px;
      background: var(--body-bg);
    }

    .ob-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 28px;
    }

    .ob-brand-icon {
      width: 32px; height: 32px;
      background: var(--gradient);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ob-brand-text {
      font-size: 1.1rem;
      font-weight: 800;
      background: var(--gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .ob-card {
      background: white;
      border-radius: 24px;
      box-shadow: 0 8px 40px rgba(124, 58, 237, 0.1);
      padding: 32px 28px 28px;
      width: 100%;
      max-width: 440px;
    }

    /* Avatar */
    .avatar-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 24px;
    }

    .avatar-wrap {
      position: relative;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--gradient);
      cursor: pointer;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      transition: transform 0.18s;
    }

    .avatar-wrap:hover { transform: scale(1.05); }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-initials {
      font-size: 1.6rem;
      font-weight: 700;
      color: white;
      user-select: none;
    }

    .avatar-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.42);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.18s;
    }

    .avatar-wrap:hover .avatar-overlay { opacity: 1; }

    .photo-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--purple, #7c3aed);
      cursor: pointer;
    }

    .photo-note {
      font-size: 11.5px;
      color: #aaa;
      margin-top: 3px;
      text-align: center;
    }

    /* Header text */
    .ob-title {
      text-align: center;
      margin-bottom: 24px;
    }

    .ob-title h2 {
      font-size: 1.45rem;
      font-weight: 800;
      margin-bottom: 6px;
    }

    .ob-title p {
      font-size: 13.5px;
      color: #777;
      line-height: 1.55;
    }

    /* Fields */
    .field { margin-bottom: 16px; }

    .field label {
      display: block;
      font-size: 12.5px;
      font-weight: 700;
      color: #444;
      margin-bottom: 6px;
      letter-spacing: 0.02em;
    }

    .field label .opt {
      font-weight: 400;
      color: #bbb;
      font-size: 12px;
    }

    .field input {
      width: 100%;
      padding: 11px 14px;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      font-family: inherit;
      background: #fafafa;
      color: inherit;
      transition: border-color 0.18s, box-shadow 0.18s;
      box-sizing: border-box;
    }

    .field input:focus {
      outline: none;
      border-color: var(--purple, #7c3aed);
      box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
      background: white;
    }

    /* Error */
    .error-msg {
      font-size: 12.5px;
      color: #ef4444;
      margin-bottom: 12px;
      padding: 10px 14px;
      background: #fef2f2;
      border-radius: 8px;
      border: 1px solid #fecaca;
    }

    /* Submit */
    .btn-submit {
      width: 100%;
      padding: 13px;
      border: none;
      border-radius: 12px;
      background: var(--gradient);
      color: white;
      font-size: 15px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: opacity 0.18s, transform 0.18s;
      box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3);
      margin-top: 8px;
    }

    .btn-submit:hover:not(:disabled) {
      opacity: 0.92;
      transform: translateY(-1px);
    }

    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    /* Skip */
    .skip-btn {
      display: block;
      width: 100%;
      background: none;
      border: none;
      color: #bbb;
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      padding: 14px 0 0;
      text-align: center;
      transition: color 0.15s;
    }

    .skip-btn:hover { color: #888; }
    .skip-btn:disabled { cursor: not-allowed; }

    @media (max-width: 480px) {
      .ob-card { padding: 24px 20px 20px; border-radius: 20px; }
    }
  `],
  template: `
    <div class="onboarding">

      <!-- Brand -->
      <div class="ob-brand">
        <div class="ob-brand-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="white" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <span class="ob-brand-text">Agenda Co</span>
      </div>

      <div class="ob-card">

        <!-- Avatar (opcional) -->
        <div class="avatar-section">
          <div class="avatar-wrap" (click)="fileInput.click()">
            @if (photoPreview()) {
              <img class="avatar-img" [src]="photoPreview()" alt="foto" />
            } @else {
              <span class="avatar-initials">{{ initials() }}</span>
            }
            <div class="avatar-overlay">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                   stroke="white" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          </div>
          <input #fileInput type="file" accept="image/*"
                 style="display:none" (change)="onPhotoSelected($event)" />
          <span class="photo-label" (click)="fileInput.click()">
            {{ photoPreview() ? 'Cambiar foto' : 'Agregar foto de perfil' }}
          </span>
          <p class="photo-note">No es necesaria para agendar citas</p>
        </div>

        <!-- Título -->
        <div class="ob-title">
          <h2>¡Hola, {{ firstName() }}!</h2>
          <p>Completá tus datos para agendar citas más rápido.</p>
        </div>

        <!-- Formulario -->
        <div class="field">
          <label>Nombre completo</label>
          <input type="text" [(ngModel)]="displayName"
                 placeholder="Cómo querés que te llamen" />
        </div>

        <div class="field">
          <label>Número de celular</label>
          <input type="tel" [(ngModel)]="phone"
                 placeholder="3001234567" inputmode="numeric" />
        </div>

        <div class="field">
          <label>Dirección <span class="opt">(opcional)</span></label>
          <input type="text" [(ngModel)]="address"
                 placeholder="Tu barrio o dirección" />
        </div>

        @if (error()) {
          <p class="error-msg">{{ error() }}</p>
        }

        <button class="btn-submit" (click)="save()" [disabled]="loading()">
          @if (loading()) { Guardando... } @else { Guardar y continuar }
        </button>

        <button class="skip-btn" (click)="skip()" [disabled]="loading()">
          Omitir por ahora
        </button>

      </div>
    </div>
  `,
})
export class ClientOnboardingComponent {
  private auth = inject(AuthService);

  displayName = '';
  phone = '';
  address = '';
  loading = signal(false);
  error = signal('');
  photoPreview = signal('');

  firstName = computed(() => {
    const name = this.displayName || this.auth.displayName();
    return name ? name.split(' ')[0] : 'amigo/a';
  });

  initials = computed(() => {
    const name = this.displayName || this.auth.displayName() || '?';
    return name.split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('');
  });

  constructor() {
    effect(() => {
      const p = this.auth.profile();
      if (!p) return;
      if (!this.displayName) this.displayName = p.displayName ?? '';
      if (!this.phone)       this.phone       = p.phone ?? '';
      if (!this.address)     this.address     = p.address ?? '';
      if (p.photoUrl && !this.photoPreview()) this.photoPreview.set(p.photoUrl);
    });
  }

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
        this.photoPreview.set(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async save() {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;

    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.saveProfile(uid, {
        displayName:     this.displayName.trim() || undefined,
        phone:           this.phone.trim()       || undefined,
        address:         this.address.trim()     || undefined,
        photoUrl:        this.photoPreview()     || undefined,
        profileComplete: true,
      });
    } catch {
      this.error.set('Error al guardar. Intentá de nuevo.');
      this.loading.set(false);
    }
  }

  async skip() {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;
    this.loading.set(true);
    try {
      await this.auth.saveProfile(uid, { profileComplete: true });
    } catch {
      this.loading.set(false);
    }
  }
}
