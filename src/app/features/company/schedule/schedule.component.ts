import { Component, computed, effect, inject, signal } from '@angular/core';
import { toMin, toTime } from '../../../core/domain/scheduling';
import { computeDayErrors, DaySchedule } from '../../../core/domain/schedule-validation';
import { CompanyStore } from '../../../core/services/company-store.service';
import { CompanyService } from '../../../core/services/company.service';
import { BlockedDate, DEFAULT_SCHEDULE, SLOT_DURATIONS } from './schedule.utils';
import { SCHEDULE_ERROR_STYLES } from './schedule.styles';
import { ScheduleIntervalComponent } from './components/schedule-interval.component';
import { ScheduleWeekEditorComponent } from './components/schedule-week-editor.component';
import { ScheduleBlockedDatesComponent } from './components/schedule-blocked-dates.component';
import { RangeChange } from './components/schedule-day-row.component';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [ScheduleIntervalComponent, ScheduleWeekEditorComponent, ScheduleBlockedDatesComponent],
  styles: [`
    ${SCHEDULE_ERROR_STYLES}

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

    /* ── Mobile responsive additions ─────────────────── */

    /* 1. Padding lateral en pantallas muy chicas */
    @media (max-width: 480px) {
      .sch-page { padding-left: 0; padding-right: 0; }
    }
  `],
  template: `
    <div class="sch-page">

      <!-- Header -->
      <div>
        <div class="sch-title">Horarios de atención</div>
        <div class="sch-desc">Configurá los días, horarios y bloqueos especiales de tu empresa.</div>
      </div>

      <app-schedule-interval [durations]="durations" [(slotInterval)]="slotInterval" />

      <app-schedule-week-editor
        [schedule]="schedule()"
        [expandedDay]="expandedDay()"
        [dayErrors]="dayErrors()"
        [slotInterval]="slotInterval()"
        [disabledSlots]="disabledSlots()"
        (toggleDay)="toggleDay($event)"
        (toggleExpand)="toggleExpand($event)"
        (updateRange)="updateRange($event.dayKey, $event.change)"
        (addRange)="addRange($event)"
        (removeRange)="removeRange($event.dayKey, $event.idx)"
        (toggleSlot)="toggleSlot($event.dayKey, $event.slot)" />

      <app-schedule-blocked-dates
        [blockedDates]="blockedDates()"
        [(newBlockDate)]="newBlockDate"
        [(newBlockReason)]="newBlockReason"
        (addBlock)="addBlock()"
        (removeBlock)="removeBlock($event)" />

      <!-- Guardar -->
      <div class="save-bar">
        @if (saveError()) {
          <div class="range-error" style="margin:0 auto 10px 0">{{ saveError() }}</div>
        }
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

  readonly durations = SLOT_DURATIONS;

  schedule      = signal<DaySchedule[]>(DEFAULT_SCHEDULE.map(d => ({ ...d, ranges: d.ranges.map(r => ({ ...r })) })));
  slotInterval  = signal<number>(30);
  expandedDay   = signal<string | null>(null);
  disabledSlots = signal<Record<string, boolean>>({});
  blockedDates  = signal<BlockedDate[]>([]);
  saved         = signal(false);
  saving        = signal(false);
  saveError     = signal('');

  /** Errores por día activo: franja con cierre <= apertura (ej. "12:00 AM" = medianoche) o franjas solapadas. */
  dayErrors = computed(() => computeDayErrors(this.schedule()));

  // Borradores del formulario de bloqueos (viven acá para sobrevivir igual que antes)
  newBlockDate   = signal('');
  newBlockReason = signal('');

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

  updateRange(dayKey: string, { idx, field, value }: RangeChange): void {
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
        // Nueva franja de 1 h a continuación de la última (antes se creaba con largo cero)
        const close = toTime(Math.min(toMin(last.close) + 60, 23 * 60 + 59));
        return { ...d, ranges: [...d.ranges, { open: last.close, close }] };
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

  // ── Slot toggle ──────────────────────────────────

  toggleSlot(dayKey: string, slot: string): void {
    const key = `${dayKey}-${slot}`;
    this.disabledSlots.update(map => ({ ...map, [key]: !map[key] }));
  }

  // ── Blocked dates ─────────────────────────────────

  addBlock(): void {
    if (!this.newBlockDate()) return;
    const date = this.newBlockDate();
    const reason = this.newBlockReason().trim();
    this.blockedDates.update(list =>
      [...list, { id: Date.now().toString(), date, reason }]
        .sort((a, b) => a.date.localeCompare(b.date))
    );
    this.newBlockDate.set('');
    this.newBlockReason.set('');
  }

  removeBlock(id: string): void {
    this.blockedDates.update(list => list.filter(b => b.id !== id));
  }

  // ── Save ─────────────────────────────────────────

  async save(): Promise<void> {
    const cid = this.companyStore.companyId();
    if (!cid) return;
    if (Object.keys(this.dayErrors()).length > 0) {
      this.saveError.set('Revisá los horarios marcados en rojo antes de guardar.');
      return;
    }
    this.saveError.set('');
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
    } catch (e) {
      console.error('[Schedule] Error al guardar', e);
      this.saveError.set('No se pudieron guardar los cambios. Intentá de nuevo.');
    } finally {
      this.saving.set(false);
    }
  }
}
