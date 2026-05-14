import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Appointment {
  id: string;
  companyName: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: 'scheduled' | 'completed' | 'cancelled';
}

const MOCK: Appointment[] = [
  { id: '1', companyName: 'Barbería El Padrino', serviceName: 'Corte + barba', date: '2026-05-15', time: '10:00', duration: 45, price: 35000, status: 'scheduled' },
  { id: '2', companyName: 'Salón Valentina', serviceName: 'Tinte completo', date: '2026-05-08', time: '14:00', duration: 90, price: 80000, status: 'completed' },
  { id: '3', companyName: 'Spa Serenidad', serviceName: 'Masaje relajante', date: '2026-04-22', time: '11:00', duration: 60, price: 70000, status: 'cancelled' },
  { id: '4', companyName: 'Barbería El Padrino', serviceName: 'Corte clásico', date: '2026-04-10', time: '09:30', duration: 30, price: 20000, status: 'completed' },
];

const STATUS_LABEL: Record<string, string> = { scheduled: 'Próxima', completed: 'Completada', cancelled: 'Cancelada' };
const STATUS_CLASS: Record<string, string> = { scheduled: 'badge-green', completed: 'badge-blue', cancelled: 'badge-red' };

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page" style="max-width:640px;margin:0 auto">
      <h1 style="font-size:1.4rem;margin-bottom:8px">Mis citas</h1>
      <p style="color:#888;font-size:13px;margin-bottom:24px">Historial de citas agendadas</p>

      <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">
        @for (f of filters; track f.value) {
          <button class="btn btn-sm" [class]="activeFilter()===f.value?'btn-primary':'btn-secondary'" (click)="activeFilter.set(f.value)">
            {{ f.label }} ({{ count(f.value) }})
          </button>
        }
      </div>

      <div style="display:flex;flex-direction:column;gap:12px">
        @for (appt of filtered(); track appt.id) {
          <div class="card">
            <div class="flex-between" style="margin-bottom:8px">
              <div>
                <div style="font-weight:600;font-size:15px">{{ appt.companyName }}</div>
                <div style="color:#888;font-size:13px;margin-top:2px">{{ appt.serviceName }}</div>
              </div>
              <span class="badge" [class]="STATUS_CLASS[appt.status]">{{ STATUS_LABEL[appt.status] }}</span>
            </div>

            <div style="display:flex;gap:20px;font-size:13px;color:#555;border-top:1px solid #f0f0f0;padding-top:10px;margin-top:8px">
              <span style="display:inline-flex;align-items:center;gap:4px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {{ appt.date | date:'d MMM yyyy':'':'es-CO' }}</span>
              <span style="display:inline-flex;align-items:center;gap:4px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> {{ appt.time }}</span>
              <span style="display:inline-flex;align-items:center;gap:4px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> {{ appt.duration }} min</span>
              <span style="margin-left:auto;font-weight:600;color:#e94560">$ {{ appt.price | number }}</span>
            </div>

            @if (appt.status === 'scheduled') {
              <div style="margin-top:12px">
                <button class="btn btn-danger btn-sm" (click)="cancel(appt.id)">Cancelar cita</button>
              </div>
            }
          </div>
        }

        @if (filtered().length === 0) {
          <div style="text-align:center;padding:48px;color:#aaa">
            <div style="display:flex;justify-content:center;margin-bottom:12px"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
            <p>No tenés citas en esta categoría.</p>
            <a routerLink="/" class="btn btn-primary" style="margin-top:16px;display:inline-block">Buscar negocios</a>
          </div>
        }
      </div>
    </div>
  `,
})
export class AppointmentsComponent {
  STATUS_CLASS = STATUS_CLASS;
  STATUS_LABEL = STATUS_LABEL;
  appointments = signal<Appointment[]>([...MOCK]);
  activeFilter = signal<string>('all');

  filters = [
    { value: 'all', label: 'Todas' },
    { value: 'scheduled', label: 'Próximas' },
    { value: 'completed', label: 'Completadas' },
    { value: 'cancelled', label: 'Canceladas' },
  ];

  filtered = computed(() => {
    const f = this.activeFilter();
    return f === 'all' ? this.appointments() : this.appointments().filter(a => a.status === f);
  });

  count(filter: string) {
    return filter === 'all' ? this.appointments().length : this.appointments().filter(a => a.status === filter).length;
  }

  cancel(id: string) {
    this.appointments.update(list => list.map(a => a.id === id ? { ...a, status: 'cancelled' as const } : a));
  }
}
