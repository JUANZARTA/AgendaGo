import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface DaySchedule {
  day: string;
  label: string;
  open: boolean;
  from: string;
  to: string;
}

interface BlockedSlot {
  id: string;
  date: string;
  from: string;
  to: string;
  reason: string;
}

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day: 'lun', label: 'Lunes',     open: true,  from: '09:00', to: '18:00' },
  { day: 'mar', label: 'Martes',    open: true,  from: '09:00', to: '18:00' },
  { day: 'mie', label: 'Miércoles', open: true,  from: '09:00', to: '18:00' },
  { day: 'jue', label: 'Jueves',    open: true,  from: '09:00', to: '18:00' },
  { day: 'vie', label: 'Viernes',   open: true,  from: '09:00', to: '18:00' },
  { day: 'sab', label: 'Sábado',    open: true,  from: '10:00', to: '16:00' },
  { day: 'dom', label: 'Domingo',   open: false, from: '10:00', to: '14:00' },
];

const MOCK_BLOCKED: BlockedSlot[] = [
  { id: '1', date: '2026-05-20', from: '12:00', to: '14:00', reason: 'Almuerzo extendido' },
];

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page" style="max-width:600px;margin:0 auto">
      <div class="flex-between" style="margin-bottom:24px">
        <h1 style="font-size:1.4rem">Horarios de atención</h1>
        <a routerLink="/empresa" class="btn btn-secondary btn-sm">← Dashboard</a>
      </div>

      @if (saved()) {
        <div style="background:#d4edda;color:#155724;padding:12px 16px;border-radius:8px;margin-bottom:16px;font-size:14px">
          ✓ Horarios guardados correctamente
        </div>
      }

      <!-- Duración de turno -->
      <div class="card" style="margin-bottom:16px">
        <div class="form-group" style="margin:0">
          <label>Duración del turno por defecto (minutos)</label>
          <select [(ngModel)]="slotDuration">
            <option [ngValue]="15">15 minutos</option>
            <option [ngValue]="20">20 minutos</option>
            <option [ngValue]="30">30 minutos</option>
            <option [ngValue]="45">45 minutos</option>
            <option [ngValue]="60">1 hora</option>
          </select>
        </div>
      </div>

      <!-- Horario semanal -->
      <div class="card" style="margin-bottom:16px">
        <h2 style="font-size:1rem;margin-bottom:16px">Días y horarios</h2>
        <div style="display:flex;flex-direction:column;gap:12px">
          @for (day of schedule; track day.day) {
            <div style="display:flex;align-items:center;gap:12px;padding:10px;border-radius:8px;border:1.5px solid #eee"
                 [style.opacity]="day.open?'1':'0.5'">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;min-width:110px">
                <input type="checkbox" [(ngModel)]="day.open" style="width:16px;height:16px;accent-color:#e94560" />
                <span style="font-weight:600">{{ day.label }}</span>
              </label>
              @if (day.open) {
                <div style="display:flex;align-items:center;gap:8px;flex:1">
                  <input type="time" [(ngModel)]="day.from" style="padding:6px 10px;border:1.5px solid #ddd;border-radius:6px;font-size:13px" />
                  <span style="color:#888;font-size:13px">a</span>
                  <input type="time" [(ngModel)]="day.to" style="padding:6px 10px;border:1.5px solid #ddd;border-radius:6px;font-size:13px" />
                </div>
              } @else {
                <span style="color:#aaa;font-size:13px;flex:1">Cerrado</span>
              }
            </div>
          }
        </div>

        <button class="btn btn-primary" style="width:100%;margin-top:20px" (click)="save()">
          Guardar horarios
        </button>
      </div>

      <!-- Bloqueos puntuales -->
      <div class="card">
        <div class="flex-between" style="margin-bottom:16px">
          <h2 style="font-size:1rem">Bloqueos puntuales</h2>
          <button class="btn btn-secondary btn-sm" (click)="showBlockModal.set(true)">+ Bloquear horario</button>
        </div>

        @if (blockedSlots().length === 0) {
          <p style="color:#aaa;font-size:13px;text-align:center;padding:16px">
            Sin bloqueos configurados. Usá esto para vacaciones, feriados o pausas especiales.
          </p>
        }

        <div style="display:flex;flex-direction:column;gap:8px">
          @for (slot of blockedSlots(); track slot.id) {
            <div style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:8px;background:#fff5f7;border:1px solid #ffd6de">
              <div style="flex:1">
                <div style="font-weight:600;font-size:14px">{{ slot.date | date:'EEEE d MMM':'':'es-CO' }}</div>
                <div style="color:#888;font-size:12px;margin-top:2px">{{ slot.from }} – {{ slot.to }} · {{ slot.reason || 'Sin motivo' }}</div>
              </div>
              <button class="btn btn-danger btn-sm" (click)="removeBlock(slot.id)">Quitar</button>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Modal bloqueo -->
    @if (showBlockModal()) {
      <div style="position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:100" (click)="showBlockModal.set(false)">
        <div class="card" style="width:400px;max-width:95vw" (click)="$event.stopPropagation()">
          <h2 style="margin-bottom:16px">Bloquear horario</h2>

          <div class="form-group">
            <label>Fecha</label>
            <input type="date" [(ngModel)]="newBlock.date" />
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label>Desde</label>
              <input type="time" [(ngModel)]="newBlock.from" />
            </div>
            <div class="form-group">
              <label>Hasta</label>
              <input type="time" [(ngModel)]="newBlock.to" />
            </div>
          </div>
          <div class="form-group">
            <label>Motivo (opcional)</label>
            <input [(ngModel)]="newBlock.reason" placeholder="Ej: Feriado, vacaciones..." />
          </div>

          <div style="display:flex;gap:10px;margin-top:8px">
            <button class="btn btn-primary" style="flex:1" (click)="addBlock()" [disabled]="!newBlock.date">Guardar bloqueo</button>
            <button class="btn btn-secondary" (click)="showBlockModal.set(false)">Cancelar</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ScheduleComponent {
  schedule: DaySchedule[] = DEFAULT_SCHEDULE.map(d => ({ ...d }));
  slotDuration = 30;
  saved = signal(false);
  showBlockModal = signal(false);
  blockedSlots = signal<BlockedSlot[]>([...MOCK_BLOCKED]);

  newBlock = { date: '', from: '09:00', to: '10:00', reason: '' };

  save() {
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 3000);
  }

  addBlock() {
    if (!this.newBlock.date) return;
    this.blockedSlots.update(list => [...list, { id: Date.now().toString(), ...this.newBlock }]);
    this.newBlock = { date: '', from: '09:00', to: '10:00', reason: '' };
    this.showBlockModal.set(false);
  }

  removeBlock(id: string) {
    this.blockedSlots.update(list => list.filter(s => s.id !== id));
  }
}
