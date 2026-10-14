import { Component, input, output } from '@angular/core';
import { MODAL_CSS } from '../company-reviews.styles';

/** Modal de confirmación de eliminación de reseña. */
@Component({
  selector: 'app-delete-review-modal',
  standalone: true,
  styles: [`
    :host { display: contents; }
    ${MODAL_CSS}
  `],
  template: `
    <div class="modal-overlay" (click)="cancel.emit()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <h3 style="font-size:1.05rem;font-weight:800;margin:0 0 8px">¿Eliminar reseña?</h3>
        <p style="font-size:13px;color:#888;margin:0 0 20px;line-height:1.6">Esta acción no se puede deshacer. La reseña se eliminará permanentemente.</p>
        <div style="display:flex;gap:10px">
          <button class="btn btn-secondary" style="flex:1" (click)="cancel.emit()">Cancelar</button>
          <button class="btn btn-danger" style="flex:1" [disabled]="deleting()" (click)="confirm.emit()">
            @if (deleting()) { Eliminando... } @else { Eliminar }
          </button>
        </div>
      </div>
    </div>
  `,
})
export class DeleteReviewModalComponent {
  deleting = input.required<boolean>();

  cancel  = output<void>();
  confirm = output<void>();
}
