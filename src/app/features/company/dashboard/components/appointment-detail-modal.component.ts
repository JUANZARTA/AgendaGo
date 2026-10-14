import { Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Appointment } from '../../../../core/services/appointment.service';
import { BADGE_STYLES, MODAL_STYLES } from '../dashboard.styles';

/** Modal de solo lectura con el detalle de una cita. */
@Component({
  selector: 'app-appointment-detail-modal',
  standalone: true,
  imports: [DecimalPipe],
  styles: [MODAL_STYLES + BADGE_STYLES],
  template: `
    <div class="modal-overlay" (click)="closed.emit()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title" style="display:flex;align-items:center;gap:8px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            Detalle de cita
          </h2>
          <button class="modal-close" (click)="closed.emit()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Estado -->
        <div style="margin-bottom:16px">
          @switch (apt().status) {
            @case ('scheduled') { <span class="badge badge-green">Confirmada</span> }
            @case ('pending')   { <span class="badge badge-yellow">Pendiente</span> }
            @case ('cancelled') { <span class="badge badge-red">Cancelada</span> }
            @case ('completed') { <span class="badge badge-blue">Completada</span> }
          }
        </div>

        <!-- Sección: Servicio -->
        <p style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#aaa;margin:0 0 8px">Servicio</p>
        <div style="background:#f9f5ff;border-radius:12px;padding:14px 16px;margin-bottom:16px">
          <div style="font-weight:700;font-size:15px">{{ apt().serviceName }}</div>
          <div style="display:flex;gap:14px;margin-top:6px;font-size:13px;color:#666;flex-wrap:wrap">
            <span style="display:inline-flex;align-items:center;gap:4px">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {{ apt().date }}
            </span>
            <span style="display:inline-flex;align-items:center;gap:4px">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {{ apt().startTime }} – {{ apt().endTime }}
            </span>
            <span style="display:inline-flex;align-items:center;gap:4px">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {{ apt().serviceDuration }} min
            </span>
            @if (apt().price) {
              <span style="font-weight:700;color:var(--purple)">\${{ apt().price | number }}</span>
            }
          </div>
        </div>

        <!-- Sección: Cliente -->
        <p style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#aaa;margin:0 0 8px">Cliente</p>
        <div style="background:#f9f5ff;border-radius:12px;padding:14px 16px;margin-bottom:16px;display:flex;flex-direction:column;gap:8px">
          @if (apt().clientPhotoUrl) {
            <img [src]="apt().clientPhotoUrl" alt="Foto del cliente"
                 style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.08)" />
          }
          <div style="display:flex;align-items:center;gap:8px;font-size:14px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span style="font-weight:600">{{ apt().clientName }}</span>
            @if (!apt().clientId) { <span style="font-size:11px;color:#aaa;background:#f3f4f6;padding:2px 7px;border-radius:20px">Invitado</span> }
          </div>
          @if (apt().clientPhone) {
            <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#555">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <a [href]="'tel:' + apt().clientPhone" style="color:var(--purple);text-decoration:none;font-weight:600">{{ apt().clientPhone }}</a>
            </div>
          }
          @if (apt().clientEmail) {
            <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#555">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              {{ apt().clientEmail }}
            </div>
          }
        </div>

        <!-- Observaciones -->
        @if (apt().clientNote) {
          <p style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#aaa;margin:0 0 8px">Observaciones</p>
          <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;padding:14px 16px;margin-bottom:16px;font-size:13px;color:#78350f;line-height:1.6">
            {{ apt().clientNote }}
          </div>
        }

        <!-- Cancelación: quién y por qué -->
        @if (apt().status === 'cancelled') {
          <p style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#aaa;margin:0 0 8px">Cancelación</p>
          <div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;padding:14px 16px;margin-bottom:16px;font-size:13px;color:#991b1b;line-height:1.6;white-space:pre-line">
            <strong>{{ apt().cancelledBy === 'client' ? 'La canceló el cliente' : 'La cancelaste vos' }}</strong>
            @if (apt().cancelReason) {<br>Motivo: {{ apt().cancelReason }}}
          </div>
        }

        <div class="modal-footer">
          <button class="btn btn-secondary" style="flex:1" (click)="closed.emit()">Cerrar</button>
        </div>
      </div>
    </div>
  `,
})
export class AppointmentDetailModalComponent {
  apt    = input.required<Appointment>();
  closed = output<void>();
}
