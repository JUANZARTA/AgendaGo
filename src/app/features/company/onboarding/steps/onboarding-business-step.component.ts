import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BusinessCategory } from '../../../../core/domain/categories';
import { OB_SHARED_STYLES } from '../onboarding.styles';
import { OnboardingForm, SOCIAL_PLATFORMS, SocialState } from '../onboarding.constants';

@Component({
  selector: 'app-onboarding-business-step',
  standalone: true,
  imports: [FormsModule],
  styles: [OB_SHARED_STYLES, `
    :host { display: block; }
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
  `],
  template: `
      <div class="anim">
        <button class="ob-btn-back" (click)="back.emit()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver
        </button>

        <div class="ob-step-label">Paso 2 de 4 — Tu negocio</div>
        <h1 class="ob-title">Configura tu negocio</h1>
        <p class="ob-subtitle">Puedes cambiar todo esto después desde el perfil</p>

        @if (selectedCatMeta()) {
          <button class="selected-cat-pill" (click)="back.emit()"
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
          <input [(ngModel)]="form().name" placeholder="Ej: Barbería El Padrino" />
        </div>

        <!-- Descripción -->
        <div class="ob-form-group">
          <label>Descripción <span style="font-weight:400;color:#aaa">(opcional)</span></label>
          <textarea [(ngModel)]="form().description" placeholder="Describe brevemente tu negocio, especialidades o lo que te hace único..."></textarea>
        </div>

        <!-- Ciudad + Dirección -->
        <div class="grid-2">
          <div class="ob-form-group">
            <label>Ciudad</label>
            <input [(ngModel)]="form().city" placeholder="Bogotá" />
          </div>
          <div class="ob-form-group">
            <label>Dirección <span style="font-weight:400;color:#aaa">(opcional)</span></label>
            <input [(ngModel)]="form().address" placeholder="Calle 45 #12-30" />
          </div>
        </div>

        <!-- WhatsApp -->
        <div class="ob-form-group">
          <label>WhatsApp</label>
          <input [(ngModel)]="form().phone" placeholder="573001234567" type="tel" />
          <p class="hint">Los clientes te escribirán a este número</p>
        </div>

        <!-- Reservas -->
        <div style="border:1.5px solid #f0e8ff;border-radius:16px;padding:18px 20px;margin-bottom:20px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span style="font-size:13px;font-weight:700;color:#374151">Reservas</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
            <div>
              <div style="font-size:13px;font-weight:700;color:#1a1a2e">Confirmar citas automáticamente</div>
              <div style="font-size:12px;color:#888;margin-top:2px">Las nuevas reservas quedan confirmadas sin revisión manual</div>
            </div>
            <div class="toggle-wrap" (click)="autoConfirm.set(!autoConfirm())" style="flex-shrink:0">
              <div class="toggle-track" [class.on]="autoConfirm()">
                <div class="toggle-thumb"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Redes sociales -->
        <div class="socials-section">
          <div class="socials-label">Redes sociales <span style="font-weight:400;color:#aaa;font-size:12px">(opcional)</span></div>

          <!-- Chips de plataformas -->
          <div class="socials-chips">
            @for (p of socialPlatforms; track p.key) {
              <button class="social-chip"
                      [class.selected]="socials()[p.key].enabled"
                      [style.background]="socials()[p.key].enabled ? p.color : 'white'"
                      [style.borderColor]="socials()[p.key].enabled ? p.color : '#e5e7eb'"
                      (click)="socials()[p.key].enabled = !socials()[p.key].enabled">
                <span class="social-chip-letter">{{ p.letter }}</span>
                {{ p.label }}
              </button>
            }
          </div>

          <!-- Inputs de handles habilitados -->
          @for (p of socialPlatforms; track p.key) {
            @if (socials()[p.key].enabled) {
              <div class="social-input-row">
                <div class="social-input-icon" [style.background]="p.color">{{ p.letter }}</div>
                <input [(ngModel)]="socials()[p.key].handle" [placeholder]="p.placeholder" />
              </div>
            }
          }
        </div>

        <div style="height:20px"></div>

        @if (error()) { <div class="error-box">{{ error() }}</div> }

        <button class="ob-btn-primary" (click)="next.emit()" [disabled]="!form().name.trim()">
          Continuar
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
  `,
})
export class OnboardingBusinessStepComponent {
  readonly socialPlatforms = SOCIAL_PLATFORMS;

  // Objetos mutados in situ por ngModel: se comparten por referencia con el contenedor
  readonly form = input.required<OnboardingForm>();
  readonly socials = input.required<Record<string, SocialState>>();
  readonly autoConfirm = model<boolean>(false);
  readonly selectedCatMeta = input.required<BusinessCategory | null>();
  readonly error = input<string>('');

  readonly back = output<void>();
  readonly next = output<void>();
}
