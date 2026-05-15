import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyStore } from '../../../core/services/company-store.service';
import { CompanyService } from '../../../core/services/company.service';
import { AuthService } from '../../../core/services/auth.service';

const DEFAULT_SCHEDULE = [
  { key: 'lun', label: 'Lunes',     enabled: true,  ranges: [{ open: '08:00', close: '18:00' }] },
  { key: 'mar', label: 'Martes',    enabled: true,  ranges: [{ open: '08:00', close: '18:00' }] },
  { key: 'mie', label: 'Miércoles', enabled: true,  ranges: [{ open: '08:00', close: '18:00' }] },
  { key: 'jue', label: 'Jueves',    enabled: true,  ranges: [{ open: '08:00', close: '18:00' }] },
  { key: 'vie', label: 'Viernes',   enabled: true,  ranges: [{ open: '08:00', close: '18:00' }] },
  { key: 'sab', label: 'Sábado',    enabled: true,  ranges: [{ open: '09:00', close: '16:00' }] },
  { key: 'dom', label: 'Domingo',   enabled: false, ranges: [{ open: '09:00', close: '14:00' }] },
];

const CATEGORIES = [
  { value: 'barberia',   label: 'Barbería',         color: '#7c3aed', icon: 'M6 3v12M6 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9v12M18 3L6 15',                                                                                                          desc: 'Cortes, barba y servicios masculinos' },
  { value: 'salon',      label: 'Salón de belleza', color: '#f43f5e', icon: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',                                                              desc: 'Cabello, uñas, maquillaje y más'    },
  { value: 'spa',        label: 'Spa / Estética',   color: '#10b981', icon: 'M17 8C8 10 5.9 16.17 3.82 19c0 0 3-1 6-4 0 0-1.5 5 5 5 5 0 8-4 8-8 0-3-1-5-3-5-1 0-2 1-2 2z',                                                                                                            desc: 'Masajes, faciales y relajación'     },
  { value: 'peluqueria', label: 'Peluquería',       color: '#f59e0b', icon: 'M6 3v12M6 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9v12M18 3L6 15',                                                                                                          desc: 'Cortes y peinados para todos'       },
] as const;

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', color: '#E1306C', placeholder: '@tu_usuario',      letter: 'IG' },
  { key: 'facebook',  label: 'Facebook',  color: '#1877F2', placeholder: 'tu-pagina',        letter: 'FB' },
  { key: 'tiktok',    label: 'TikTok',    color: '#111111', placeholder: '@tu_usuario',      letter: 'TT' },
  { key: 'youtube',   label: 'YouTube',   color: '#FF0000', placeholder: 'URL del canal',    letter: 'YT' },
];

const SLOT_OPTIONS = [
  { value: 15, label: '15 minutos' },
  { value: 20, label: '20 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '60 minutos (1 hora)' },
];

@Component({
  selector: 'app-company-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .onboarding {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px 56px;
      background: var(--body-bg);
    }

    .ob-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 32px;
    }
    .ob-logo-icon {
      width: 32px; height: 32px;
      background: var(--gradient);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ob-logo-text {
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
      box-shadow: 0 8px 40px rgba(var(--primary-rgb), .14);
      padding: 36px 40px;
      width: 100%;
      max-width: 580px;
    }

    /* Progress bar */
    .ob-progress { display: flex; gap: 6px; margin-bottom: 28px; }
    .ob-progress-bar { height: 4px; flex: 1; border-radius: 4px; transition: background .3s ease; }
    .ob-progress-bar.active   { background: var(--gradient); }
    .ob-progress-bar.done     { background: var(--purple); }
    .ob-progress-bar.inactive { background: #f0e8ff; }

    .ob-step-label {
      font-size: 11px; font-weight: 700; color: var(--purple);
      letter-spacing: .08em; text-transform: uppercase; margin-bottom: 4px;
    }
    .ob-title { font-size: 1.45rem; font-weight: 800; color: #1a1a2e; margin: 0 0 4px; line-height: 1.25; }
    .ob-subtitle { font-size: 13px; color: #888; margin: 0 0 24px; }

    /* Category grid */
    .cat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .cat-card {
      border: 2px solid #f0e8ff; border-radius: 16px; padding: 20px 16px;
      cursor: pointer; background: white; text-align: left;
      transition: border-color .18s, background .18s, transform .18s, box-shadow .18s;
      width: 100%; display: flex; flex-direction: column; gap: 8px;
    }
    .cat-card:hover { border-color: var(--purple); background: var(--btn-secondary-bg); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(var(--primary-rgb),.12); }
    .cat-card.selected { background: var(--btn-secondary-bg); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(var(--primary-rgb),.18); }
    .cat-icon-wrap { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .cat-label { font-weight: 700; font-size: 14px; color: #1a1a2e; }
    .cat-desc  { font-size: 12px; color: #888; line-height: 1.4; }

    /* Form */
    .ob-form-group { margin-bottom: 16px; }
    .ob-form-group label { display: block; font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 6px; }
    .ob-form-group input, .ob-form-group textarea, .ob-form-group select {
      width: 100%; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 11px 14px;
      font-size: 14px; color: #1a1a2e; background: white; outline: none;
      transition: border-color .15s, box-shadow .15s; box-sizing: border-box; font-family: inherit;
    }
    .ob-form-group input:focus, .ob-form-group textarea:focus, .ob-form-group select:focus {
      border-color: var(--purple);
      box-shadow: 0 0 0 3px rgba(var(--primary-rgb),.1);
    }
    .ob-form-group textarea { resize: vertical; min-height: 72px; line-height: 1.5; }
    .ob-form-group select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; cursor: pointer; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    /* Selected category pill */
    .selected-cat-pill {
      display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px;
      border-radius: 20px; font-size: 13px; font-weight: 700; margin-bottom: 20px;
      cursor: pointer; border: none; transition: opacity .15s;
    }
    .selected-cat-pill:hover { opacity: .8; }

    /* Social networks */
    .socials-section { margin-top: 4px; }
    .socials-label { font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 10px; }
    .socials-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
    .social-chip {
      display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px;
      border-radius: 20px; border: 1.5px solid #e5e7eb; background: white;
      cursor: pointer; font-size: 12px; font-weight: 700; color: #888;
      transition: all .15s; font-family: inherit;
    }
    .social-chip.selected { color: white; border-color: transparent; }
    .social-chip-letter {
      width: 18px; height: 18px; border-radius: 4px; background: rgba(255,255,255,.25);
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 9px; font-weight: 800; letter-spacing: -.5px;
    }
    .social-input-row {
      display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
    }
    .social-input-icon {
      width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 800; color: white; letter-spacing: -.5px;
    }
    .social-input-row input {
      flex: 1; border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 9px 12px;
      font-size: 13px; color: #1a1a2e; background: white; outline: none;
      font-family: inherit; transition: border-color .15s, box-shadow .15s;
    }
    .social-input-row input:focus { border-color: var(--purple); box-shadow: 0 0 0 3px rgba(var(--primary-rgb),.1); }

    /* Schedule question (step 3) */
    .choice-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px; }
    .choice-card {
      border: 2px solid #e5e7eb; border-radius: 16px; padding: 20px 16px; cursor: pointer;
      background: white; text-align: center; transition: all .18s; font-family: inherit;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
    }
    .choice-card:hover { border-color: var(--purple); background: #f9f5ff; transform: translateY(-2px); }
    .choice-card.primary-choice { background: var(--gradient); border-color: transparent; color: white; }
    .choice-card.primary-choice:hover { opacity: .9; transform: translateY(-2px); }
    .choice-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
    .choice-title { font-weight: 800; font-size: 14px; }
    .choice-desc  { font-size: 11px; opacity: .7; line-height: 1.4; }

    /* Schedule editor (step 4) */
    .day-rows { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
    .day-row {
      display: flex; align-items: center; gap: 10px;
      background: #fafafa; border-radius: 12px; padding: 10px 14px;
      border: 1.5px solid #f0e8ff; transition: opacity .18s;
    }
    .day-row.off { opacity: .45; }
    .day-name { font-size: 13px; font-weight: 700; color: #1a1a2e; width: 84px; flex-shrink: 0; }
    .time-input {
      border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 6px 10px;
      font-size: 13px; font-family: inherit; color: #1a1a2e; outline: none;
      width: 88px; transition: border-color .15s;
    }
    .time-input:focus { border-color: var(--purple); }
    .time-sep { color: #bbb; font-size: 13px; }

    /* Toggle switch */
    .toggle-wrap { display: flex; align-items: center; flex-shrink: 0; cursor: pointer; }
    .toggle-track {
      width: 34px; height: 20px; border-radius: 10px; background: #e5e7eb;
      position: relative; transition: background .2s; flex-shrink: 0;
    }
    .toggle-track.on { background: var(--purple); }
    .toggle-thumb {
      width: 14px; height: 14px; border-radius: 50%; background: white;
      position: absolute; top: 3px; left: 3px;
      transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.2);
    }
    .toggle-track.on .toggle-thumb { transform: translateX(14px); }

    /* Buttons */
    .ob-btn-primary {
      width: 100%; padding: 14px; border-radius: 12px; border: none;
      background: var(--gradient); color: white; font-size: 15px; font-weight: 700;
      cursor: pointer; letter-spacing: .01em;
      transition: opacity .18s, transform .18s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      font-family: inherit;
    }
    .ob-btn-primary:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
    .ob-btn-primary:active { transform: translateY(0); }
    .ob-btn-primary:disabled { opacity: .5; cursor: not-allowed; }

    .ob-btn-back {
      display: inline-flex; align-items: center; gap: 6px;
      background: none; border: none; color: #888; font-size: 13px; font-weight: 600;
      cursor: pointer; padding: 0; margin-bottom: 18px; font-family: inherit;
    }
    .ob-btn-back:hover { color: var(--purple); }

    .error-box {
      background: #fee2e2; color: #991b1b; border-radius: 10px; padding: 10px 14px;
      font-size: 13px; font-weight: 600; margin-bottom: 16px;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .anim { animation: fadeInUp .3s ease both; }

    .hint { font-size: 12px; color: #aaa; margin-top: 4px; }

    @media (max-width: 500px) {
      .ob-card { padding: 24px 18px; }
      .cat-grid { grid-template-columns: 1fr; }
      .grid-2 { grid-template-columns: 1fr; }
      .choice-grid { grid-template-columns: 1fr; }
      .ob-title { font-size: 1.2rem; }
      .day-row { flex-wrap: wrap; gap: 8px; }
    }
  `],
  template: `
    <div class="onboarding">

      <!-- Logo -->
      <div class="ob-logo">
        <div class="ob-logo-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/>
            <line x1="8.5" y1="8.5" x2="18" y2="18"/><line x1="5.5" y1="8.5" x2="15" y2="18"/>
            <line x1="12" y1="16" x2="12" y2="22"/>
          </svg>
        </div>
        <span class="ob-logo-text">Agenda Co</span>
      </div>

      <div class="ob-card">

        <!-- Progress bars (3: tipo / datos / horarios) -->
        <div class="ob-progress">
          @for (bar of progressBars(); track $index) {
            <div class="ob-progress-bar" [class]="bar"></div>
          }
        </div>

        <!-- ══ PASO 1: Tipo de negocio ══ -->
        @if (step() === 1) {
          <div class="anim">
            <div class="ob-step-label">Paso 1 de 3 — Tipo de negocio</div>
            <h1 class="ob-title">¿Qué tipo de negocio tenés?</h1>
            <p class="ob-subtitle">Elegí la categoría que mejor te describe</p>

            <div class="cat-grid">
              @for (cat of categories; track cat.value) {
                <button class="cat-card" [class.selected]="selectedCat() === cat.value"
                        [style.borderColor]="selectedCat() === cat.value ? cat.color : ''"
                        (click)="pickCategory(cat.value)">
                  <div class="cat-icon-wrap"
                       [style.background]="cat.color + '18'"
                       [style.color]="cat.color">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <path [attr.d]="cat.icon"/>
                    </svg>
                  </div>
                  <div class="cat-label">{{ cat.label }}</div>
                  <div class="cat-desc">{{ cat.desc }}</div>
                </button>
              }
            </div>
          </div>
        }

        <!-- ══ PASO 2: Datos del negocio ══ -->
        @if (step() === 2) {
          <div class="anim">
            <button class="ob-btn-back" (click)="step.set(1)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Volver
            </button>

            <div class="ob-step-label">Paso 2 de 3 — Tu negocio</div>
            <h1 class="ob-title">Configurá tu negocio</h1>
            <p class="ob-subtitle">Podés cambiar todo esto después desde el perfil</p>

            @if (selectedCatMeta()) {
              <button class="selected-cat-pill" (click)="step.set(1)"
                      [style.background]="selectedCatMeta()!.color + '18'"
                      [style.color]="selectedCatMeta()!.color">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path [attr.d]="selectedCatMeta()!.icon"/></svg>
                {{ selectedCatMeta()!.label }}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
            }

            <!-- Nombre -->
            <div class="ob-form-group">
              <label>Nombre del negocio *</label>
              <input [(ngModel)]="form.name" placeholder="Ej: Barbería El Padrino" />
            </div>

            <!-- Descripción -->
            <div class="ob-form-group">
              <label>Descripción <span style="font-weight:400;color:#aaa">(opcional)</span></label>
              <textarea [(ngModel)]="form.description" placeholder="Describí brevemente tu negocio, especialidades o lo que te hace único..."></textarea>
            </div>

            <!-- Ciudad + Dirección -->
            <div class="grid-2">
              <div class="ob-form-group">
                <label>Ciudad</label>
                <input [(ngModel)]="form.city" placeholder="Bogotá" />
              </div>
              <div class="ob-form-group">
                <label>Dirección <span style="font-weight:400;color:#aaa">(opcional)</span></label>
                <input [(ngModel)]="form.address" placeholder="Calle 45 #12-30" />
              </div>
            </div>

            <!-- WhatsApp -->
            <div class="ob-form-group">
              <label>WhatsApp</label>
              <input [(ngModel)]="form.phone" placeholder="573001234567" type="tel" />
              <p class="hint">Los clientes te escribirán a este número</p>
            </div>

            <!-- Redes sociales -->
            <div class="socials-section">
              <div class="socials-label">Redes sociales</div>

              <!-- Chips de plataformas -->
              <div class="socials-chips">
                @for (p of socialPlatforms; track p.key) {
                  <button class="social-chip"
                          [class.selected]="socials[p.key].enabled"
                          [style.background]="socials[p.key].enabled ? p.color : 'white'"
                          [style.borderColor]="socials[p.key].enabled ? p.color : '#e5e7eb'"
                          (click)="socials[p.key].enabled = !socials[p.key].enabled">
                    <span class="social-chip-letter">{{ p.letter }}</span>
                    {{ p.label }}
                  </button>
                }
              </div>

              <!-- Inputs de handles habilitados -->
              @for (p of socialPlatforms; track p.key) {
                @if (socials[p.key].enabled) {
                  <div class="social-input-row">
                    <div class="social-input-icon" [style.background]="p.color">{{ p.letter }}</div>
                    <input [(ngModel)]="socials[p.key].handle" [placeholder]="p.placeholder" />
                  </div>
                }
              }
            </div>

            <div style="height:20px"></div>

            @if (error()) { <div class="error-box">{{ error() }}</div> }

            <button class="ob-btn-primary" (click)="step.set(3)" [disabled]="!form.name.trim()">
              Continuar
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        }

        <!-- ══ PASO 3: ¿Configurar horarios? ══ -->
        @if (step() === 3) {
          <div class="anim">
            <button class="ob-btn-back" (click)="step.set(2)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Volver
            </button>

            <div class="ob-step-label">Paso 3 de 3 — Horarios</div>
            <h1 class="ob-title">¿Configurás tus horarios ahora?</h1>
            <p class="ob-subtitle">Si preferís, podés hacerlo después desde el panel de Horarios</p>

            <div class="choice-grid">
              <!-- Configurar ahora -->
              <button class="choice-card primary-choice" (click)="step.set(4)">
                <div class="choice-icon" style="background:rgba(255,255,255,.2)">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div class="choice-title">Configurar ahora</div>
                <div class="choice-desc">Definí días y horarios de atención</div>
              </button>

              <!-- Después -->
              <button class="choice-card" (click)="doCreate()" [disabled]="creating()">
                <div class="choice-icon" style="background:#f0e8ff">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </div>
                <div class="choice-title" style="color:#1a1a2e">
                  {{ creating() ? 'Creando...' : 'Hacerlo después' }}
                </div>
                <div class="choice-desc">Empezar con horarios por defecto</div>
              </button>
            </div>

            @if (error()) { <div class="error-box" style="margin-top:16px">{{ error() }}</div> }
          </div>
        }

        <!-- ══ PASO 4: Editor de horarios ══ -->
        @if (step() === 4) {
          <div class="anim">
            <button class="ob-btn-back" (click)="step.set(3)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Volver
            </button>

            <div class="ob-step-label">Paso 3 de 3 — Horarios</div>
            <h1 class="ob-title">Configurá tus horarios</h1>
            <p class="ob-subtitle">Podés ajustar esto en detalle desde el panel de Horarios</p>

            <!-- Intervalo y staff -->
            <div class="ob-form-group">
              <label>Intervalo entre turnos</label>
              <p style="font-size:12px;color:#888;margin:0 0 6px">Cada cuánto mostrás opciones de hora. La duración real viene de cada servicio.</p>
              <select [(ngModel)]="slotInterval">
                @for (opt of slotOptions; track opt.value) {
                  <option [ngValue]="opt.value">{{ opt.label }}</option>
                }
              </select>
            </div>


            <!-- Días y horas -->
            <div class="day-rows">
              @for (day of scheduleLocal; track day.key) {
                <div class="day-row" [class.off]="!day.enabled">
                  <!-- Toggle -->
                  <div class="toggle-wrap" (click)="day.enabled = !day.enabled">
                    <div class="toggle-track" [class.on]="day.enabled">
                      <div class="toggle-thumb"></div>
                    </div>
                  </div>

                  <span class="day-name">{{ day.label }}</span>

                  @if (day.enabled) {
                    <input type="time" class="time-input" [(ngModel)]="day.ranges[0].open"  />
                    <span class="time-sep">–</span>
                    <input type="time" class="time-input" [(ngModel)]="day.ranges[0].close" />
                  } @else {
                    <span style="font-size:12px;color:#bbb;margin-left:4px">Cerrado</span>
                  }
                </div>
              }
            </div>

            <div style="height:24px"></div>

            @if (error()) { <div class="error-box">{{ error() }}</div> }

            <button class="ob-btn-primary" (click)="doCreate()" [disabled]="creating()">
              @if (creating()) {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Creando tu negocio...
              } @else {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Finalizar configuración
              }
            </button>
          </div>
        }

      </div>
    </div>
  `,
})
export class CompanyOnboardingComponent {
  private companyStore = inject(CompanyStore);
  private companySvc   = inject(CompanyService);
  private authSvc      = inject(AuthService);

  readonly categories     = CATEGORIES;
  readonly socialPlatforms = SOCIAL_PLATFORMS;
  readonly slotOptions     = SLOT_OPTIONS;

  step        = signal(1);
  selectedCat = signal<string>('');
  creating    = signal(false);
  error       = signal('');

  form = { name: '', description: '', city: '', address: '', phone: '' };

  constructor() {
    effect(() => {
      const name = this.authSvc.displayName();
      if (name && !this.form.name) this.form.name = name;
    });
  }

  socials: Record<string, { enabled: boolean; handle: string }> = {
    instagram: { enabled: true,  handle: '' },
    facebook:  { enabled: true,  handle: '' },
    tiktok:    { enabled: true,  handle: '' },
    youtube:   { enabled: true,  handle: '' },
  };

  scheduleLocal = DEFAULT_SCHEDULE.map(d => ({
    ...d,
    ranges: d.ranges.map(r => ({ ...r })),
  }));

  slotInterval = 30;

  progressBars = computed(() => {
    const s = this.step();
    return [
      s > 1 ? 'done' : 'active',
      s > 2 ? 'done' : s === 2 ? 'active' : 'inactive',
      s >= 3 ? 'active' : 'inactive',
    ];
  });

  selectedCatMeta = computed(() => CATEGORIES.find(c => c.value === this.selectedCat()) ?? null);

  pickCategory(value: string) {
    this.selectedCat.set(value);
    this.step.set(2);
  }

  async doCreate() {
    if (!this.form.name.trim() || !this.selectedCat()) return;
    this.creating.set(true);
    this.error.set('');
    try {
      const slug = this.form.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const social = (key: string) => {
        const s = this.socials[key];
        return s.enabled && s.handle.trim() ? s.handle.trim() : undefined;
      };

      await this.companySvc.createCompany({
        name:                this.form.name.trim(),
        slug,
        category:            this.selectedCat() as any,
        description:         this.form.description.trim() || undefined,
        phone:               this.form.phone.trim() || undefined,
        city:                this.form.city.trim() || undefined,
        address:             this.form.address.trim() || undefined,
        instagram:           social('instagram'),
        facebook:            social('facebook'),
        tiktok:              social('tiktok'),
        youtube:             social('youtube'),
        logoColor:           CATEGORIES.find(c => c.value === this.selectedCat())?.color,
        isActive:            true,
        isPublic:            true,
        slotInterval: this.slotInterval,
        schedule:            this.scheduleLocal,
        blockedDates:        [],
        disabledSlots:       {},
      });

      await this.companyStore.refresh();
    } catch (err: any) {
      console.error('[Onboarding] createCompany error:', err);
      const code = err?.code ?? '';
      this.error.set(
        code === 'permission-denied' ? 'Sin permisos en Firestore. Configurá las reglas de seguridad.' :
        code === 'unauthenticated'   ? 'Sesión expirada. Cerrá sesión e iniciá de nuevo.' :
        err?.message ? `Error: ${err.message}` : 'Error de conexión. Intentá de nuevo.'
      );
      this.creating.set(false);
    }
  }
}
