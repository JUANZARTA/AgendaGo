import { Component, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Appointment } from '../../../../core/services/appointment.service';
import { STAR_RANGE, formatAptDate } from '../company-reviews.utils';
import { REVIEW_TEXTAREA_CSS, STAR_BTN_CSS } from '../company-reviews.styles';

/** Formulario de nueva reseña. Los borradores viven en el contenedor (model). */
@Component({
  selector: 'app-new-review-form',
  standalone: true,
  imports: [FormsModule],
  styles: [`
    :host { display: block; }
    ${STAR_BTN_CSS}
    ${REVIEW_TEXTAREA_CSS}

    .apt-select {
      width: 100%; padding: 10px 14px;
      border: 1.5px solid #e5e0ff; border-radius: 12px;
      font-size: 13px; font-family: inherit;
      background: white; outline: none; color: inherit;
      transition: border-color .18s; margin-bottom: 14px;
    }
    .apt-select:focus { border-color: var(--purple); }
  `],
  template: `
    <!-- Formulario nueva reseña -->
    <div style="background:white;border-radius:14px;padding:20px;margin-bottom:20px;box-shadow:0 2px 10px rgba(0,0,0,.05)">
      <p style="font-size:13px;font-weight:700;color:var(--purple);margin:0 0 14px">Deja tu reseña</p>

      <!-- Selector de turno si hay más de uno -->
      @if (reviewableApts().length > 1) {
        <select class="apt-select" [ngModel]="selectedAptId()" (ngModelChange)="selectedAptId.set($event)">
          <option value="">Selecciona el turno a reseñar</option>
          @for (a of reviewableApts(); track a.id) {
            <option [value]="a.id">{{ a.serviceName }} · {{ formatAptDate(a.date) }} {{ a.startTime }}</option>
          }
        </select>
      } @else {
        <div style="font-size:12px;color:#888;background:#f8f7ff;border-radius:10px;padding:8px 12px;margin-bottom:14px">
          Turno: <strong>{{ reviewableApts()[0]?.serviceName }}</strong> · {{ formatAptDate(reviewableApts()[0]?.date) }} {{ reviewableApts()[0]?.startTime }}
        </div>
      }

      <div style="display:flex;gap:4px;margin-bottom:14px">
        @for (i of starRange; track i) {
          <button type="button" class="star-btn"
            (click)="rating.set(i)"
            (mouseover)="hover.set(i)"
            (mouseout)="hover.set(0)">
            <svg width="30" height="30" viewBox="0 0 24 24"
                 [attr.fill]="i <= (hover() || rating()) ? '#f59e0b' : '#e5e7eb'"
                 [attr.stroke]="i <= (hover() || rating()) ? '#f59e0b' : '#d1d5db'"
                 stroke-width="1" style="transition:fill .12s">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>
        }
      </div>

      <textarea class="review-textarea" [ngModel]="comment()" (ngModelChange)="comment.set($event)"
                placeholder="Cuenta tu experiencia...">
      </textarea>

      @if (error()) {
        <p style="color:#ef4444;font-size:13px;margin-top:6px">{{ error() }}</p>
      }

      <button class="btn btn-primary" style="margin-top:12px;width:100%"
              [disabled]="submitting()"
              (click)="publish.emit()">
        @if (submitting()) { Enviando... } @else { Publicar reseña }
      </button>
    </div>
  `,
})
export class NewReviewFormComponent {
  reviewableApts = input.required<Appointment[]>();
  error          = input.required<string>();
  submitting     = input.required<boolean>();

  selectedAptId = model.required<string>();
  rating        = model.required<number>();
  comment       = model.required<string>();

  publish = output<void>();

  hover = signal(0);

  readonly starRange = STAR_RANGE;
  readonly formatAptDate = formatAptDate;
}
