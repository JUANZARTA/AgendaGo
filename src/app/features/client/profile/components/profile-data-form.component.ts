import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PROFILE_ACCORDION_STYLES } from './profile.styles';

/** Formulario "Mis datos" (cuerpo del acordeón). El estado del form vive en el contenedor. */
@Component({
  selector: 'app-profile-data-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  styles: [`
    :host { display: contents; }

    ${PROFILE_ACCORDION_STYLES}

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
  `],
  template: `
          <div class="accordion-body">
            <form [formGroup]="form()" (ngSubmit)="save.emit()">
              <div class="form-field">
                <label>Nombre completo</label>
                <input class="form-input" type="text" formControlName="displayName"
                       placeholder="Como quieres que te llamen" />
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
              @if (success()) { <p class="success-msg">Datos actualizados.</p> }
              @if (error())   { <p class="error-msg">{{ error() }}</p> }
              <button type="submit" class="btn btn-primary" style="width:100%" [disabled]="loading()">
                @if (loading()) { Guardando... } @else { Guardar cambios }
              </button>
            </form>
          </div>
  `,
})
export class ProfileDataFormComponent {
  readonly form    = input.required<FormGroup>();
  readonly loading = input.required<boolean>();
  readonly success = input.required<boolean>();
  readonly error   = input.required<string>();
  readonly save    = output<void>();
}
