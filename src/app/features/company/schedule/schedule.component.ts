import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyStore } from '../../../core/services/company-store.service';
import { CompanyService } from '../../../core/services/company.service';

interface TimeRange {
  open: string;
  close: string;
}

interface DaySchedule {
  key: string;
  label: string;
  enabled: boolean;
  ranges: TimeRange[];
}

interface BlockedDate {
  id: string;
  date: string;
  reason: string;
}

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { key: 'lun', label: 'Lunes',     enabled: true,  ranges: [{ open: '08:00', close: '18:00' }] },
  { key: 'mar', label: 'Martes',    enabled: true,  ranges: [{ open: '08:00', close: '18:00' }] },
  { key: 'mie', label: 'Miércoles', enabled: true,  ranges: [{ open: '08:00', close: '18:00' }] },
  { key: 'jue', label: 'Jueves',    enabled: true,  ranges: [{ open: '08:00', close: '18:00' }] },
  { key: 'vie', label: 'Viernes',   enabled: true,  ranges: [{ open: '08:00', close: '19:00' }] },
  { key: 'sab', label: 'Sábado',    enabled: true,  ranges: [{ open: '09:00', close: '16:00' }] },
  { key: 'dom', label: 'Domingo',   enabled: false, ranges: [{ open: '09:00', close: '14:00' }] },
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
    .sch-title {
      font-size: 1.45rem;
      font-weight: 800;
      color: #1a1a2e;
      letter-spacing: -0.3px;
    }
    .sch-desc { font-size: 13px; color: #888; margin-top: 4px; }

    /* ── Card section ─────────────────────────────── */
    .sch-section {
      background: white;
      border-radius: 16px;
      padding: 22px 24px;
      box-shadow: 0 4px 24px rgba(var(--primary-rgb), 0.10);
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
    .duration-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .duration-btn {
      padding: 8px 16px;
      border-radius: 8px;
      border: 2px solid var(--form-border);
      background: #fdfbff;
      color: #555;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .duration-btn:hover { border-color: var(--purple); color: var(--purple); }
    .duration-btn.active { border-color: var(--purple); background: #ede9fe; color: var(--purple); }

    /* ── Day rows ─────────────────────────────────── */
    .day-list { display: flex; flex-direction: column; }

    .day-row {
      border-bottom: 1px solid var(--btn-secondary-bg);
      padding: 14px 0;
    }
    .day-row:last-child { border-bottom: none; }

    /* Top bar: toggle + label + chevron */
    .day-top {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    /* ── Toggle switch ────────────────────────────── */
    .toggle-wrap { flex-shrink: 0; display: flex; align-items: center; }
    .toggle-input { display: none; }
    .toggle-pill {
      display: inline-block;
      width: 40px; height: 22px;
      border-radius: 11px;
      background: #ddd;
      position: relative;
      cursor: pointer;
      transition: background 0.2s;
    }
    .toggle-pill::after {
      content: '';
      position: absolute;
      top: 3px; left: 3px;
      width: 16px; height: 16px;
      border-radius: 50%;
      background: white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      transition: transform 0.2s;
    }
    .toggle-input:checked + .toggle-pill { background: var(--purple); }
    .toggle-input:checked + .toggle-pill::after { transform: translateX(18px); }

    .day-label {
      font-weight: 700;
      font-size: 14px;
      color: #1a1a2e;
      min-width: 86px;
    }
    .day-label.disabled { color: #aaa; }

    .day-closed {
      flex: 1;
      font-size: 13px;
      color: #bbb;
      font-style: italic;
    }

    /* ── Ranges area ──────────────────────────────── */
    .day-body {
      margin-top: 10px;
      padding-left: 54px; /* align under day label */
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .range-row {
      display: flex;
      align-items: center;
      gap: 8px;
      animation: fadeSlideIn 0.2s ease both;
    }
    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .time-input {
      padding: 6px 10px;
      border: 2px solid var(--form-border);
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #1a1a2e;
      background: #fdfbff;
      width: 96px;
      transition: border-color 0.15s;
      cursor: pointer;
    }
    .time-input:focus { outline: none; border-color: var(--purple); }

    .time-sep { font-size: 13px; color: #aaa; font-weight: 500; }

    .remove-range-btn {
      width: 26px; height: 26px;
      border-radius: 6px;
      border: 1.5px solid #fecdd3;
      background: #fff1f2;
      color: var(--pink);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
      flex-shrink: 0;
    }
    .remove-range-btn:hover { background: #ffe4e8; border-color: #f43f5e; }

    .add-range-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      border-radius: 7px;
      border: 1.5px dashed #c4b5fd;
      background: transparent;
      color: var(--purple);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      align-self: flex-start;
    }
    .add-range-btn:hover { border-color: var(--purple); background: var(--btn-secondary-bg); }

    /* ── Chevron expand ───────────────────────────── */
    .expand-btn {
      margin-left: auto;
      background: none;
      border: none;
      cursor: pointer;
      color: #bbb;
      display: flex;
      align-items: center;
      padding: 4px;
      border-radius: 6px;
      transition: color 0.15s, background 0.15s, transform 0.22s;
    }
    .expand-btn:hover { color: var(--purple); background: var(--btn-secondary-bg); }
    .expand-btn.open { transform: rotate(180deg); color: var(--purple); }

    /* ── Slot grid panel ──────────────────────────── */
    .slot-panel {
      overflow: hidden;
      max-height: 0;
      transition: max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.25s;
      opacity: 0;
    }
    .slot-panel.expanded { max-height: 600px; opacity: 1; }
    .slot-grid { display: flex; flex-wrap: wrap; gap: 7px; padding: 14px 0 6px 54px; }

    .slot-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      border-radius: 8px;
      border: 1.5px solid #d4bbff;
      background: #f3eeff;
      color: var(--purple);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      user-select: none;
    }
    .slot-btn:hover { border-color: var(--purple); background: #ebe4ff; }
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

    /* ── Toast ────────────────────────────────────── */
    .toast {
      position: fixed;
      bottom: 24px; left: 50%;
      transform: translateX(-50%);
      background: #10b981;
      color: white;
      padding: 12px 22px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      display: flex; align-items: center; gap: 8px;
      box-shadow: 0 6px 24px rgba(16, 185, 129, 0.35);
      z-index: 200;
      animation: toast-in 0.25s ease;
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translateX(-50%) translateY(12px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }

    .save-bar { position: sticky; bottom: 16px; display: flex; justify-content: flex-end; }

    @media (max-width: 560px) {
      .sch-section { padding: 16px; }
      .day-body { padding-left: 0; }
      .slot-grid { padding-left: 0; }
      .day-label { min-width: 70px; font-size: 13px; }
      .time-input { width: 84px; font-size: 12px; }
      .block-form { flex-direction: column; }
    }

    /* ── Mobile responsive additions ─────────────────── */

    /* 1. Padding lateral en pantallas muy chicas */
    @media (max-width: 480px) {
      .sch-page { padding-left: 0; padding-right: 0; }
      .sch-section { border-radius: 12px; padding: 16px 14px; }
    }

    /* 2. Time inputs en <400px */
    @media (max-width: 400px) {
      .time-input { width: 76px; font-size: 12px; padding: 5px 6px; }
      .day-label { min-width: 62px; font-size: 13px; }
      .day-body { padding-left: 0; }
      .slot-grid { padding-left: 0; }
    }

    /* 3. add-range-btn y range-row en mobile */
    @media (max-width: 480px) {
      .add-range-btn { font-size: 11px; padding: 4px 10px; }
      .range-row { flex-wrap: wrap; gap: 6px; }
    }

    /* 4. font-size 16px para evitar zoom en iOS */
    @media (max-width: 640px) {
      .time-input { font-size: 16px; }
      .block-field input { font-size: 16px; }
    }

    /* 5. Duration buttons en mobile */
    @media (max-width: 480px) {
      .duration-btn { padding: 6px 12px; font-size: 12px; }
    }
  `],
  template: `
    <div class="sch-page">

      <!-- Header -->
      <div>
        <div class="sch-title">Horarios de atención</div>
        <div class="sch-desc">Configurá los días, horarios y bloqueos especiales de tu empresa.</div>
      </div>

      <!-- Intervalo de slots + Staff -->
      <div class="sch-section">
        <div class="sch-section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          Intervalo entre turnos
        </div>
        <p style="font-size:12px;color:#888;margin:0 0 12px">Cada cuánto mostrás opciones de hora al cliente. La duración real viene de cada servicio.</p>
        <div class="duration-row">
          @for (d of durations; track d) {
            <button class="duration-btn" [class.active]="slotInterval() === d" (click)="slotInterval.set(d)">
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

              <!-- Fila superior: toggle + nombre + chevron -->
              <div class="day-top">
                <div class="toggle-wrap" (click)="toggleDay(day.key)">
                  <input
                    class="toggle-input"
                    type="checkbox"
                    [id]="'tog-' + day.key"
                    [checked]="day.enabled"
                    (change)="toggleDay(day.key)" />
                  <label class="toggle-pill" [for]="'tog-' + day.key"></label>
                </div>

                <span class="day-label" [class.disabled]="!day.enabled">{{ day.label }}</span>

                @if (!day.enabled) {
                  <span class="day-closed">Cerrado</span>
                }

                @if (day.enabled) {
                  <button
                    class="expand-btn"
                    [class.open]="expandedDay() === day.key"
                    (click)="toggleExpand(day.key)"
                    title="Ver turnos disponibles">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                }
              </div>

              <!-- Franjas horarias -->
              @if (day.enabled) {
                <div class="day-body">
                  @for (range of day.ranges; track $index; let i = $index) {
                    <div class="range-row">
                      <input
                        class="time-input"
                        type="time"
                        [value]="range.open"
                        (change)="updateRange(day.key, i, 'open', $any($event.target).value)" />
                      <span style="font-size:10px;font-weight:700;color:#888;min-width:20px">{{ ampm(range.open) }}</span>
                      <span class="time-sep">—</span>
                      <input
                        class="time-input"
                        type="time"
                        [value]="range.close"
                        (change)="updateRange(day.key, i, 'close', $any($event.target).value)" />
                      <span style="font-size:10px;font-weight:700;color:#888;min-width:20px">{{ ampm(range.close) }}</span>

                      @if (day.ranges.length > 1) {
                        <button
                          class="remove-range-btn"
                          title="Eliminar franja"
                          (click)="removeRange(day.key, i)">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      }
                    </div>
                  }

                  <button class="add-range-btn" (click)="addRange(day.key)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Agregar franja
                  </button>
                </div>
              }

              <!-- Panel de turnos individuales -->
              <div class="slot-panel" [class.expanded]="expandedDay() === day.key && day.enabled">
                <div class="slot-grid">
                  @for (slot of generateSlots(day); track slot) {
                    <button
                      class="slot-btn"
                      [class.disabled-slot]="isSlotDisabled(day.key, slot)"
                      (click)="toggleSlot(day.key, slot)">
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
            [disabled]="!newBlockDate" (click)="addBlock()">
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
                <button class="block-remove" (click)="removeBlock(block.id)" title="Eliminar bloqueo">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            }
          </div>
        }
      </div>

      <!-- Guardar -->
      <div class="save-bar">
        <button class="btn btn-primary" style="gap:8px" (click)="save()" [disabled]="saving()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          {{ saving() ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>
    </div>

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
  private companyStore = inject(CompanyStore);
  private companySvc   = inject(CompanyService);

  ampm(t: string): string {
    if (!t) return '';
    const [h] = t.split(':').map(Number);
    return h < 12 ? 'AM' : 'PM';
  }

  readonly durations = SLOT_DURATIONS;

  schedule      = signal<DaySchedule[]>(DEFAULT_SCHEDULE.map(d => ({ ...d, ranges: d.ranges.map(r => ({ ...r })) })));
  slotInterval  = signal<number>(30);
  expandedDay   = signal<string | null>(null);
  disabledSlots = signal<Record<string, boolean>>({});
  blockedDates  = signal<BlockedDate[]>([]);
  saved         = signal(false);
  saving        = signal(false);

  newBlockDate   = '';
  newBlockReason = '';

  constructor() {
    effect(() => {
      const company = this.companyStore.company();
      if (!company) return;
      if (company.schedule?.length) {
        this.schedule.set(company.schedule.map(d => ({ ...d, ranges: d.ranges.map(r => ({ ...r })) })));
      }
      if (company.slotInterval)  this.slotInterval.set(company.slotInterval);
      if (company.disabledSlots)       this.disabledSlots.set({ ...company.disabledSlots });
      if (company.blockedDates)        this.blockedDates.set([...company.blockedDates]);
    });
  }

  // ── Day toggle ───────────────────────────────────

  toggleDay(key: string): void {
    this.schedule.update(days =>
      days.map(d => d.key === key ? { ...d, enabled: !d.enabled } : d)
    );
    if (this.expandedDay() === key) this.expandedDay.set(null);
  }

  toggleExpand(key: string): void {
    this.expandedDay.update(cur => cur === key ? null : key);
  }

  // ── Range management ─────────────────────────────

  updateRange(dayKey: string, idx: number, field: 'open' | 'close', value: string): void {
    this.schedule.update(days =>
      days.map(d => {
        if (d.key !== dayKey) return d;
        const ranges = d.ranges.map((r, i) => i === idx ? { ...r, [field]: value } : r);
        return { ...d, ranges };
      })
    );
    if (this.expandedDay() === dayKey) {
      this.expandedDay.set(null);
      requestAnimationFrame(() => this.expandedDay.set(dayKey));
    }
  }

  addRange(dayKey: string): void {
    this.schedule.update(days =>
      days.map(d => {
        if (d.key !== dayKey) return d;
        const last = d.ranges[d.ranges.length - 1];
        return { ...d, ranges: [...d.ranges, { open: last.close, close: last.close }] };
      })
    );
  }

  removeRange(dayKey: string, idx: number): void {
    this.schedule.update(days =>
      days.map(d => {
        if (d.key !== dayKey || d.ranges.length <= 1) return d;
        return { ...d, ranges: d.ranges.filter((_, i) => i !== idx) };
      })
    );
  }

  // ── Slot generation (merges all ranges) ──────────

  generateSlots(day: DaySchedule): string[] {
    if (!day.enabled) return [];
    const duration = this.slotInterval();
    const set = new Set<string>();

    for (const range of day.ranges) {
      const [openH, openM] = range.open.split(':').map(Number);
      const [closeH, closeM] = range.close.split(':').map(Number);
      const start = openH * 60 + openM;
      const end   = closeH * 60 + closeM;
      for (let m = start; m < end; m += duration) {
        const hh = String(Math.floor(m / 60)).padStart(2, '0');
        const mm = String(m % 60).padStart(2, '0');
        set.add(`${hh}:${mm}`);
      }
    }

    return [...set].sort();
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
    this.blockedDates.update(list =>
      [...list, { id: Date.now().toString(), date: this.newBlockDate, reason: this.newBlockReason.trim() }]
        .sort((a, b) => a.date.localeCompare(b.date))
    );
    this.newBlockDate = '';
    this.newBlockReason = '';
  }

  removeBlock(id: string): void {
    this.blockedDates.update(list => list.filter(b => b.id !== id));
  }

  formatDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  // ── Save ─────────────────────────────────────────

  async save(): Promise<void> {
    const cid = this.companyStore.companyId();
    if (!cid) return;
    this.saving.set(true);
    try {
      await this.companySvc.updateCompany(cid, {
        schedule:      this.schedule(),
        slotInterval:  this.slotInterval(),
        blockedDates:  this.blockedDates(),
        disabledSlots: this.disabledSlots(),
      });
      await this.companyStore.refresh();
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2000);
    } finally {
      this.saving.set(false);
    }
  }
}
