import { Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Appointment } from '../../../../core/services/appointment.service';
import { BADGE_STYLES } from '../dashboard.styles';

/** Tarjeta de una cita dentro de la línea de tiempo del día. */
@Component({
  selector: 'app-appointment-card',
  standalone: true,
  imports: [DecimalPipe],
  styles: [`
    :host { display: block; }
    @keyframes slideInLeft {
      from { opacity:0; transform:translateX(-20px); }
      to   { opacity:1; transform:translateX(0); }
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
    /* El delay depende de la posición del host dentro de la línea de tiempo */
    :host(:nth-child(1)) .apt-card { animation-delay: 0.05s; }
    :host(:nth-child(2)) .apt-card { animation-delay: 0.12s; }
    :host(:nth-child(3)) .apt-card { animation-delay: 0.19s; }
    :host(:nth-child(4)) .apt-card { animation-delay: 0.26s; }
    :host(:nth-child(5)) .apt-card { animation-delay: 0.33s; }
    :host(:nth-child(6)) .apt-card { animation-delay: 0.40s; }
    .apt-card:hover { box-shadow: 0 6px 20px rgba(var(--primary-rgb),.15); transform: translateX(4px); }
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

    ${BADGE_STYLES}

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

    @media (max-width: 700px) {
      .apt-card { flex-wrap: wrap; }
    }
    @media (max-width: 480px) {
      .apt-card { flex-wrap: wrap; gap: 10px; }
      .apt-time { min-width: unset; width: 100%; display: flex; align-items: center; gap: 8px; }
      .apt-time-value { font-size: 1rem; }
      .apt-actions { width: 100%; justify-content: flex-end; }
    }
  `],
  template: `
    <div class="apt-card" [class]="apt().status">
      <div class="apt-time">
        <div class="apt-time-value">{{ apt().startTime }}</div>
      </div>

      <div class="apt-body">
        <div class="apt-client">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          {{ apt().clientName }}
        </div>
        <div class="apt-service">{{ apt().serviceName }}</div>
        @if (apt().staffName) {
          <div class="apt-meta" style="margin-top:2px;font-size:12px;color:#a0a0b8;display:flex;align-items:center;gap:4px">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            {{ apt().staffName }}
          </div>
        }
        <div class="apt-meta" style="display:flex;align-items:center;gap:10px;margin-top:3px">
          <span style="display:inline-flex;align-items:center;gap:3px">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {{ apt().serviceDuration }} min
          </span>
          @if (apt().price) {
            <span>\${{ apt().price | number }}</span>
          }
          @if (apt().clientPhone) {
            <span style="display:inline-flex;align-items:center;gap:3px">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              {{ apt().clientPhone }}
            </span>
          }
        </div>
        @if (apt().status === 'cancelled' && apt().cancelReason) {
          <div class="apt-meta" style="margin-top:3px;color:#dc2626" [title]="apt().cancelReason!">
            Motivo{{ apt().cancelledBy === 'client' ? ' (cliente)' : '' }}: {{ apt().cancelReason }}
          </div>
        }
      </div>

      <div class="apt-actions">
        <!-- Ver detalle -->
        <button class="icon-btn" title="Ver detalle" (click)="detailRequested.emit(apt())">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        </button>

        @switch (apt().status) {
          @case ('scheduled') { <span class="badge badge-green">Confirmada</span> }
          @case ('pending')   { <span class="badge badge-yellow">Pendiente</span> }
          @case ('cancelled') { <span class="badge badge-red">Cancelada</span> }
          @case ('completed') { <span class="badge badge-blue">Completada</span> }
        }

        @if (apt().status === 'pending') {
          <button class="icon-btn confirm" title="Confirmar" (click)="confirmRequested.emit(apt().id!)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </button>
        }

        @if (apt().status === 'scheduled') {
          <button class="icon-btn complete-btn" title="Marcar completada" (click)="completeRequested.emit(apt().id!)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </button>
        }

        @if (apt().status !== 'cancelled' && apt().status !== 'completed') {
          <button class="icon-btn cancel-btn" title="Cancelar" (click)="cancelRequested.emit(apt())">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        }

        <!-- Las completadas no se eliminan: alimentan ingresos, estadísticas y reseñas -->
        @if (apt().status === 'cancelled') {
          <button class="icon-btn delete-btn" title="Eliminar" (click)="deleteRequested.emit(apt())">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        }
      </div>
    </div>
  `,
})
export class AppointmentCardComponent {
  apt = input.required<Appointment>();

  detailRequested   = output<Appointment>();
  confirmRequested  = output<string>();
  completeRequested = output<string>();
  cancelRequested   = output<Appointment>();
  deleteRequested   = output<Appointment>();
}
