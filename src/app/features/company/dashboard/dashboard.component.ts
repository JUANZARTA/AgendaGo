import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

const TODAY = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const TRIAL_DAYS_LEFT = 5;

const MOCK: any[] = [
  { id: '1', clientName: 'Juan Pérez', serviceName: 'Corte clásico', startTime: '09:00', endTime: '09:30', status: 'scheduled', isGuest: true },
  { id: '2', clientName: 'Carlos López', serviceName: 'Corte + barba', startTime: '10:00', endTime: '10:45', status: 'scheduled', isGuest: false },
  { id: '3', clientName: 'Miguel Torres', serviceName: 'Afeitado navaja', startTime: '11:00', endTime: '11:30', status: 'cancelled', isGuest: true },
  { id: '4', clientName: 'Andrés Ruiz', serviceName: 'Corte clásico', startTime: '14:00', endTime: '14:30', status: 'scheduled', isGuest: false },
  { id: '5', clientName: 'David Gómez', serviceName: 'Corte + barba', startTime: '15:00', endTime: '15:45', status: 'scheduled', isGuest: true },
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">
      <!-- Banner trial -->
      @if (trialDaysLeft <= 7) {
        <div style="background:{{ trialDaysLeft <= 2 ? '#fff0f0' : '#fff8e1' }};border:1.5px solid {{ trialDaysLeft <= 2 ? '#ffb3b3' : '#ffe082' }};border-radius:10px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;gap:12px">
          <span style="font-size:1.4rem">{{ trialDaysLeft <= 2 ? '🚨' : '⏳' }}</span>
          <div style="flex:1">
            <strong>{{ trialDaysLeft <= 0 ? 'Tu período de prueba venció' : 'Tu prueba gratuita vence en ' + trialDaysLeft + ' día' + (trialDaysLeft !== 1 ? 's' : '') }}</strong>
            <div style="font-size:13px;color:#7a5800;margin-top:2px">Suscribite por $29.000/mes para seguir recibiendo citas.</div>
          </div>
          <button class="btn btn-primary btn-sm">Suscribirse ahora</button>
        </div>
      }

      <div class="flex-between" style="margin-bottom:24px">
        <div>
          <h1 style="font-size:1.4rem;text-transform:capitalize">Dashboard</h1>
          <p style="color:#888;font-size:13px">{{ today }}</p>
        </div>
        <button class="btn btn-primary" (click)="showModal.set(true)">+ Nueva cita</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px">
        <div class="card" style="text-align:center">
          <div style="font-size:2rem;font-weight:700;color:#e94560">{{ scheduled() }}</div>
          <div style="color:#888;font-size:13px">Confirmadas</div>
        </div>
        <div class="card" style="text-align:center">
          <div style="font-size:2rem;font-weight:700;color:#888">{{ cancelledCount() }}</div>
          <div style="color:#888;font-size:13px">Canceladas</div>
        </div>
        <div class="card" style="text-align:center">
          <div style="font-size:2rem;font-weight:700;color:#1a8c5a">{{ appointments().length }}</div>
          <div style="color:#888;font-size:13px">Total hoy</div>
        </div>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">
        <a routerLink="/empresa/perfil" class="btn btn-secondary btn-sm">⚙ Perfil</a>
        <a routerLink="/empresa/servicios" class="btn btn-secondary btn-sm">📋 Servicios</a>
        <a routerLink="/empresa/horarios" class="btn btn-secondary btn-sm">🕐 Horarios</a>
      </div>

      <div class="card">
        <h2 style="font-size:1rem;margin-bottom:16px">Agenda del día</h2>
        <div style="display:flex;flex-direction:column;gap:10px">
          @for (appt of appointments(); track appt.id) {
            <div style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:8px;border:1.5px solid #eee"
                 [style.opacity]="appt.status==='cancelled'?'0.5':'1'">
              <div style="min-width:52px;text-align:center;font-weight:700;font-size:14px;color:#e94560">
                {{ appt.startTime }}
              </div>
              <div style="flex:1">
                <div style="font-weight:600;font-size:14px">
                  {{ appt.clientName }}
                  @if (appt.isGuest) { <span style="color:#aaa;font-size:11px;margin-left:4px">invitado</span> }
                </div>
                <div style="color:#888;font-size:12px">{{ appt.serviceName }} · hasta {{ appt.endTime }}</div>
              </div>
              <span class="badge" [class]="appt.status==='scheduled'?'badge-green':'badge-red'">
                {{ appt.status === 'scheduled' ? 'Confirmada' : 'Cancelada' }}
              </span>
              @if (appt.status === 'scheduled') {
                <button class="btn btn-danger btn-sm" (click)="cancel(appt.id)">Cancelar</button>
              }
            </div>
          }
        </div>
      </div>
    </div>

    @if (showModal()) {
      <div style="position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:100" (click)="showModal.set(false)">
        <div class="card" style="width:400px;max-width:95vw" (click)="$event.stopPropagation()">
          <h2 style="margin-bottom:16px">Nueva cita manual</h2>
          <div class="form-group">
            <label>Nombre del cliente</label>
            <input [(ngModel)]="newName" placeholder="Nombre completo" />
          </div>
          <div class="form-group">
            <label>Servicio</label>
            <select [(ngModel)]="newService">
              <option value="Corte clásico">Corte clásico</option>
              <option value="Corte + barba">Corte + barba</option>
              <option value="Afeitado navaja">Afeitado navaja</option>
            </select>
          </div>
          <div class="form-group">
            <label>Hora inicio</label>
            <input type="time" [(ngModel)]="newTime" />
          </div>
          <div style="display:flex;gap:10px;margin-top:8px">
            <button class="btn btn-primary" style="flex:1" (click)="addManual()" [disabled]="!newName">Agregar</button>
            <button class="btn btn-secondary" (click)="showModal.set(false)">Cancelar</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DashboardComponent {
  today = TODAY;
  trialDaysLeft = TRIAL_DAYS_LEFT;
  appointments = signal([...MOCK]);
  showModal = signal(false);
  newName = '';
  newService = 'Corte clásico';
  newTime = '12:00';

  scheduled = computed(() => this.appointments().filter((a) => a.status === 'scheduled').length);
  cancelledCount = computed(() => this.appointments().filter((a) => a.status === 'cancelled').length);

  cancel(id: string) {
    this.appointments.update(list => list.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
  }

  addManual() {
    if (!this.newName.trim()) return;
    this.appointments.update(list => [...list, {
      id: Date.now().toString(),
      clientName: this.newName,
      serviceName: this.newService,
      startTime: this.newTime,
      endTime: '',
      status: 'scheduled',
      isGuest: true,
    }]);
    this.showModal.set(false);
    this.newName = '';
    this.newTime = '12:00';
  }
}
