import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const SERVICES = [
  { id: '1', name: 'Corte clásico',   duration: 30, price: 20000 },
  { id: '2', name: 'Corte + barba',   duration: 45, price: 35000 },
  { id: '3', name: 'Afeitado navaja', duration: 30, price: 25000 },
];

const MOCK_APPOINTMENTS = [
  { id:'a1', time:'08:30', client:'Carlos Ruiz',    service:'Corte clásico',   duration:30, price:20000, status:'confirmed', phone:'3001111111' },
  { id:'a2', time:'09:00', client:'Andrés Mora',    service:'Corte + barba',   duration:45, price:35000, status:'pending',   phone:'3002222222' },
  { id:'a3', time:'10:00', client:'Luis Pérez',     service:'Afeitado navaja', duration:30, price:25000, status:'confirmed', phone:'3003333333' },
  { id:'a4', time:'11:00', client:'Jorge Salcedo',  service:'Corte clásico',   duration:30, price:20000, status:'cancelled', phone:'3004444444' },
  { id:'a5', time:'14:00', client:'Mario Castillo', service:'Corte + barba',   duration:45, price:35000, status:'pending',   phone:'3005555555' },
  { id:'a6', time:'15:00', client:'Felipe Torres',  service:'Corte clásico',   duration:30, price:20000, status:'confirmed', phone:'3006666666' },
];

const CANCEL_REASONS = [
  'El cliente no se presentó',
  'El cliente canceló con anticipación',
  'Enfermedad del profesional',
  'Problema con materiales o equipos',
  'Error en el agendamiento',
  'Otro',
];

const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 8; h < 18; h++) {
    slots.push(`${String(h).padStart(2,'0')}:00`);
    slots.push(`${String(h).padStart(2,'0')}:30`);
  }
  return slots;
})();

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .dashboard { animation: fadeInUp .35s ease both; }
    @keyframes fadeInUp {
      from { opacity:0; transform:translateY(16px); }
      to   { opacity:1; transform:translateY(0); }
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; margin: 0; }
    .page-subtitle { font-size: 13px; color: #888; margin: 2px 0 0; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }
    .stat-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(124,58,237,.12);
      padding: 20px 16px;
      text-align: center;
    }
    .stat-number {
      font-size: 2.2rem;
      font-weight: 800;
      background: linear-gradient(135deg, #7c3aed, #f43f5e);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      margin-bottom: 6px;
    }
    .stat-number.green  { background: linear-gradient(135deg, #059669, #10b981); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
    .stat-number.yellow { background: linear-gradient(135deg, #d97706, #f59e0b); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
    .stat-number.red    { background: linear-gradient(135deg, #dc2626, #f43f5e); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
    .stat-label { font-size: 12px; color: #888; font-weight: 500; letter-spacing: .3px; }

    .section-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(124,58,237,.12);
      padding: 24px;
      margin-bottom: 24px;
    }
    .section-title { font-size: 1rem; font-weight: 700; color: #1a1a2e; margin: 0 0 20px; }

    .timeline {
      display: flex;
      flex-direction: column;
      gap: 12px;
      position: relative;
      padding-left: 16px;
    }
    .timeline::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: linear-gradient(to bottom, #7c3aed, #f43f5e);
      border-radius: 2px;
    }

    .apt-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 16px;
      border-radius: 12px;
      border: 1.5px solid #eee;
      border-left: 4px solid #7c3aed;
      background: #fafafa;
      transition: box-shadow .2s;
    }
    .apt-card:hover { box-shadow: 0 4px 16px rgba(124,58,237,.1); }
    .apt-card.confirmed { border-left-color: #059669; }
    .apt-card.pending   { border-left-color: #d97706; }
    .apt-card.cancelled { border-left-color: #dc2626; opacity: .55; }

    .apt-time { min-width: 56px; text-align: center; }
    .apt-time-value { font-size: 1.1rem; font-weight: 800; color: #7c3aed; }
    .apt-body { flex: 1; min-width: 0; }
    .apt-client { font-weight: 700; font-size: 14px; color: #1a1a2e; display:flex; align-items:center; gap:6px; }
    .apt-service { font-size: 12px; color: #888; margin-top: 2px; }
    .apt-meta { font-size: 12px; color: #aaa; margin-top: 2px; }
    .apt-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
    }
    .badge-green  { background: #d1fae5; color: #065f46; }
    .badge-yellow { background: #fef3c7; color: #92400e; }
    .badge-red    { background: #fee2e2; color: #991b1b; }

    /* Botón icono circular pequeño */
    .icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 1.5px solid #e5e7eb;
      background: white;
      cursor: pointer;
      color: #6b7280;
      transition: background .15s, color .15s, border-color .15s;
      flex-shrink: 0;
    }
    .icon-btn:hover { background: #f3f4f6; color: #1a1a2e; border-color: #d1d5db; }
    .icon-btn.confirm:hover { background: #d1fae5; color: #059669; border-color: #6ee7b7; }
    .icon-btn.cancel-btn:hover { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      padding: 16px;
    }
    .modal-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,.25);
      padding: 28px;
      width: 100%;
      max-width: 460px;
      max-height: 90vh;
      overflow-y: auto;
      animation: fadeInUp .25s ease both;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .modal-title { font-size: 1.1rem; font-weight: 700; color: #1a1a2e; margin: 0; }
    .modal-close {
      width: 32px; height: 32px; border-radius: 8px; border: none;
      background: #f3f4f6; cursor: pointer; color: #6b7280;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s;
    }
    .modal-close:hover { background: #e5e7eb; }

    .form-group { margin-bottom: 14px; }
    .form-group label { display:block; font-size:13px; font-weight:600; color:#374151; margin-bottom:5px; }
    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      padding: 9px 12px;
      font-size: 14px;
      color: #1a1a2e;
      background: white;
      outline: none;
      transition: border-color .15s;
      box-sizing: border-box;
    }
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,.1); }
    .form-group textarea { resize: vertical; min-height: 72px; }

    .modal-footer { display: flex; gap: 10px; margin-top: 20px; }
    .modal-footer .btn { flex: 1; }

    /* Radio group para motivos de cancelación */
    .reason-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
    .reason-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      cursor: pointer;
      transition: border-color .15s, background .15s;
    }
    .reason-item:hover { background: #f9f5ff; border-color: #c4b5fd; }
    .reason-item.selected { background: #f3f4ff; border-color: #7c3aed; }
    .reason-item input[type=radio] { accent-color: #7c3aed; width: 16px; height: 16px; flex-shrink: 0; }
    .reason-item span { font-size: 13px; color: #374151; }

    .cancel-target-info {
      background: #fef3c7;
      border: 1.5px solid #fde68a;
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 16px;
      font-size: 13px;
      color: #92400e;
    }
    .cancel-target-info strong { display: block; font-size: 14px; color: #78350f; margin-bottom: 2px; }

    @media (max-width: 700px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .apt-card { flex-wrap: wrap; }
    }
    @media (max-width: 420px) {
      .stats-grid { grid-template-columns: 1fr 1fr; }
    }
  `],
  template: `
    <div class="dashboard">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">{{ today }}</p>
        </div>
        <button class="btn btn-primary" (click)="showNewModal.set(true)" style="display:inline-flex;align-items:center;gap:8px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva cita
        </button>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ total() }}</div>
          <div class="stat-label">Total hoy</div>
        </div>
        <div class="stat-card">
          <div class="stat-number green">{{ confirmed() }}</div>
          <div class="stat-label">Confirmadas</div>
        </div>
        <div class="stat-card">
          <div class="stat-number yellow">{{ pending() }}</div>
          <div class="stat-label">Pendientes</div>
        </div>
        <div class="stat-card">
          <div class="stat-number red">{{ cancelled() }}</div>
          <div class="stat-label">Canceladas</div>
        </div>
      </div>

      <!-- Agenda del día -->
      <div class="section-card">
        <h2 class="section-title" style="display:flex;align-items:center;gap:8px">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Agenda del día
        </h2>

        <div class="timeline">
          @for (apt of appointments(); track apt.id) {
            <div class="apt-card" [class]="apt.status">
              <!-- Hora -->
              <div class="apt-time">
                <div class="apt-time-value">{{ apt.time }}</div>
              </div>

              <!-- Info -->
              <div class="apt-body">
                <div class="apt-client">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  {{ apt.client }}
                </div>
                <div class="apt-service">{{ apt.service }}</div>
                <div class="apt-meta" style="display:flex;align-items:center;gap:10px;margin-top:3px">
                  <span style="display:inline-flex;align-items:center;gap:3px">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {{ apt.duration }} min
                  </span>
                  <span>${{ apt.price | number }}</span>
                  <span style="display:inline-flex;align-items:center;gap:3px">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    {{ apt.phone }}
                  </span>
                </div>
              </div>

              <!-- Badge estado -->
              <div class="apt-actions">
                @switch (apt.status) {
                  @case ('confirmed') { <span class="badge badge-green">Confirmada</span> }
                  @case ('pending')   { <span class="badge badge-yellow">Pendiente</span> }
                  @case ('cancelled') { <span class="badge badge-red">Cancelada</span> }
                }

                <!-- Confirmar (solo pendiente) -->
                @if (apt.status === 'pending') {
                  <button class="icon-btn confirm" title="Confirmar cita" (click)="confirmAppointment(apt.id)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </button>
                }

                <!-- Cancelar (si no está ya cancelada) -->
                @if (apt.status !== 'cancelled') {
                  <button class="icon-btn cancel-btn" title="Cancelar cita" (click)="openCancelModal(apt)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </div>

    </div><!-- /dashboard -->


    <!-- ===== MODAL: Nueva cita ===== -->
    @if (showNewModal()) {
      <div class="modal-overlay" (click)="closeNewModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title" style="display:flex;align-items:center;gap:8px">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Nueva cita
            </h2>
            <button class="modal-close" (click)="closeNewModal()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="form-group">
            <label>Nombre del cliente</label>
            <input [(ngModel)]="newClient" placeholder="Nombre completo" />
          </div>

          <div class="form-group">
            <label>Teléfono</label>
            <input [(ngModel)]="newPhone" placeholder="3001234567" type="tel" />
          </div>

          <div class="form-group">
            <label>Servicio</label>
            <select [(ngModel)]="newServiceId">
              @for (svc of services; track svc.id) {
                <option [value]="svc.id">{{ svc.name }} — {{ svc.duration }} min / ${{ svc.price | number }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label>Fecha</label>
            <input type="date" [(ngModel)]="newDate" />
          </div>

          <div class="form-group">
            <label>Hora</label>
            <select [(ngModel)]="newTime">
              @for (slot of timeSlots; track slot) {
                <option [value]="slot">{{ slot }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label>Nota interna <span style="font-weight:400;color:#aaa">(opcional)</span></label>
            <textarea [(ngModel)]="newNote" placeholder="Preferencias, indicaciones, etc."></textarea>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeNewModal()">Cancelar</button>
            <button class="btn btn-primary" (click)="saveNewAppointment()" [disabled]="!newClient.trim()">Guardar cita</button>
          </div>
        </div>
      </div>
    }


    <!-- ===== MODAL: Cancelar cita ===== -->
    @if (cancelTarget()) {
      <div class="modal-overlay" (click)="cancelTarget.set(null)">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title" style="display:flex;align-items:center;gap:8px">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Cancelar cita
            </h2>
            <button class="modal-close" (click)="cancelTarget.set(null)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="cancel-target-info">
            <strong>{{ cancelTarget()?.client }}</strong>
            {{ cancelTarget()?.service }} · {{ cancelTarget()?.time }}
          </div>

          <p style="font-size:13px;color:#374151;margin:0 0 10px;font-weight:600">Motivo de cancelación</p>

          <div class="reason-list">
            @for (reason of cancelReasons; track reason) {
              <label class="reason-item" [class.selected]="cancelReason() === reason">
                <input type="radio" name="cancel-reason" [value]="reason" [(ngModel)]="selectedReason" (change)="cancelReason.set(reason)" />
                <span>{{ reason }}</span>
              </label>
            }
          </div>

          @if (cancelReason() === 'Otro') {
            <div class="form-group">
              <label>Especificá el motivo</label>
              <textarea [(ngModel)]="cancelOtherText" placeholder="Describí el motivo..." (input)="cancelOther.set(cancelOtherText)"></textarea>
            </div>
          }

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="cancelTarget.set(null)">Volver</button>
            <button class="btn btn-danger"
              [disabled]="!cancelReason() || (cancelReason() === 'Otro' && !cancelOther().trim())"
              (click)="doCancel()">
              Confirmar cancelación
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DashboardComponent {
  readonly today = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  readonly services = SERVICES;
  readonly cancelReasons = CANCEL_REASONS;
  readonly timeSlots = TIME_SLOTS;

  // --- State ---
  appointments = signal([...MOCK_APPOINTMENTS]);
  showNewModal  = signal(false);
  cancelTarget  = signal<any>(null);
  cancelReason  = signal('');
  cancelOther   = signal('');

  // --- Stats ---
  total     = computed(() => this.appointments().length);
  confirmed = computed(() => this.appointments().filter(a => a.status === 'confirmed').length);
  pending   = computed(() => this.appointments().filter(a => a.status === 'pending').length);
  cancelled = computed(() => this.appointments().filter(a => a.status === 'cancelled').length);

  // --- New appointment form ---
  newClient    = '';
  newPhone     = '';
  newServiceId = SERVICES[0].id;
  newDate      = '';
  newTime      = '08:00';
  newNote      = '';

  // --- Cancel modal local binding (needed for ngModel on radio) ---
  selectedReason = '';
  cancelOtherText = '';

  // --- Actions ---
  confirmAppointment(id: string): void {
    this.appointments.update(list =>
      list.map(a => a.id === id ? { ...a, status: 'confirmed' } : a)
    );
  }

  openCancelModal(apt: any): void {
    this.cancelTarget.set(apt);
    this.cancelReason.set('');
    this.cancelOther.set('');
    this.selectedReason = '';
    this.cancelOtherText = '';
  }

  doCancel(): void {
    const target = this.cancelTarget();
    if (!target) return;
    this.appointments.update(list =>
      list.map(a => a.id === target.id ? { ...a, status: 'cancelled' } : a)
    );
    this.cancelTarget.set(null);
    this.cancelReason.set('');
    this.cancelOther.set('');
  }

  saveNewAppointment(): void {
    if (!this.newClient.trim()) return;
    const svc = SERVICES.find(s => s.id === this.newServiceId) ?? SERVICES[0];
    this.appointments.update(list => [
      ...list,
      {
        id:       'new-' + Date.now(),
        time:     this.newTime,
        client:   this.newClient.trim(),
        service:  svc.name,
        duration: svc.duration,
        price:    svc.price,
        status:   'pending',
        phone:    this.newPhone.trim(),
      },
    ].sort((a, b) => a.time.localeCompare(b.time)));
    this.closeNewModal();
  }

  closeNewModal(): void {
    this.showNewModal.set(false);
    this.newClient    = '';
    this.newPhone     = '';
    this.newServiceId = SERVICES[0].id;
    this.newDate      = '';
    this.newTime      = '08:00';
    this.newNote      = '';
  }
}
