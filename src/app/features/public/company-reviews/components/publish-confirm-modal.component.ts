import { Component, input, output } from '@angular/core';
import { STAR_RANGE } from '../company-reviews.utils';
import { MODAL_CSS } from '../company-reviews.styles';

/** Modal de confirmación antes de publicar la reseña. */
@Component({
  selector: 'app-publish-confirm-modal',
  standalone: true,
  styles: [`
    :host { display: contents; }
    ${MODAL_CSS}
  `],
  template: `
    <div class="modal-overlay" (click)="cancel.emit()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <h3 style="font-size:1.05rem;font-weight:800;margin:0 0 6px">¿Publicar reseña?</h3>
        <p style="font-size:13px;color:#888;margin:0 0 18px">Podés editarla o eliminarla después si querés.</p>

        <div style="display:flex;gap:3px;margin-bottom:10px">
          @for (i of starRange; track i) {
            <svg width="22" height="22" viewBox="0 0 24 24"
                 [attr.fill]="i <= rating() ? '#f59e0b' : '#e5e7eb'"
                 [attr.stroke]="i <= rating() ? '#f59e0b' : '#d1d5db'"
                 stroke-width="1">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          }
        </div>

        @if (comment().trim()) {
          <p style="font-size:13px;color:#444;background:#f8f7ff;border-radius:10px;padding:10px 14px;margin:0 0 20px;line-height:1.6">
            "{{ comment() }}"
          </p>
        }

        <div style="display:flex;gap:10px">
          <button class="btn btn-secondary" style="flex:1" (click)="cancel.emit()">Cancelar</button>
          <button class="btn btn-primary" style="flex:1" [disabled]="submitting()" (click)="confirm.emit()">
            @if (submitting()) { Enviando... } @else { Confirmar }
          </button>
        </div>
      </div>
    </div>
  `,
})
export class PublishConfirmModalComponent {
  rating     = input.required<number>();
  comment    = input.required<string>();
  submitting = input.required<boolean>();

  cancel  = output<void>();
  confirm = output<void>();

  readonly starRange = STAR_RANGE;
}
