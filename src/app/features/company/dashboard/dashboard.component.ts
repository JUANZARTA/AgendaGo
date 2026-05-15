import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AppointmentService, Appointment } from '../../../core/services/appointment.service';
import { ServiceCatalogService, ServiceItem } from '../../../core/services/service-catalog.service';
import { CompanyStore } from '../../../core/services/company-store.service';

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
    @keyframes scaleIn {
      from { opacity:0; transform:scale(0.88); }
      60%  { transform:scale(1.04); }
      to   { opacity:1; transform:scale(1); }
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
      box-shadow: 0 4px 24px rgba(var(--primary-rgb),.12);
      padding: 20px 16px;
      text-align: center;
      animation: scaleIn 0.4s ease both;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }
    .stat-card:hover { transform: translateY(-4px) scale(1.04); box-shadow: 0 10px 32px rgba(var(--primary-rgb),.22); }
    .stats-grid .stat-card:nth-child(1) { animation-delay: 0.00s; }
    .stats-grid .stat-card:nth-child(2) { animation-delay: 0.08s; }
    .stats-grid .stat-card:nth-child(3) { animation-delay: 0.16s; }
    .stats-grid .stat-card:nth-child(4) { animation-delay: 0.24s; }
    .stat-number {
      font-size: 2.2rem;
      font-weight: 800;
      background: var(--gradient);
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
      box-shadow: 0 4px 24px rgba(var(--primary-rgb),.12);
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
      background: var(--gradient);
      border-radius: 2px;
    }

    .apt-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 16px;
      border-radius: 12px;
      border: 1.5px solid #eee;
      border-left: 4px solid var(--purple);
      background: #fafafa;
      transition: box-shadow .25s ease, transform .25s ease;
      animation: slideInLeft 0.35s ease both;
    }
    .apt-card:nth-child(1) { animation-delay: 0.05s; }
    .apt-card:nth-child(2) { animation-delay: 0.12s; }
    .apt-card:nth-child(3) { animation-delay: 0.19s; }
    .apt-card:nth-child(4) { animation-delay: 0.26s; }
    .apt-card:nth-child(5) { animation-delay: 0.33s; }
    .apt-card:nth-child(6) { animation-delay: 0.40s; }
    .apt-card:hover { box-shadow: 0 6px 20px rgba(var(--primary-rgb),.15); transform: translateX(4px); }
    @keyframes slideInLeft {
      from { opacity:0; transform:translateX(-20px); }
      to   { opacity:1; transform:translateX(0); }
    }
    .apt-card.scheduled { border-left-color: #059669; }
    .apt-card.pending   { border-left-color: #d97706; }
    .apt-card.cancelled { border-left-color: #dc2626; opacity: .55; }
    .apt-card.completed { border-left-color: #0891b2; opacity: .7; }

    .apt-time { min-width: 56px; text-align: center; }
    .apt-time-value { font-size: 1.1rem; font-weight: 800; color: var(--purple); }
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
    .badge-blue   { background: #dbeafe; color: #1d4ed8; }

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
    .icon-btn.complete-btn:hover { background: #dbeafe; color: #1d4ed8; border-color: #93c5fd; }
    .icon-btn.cancel-btn:hover { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }
    .icon-btn.delete-btn:hover { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }

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
    .form-group textarea:focus { border-color: var(--purple); box-shadow: 0 0 0 3px rgba(var(--primary-rgb),.1); }
    .form-group textarea { resize: vertical; min-height: 72px; }

    .modal-footer { display: flex; gap: 10px; margin-top: 20px; }
    .modal-footer .btn { flex: 1; }

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
    .reason-item.selected { background: #f3f4ff; border-color: var(--purple); }
    .reason-item input[type=radio] { accent-color: var(--purple); width: 16px; height: 16px; flex-shrink: 0; }
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

    .modal-card { max-width: min(460px, calc(100vw - 16px)); }

    /* Date navigation */
    .date-nav {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .date-nav-arrow {
      width: 34px; height: 34px; border-radius: 10px;
      border: 1.5px solid #e5e7eb; background: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #6b7280; transition: all .15s;
    }
    .date-nav-arrow:hover { background: #f3f4f6; border-color: #d1d5db; color: #1a1a2e; }

    .date-chip {
      position: relative;
      display: inline-flex; align-items: center; gap: 7px;
      padding: 7px 14px; border-radius: 10px;
      border: 1.5px solid #e5e7eb; background: white; cursor: pointer;
      font-size: 13px; font-weight: 600; color: #374151;
      transition: all .15s; white-space: nowrap; user-select: none;
    }
    .date-chip:hover { border-color: var(--purple); color: var(--purple); background: #f9f5ff; }
    .date-chip.date-chip-today { border-color: var(--purple); color: var(--purple); background: var(--btn-secondary-bg); }

    .date-chip-input {
      position: absolute; inset: 0; opacity: 0;
      width: 100%; height: 100%; cursor: pointer;
      border: none; padding: 0; margin: 0;
    }

    @media (max-width: 480px) {
      .apt-card { flex-wrap: wrap; gap: 10px; }
      .apt-time { min-width: unset; width: 100%; display: flex; align-items: center; gap: 8px; }
      .apt-time-value { font-size: 1rem; }
      .apt-actions { width: 100%; justify-content: flex-end; }
      .modal-overlay { padding: 8px; align-items: flex-end; }
      .modal-card { border-radius: 20px 20px 0 0; max-height: 95vh; }
    }

    @media (max-width: 640px) {
      .form-group input,
      .form-group select,
      .form-group textarea { font-size: 16px; }
    }
  `],
  template: `
    <div class="dashboard">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">{{ selectedDateLabel() }}</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">

          <!-- Navegación de fecha -->
          <div class="date-nav">
            <button class="date-nav-arrow" (click)="navigate(-1)" title="Día anterior">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>

            <label class="date-chip" [class.date-chip-today]="isToday()" title="Elegir fecha">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>{{ isToday() ? 'Hoy' : selectedDateShort() }}</span>
              <input type="date" class="date-chip-input" [value]="selectedDate()" (change)="onDateChange($event)" />
            </label>

            <button class="date-nav-arrow" (click)="navigate(1)" title="Día siguiente">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>

            @if (!isToday()) {
              <button class="btn btn-secondary btn-sm" (click)="goToday()" style="font-size:12px">Hoy</button>
            }
          </div>

          <button class="btn btn-primary" (click)="showNewModal.set(true)"
                  [disabled]="!companyStore.companyId()"
                  style="display:inline-flex;align-items:center;gap:8px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva cita
          </button>
        </div>
      </div>

      @if (companyStore.loading()) {
        <div class="section-card" style="text-align:center;color:#aaa">Cargando empresa...</div>
      } @else if (!companyStore.companyId()) {
        <div class="section-card" style="text-align:center;color:#aaa">
          Iniciá sesión para ver tu agenda.
        </div>
      } @else {
        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">{{ total() }}</div>
            <div class="stat-label">Total hoy</div>
          </div>
          <div class="stat-card">
            <div class="stat-number green">{{ scheduled() }}</div>
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Agenda del día
          </h2>

          @if (loadingApts()) {
            <div style="text-align:center;padding:32px;color:#aaa">Cargando citas...</div>
          } @else if (appointments().length === 0) {
            <div style="text-align:center;padding:32px;color:#aaa">Sin citas para hoy.</div>
          } @else {
            <div class="timeline">
              @for (apt of appointments(); track apt.id) {
                <div class="apt-card" [class]="apt.status">
                  <div class="apt-time">
                    <div class="apt-time-value">{{ apt.startTime }}</div>
                  </div>

                  <div class="apt-body">
                    <div class="apt-client">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      {{ apt.clientName }}
                    </div>
                    <div class="apt-service">{{ apt.serviceName }}</div>
                    <div class="apt-meta" style="display:flex;align-items:center;gap:10px;margin-top:3px">
                      <span style="display:inline-flex;align-items:center;gap:3px">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        {{ apt.serviceDuration }} min
                      </span>
                      @if (apt.price) {
                        <span>\${{ apt.price | number }}</span>
                      }
                      @if (apt.clientPhone) {
                        <span style="display:inline-flex;align-items:center;gap:3px">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                          </svg>
                          {{ apt.clientPhone }}
                        </span>
                      }
                    </div>
                  </div>

                  <div class="apt-actions">
                    @switch (apt.status) {
                      @case ('scheduled') { <span class="badge badge-green">Confirmada</span> }
                      @case ('pending')   { <span class="badge badge-yellow">Pendiente</span> }
                      @case ('cancelled') { <span class="badge badge-red">Cancelada</span> }
                      @case ('completed') { <span class="badge badge-blue">Completada</span> }
                    }

                    @if (apt.status === 'pending') {
                      <button class="icon-btn confirm" title="Confirmar" (click)="confirmApt(apt.id!)">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </button>
                    }

                    @if (apt.status === 'scheduled') {
                      <button class="icon-btn complete-btn" title="Marcar completada" (click)="completeApt(apt.id!)">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                      </button>
                    }

                    @if (apt.status !== 'cancelled' && apt.status !== 'completed') {
                      <button class="icon-btn cancel-btn" title="Cancelar" (click)="openCancelModal(apt)">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    }

                    @if (apt.status === 'cancelled' || apt.status === 'completed') {
                      <button class="icon-btn delete-btn" title="Eliminar" (click)="deleteTarget.set(apt)">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>


    <!-- ===== MODAL: Nueva cita ===== -->
    @if (showNewModal()) {
      <div class="modal-overlay" (click)="closeNewModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title" style="display:flex;align-items:center;gap:8px">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
              @for (svc of services(); track svc.id) {
                <option [value]="svc.id">{{ svc.name }} — {{ svc.duration }} min / \${{ (svc.price ?? 0) | number }}</option>
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
            <button class="btn btn-primary" (click)="saveNewAppointment()"
                    [disabled]="!newClient.trim() || saving()">
              {{ saving() ? 'Guardando...' : 'Guardar cita' }}
            </button>
          </div>
        </div>
      </div>
    }


    <!-- ===== MODAL: Eliminar cita ===== -->
    @if (deleteTarget()) {
      <div class="modal-overlay" (click)="deleteTarget.set(null)">
        <div class="modal-card" style="max-width:360px" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title" style="display:flex;align-items:center;gap:8px">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
              Eliminar cita
            </h2>
            <button class="modal-close" (click)="deleteTarget.set(null)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="cancel-target-info">
            <strong>{{ deleteTarget()?.clientName }}</strong>
            {{ deleteTarget()?.serviceName }} · {{ deleteTarget()?.startTime }}
          </div>

          <p style="font-size:13px;color:#374151;margin:0 0 20px">
            Esta acción es permanente y no se puede deshacer. ¿Confirmás que querés eliminar esta cita?
          </p>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="deleteTarget.set(null)">Cancelar</button>
            <button class="btn btn-danger" [disabled]="saving()" (click)="doDelete()">
              {{ saving() ? 'Eliminando...' : 'Eliminar' }}
            </button>
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
            <strong>{{ cancelTarget()?.clientName }}</strong>
            {{ cancelTarget()?.serviceName }} · {{ cancelTarget()?.startTime }}
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
              [disabled]="!cancelReason() || (cancelReason() === 'Otro' && !cancelOther().trim()) || saving()"
              (click)="doCancel()">
              Confirmar cancelación
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DashboardComponent implements OnDestroy {
  readonly companyStore  = inject(CompanyStore);
  private aptSvc         = inject(AppointmentService);
  private catalogSvc     = inject(ServiceCatalogService);

  private readonly _today = new Date().toISOString().split('T')[0];
  selectedDate = signal(this._today);

  selectedDateLabel = computed(() => {
    const [y, m, d] = this.selectedDate().split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  });

  isToday = computed(() => this.selectedDate() === this._today);

  selectedDateShort = computed(() => {
    const [y, m, d] = this.selectedDate().split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
      day: 'numeric', month: 'short',
    });
  });
  readonly cancelReasons = CANCEL_REASONS;
  readonly timeSlots     = TIME_SLOTS;

  appointments = signal<Appointment[]>([]);
  services     = signal<ServiceItem[]>([]);
  loadingApts  = signal(false);
  saving       = signal(false);

  showNewModal = signal(false);
  cancelTarget = signal<Appointment | null>(null);
  cancelReason = signal('');
  cancelOther  = signal('');
  deleteTarget = signal<Appointment | null>(null);

  total     = computed(() => this.appointments().length);
  scheduled = computed(() => this.appointments().filter(a => a.status === 'scheduled').length);
  pending   = computed(() => this.appointments().filter(a => a.status === 'pending').length);
  cancelled = computed(() => this.appointments().filter(a => a.status === 'cancelled').length);

  newClient    = '';
  newPhone     = '';
  newServiceId = '';
  newDate      = '';
  newTime      = '08:00';
  newNote      = '';

  selectedReason  = '';
  cancelOtherText = '';

  private aptSub?: Subscription;

  constructor() {
    effect(() => {
      const cid  = this.companyStore.companyId();
      const date = this.selectedDate();
      if (!cid) return;
      this.loadingApts.set(true);
      this.aptSub?.unsubscribe();
      this.aptSub = this.aptSvc.watchByCompanyAndDate(cid, date).subscribe({
        next: (apts) => {
          this.appointments.set(apts.sort((a, b) => a.startTime.localeCompare(b.startTime)));
          this.loadingApts.set(false);
        },
        error: (err) => {
          console.error('[Dashboard] snapshot error:', err);
          this.loadingApts.set(false);
        },
      });
      this.catalogSvc.getActiveServices(cid).then(svcs => {
        this.services.set(svcs);
        if (svcs.length && !this.newServiceId) this.newServiceId = svcs[0].id!;
      });
    });
  }

  ngOnDestroy() {
    this.aptSub?.unsubscribe();
  }

  navigate(days: number) {
    const [y, m, d] = this.selectedDate().split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    this.selectedDate.set(date.toISOString().split('T')[0]);
  }

  goToday() {
    this.selectedDate.set(this._today);
  }

  onDateChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    if (val) this.selectedDate.set(val);
  }

  async confirmApt(id: string) {
    await this.aptSvc.confirmAppointment(id);
  }

  async completeApt(id: string) {
    await this.aptSvc.completeAppointment(id);
  }

  openCancelModal(apt: Appointment) {
    this.cancelTarget.set(apt);
    this.cancelReason.set('');
    this.cancelOther.set('');
    this.selectedReason  = '';
    this.cancelOtherText = '';
  }

  async doDelete() {
    const target = this.deleteTarget();
    if (!target?.id) return;
    this.saving.set(true);
    try {
      await this.aptSvc.deleteAppointment(target.id);
      this.deleteTarget.set(null);
    } finally {
      this.saving.set(false);
    }
  }

  async doCancel() {
    const target = this.cancelTarget();
    if (!target?.id) return;
    this.saving.set(true);
    try {
      await this.aptSvc.cancelAppointment(target.id, 'company');
      this.cancelTarget.set(null);
    } finally {
      this.saving.set(false);
    }
  }

  async saveNewAppointment() {
    const cid     = this.companyStore.companyId();
    const company = this.companyStore.company();
    if (!cid || !this.newClient.trim()) return;

    const svc = this.services().find(s => s.id === this.newServiceId) ?? this.services()[0];
    if (!svc) return;

    this.saving.set(true);
    try {
      await this.aptSvc.createManualAppointment({
        companyId:       cid,
        companyName:     company?.name ?? '',
        serviceId:       svc.id!,
        serviceName:     svc.name,
        serviceDuration: svc.duration ?? 30,
        clientName:      this.newClient.trim(),
        clientPhone:     this.newPhone.trim(),
        isGuestClient:   true,
        date:            this.newDate || this.selectedDate(),
        startTime:       this.newTime,
        endTime:         this.calcEndTime(this.newTime, svc.duration ?? 30),
        price:           svc.price,
        source:          'manual',
      });
      this.closeNewModal();
    } finally {
      this.saving.set(false);
    }
  }

  closeNewModal() {
    this.showNewModal.set(false);
    this.newClient    = '';
    this.newPhone     = '';
    this.newServiceId = this.services()[0]?.id ?? '';
    this.newDate      = '';
    this.newTime      = '08:00';
    this.newNote      = '';
  }

  private calcEndTime(start: string, duration: number): string {
    const [h, m] = start.split(':').map(Number);
    const total  = h * 60 + m + duration;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }
}
