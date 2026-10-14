import { Component, input, output } from '@angular/core';
import { Review } from '../../../../core/services/review.service';
import { STAR_RANGE, formatDate } from '../company-reviews.utils';

/** Tarjeta de una reseña (con respuesta del negocio y acciones si es del usuario actual). */
@Component({
  selector: 'app-review-card',
  standalone: true,
  styles: [`
    :host { display: block; }

    .review-card {
      background: white;
      border-radius: 14px;
      padding: 16px 18px;
      box-shadow: 0 2px 10px rgba(0,0,0,.05);
    }

    .icon-btn {
      background: none; border: none; cursor: pointer;
      padding: 6px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s;
    }
    .icon-btn:hover { background: #f3f4f6; }
    .icon-btn.danger:hover { background: #fee2e2; color: #ef4444; }
  `],
  template: `
    <div class="review-card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="width:36px;height:36px;border-radius:50%;background:var(--gradient);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:white;flex-shrink:0;overflow:hidden">
          @if (review().clientPhotoUrl) {
            <img [src]="review().clientPhotoUrl" style="width:100%;height:100%;object-fit:cover" alt="" />
          } @else {
            {{ review().clientName[0]?.toUpperCase() }}
          }
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:14px">{{ review().clientName }}</div>
          <div style="display:flex;gap:2px;margin-top:2px">
            @for (i of starRange; track i) {
              <svg width="12" height="12" viewBox="0 0 24 24"
                   [attr.fill]="i <= review().rating ? '#f59e0b' : '#e5e7eb'"
                   [attr.stroke]="i <= review().rating ? '#f59e0b' : '#d1d5db'"
                   stroke-width="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            }
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:4px;flex-shrink:0">
          <span style="font-size:11px;color:#bbb">{{ formatDate(review().createdAt) }}{{ review().updatedAt ? ' (editada)' : '' }}</span>
          @if (isOwn()) {
            <button class="icon-btn" title="Editar reseña" (click)="edit.emit(review())">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="icon-btn danger" title="Eliminar reseña" (click)="remove.emit(review())">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          }
        </div>
      </div>
      @if (review().comment) {
        <p style="font-size:13px;color:#444;line-height:1.65;margin:0">{{ review().comment }}</p>
      }
      @if (review().reply) {
        <div style="background:rgba(124,58,237,.06);border-left:3px solid var(--purple);border-radius:0 10px 10px 0;padding:10px 14px;margin-top:12px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
            </svg>
            <span style="font-size:11px;font-weight:700;color:var(--purple)">Respuesta del negocio</span>
          </div>
          <p style="font-size:13px;color:#555;line-height:1.6;margin:0">{{ review().reply }}</p>
        </div>
      }
    </div>
  `,
})
export class ReviewCardComponent {
  review = input.required<Review>();
  isOwn  = input.required<boolean>();

  edit   = output<Review>();
  remove = output<Review>();

  readonly starRange = STAR_RANGE;
  readonly formatDate = formatDate;
}
