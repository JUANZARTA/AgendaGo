import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentService, Appointment } from '../../../core/services/appointment.service';
import { ThemeSwitcherComponent } from '../../../shared/components/theme-switcher.component';

type OpenSection = 'none' | 'data' | 'photo';

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ThemeSwitcherComponent],
  styles: [`
    .panel { max-width: 500px; margin: 0 auto; padding-bottom: 48px; }

    /* ── Header ───────────────────────────────────────────── */
    .panel-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px 16px;
      border-bottom: 1px solid rgba(0,0,0,.06);
    }

    .back-btn {
      width: 34px; height: 34px;
      border-radius: 50%;
      background: rgba(0,0,0,.05);
      border: none;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: inherit;
      transition: background .15s;
    }
    .back-btn:hover { background: rgba(0,0,0,.1); }

    .panel-title { font-size: 1.1rem; font-weight: 700; }

    /* ── User hero ────────────────────────────────────────── */
    .user-hero {
      display: flex; align-items: center; gap: 14px;
      padding: 20px 16px 16px;
    }

    .avatar-lg {
      width: 60px; height: 60px;
      border-radius: 50%;
      background: var(--gradient);
      display: flex; align-items: center; justify-content: center;
      overflow: hidden; flex-shrink: 0;
      font-size: 1.3rem; font-weight: 700; color: white;
      box-shadow: 0 4px 16px rgba(124,58,237,.25);
    }
    .avatar-lg img { width: 100%; height: 100%; object-fit: cover; }

    .user-name { font-size: 1rem; font-weight: 700; }
    .user-email { font-size: 12px; color: #888; margin-top: 2px; }

    /* ── Settings group ───────────────────────────────────── */
    .group-label {
      font-size: 11px; font-weight: 700;
      letter-spacing: .07em; text-transform: uppercase;
      color: #aaa; padding: 16px 16px 6px;
    }

    .settings-list {
      background: white;
      border-top: 1px solid rgba(0,0,0,.06);
      border-bottom: 1px solid rgba(0,0,0,.06);
    }

    /* ── Settings row ────────────────────────────────────── */
    .s-row {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid rgba(0,0,0,.05);
      cursor: pointer; transition: background .15s;
      background: none; border-left: none; border-right: none; border-top: none;
      width: 100%; font-family: inherit; font-size: 14px; text-align: left;
      color: inherit;
    }
    .s-row:last-child { border-bottom: none; }
    .s-row:hover:not(.open-row):not([disabled]) { background: rgba(0,0,0,.025); }
    .s-row.disabled { opacity: .45; cursor: not-allowed; }

    .row-icon {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .row-text { flex: 1; min-width: 0; }
    .row-label { font-weight: 600; font-size: 14px; }
    .row-sub { font-size: 12px; color: #888; margin-top: 1px; }

    .chevron {
      color: #ccc; flex-shrink: 0;
      transition: transform .22s ease;
    }
    .chevron.open { transform: rotate(90deg); }

    /* ── Accordion body ──────────────────────────────────── */
    .accordion-body {
      background: #f8f7ff;
      border-bottom: 1px solid rgba(0,0,0,.06);
      padding: 20px 16px;
      overflow: hidden;
    }

    /* ── Form inputs ─────────────────────────────────────── */
    .form-field { margin-bottom: 14px; }

    .form-field label {
      display: block;
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: .04em;
      text-transform: uppercase;
      color: var(--purple, #7c3aed);
      margin-bottom: 6px;
    }

    .form-input {
      width: 100%;
      padding: 13px 16px;
      border: 1.5px solid #e5e0ff;
      border-radius: 14px;
      font-size: 15px;
      font-family: inherit;
      background: white;
      color: inherit;
      transition: border-color .18s, box-shadow .18s;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--purple, #7c3aed);
      box-shadow: 0 0 0 3px rgba(124, 58, 237, .1);
    }

    .form-input::placeholder { color: #c4b5fd; }

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

    /* ── Upcoming appointments ───────────────────────────── */
    .apt-row {
      display: flex; align-items: center; gap: 12px;
      padding: 11px 16px;
      border-bottom: 1px solid rgba(0,0,0,.05);
    }
    .apt-row:last-child { border-bottom: none; }
    .apt-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--gradient); flex-shrink: 0; }

    /* ── Logout ──────────────────────────────────────────── */
    .logout-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; padding: 13px 16px; margin-top: 4px;
      background: #fef2f2; color: #ef4444;
      border: 1.5px solid #fecaca; border-radius: 12px;
      font-size: 14px; font-weight: 700;
      font-family: inherit; cursor: pointer;
      transition: background .15s;
    }
    .logout-btn:hover { background: #fee2e2; }

    .success-msg { color: #10b981; font-size: 13px; margin-top: 4px; margin-bottom: 12px; }
    .error-msg   { color: #ef4444; font-size: 13px; margin-top: 4px; margin-bottom: 12px; }
  `],
  template: `
    <div class="panel">

      <!-- Header -->
      <div class="panel-header">
        <button class="back-btn" (click)="goBack()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span class="panel-title">Mi cuenta</span>
      </div>

      <!-- Hero usuario -->
      <div class="user-hero">
        <div class="avatar-lg">
          @if (auth.profile()?.photoUrl) {
            <img [src]="auth.profile()!.photoUrl!" alt="foto" />
          } @else {
            {{ initials() }}
          }
        </div>
        <div>
          <div class="user-name">{{ auth.displayName() || 'Usuario' }}</div>
          <div class="user-email">{{ auth.currentUser()?.email }}</div>
        </div>
      </div>

      <!-- ── PRÓXIMAS CITAS ─────────────────────────────── -->
      <div class="group-label">Próximas citas</div>
      <div class="settings-list">
        @if (loadingApts()) {
          <div style="padding:14px 16px;color:#aaa;font-size:13px">Cargando...</div>
        } @else if (upcomingApts().length === 0) {
          <div style="padding:14px 16px;font-size:13px;color:#aaa;display:flex;align-items:center;justify-content:space-between">
            <span>Sin citas programadas</span>
            <a routerLink="/" style="color:var(--purple);font-weight:600;font-size:13px">Buscar →</a>
          </div>
        } @else {
          @for (apt of upcomingApts(); track apt.id) {
            <div class="apt-row">
              <div class="apt-dot"></div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ apt.companyName }}</div>
                <div style="font-size:12px;color:#888">{{ apt.serviceName }}</div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <div style="font-size:12px;font-weight:600">{{ formatDate(apt.date) }}</div>
                <div style="font-size:11px;color:#888">{{ apt.startTime }}</div>
              </div>
            </div>
          }
          <a routerLink="/cliente/citas"
             style="display:flex;align-items:center;justify-content:center;padding:11px 16px;font-size:13px;font-weight:700;color:var(--purple);text-decoration:none;gap:4px">
            Ver todas mis citas
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </a>
        }
      </div>

      <!-- ── CONFIGURACIÓN ─────────────────────────────── -->
      <div class="group-label">Configuración</div>
      <div class="settings-list">

        <!-- MIS DATOS (acordeón) -->
        <button class="s-row" [class.open-row]="openSection() === 'data'" (click)="toggle('data')">
          <div class="row-icon" style="background:#f0ebff">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="row-text">
            <div class="row-label">Mis datos</div>
            <div class="row-sub">Nombre, celular y dirección</div>
          </div>
          <svg class="chevron" [class.open]="openSection() === 'data'"
               width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        @if (openSection() === 'data') {
          <div class="accordion-body">
            <form [formGroup]="dataForm" (ngSubmit)="saveData()">
              <div class="form-field">
                <label>Nombre completo</label>
                <input class="form-input" type="text" formControlName="displayName"
                       placeholder="Como querés que te llamen" />
              </div>
              <div class="form-field">
                <label>Celular</label>
                <input class="form-input" type="tel" formControlName="phone"
                       placeholder="3001234567" inputmode="numeric" />
              </div>
              <div class="form-field" style="margin-bottom:18px">
                <label>Dirección <span style="font-weight:400;color:#a78bfa;text-transform:none;letter-spacing:0">(opcional)</span></label>
                <input class="form-input" type="text" formControlName="address"
                       placeholder="Tu barrio o dirección" />
              </div>
              @if (dataSuccess()) { <p class="success-msg">Datos actualizados.</p> }
              @if (dataError())   { <p class="error-msg">{{ dataError() }}</p> }
              <button type="submit" class="btn btn-primary" style="width:100%" [disabled]="dataLoading()">
                @if (dataLoading()) { Guardando... } @else { Guardar cambios }
              </button>
            </form>
          </div>
        }

        <!-- FOTO DE PERFIL (acordeón) -->
        <button class="s-row" [class.open-row]="openSection() === 'photo'" (click)="toggle('photo')">
          <div class="row-icon" style="background:#fce7f3">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <div class="row-text">
            <div class="row-label">Foto de perfil</div>
            <div class="row-sub">{{ auth.profile()?.photoUrl ? 'Foto configurada' : 'Sin foto' }}</div>
          </div>
          <svg class="chevron" [class.open]="openSection() === 'photo'"
               width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        @if (openSection() === 'photo') {
          <div class="accordion-body" style="text-align:center">
            <div class="photo-preview-wrap">
              <div class="photo-preview" (click)="photoFileInput.click()">
                @if (photoPreview()) {
                  <img [src]="photoPreview()" alt="foto" />
                } @else {
                  {{ initials() }}
                }
              </div>
              <button type="button" class="photo-change-btn" (click)="photoFileInput.click()">
                {{ photoPreview() ? 'Cambiar foto' : '+ Agregar foto' }}
              </button>
            </div>
            <input #photoFileInput type="file" accept="image/*" style="display:none" (change)="onPhotoSelected($event)" />
            @if (photoPreview()) {
              <div style="display:flex;gap:10px;max-width:320px;margin:0 auto">
                <button type="button" class="btn btn-primary" style="flex:1" (click)="savePhoto()" [disabled]="photoLoading()">
                  @if (photoLoading()) { Guardando... } @else { Guardar foto }
                </button>
                <button type="button" class="btn btn-secondary" style="color:#ef4444;border-color:#fecaca"
                        (click)="removePhoto()">Quitar</button>
              </div>
            }
            @if (photoSuccess()) { <p class="success-msg" style="margin-top:12px">Foto actualizada.</p> }
          </div>
        }

        <!-- TEMA DE COLOR -->
        <div class="s-row" style="cursor:default">
          <div class="row-icon" style="background:#ecfdf5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 12h8M12 8v8"/>
            </svg>
          </div>
          <div class="row-text"><div class="row-label">Tema de color</div></div>
          <app-theme-switcher />
        </div>

      </div>

      <!-- ── CUENTA ─────────────────────────────────────── -->
      <div class="group-label">Cuenta</div>
      <div class="settings-list">
        <button class="s-row disabled" disabled>
          <div class="row-icon" style="background:#eff6ff">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div class="row-text">
            <div class="row-label">Restablecer contraseña</div>
            <div class="row-sub">Próximamente</div>
          </div>
        </button>

        <button class="s-row disabled" style="color:#ef4444" disabled>
          <div class="row-icon" style="background:#fef2f2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
          </div>
          <div class="row-text">
            <div class="row-label">Eliminar cuenta</div>
            <div class="row-sub">Próximamente</div>
          </div>
        </button>
      </div>

      <!-- Logout -->
      <div style="padding:16px 16px 0">
        <button class="logout-btn" (click)="logout()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Cerrar sesión
        </button>
      </div>

    </div>
  `,
})
export class ClientProfileComponent {
  readonly auth = inject(AuthService);
  private aptSvc = inject(AppointmentService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  openSection = signal<OpenSection>('none');

  dataForm = this.fb.group({ displayName: [''], phone: [''], address: [''] });
  dataLoading = signal(false);
  dataSuccess = signal(false);
  dataError = signal('');

  photoPreview = signal('');
  photoLoading = signal(false);
  photoSuccess = signal(false);

  loadingApts = signal(true);
  allApts = signal<Appointment[]>([]);

  initials = computed(() => {
    const name = this.auth.displayName() || '?';
    return name.split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('');
  });

  upcomingApts = computed(() =>
    this.allApts().filter(a => a.status === 'pending' || a.status === 'scheduled').slice(0, 3)
  );

  constructor() {
    effect(() => {
      const p = this.auth.profile();
      if (!p) return;
      if (!this.dataForm.dirty) {
        this.dataForm.patchValue({ displayName: p.displayName ?? '', phone: p.phone ?? '', address: p.address ?? '' });
      }
      if (p.photoUrl && !this.photoPreview()) this.photoPreview.set(p.photoUrl);
    });
    this._loadApts();
  }

  toggle(s: OpenSection) {
    this.openSection.update(cur => cur === s ? 'none' : s);
  }

  private async _loadApts() {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) { this.loadingApts.set(false); return; }
    try { this.allApts.set(await this.aptSvc.getByClient(uid)); }
    catch { /* silencioso */ }
    finally { this.loadingApts.set(false); }
  }

  async saveData() {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;
    this.dataLoading.set(true);
    this.dataSuccess.set(false);
    this.dataError.set('');
    try {
      const { displayName, phone, address } = this.dataForm.value;
      await this.auth.saveProfile(uid, {
        displayName: displayName?.trim() || '',
        phone:   phone?.trim()   || undefined,
        address: address?.trim() || undefined,
      });
      this.dataForm.markAsPristine();
      this.dataSuccess.set(true);
      setTimeout(() => { this.dataSuccess.set(false); this.openSection.set('none'); }, 1400);
    } catch {
      this.dataError.set('Error al guardar. Intentá de nuevo.');
    } finally {
      this.dataLoading.set(false);
    }
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

  async savePhoto() {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;
    this.photoLoading.set(true);
    try {
      await this.auth.saveProfile(uid, { photoUrl: this.photoPreview() });
      this.photoSuccess.set(true);
      setTimeout(() => { this.photoSuccess.set(false); this.openSection.set('none'); }, 1400);
    } catch { /* silencioso */ }
    finally { this.photoLoading.set(false); }
  }

  async removePhoto() {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;
    this.photoPreview.set('');
    await this.auth.saveProfile(uid, { photoUrl: undefined });
    this.openSection.set('none');
  }

  formatDate(date: string): string {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  }

  goBack() { this.router.navigate(['/cliente/citas']); }

  logout() {
    this.auth.logout().subscribe();
    this.router.navigate(['/auth/login']);
  }
}
