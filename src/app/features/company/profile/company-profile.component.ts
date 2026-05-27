import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyStore } from '../../../core/services/company-store.service';
import { CompanyService } from '../../../core/services/company.service';
import { ThemeSwitcherComponent } from '../../../shared/components/theme-switcher.component';

const PRESET_ICONS: { key: string; label: string; path: string }[] = [
  { key: 'scissors', label: 'Tijeras',    path: 'M6 3v12M6 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9v12M18 3L6 15' },
  { key: 'star',     label: 'Estrella',   path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { key: 'leaf',     label: 'Hoja/Spa',   path: 'M17 8C8 10 5.9 16.17 3.82 19c0 0 3-1 6-4 0 0-1.5 5 5 5 5 0 8-4 8-8 0-3-1-5-3-5-1 0-2 1-2 2z' },
  { key: 'sun',      label: 'Sol',        path: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42' },
  { key: 'heart',    label: 'Corazón',    path: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' },
  { key: 'zap',      label: 'Rayo',       path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  { key: 'smile',    label: 'Sonrisa',    path: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01' },
  { key: 'award',    label: 'Premio',     path: 'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12' },
];

const PRESET_COLORS = ['#7c3aed','#f43f5e','#10b981','#f59e0b','#3b82f6','#ec4899','#1a1a2e','#6d28d9'];

@Component({
  selector: 'app-company-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ThemeSwitcherComponent],
  styles: [`
    .profile-page { max-width: 620px; margin: 0 auto; padding-bottom: 40px; animation: fadeInUp .3s ease; }
    @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

    .page-title { font-size:1.45rem; font-weight:800; color:#1a1a2e; margin:0 0 24px; }

    .card { background:white; border-radius:16px; box-shadow:0 4px 24px rgba(var(--primary-rgb),.12); padding:24px; margin-bottom:20px; }
    .card-title { font-size:14px; font-weight:700; color:#1a1a2e; margin:0 0 18px; display:flex; align-items:center; gap:8px; }

    .form-group { margin-bottom:16px; }
    .form-group label { display:block; font-size:13px; font-weight:600; color:#374151; margin-bottom:5px; }
    .form-group input,
    .form-group select,
    .form-group textarea {
      width:100%; border:1.5px solid #e5e7eb; border-radius:10px;
      padding:9px 12px; font-size:14px; color:#1a1a2e; background:white;
      outline:none; transition:border-color .15s; box-sizing:border-box;
    }
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus { border-color:var(--purple); box-shadow:0 0 0 3px rgba(var(--primary-rgb),.1); }
    .form-group textarea { resize:vertical; min-height:72px; }

    /* Logo section */
    .logo-preview {
      width:88px; height:88px; border-radius:18px;
      display:flex; align-items:center; justify-content:center;
      flex-shrink:0; overflow:hidden;
      box-shadow:0 4px 16px rgba(0,0,0,.1);
      border:2px solid rgba(0,0,0,.06);
    }
    .logo-preview img { width:100%; height:100%; object-fit:cover; }

    .logo-tabs { display:flex; gap:0; border:1.5px solid #e5e7eb; border-radius:10px; overflow:hidden; margin-bottom:16px; }
    .logo-tab {
      flex:1; padding:9px; font-size:13px; font-weight:600; cursor:pointer;
      border:none; background:white; color:#888; transition:all .15s;
      display:flex; align-items:center; justify-content:center; gap:6px;
    }
    .logo-tab.active { background:var(--purple); color:white; }

    .upload-area {
      border:2px dashed #d4bbff; border-radius:12px; padding:24px;
      text-align:center; cursor:pointer; transition:all .15s; background:#fdfbff;
    }
    .upload-area:hover { border-color:var(--purple); background:var(--btn-secondary-bg); }
    .upload-area input[type=file] { display:none; }

    .icon-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
    .icon-option {
      aspect-ratio:1; border-radius:12px; border:2px solid #e5e7eb;
      background:white; cursor:pointer; display:flex; flex-direction:column;
      align-items:center; justify-content:center; gap:5px;
      font-size:11px; font-weight:600; color:#888; transition:all .15s;
    }
    .icon-option:hover { border-color:var(--purple); color:var(--purple); }
    .icon-option.selected { border-color:var(--purple); background:var(--btn-secondary-bg); color:var(--purple); }

    .color-row { display:flex; gap:8px; flex-wrap:wrap; margin-top:14px; }
    .color-dot {
      width:28px; height:28px; border-radius:50%; cursor:pointer;
      border:3px solid transparent; transition:transform .15s, border-color .15s;
      flex-shrink:0;
    }
    .color-dot:hover { transform:scale(1.15); }
    .color-dot.selected { border-color:white; box-shadow:0 0 0 2px var(--purple); transform:scale(1.1); }

    /* Toast */
    .toast {
      position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
      background:#10b981; color:white; padding:12px 22px; border-radius:10px;
      font-size:14px; font-weight:600; display:flex; align-items:center; gap:8px;
      box-shadow:0 6px 24px rgba(16,185,129,.35); z-index:200;
      animation:toast-in .25s ease;
    }
    @keyframes toast-in { from{opacity:0;transform:translateX(-50%) translateY(12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }

    /* Grid 2 columnas → 1 en mobile */
    .grid-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

    @media (max-width: 560px) {
      .icon-grid { grid-template-columns: repeat(4, 1fr); }
    }

    @media (max-width: 480px) {
      /* Grid de teléfono/ciudad apilado */
      .grid-2col { grid-template-columns: 1fr; }

      /* Icon grid: reducir tamaño mínimo de las celdas */
      .icon-option { min-height: 56px; font-size: 10px; }

      /* Inputs 16px para evitar zoom iOS */
      input, select, textarea { font-size: 16px !important; }
    }

    @media (max-width: 400px) {
      /* Logo preview: stack vertical */
      .logo-preview-row { flex-direction: column; align-items: center; text-align: center; }
    }

    /* Toast responsive */
    .toast { max-width: calc(100vw - 32px); white-space: normal; text-align: center; }
  `],
  template: `
    <div class="profile-page">
      <h1 class="page-title">Perfil de la empresa</h1>

      <!-- ── Compartir negocio ── -->
      <div class="card" style="background:linear-gradient(135deg,#f9f5ff 0%,#fdf2ff 100%);border:1.5px solid #f0e8ff">
        <div class="card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Tu página pública
        </div>
        <p style="font-size:13px;color:#666;margin:0 0 14px">Compartí este link con tus clientes para que agenden directamente, sin pasar por la búsqueda.</p>

        <div style="display:flex;gap:8px;align-items:center">
          <div style="flex:1;background:white;border:1.5px solid #e5e7eb;border-radius:10px;padding:9px 12px;font-size:13px;color:#555;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            {{ shareUrl }}
          </div>
          <button (click)="copyLink()"
            style="flex-shrink:0;padding:9px 16px;border-radius:10px;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:inherit;display:flex;align-items:center;gap:6px;transition:all .15s"
            [style.background]="linkCopied() ? '#d1fae5' : 'var(--gradient)'"
            [style.color]="linkCopied() ? '#065f46' : 'white'">
            @if (linkCopied()) {
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ¡Copiado!
            } @else {
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copiar link
            }
          </button>
        </div>
      </div>

      <!-- ── Logo ── -->
      <div class="card">
        <div class="card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          Logo del negocio
          <span style="font-size:12px;font-weight:400;color:#aaa;margin-left:4px">(opcional)</span>
        </div>

        <!-- Vista previa -->
        <div class="logo-preview-row" style="display:flex;align-items:center;gap:20px;margin-bottom:20px">
          <div class="logo-preview" [style.background]="logoMode()==='icon' ? selectedColor() : 'var(--btn-secondary-bg)'">
            @if (logoMode() === 'upload' && uploadedImage()) {
              <img [src]="uploadedImage()" alt="Logo" />
            } @else {
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                   [attr.stroke]="logoMode()==='icon' ? 'white' : '#c4b5fd'"
                   stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path [attr.d]="selectedIcon().path"/>
              </svg>
            }
          </div>
          <div>
            <div style="font-weight:700;font-size:14px;color:#1a1a2e">{{ form.name || 'Tu negocio' }}</div>
            <div style="font-size:12px;color:#aaa;margin-top:3px">Vista previa del logo</div>
            @if (logoMode()==='upload' && uploadedImage()) {
              <button (click)="clearUpload()" style="margin-top:8px;font-size:12px;color:#f43f5e;background:none;border:none;cursor:pointer;padding:0;font-weight:600">
                Quitar imagen
              </button>
            }
          </div>
        </div>

        <!-- Tabs: Subir / Elegir ícono -->
        <div class="logo-tabs">
          <button class="logo-tab" [class.active]="logoMode()==='upload'" (click)="logoMode.set('upload')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
            </svg>
            Subir imagen
          </button>
          <button class="logo-tab" [class.active]="logoMode()==='icon'" (click)="logoMode.set('icon')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Elegir ícono
          </button>
        </div>

        <!-- Panel: Subir imagen -->
        @if (logoMode() === 'upload') {
          <label class="upload-area" for="logo-file-input">
            <input id="logo-file-input" type="file" accept="image/*" (change)="onFileChange($event)" />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:8px">
              <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
            </svg>
            <div style="font-size:14px;font-weight:600;color:var(--purple)">Hacé clic para subir</div>
            <div style="font-size:12px;color:#aaa;margin-top:4px">PNG, JPG o SVG — máx. 2MB</div>
          </label>
        }

        <!-- Panel: Elegir ícono -->
        @if (logoMode() === 'icon') {
          <div class="icon-grid">
            @for (icon of presetIcons; track icon.key) {
              <button class="icon-option" [class.selected]="selectedIconKey() === icon.key"
                      (click)="selectedIconKey.set(icon.key)">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path [attr.d]="icon.path"/>
                </svg>
                {{ icon.label }}
              </button>
            }
          </div>

          <!-- Color del fondo del ícono -->
          <div style="margin-top:16px">
            <div style="font-size:12px;font-weight:700;color:#888;margin-bottom:8px">Color de fondo</div>
            <div class="color-row">
              @for (color of presetColors; track color) {
                <div class="color-dot" [class.selected]="selectedColor()===color"
                     [style.background]="color" (click)="selectedColor.set(color)"></div>
              }
            </div>
          </div>
        }
      </div>

      <!-- ── Datos generales ── -->
      <div class="card">
        <div class="card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Información del negocio
        </div>

        <div class="form-group">
          <label>Nombre del negocio *</label>
          <input [(ngModel)]="form.name" placeholder="Ej: Salón Valentina" />
        </div>

        <div class="form-group">
          <label>Categoría</label>
          <select [(ngModel)]="form.category">
            <option value="salon">Salón de belleza</option>
            <option value="barberia">Barbería</option>
            <option value="spa">Spa</option>
            <option value="peluqueria">Peluquería</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div class="form-group">
          <label>Descripción</label>
          <textarea [(ngModel)]="form.description" rows="3"
            placeholder="Describí tu negocio en pocas palabras"></textarea>
        </div>

        <div class="grid-2col">
          <div class="form-group" style="margin-bottom:0">
            <label>Teléfono / WhatsApp</label>
            <input [(ngModel)]="form.phone" placeholder="57300..." />
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label>Ciudad</label>
            <input [(ngModel)]="form.city" placeholder="Bogotá" />
          </div>
        </div>
      </div>

      <!-- ── Ubicación y redes ── -->
      <div class="card">
        <div class="card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          Ubicación y redes
        </div>

        <div class="form-group">
          <label>Dirección</label>
          <input [(ngModel)]="form.address" placeholder="Calle 123 # 45-67" />
        </div>

        <div class="form-group">
          <label>Instagram</label>
          <input [(ngModel)]="form.instagram" placeholder="@tu_negocio" />
        </div>

        <div class="form-group">
          <label>Facebook</label>
          <input [(ngModel)]="form.facebook" placeholder="facebook.com/tu_negocio" />
        </div>

        <div class="form-group">
          <label>TikTok</label>
          <input [(ngModel)]="form.tiktok" placeholder="@tu_negocio" />
        </div>

        <div class="form-group" style="margin-bottom:0">
          <label>YouTube</label>
          <input [(ngModel)]="form.youtube" placeholder="youtube.com/@tu_negocio" />
        </div>
      </div>

      <!-- ── Configuración de reservas ── -->
      <div class="card">
        <div class="card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 9 15 9"/><polyline points="9 12 15 12"/><polyline points="9 15 12 15"/>
          </svg>
          Reservas
        </div>
        <label style="display:flex;align-items:center;justify-content:space-between;gap:16px;cursor:pointer">
          <div>
            <div style="font-size:14px;font-weight:600;color:#1a1a2e">Confirmar citas automáticamente</div>
            <div style="font-size:12px;color:#888;margin-top:3px">Las nuevas reservas quedan confirmadas sin revisión manual</div>
          </div>
          <div style="position:relative;width:44px;height:24px;flex-shrink:0">
            <input type="checkbox" [(ngModel)]="form.autoConfirm"
                   style="position:absolute;opacity:0;width:0;height:0" />
            <div style="position:absolute;inset:0;border-radius:24px;transition:background .2s"
                 [style.background]="form.autoConfirm ? 'var(--purple)' : '#e5e7eb'">
              <div style="position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:white;transition:transform .2s;box-shadow:0 1px 4px rgba(0,0,0,.2)"
                   [style.transform]="form.autoConfirm ? 'translateX(23px)' : 'translateX(3px)'"></div>
            </div>
          </div>
        </label>
      </div>

      <!-- ── Apariencia ── -->
      <div class="card">
        <div class="card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          Apariencia
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0">
          <div>
            <div style="font-size:14px;font-weight:600;color:#1a1a2e">Tema de la interfaz</div>
            <div style="font-size:12px;color:#888;margin-top:2px">Claro u oscuro</div>
          </div>
          <app-theme-switcher />
        </div>
      </div>

      <!-- Acciones -->
      <div style="display:flex;gap:10px">
        <button class="btn btn-primary" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px"
                (click)="save()" [disabled]="!form.name || saving()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
          </svg>
          {{ saving() ? 'Guardando...' : 'Guardar cambios' }}
        </button>
        <button class="btn btn-secondary" (click)="reset()">Descartar</button>
      </div>
    </div>

    @if (saved()) {
      <div class="toast">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Perfil guardado correctamente
      </div>
    }
  `,
})
export class CompanyProfileComponent {
  private companyStore = inject(CompanyStore);
  private companySvc   = inject(CompanyService);

  readonly presetIcons = PRESET_ICONS;
  readonly presetColors = PRESET_COLORS;

  saved       = signal(false);
  saving      = signal(false);
  linkCopied  = signal(false);

  get shareUrl(): string {
    return `${window.location.origin}/negocio/${this.companyStore.companyId() ?? ''}`;
  }

  async copyLink(): Promise<void> {
    await navigator.clipboard.writeText(this.shareUrl);
    this.linkCopied.set(true);
    setTimeout(() => this.linkCopied.set(false), 2500);
  }
  logoMode        = signal<'upload' | 'icon'>('icon');
  uploadedImage   = signal<string | null>(null);
  selectedIconKey = signal('scissors');
  selectedColor   = signal('#7c3aed');

  selectedIcon = () => PRESET_ICONS.find(i => i.key === this.selectedIconKey()) ?? PRESET_ICONS[0];

  form = {
    name:        '',
    category:    'barberia',
    description: '',
    phone:       '',
    city:        '',
    address:     '',
    instagram:   '',
    facebook:    '',
    tiktok:      '',
    youtube:     '',
    autoConfirm: false,
  };

  private original = { ...this.form };

  constructor() {
    effect(() => {
      const company = this.companyStore.company();
      if (!company) return;
      this.form = {
        name:        company.name ?? '',
        category:    company.category ?? 'barberia',
        description: company.description ?? '',
        phone:       company.phone ?? '',
        city:        company.city ?? '',
        address:     company.address ?? '',
        instagram:   company.instagram ?? '',
        facebook:    company.facebook ?? '',
        tiktok:      company.tiktok ?? '',
        youtube:     company.youtube ?? '',
        autoConfirm: company.autoConfirm ?? false,
      };
      this.original = { ...this.form };
      if (company.logoIcon)  this.selectedIconKey.set(company.logoIcon);
      if (company.logoColor) this.selectedColor.set(company.logoColor);
      if (company.logoUrl)   { this.uploadedImage.set(company.logoUrl); this.logoMode.set('upload'); }
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('El archivo supera los 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.uploadedImage.set(reader.result as string);
      this.logoMode.set('upload');
    };
    reader.readAsDataURL(file);
  }

  clearUpload() {
    this.uploadedImage.set(null);
    this.logoMode.set('icon');
  }

  async save() {
    const cid = this.companyStore.companyId();
    if (!cid || !this.form.name.trim()) return;
    this.saving.set(true);
    try {
      await this.companySvc.updateCompany(cid, {
        name:        this.form.name.trim(),
        category:    this.form.category as any,
        description: this.form.description,
        phone:       this.form.phone,
        city:        this.form.city,
        address:     this.form.address,
        instagram:   this.form.instagram,
        facebook:    this.form.facebook,
        tiktok:      this.form.tiktok,
        youtube:     this.form.youtube,
        logoIcon:    this.logoMode() === 'icon' ? this.selectedIconKey() : undefined,
        logoColor:   this.logoMode() === 'icon' ? this.selectedColor()   : undefined,
        logoUrl:     this.logoMode() === 'upload' ? (this.uploadedImage() ?? undefined) : undefined,
        autoConfirm: this.form.autoConfirm,
      });
      this.original = { ...this.form };
      await this.companyStore.refresh();
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2500);
    } finally {
      this.saving.set(false);
    }
  }

  reset() {
    this.form = { ...this.original };
    this.saved.set(false);
  }
}
