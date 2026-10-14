import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SCHEDULE_SECTION_STYLES } from '../schedule.styles';
import { BlockedDate } from '../schedule.utils';

@Component({
  selector: 'app-schedule-blocked-dates',
  standalone: true,
  imports: [FormsModule],
  styles: [`
    :host { display: block; }
    ${SCHEDULE_SECTION_STYLES}

    /* ── Blocked dates ────────────────────────────── */
    .block-form {
      display: flex;
      gap: 10px;
      align-items: flex-end;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }
    .block-field { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 140px; }
    .block-field label { font-size: 12px; font-weight: 700; color: #777; }
    .block-field input {
      padding: 9px 12px;
      border: 2px solid var(--form-border);
      border-radius: 8px;
      font-size: 13px;
      background: #fdfbff;
      transition: border-color 0.15s;
    }
    .block-field input:focus { outline: none; border-color: var(--purple); }

    .block-list { display: flex; flex-direction: column; gap: 8px; }
    .block-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 10px;
      background: #fff8f0;
      border: 1px solid #fde8cc;
    }
    .block-item-icon { flex-shrink: 0; color: #f59e0b; }
    .block-item-info { flex: 1; }
    .block-item-date { font-size: 13px; font-weight: 700; color: #1a1a2e; }
    .block-item-reason { font-size: 12px; color: #999; margin-top: 2px; }
    .block-remove {
      background: none; border: none; cursor: pointer; color: #bbb;
      padding: 4px; border-radius: 6px; display: flex;
      transition: color 0.15s, background 0.15s;
    }
    .block-remove:hover { color: var(--pink); background: #fff0f3; }

    .empty-state { text-align: center; padding: 20px; color: #bbb; font-size: 13px; }

    @media (max-width: 560px) {
      .block-form { flex-direction: column; }
    }

    /* 4. font-size 16px para evitar zoom en iOS */
    @media (max-width: 640px) {
      .block-field input { font-size: 16px; }
    }
  `],
  template: `
      <!-- Bloqueos especiales -->
      <div class="sch-section">
        <div class="sch-section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Bloqueos especiales
        </div>

        <div class="block-form">
          <div class="block-field">
            <label>Fecha</label>
            <input type="date" [(ngModel)]="newBlockDate" />
          </div>
          <div class="block-field" style="flex:2">
            <label>Motivo (opcional)</label>
            <input type="text" [(ngModel)]="newBlockReason" placeholder="Ej: Día festivo, vacaciones..." />
          </div>
          <button class="btn btn-secondary btn-sm" style="flex-shrink:0;align-self:flex-end"
            [disabled]="!newBlockDate()" (click)="addBlock.emit()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Agregar
          </button>
        </div>

        @if (blockedDates().length === 0) {
          <div class="empty-state">Sin bloqueos configurados.</div>
        } @else {
          <div class="block-list">
            @for (block of blockedDates(); track block.id) {
              <div class="block-item">
                <span class="block-item-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </span>
                <div class="block-item-info">
                  <div class="block-item-date">{{ formatDate(block.date) }}</div>
                  @if (block.reason) {
                    <div class="block-item-reason">{{ block.reason }}</div>
                  }
                </div>
                <button class="block-remove" (click)="removeBlock.emit(block.id)" title="Eliminar bloqueo">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            }
          </div>
        }
      </div>
  `,
})
export class ScheduleBlockedDatesComponent {
  blockedDates = input.required<BlockedDate[]>();
  /** Borradores del formulario: viven en el contenedor. */
  newBlockDate   = model<string>('');
  newBlockReason = model<string>('');

  addBlock    = output<void>();
  removeBlock = output<string>();

  formatDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }
}
