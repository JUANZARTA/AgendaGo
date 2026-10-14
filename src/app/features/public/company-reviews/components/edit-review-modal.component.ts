import { Component, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { STAR_RANGE } from '../company-reviews.utils';
import { MODAL_CSS, REVIEW_TEXTAREA_CSS, STAR_BTN_CSS } from '../company-reviews.styles';

/** Modal de edición de reseña propia. Borradores (rating/comment) en el contenedor. */
@Component({
  selector: 'app-edit-review-modal',
  standalone: true,
  imports: [FormsModule],
  styles: [`
    :host { display: contents; }
    ${STAR_BTN_CSS}
    ${REVIEW_TEXTAREA_CSS}
    ${MODAL_CSS}
  `],
  template: `
    <div class="modal-overlay" (click)="cancel.emit()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <h3 style="font-size:1.05rem;font-weight:800;margin:0 0 16px">Editar reseña</h3>

        <div style="display:flex;gap:4px;margin-bottom:14px">
          @for (i of starRange; track i) {
            <button type="button" class="star-btn"
              (click)="rating.set(i)"
              (mouseover)="hover.set(i)"
              (mouseout)="hover.set(0)">
              <svg width="28" height="28" viewBox="0 0 24 24"
                   [attr.fill]="i <= (hover() || rating()) ? '#f59e0b' : '#e5e7eb'"
                   [attr.stroke]="i <= (hover() || rating()) ? '#f59e0b' : '#d1d5db'"
                   stroke-width="1" style="transition:fill .12s">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </button>
          }
        </div>

        <textarea class="review-textarea" [ngModel]="comment()" (ngModelChange)="comment.set($event)"
                  placeholder="Contá tu experiencia...">
        </textarea>

        @if (error()) {
          <p style="color:#ef4444;font-size:13px;margin-top:6px">{{ error() }}</p>
        }

        <div style="display:flex;gap:10px;margin-top:16px">
          <button class="btn btn-secondary" style="flex:1" (click)="cancel.emit()">Cancelar</button>
          <button class="btn btn-primary" style="flex:1" [disabled]="updating()" (click)="save.emit()">
            @if (updating()) { Guardando... } @else { Guardar cambios }
          </button>
        </div>
      </div>
    </div>
  `,
})
export class EditReviewModalComponent {
  error    = input.required<string>();
  updating = input.required<boolean>();

  rating  = model.required<number>();
  comment = model.required<string>();

  cancel = output<void>();
  save   = output<void>();

  hover = signal(0);

  readonly starRange = STAR_RANGE;
}
