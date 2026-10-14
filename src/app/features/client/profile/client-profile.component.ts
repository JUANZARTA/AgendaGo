import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentService, Appointment } from '../../../core/services/appointment.service';
import { ThemeSwitcherComponent } from '../../../shared/components/theme-switcher.component';
import { TourService } from '../../../core/services/tour.service';
import { ProfileAppointmentsComponent } from './components/profile-appointments.component';
import { ProfileDataFormComponent } from './components/profile-data-form.component';
import { ProfilePhotoComponent } from './components/profile-photo.component';
import { ProfileAccountComponent } from './components/profile-account.component';
import { PROFILE_SETTINGS_STYLES } from './components/profile.styles';
import { LegalLinksComponent } from '../../../shared/components/legal-links.component';

type OpenSection = 'none' | 'data' | 'photo';

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, ThemeSwitcherComponent,
    ProfileAppointmentsComponent, ProfileDataFormComponent, ProfilePhotoComponent, ProfileAccountComponent,
    LegalLinksComponent,
  ],
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

    ${PROFILE_SETTINGS_STYLES}

    .chevron {
      color: #ccc; flex-shrink: 0;
      transition: transform .22s ease;
    }
    .chevron.open { transform: rotate(90deg); }
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

      <app-profile-appointments [loading]="loadingApts()" [appointments]="upcomingApts()" />

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
          <app-profile-data-form
            [form]="dataForm"
            [loading]="dataLoading()"
            [success]="dataSuccess()"
            [error]="dataError()"
            (save)="saveData()" />
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
          <app-profile-photo
            [(preview)]="photoPreview"
            [initials]="initials()"
            [loading]="photoLoading()"
            [success]="photoSuccess()"
            (save)="savePhoto()"
            (remove)="removePhoto()" />
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

        <!-- TOUR -->
        <button class="s-row" (click)="startTour()">
          <div class="row-icon" style="background:#fef3c7">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="row-text">
            <div class="row-label">Tour de la app</div>
            <div class="row-sub">Volvé a ver el recorrido guiado</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>

      </div>

      <app-legal-links />

      <app-profile-account (logout)="logout()" />

    </div>
  `,
})
export class ClientProfileComponent {
  readonly auth   = inject(AuthService);
  private aptSvc  = inject(AppointmentService);
  private router  = inject(Router);
  private fb      = inject(FormBuilder);
  private tourSvc = inject(TourService);

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

  startTour() { this.tourSvc.restartClientTour(); }

  goBack() { this.router.navigate(['/cliente/citas']); }

  logout() {
    this.auth.logout().subscribe();
    this.router.navigate(['/auth/login']);
  }
}
