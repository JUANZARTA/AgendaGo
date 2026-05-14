import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface DaySchedule {
  key: string;
  label: string;
  enabled: boolean;
  open: string;
  close: string;
}

interface BlockedDate {
  id: string;
  date: string;
  reason: string;
}

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { key: 'lun', label: 'Lunes',     enabled: true,  open: '08:00', close: '18:00' },
  { key: 'mar', label: 'Martes',    enabled: true,  open: '08:00', close: '18:00' },
  { key: 'mie', label: 'Miércoles', enabled: true,  open: '08:00', close: '18:00' },
  { key: 'jue', label: 'Jueves',    enabled: true,  open: '08:00', close: '18:00' },
  { key: 'vie', label: 'Viernes',   enabled: true,  open: '08:00', close: '19:00' },
  { key: 'sab', label: 'Sábado',    enabled: true,  open: '09:00', close: '16:00' },
  { key: 'dom', label: 'Domingo',   enabled: false, open: '09:00', close: '14:00' },
];

const SLOT_DURATIONS = [15, 20, 30, 45, 60] as const;

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    /* ── Page layout ─────────────────────────────── */
    .sch-page {
      max-width: 780px;
      margin: 0 auto;
      padding: 0 4px 80px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* ── Section header ───────────────────────────── */
    .sch-header { margin-bottom: 4px; }
    .sch-title {
      font-size: 1.45rem;
      font-weight: 800;
      color: #1a1a2e;
      letter-spacing: -0.3px;
    }
    .sch-desc {
      font-size: 13px;
      color: #888;
      margin-top: 4px;
    }

    /* ── Card section ─────────────────────────────── */
    .sch-section {
      background: white;
      border-radius: 16px;
      padding: 22px 24px;
      box-shadow: 0 4px 24px rgba(124, 58, 237, 0.10);
    }
    .sch-section-title {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* ── Duration selector ────────────────────────── */
    .duration-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .duration-btn {
      padding: 8px 16px;
      border-radius: 8px;
      border: 2px solid #ede8ff;
      background: #fdfbff;
      color: #555;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .duration-btn:hover { border-color: #7c3aed; color: #7c3aed; }
    .duration-btn.active {
      border-color: #7c3aed;
      background: #ede9fe;
      color: #7c3aed;
    }

    /* ── Day rows ─────────────────────────────────── */
    .day-list { display: flex; flex-direction: column; gap: 0; }

    .day-row {
      border-bottom: 1px solid #f3f0ff;
      padding: 14px 0;
      cursor: pointer;
      user-select: none;
    }
    .day-row:last-child { border-bottom: none; }

    .day-row-main {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    /* ── Toggle switch (pill + circle, CSS only) ─── */
    .toggle-wrap {
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }
    .toggle-input { display: none; }
    .toggle-pill {
      display: inline-block;
      width: 40px;
      height: 22px;
      border-radius: 11px;
      background: #ddd;
      position: relative;
      cursor: pointer;
      transition: background 0.2s;
    }
    .toggle-pill::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      transition: transform 0.2s;
    }
    .toggle-input:checked + .toggle-pill {
      background: #7c3aed;
    }
    .toggle-input:checked + .toggle-pill::after {
      transform: translateX(18px);
    }

    .day-label {
      font-weight: 700;
      font-size: 14px;
      color: #1a1a2e;
      min-width: 86px;
    }
    .day-label.disabled { color: #aaa; }

    .day-hours {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }
    .day-closed {
      flex: 1;
      font-size: 13px;
      color: #bbb;
      font-style: italic;
    }

    .time-input {
      padding: 6px 10px;
      border: 2px solid #ede8ff;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #1a1a2e;
      background: #fdfbff;
      width: 96px;
      transition: border-color 0.15s;
      cursor: pointer;
    }
    .time-input:focus { outline: none; border-color: #7c3aed; }

    .time-sep { font-size: 13px; color: #aaa; font-weight: 500; }

    .day-expand-icon {
      flex-shrink: 0;
      color: #bbb;
      transition: transform 0.22s;
      display: flex;
    }
    .day-expand-icon.open { transform: rotate(180deg); }
    .day-expand-icon.hidden { visibility: hidden; }

    /* ── Slot grid panel ──────────────────────────── */
    .slot-panel {
      overflow: hidden;
      max-height: 0;
      transition: max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.25s;
      opacity: 0;
    }
    .slot-panel.expanded {
      max-height: 600px;
      opacity: 1;
    }
    .slot-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      padding: 14px 0 6px;
    }
    .slot-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      border-radius: 8px;
      border: 1.5px solid #d4bbff;
      background: #f3eeff;
      color: #7c3aed;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      user-select: none;
    }
    .slot-btn:hover { border-color: #7c3aed; background: #ebe4ff; }
    .slot-btn.disabled-slot {
      background: #f5f5f5;
      border-color: #e0e0e0;
      color: #bbb;
      opacity: 0.45;
      text-decoration: line-through;
    }
    .slot-btn.disabled-slot:hover { border-color: #ccc; background: #f0f0f0; }

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
      border: 2px solid #ede8ff;
      border-radius: 8px;
      font-size: 13px;
      background: #fdfbff;
      transition: border-color 0.15s;
    }
    .block-field input:focus { outline: none; border-color: #7c3aed; }

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
      background: none;
      border: none;
      cursor: pointer;
      color: #bbb;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      transition: color 0.15s, background 0.15s;
    }
    .block-remove:hover { color: #f43f5e; background: #fff0f3; }

    .empty-state {
      text-align: center;
      padding: 20px;
      color: #bbb;
      font-size: 13px;
    }

    /* ── Success toast ────────────────────────────── */
    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(0);
      background: #10b981;
      color: white;
      padding: 12px 22px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 6px 24px rgba(16, 185, 129, 0.35);
      z-index: 200;
      animation: toast-in 0.25s ease;
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translateX(-50%) translateY(12px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }

    /* ── Save button (sticky footer) ─────────────── */
    .save-bar {
      position: sticky;
      bottom: 16px;
      display: flex;
      justify-content: flex-end;
    }

    /* ── Responsive ───────────────────────────────── */
    @media (max-width: 560px) {
      .sch-section { padding: 16px; }
      .day-row-main { gap: 10px; }
      .day-label { min-width: 70px; font-size: 13px; }
      .time-input { width: 84px; font-size: 12px; }
      .block-form { flex-direction: column; }
    }
  `],
  template: `
    <div class="sch-page">

      <!-- Header -->
      <div class="sch-header">
        <div class="sch-title">Horarios de atención</div>
        <div class="sch-desc">Configurá los días, horarios y bloqueos especiales de tu empresa.</div>
      </div>

      <!-- Duración del turno -->
      <div class="sch-section">
        <div class="sch-section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          Duración estándar del turno
        </div>
        <div class="duration-row">
          @for (d of durations; track d) {
            <button
              class="duration-btn"
              [class.active]="slotDuration() === d"
              (click)="slotDuration.set(d)">
              {{ d }} min
            </button>
          }
        </div>
      </div>

      <!-- Configuración semanal -->
      <div class="sch-section">
        <div class="sch-section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Configuración semanal
        </div>

        <div class="day-list">
          @for (day of schedule(); track day.key) {
            <div class="day-row">
              <div class="day-row-main" (click)="onRowClick(day)">
                <!-- Toggle -->
                <div class="toggle-wrap" (click)="$event.stopPropagation(); toggleDay(day.key)">
                  <input
                    class="toggle-input"
                    type="checkbox"
                    [id]="'tog-' + day.key"
                    [checked]="day.enabled"
                    (change)="toggleDay(day.key)"/>
                  <label class="toggle-pill" [for]="'tog-' + day.key"></label>
                </div>

                <!-- Nombre día -->
                <span class="day-label" [class.disabled]="!day.enabled">{{ day.label }}</span>

                <!-- Horas o "Cerrado" -->
                @if (day.enabled) {
                  <div class="day-hours" (click)="$event.stopPropagation()">
                    <input
                      class="time-input"
                      type="time"
                      [value]="day.open"
                      (change)="updateTime(day.key, 'open', $any($event.target).value)"/>
                    <span class="time-sep">—</span>
                    <input
                      class="time-input"
                      type="time"
                      [value]="day.close"
                      (change)="updateTime(day.key, 'close', $any($event.target).value)"/>
                  </div>
                } @else {
                  <span class="day-closed">Cerrado</span>
                }

                <!-- Chevron -->
                <span
                  class="day-expand-icon"
                  [class.open]="expandedDay() === day.key"
                  [class.hidden]="!day.enabled">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </span>
              </div>

              <!-- Slots panel -->
              <div class="slot-panel" [class.expanded]="expandedDay() === day.key && day.enabled">
                <div class="slot-grid">
                  @for (slot of generateSlots(day); track slot) {
                    <button
                      class="slot-btn"
                      [class.disabled-slot]="isSlotDisabled(day.key, slot)"
                      (click)="$event.stopPropagation(); toggleSlot(day.key, slot)">
                      @if (isSlotDisabled(day.key, slot)) {
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      }
                      {{ slot }}
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Bloqueos especiales -->
      <div class="sch-section">
        <div class="sch-section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Bloqueos especiales
        </div>

        <!-- Formulario agregar -->
        <div class="block-form">
          <div class="block-field">
            <label>Fecha</label>
            <input type="date" [(ngModel)]="newBlockDate" />
          </div>
          <div class="block-field" style="flex:2">
            <label>Motivo (opcional)</label>
            <input type="text" [(ngModel)]="newBlockReason" placeholder="Ej: Día festivo, vacaciones..." />
          </div>
          <button
            class="btn btn-secondary btn-sm"
            style="flex-shrink:0;align-self:flex-end"
            [disabled]="!newBlockDate"
            (click)="addBlock()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Agregar
          </button>
        </div>

        <!-- Lista de bloqueos -->
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
                <button class="block-remove" (click)="removeBlock(block.id)" title="Eliminar bloqueo">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            }
          </div>
        }
      </div>

      <!-- Botón guardar -->
      <div class="save-bar">
        <button class="btn btn-primary" style="gap:8px" (click)="save()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          Guardar cambios
        </button>
      </div>
    </div>

    <!-- Toast notificación -->
    @if (saved()) {
      <div class="toast">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Cambios guardados correctamente
      </div>
    }
  `,
})
export class ScheduleComponent {
  readonly durations = SLOT_DURATIONS;

  schedule = signal<DaySchedule[]>(DEFAULT_SCHEDULE.map(d => ({ ...d })));
  slotDuration = signal<number>(30);
  expandedDay = signal<string | null>(null);
  disabledSlots = signal<Record<string, boolean>>({});
  blockedDates = signal<BlockedDate[]>([
    { id: 'b1', date: '2026-05-20', reason: 'Día festivo' },
  ]);
  saved = signal(false);

  newBlockDate = '';
  newBlockReason = '';

  // ── Day actions ──────────────────────────────────

  toggleDay(key: string): void {
    this.schedule.update(days =>
      days.map(d => d.key === key ? { ...d, enabled: !d.enabled } : d)
    );
    if (this.expandedDay() === key) {
      this.expandedDay.set(null);
    }
  }

  updateTime(key: string, field: 'open' | 'close', value: string): void {
    this.schedule.update(days =>
      days.map(d => d.key === key ? { ...d, [field]: value } : d)
    );
    // Regenerate panel: collapse so slots recalculate on next expand
    if (this.expandedDay() === key) {
      this.expandedDay.set(null);
      requestAnimationFrame(() => this.expandedDay.set(key));
    }
  }

  onRowClick(day: DaySchedule): void {
    if (!day.enabled) return;
    this.expandedDay.update(cur => cur === day.key ? null : day.key);
  }

  // ── Slot generation ──────────────────────────────

  generateSlots(day: DaySchedule): string[] {
    if (!day.enabled) return [];
    const [openH, openM] = day.open.split(':').map(Number);
    const [closeH, closeM] = day.close.split(':').map(Number);
    const startMin = openH * 60 + openM;
    const endMin = closeH * 60 + closeM;
    const duration = this.slotDuration();
    const slots: string[] = [];
    for (let m = startMin; m < endMin; m += duration) {
      const hh = String(Math.floor(m / 60)).padStart(2, '0');
      const mm = String(m % 60).padStart(2, '0');
      slots.push(`${hh}:${mm}`);
    }
    return slots;
  }

  // ── Slot toggle ──────────────────────────────────

  toggleSlot(dayKey: string, slot: string): void {
    const key = `${dayKey}-${slot}`;
    this.disabledSlots.update(map => ({ ...map, [key]: !map[key] }));
  }

  isSlotDisabled(dayKey: string, slot: string): boolean {
    return !!this.disabledSlots()[`${dayKey}-${slot}`];
  }

  // ── Blocked dates ─────────────────────────────────

  addBlock(): void {
    if (!this.newBlockDate) return;
    const entry: BlockedDate = {
      id: Date.now().toString(),
      date: this.newBlockDate,
      reason: this.newBlockReason.trim(),
    };
    this.blockedDates.update(list => [...list, entry].sort((a, b) => a.date.localeCompare(b.date)));
    this.newBlockDate = '';
    this.newBlockReason = '';
  }

  removeBlock(id: string): void {
    this.blockedDates.update(list => list.filter(b => b.id !== id));
  }

  formatDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  // ── Save ─────────────────────────────────────────

  save(): void {
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2000);
  }
}
