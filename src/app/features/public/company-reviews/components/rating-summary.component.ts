import { Component, input } from '@angular/core';
import { STAR_RANGE } from '../company-reviews.utils';

/** Resumen de calificación (estrellas + promedio + cantidad) o mensaje de "sin reseñas". */
@Component({
  selector: 'app-rating-summary',
  standalone: true,
  styles: [`:host { display: block; }`],
  template: `
    @if (count() > 0) {
      <div style="display:flex;align-items:center;gap:8px">
        <div style="display:flex;gap:3px">
          @for (i of starRange; track i) {
            <svg width="16" height="16" viewBox="0 0 24 24"
                 [attr.fill]="i <= avgRating() ? '#fbbf24' : 'rgba(255,255,255,.3)'"
                 [attr.stroke]="i <= avgRating() ? '#fbbf24' : 'rgba(255,255,255,.3)'"
                 stroke-width="1">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          }
        </div>
        <span style="font-size:15px;font-weight:800">{{ avgRating() }}</span>
        <span style="font-size:13px;opacity:.75">({{ count() }} reseña{{ count() !== 1 ? 's' : '' }})</span>
      </div>
    } @else if (!loading()) {
      <p style="opacity:.72;font-size:14px;margin:0">Todavía sin reseñas · ¡Sé el primero!</p>
    }
  `,
})
export class RatingSummaryComponent {
  count     = input.required<number>();
  avgRating = input.required<number>();
  loading   = input.required<boolean>();

  readonly starRange = STAR_RANGE;
}
