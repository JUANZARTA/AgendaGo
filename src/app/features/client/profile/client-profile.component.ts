import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentService, Appointment } from '../../../core/services/appointment.service';
import { ThemeSwitcherComponent } from '../../../shared/components/theme-switcher.component';

type Section = 'main' | 'edit-data' | 'edit-photo';

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ThemeSwitcherComponent],
  styles: [`
    .panel { max-width: 500px; margin: 0 auto; padding-bottom: 40px; }

    /* ── Header ─────────────────────────────────────────────────── */
    .panel-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px 16px;
      border-bottom: 1px solid rgba(0,0,0,.06);
    }

    .back-btn {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: rgba(0,0,0,.05);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: inherit;
      flex-shrink: 0;
      transition: background .15s;
    }
    .back-btn:hover { background: rgba(0,0,0,.1); }

    .panel-title {
      font-size: 1.1rem;
      font-weight: 700;
      flex: 1;
    }

    /* ── User hero ───────────────────────────────────────────────── */
    .user-hero {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 20px 16px;
    }

    .avatar-lg {
      width: 64px; height: 64px;
      border-radius: 50%;
      background: var(--gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
      font-size: 1.4rem;
      font-weight: 700;
      color: white;
    }

    .avatar-lg img { width: 100%; height: 100%; object-fit: cover; }

    .user-info { flex: 1; min-width: 0; }

    .user-name {
      font-size: 1.05rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-email {
      font-size: 12.5px;
      color: #888;
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── Settings list ───────────────────────────────────────────── */
    .settings-group {
      margin: 0 0 4px;
    }

    .settings-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .07em;
      text-transform: uppercase;
      color: #aaa;
      padding: 16px 16px 6px;
    }

    .settings-list {
      background: white;
      border-top: 1px solid rgba(0,0,0,.06);
      border-bottom: 1px solid rgba(0,0,0,.06);
    }

    .settings-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid rgba(0,0,0,.05);
      cursor: pointer;
      transition: background .15s;
      text-decoration: none;
      color: inherit;
      background: none;
      border-left: none;
      border-right: none;
      border-top: none;
      width: 100%;
      font-family: inherit;
      font-size: 14px;
      text-align: left;
    }

    .settings-row:last-child { border-bottom: none; }
    .settings-row:hover { background: rgba(0,0,0,.03); }

    .settings-row.disabled {
      opacity: .45;
      cursor: not-allowed;
    }
    .settings-row.disabled:hover { background: none; }

    .row-icon {
      width: 34px; height: 34px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .row-text { flex: 1; min-width: 0; }
    .row-label { font-weight: 600; font-size: 14px; }
    .row-sub { font-size: 12px; color: #888; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .row-chevron { color: #ccc; flex-shrink: 0; }

    /* ── Edit sub-panels ─────────────────────────────────────────── */
    .sub-panel { padding: 0 16px 32px; }

    .field { margin-bottom: 16px; }

    .field label {
      display: block;
      font-size: 12.5px;
      font-weight: 700;
      margin-bottom: 6px;
      color: #555;
    }

    /* ── Próximas citas ─────────────────────────────────────────── */
    .apt-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(0,0,0,.05);
    }
    .apt-row:last-child { border-bottom: none; }

    .apt-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--gradient);
      flex-shrink: 0;
    }

    /* ── Danger zone ────────────────────────────────────────────── */
    .danger-row {
      color: #ef4444;
    }

    .danger-row .row-icon { background: #fef2f2; }
  `],
  template: `
    <div class="panel">

      <!-- ═══════════════════════════════════════════════════════
           PANEL PRINCIPAL
      ═══════════════════════════════════════════════════════ -->
      @if (section() === 'main') {

        <!-- Header -->
        <div class="panel-header">
          <button class="back-btn" (click)="goBack()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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
          <div class="user-info">
            <div class="user-name">{{ auth.displayName() || 'Usuario' }}</div>
            <div class="user-email">{{ auth.currentUser()?.email }}</div>
          </div>
        </div>

        <!-- Próximas citas -->
        <div class="settings-group">
          <div class="settings-label">Próximas citas</div>
          <div class="settings-list">
            @if (loadingApts()) {
              <div style="padding:16px;color:#aaa;font-size:13px;text-align:center">Cargando...</div>
            } @else if (upcomingApts().length === 0) {
              <div style="padding:14px 16px;font-size:13px;color:#aaa">
                No tenés citas programadas.
                <a routerLink="/" style="color:var(--purple);font-weight:600;margin-left:4px">Buscar negocios →</a>
              </div>
            } @else {
              @for (apt of upcomingApts(); track apt.id) {
                <div class="apt-row">
                  <div class="apt-dot"></div>
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                      {{ apt.companyName }}
                    </div>
                    <div style="font-size:12px;color:#888">{{ apt.serviceName }}</div>
                  </div>
                  <div style="text-align:right;flex-shrink:0">
                    <div style="font-size:12px;font-weight:600">{{ formatDate(apt.date) }}</div>
                    <div style="font-size:11px;color:#888">{{ apt.startTime }}</div>
                  </div>
                </div>
              }
              <a routerLink="/cliente/citas"
                 style="display:flex;align-items:center;justify-content:center;padding:12px;font-size:13px;font-weight:700;color:var(--purple);text-decoration:none;gap:4px">
                Ver todas mis citas
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </a>
            }
          </div>
        </div>

        <!-- Configuración -->
        <div class="settings-group">
          <div class="settings-label">Configuración</div>
          <div class="settings-list">

            <!-- Mis datos -->
            <button class="settings-row" (click)="section.set('edit-data')">
              <div class="row-icon" style="background:#f0ebff">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div class="row-text">
                <div class="row-label">Mis datos</div>
                <div class="row-sub">Nombre, celular y dirección</div>
              </div>
              <svg class="row-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            <!-- Foto de perfil -->
            <button class="settings-row" (click)="section.set('edit-photo')">
              <div class="row-icon" style="background:#fce7f3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <div class="row-text">
                <div class="row-label">Foto de perfil</div>
                <div class="row-sub">{{ auth.profile()?.photoUrl ? 'Foto configurada' : 'Sin foto' }}</div>
              </div>
              <svg class="row-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            <!-- Tema de color -->
            <div class="settings-row" style="cursor:default" (click)="$event.stopPropagation()">
              <div class="row-icon" style="background:#ecfdf5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4M12 16h.01"/>
                </svg>
              </div>
              <div class="row-text">
                <div class="row-label">Tema de color</div>
              </div>
              <app-theme-switcher />
            </div>

          </div>
        </div>

        <!-- Cuenta -->
        <div class="settings-group">
          <div class="settings-label">Cuenta</div>
          <div class="settings-list">

            <button class="settings-row disabled" disabled>
              <div class="row-icon" style="background:#eff6ff">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div class="row-text">
                <div class="row-label">Restablecer contraseña</div>
                <div class="row-sub">Próximamente</div>
              </div>
            </button>

            <button class="settings-row danger-row disabled" disabled>
              <div class="row-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
        </div>

        <!-- Logout -->
        <div style="padding: 8px 16px 0">
          <button class="settings-row"
                  style="background:#fef2f2;border-radius:12px;color:#ef4444;font-weight:700;justify-content:center;gap:8px;border:1.5px solid #fecaca"
                  (click)="logout()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesión
          </button>
        </div>

      }

      <!-- ═══════════════════════════════════════════════════════
           SUB-PANEL: MIS DATOS
      ═══════════════════════════════════════════════════════ -->
      @if (section() === 'edit-data') {

        <div class="panel-header">
          <button class="back-btn" (click)="section.set('main')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span class="panel-title">Mis datos</span>
        </div>

        <div class="sub-panel" style="padding-top:24px">
          <form [formGroup]="dataForm" (ngSubmit)="saveData()">
            <div class="field">
              <label>Nombre completo</label>
              <input class="input" type="text" formControlName="displayName" placeholder="Tu nombre" />
            </div>
            <div class="field">
              <label>Celular</label>
              <input class="input" type="tel" formControlName="phone" placeholder="3001234567" inputmode="numeric" />
            </div>
            <div class="field">
              <label>Dirección <span style="font-weight:400;color:#aaa">(opcional)</span></label>
              <input class="input" type="text" formControlName="address" placeholder="Tu barrio o dirección" />
            </div>

            @if (dataSuccess()) {
              <p style="color:#10b981;font-size:13px;margin-bottom:12px">Datos actualizados.</p>
            }
            @if (dataError()) {
              <p style="color:#ef4444;font-size:13px;margin-bottom:12px">{{ dataError() }}</p>
            }

            <button type="submit" class="btn btn-primary" style="width:100%" [disabled]="dataLoading()">
              @if (dataLoading()) { Guardando... } @else { Guardar cambios }
            </button>
          </form>
        </div>

      }

      <!-- ═══════════════════════════════════════════════════════
           SUB-PANEL: FOTO DE PERFIL
      ═══════════════════════════════════════════════════════ -->
      @if (section() === 'edit-photo') {

        <div class="panel-header">
          <button class="back-btn" (click)="section.set('main')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span class="panel-title">Foto de perfil</span>
        </div>

        <div class="sub-panel" style="padding-top:32px;text-align:center">

          <!-- Preview -->
          <div style="position:relative;width:120px;height:120px;border-radius:50%;background:var(--gradient);margin:0 auto 12px;overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 8px 24px rgba(124,58,237,.25)"
               (click)="photoFileInput.click()">
            @if (photoPreview()) {
              <img [src]="photoPreview()" style="width:100%;height:100%;object-fit:cover" alt="foto" />
            } @else {
              <span style="font-size:2.2rem;font-weight:700;color:white">{{ initials() }}</span>
            }
            <div style="position:absolute;inset:0;background:rgba(0,0,0,.42);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .18s"
                 onmouseover="this.style.opacity='1'"
                 onmouseout="this.style.opacity='0'">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          </div>

          <input #photoFileInput type="file" accept="image/*" style="display:none" (change)="onPhotoSelected($event)" />

          <p style="font-size:13px;color:#888;margin-bottom:24px">
            La foto se recorta en círculo y se guarda automáticamente.
          </p>

          <button class="btn btn-secondary" style="display:inline-flex;align-items:center;gap:8px;margin-bottom:16px"
                  (click)="photoFileInput.click()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            {{ photoPreview() ? 'Cambiar foto' : 'Elegir foto' }}
          </button>

          @if (photoPreview()) {
            <div>
              <button class="btn btn-primary" style="width:100%;max-width:280px;margin-bottom:10px"
                      (click)="savePhoto()" [disabled]="photoLoading()">
                @if (photoLoading()) { Guardando... } @else { Guardar foto }
              </button>
              <button class="btn btn-secondary" style="width:100%;max-width:280px;color:#ef4444;border-color:#fecaca"
                      (click)="removePhoto()">
                Quitar foto
              </button>
            </div>
          }

          @if (photoSuccess()) {
            <p style="color:#10b981;font-size:13px;margin-top:12px">Foto actualizada.</p>
          }
        </div>

      }

    </div>
  `,
})
export class ClientProfileComponent {
  readonly auth = inject(AuthService);
  private aptSvc = inject(AppointmentService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  section = signal<Section>('main');

  /* ── Datos form ──────────────────────────────────────── */
  dataForm = this.fb.group({
    displayName: [''],
    phone: [''],
    address: [''],
  });
  dataLoading = signal(false);
  dataSuccess = signal(false);
  dataError = signal('');

  /* ── Foto ────────────────────────────────────────────── */
  photoPreview = signal('');
  photoLoading = signal(false);
  photoSuccess = signal(false);

  /* ── Citas ───────────────────────────────────────────── */
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
        this.dataForm.patchValue({
          displayName: p.displayName ?? '',
          phone:       p.phone ?? '',
          address:     p.address ?? '',
        });
      }
      if (p.photoUrl && !this.photoPreview()) this.photoPreview.set(p.photoUrl);
    });

    this._loadApts();
  }

  private async _loadApts() {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) { this.loadingApts.set(false); return; }
    try {
      const apts = await this.aptSvc.getByClient(uid);
      this.allApts.set(apts);
    } catch { /* silencioso */ }
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
      setTimeout(() => { this.dataSuccess.set(false); this.section.set('main'); }, 1200);
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
      setTimeout(() => { this.photoSuccess.set(false); this.section.set('main'); }, 1200);
    } catch { /* silencioso */ }
    finally { this.photoLoading.set(false); }
  }

  async removePhoto() {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;
    this.photoPreview.set('');
    await this.auth.saveProfile(uid, { photoUrl: undefined });
    this.section.set('main');
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
