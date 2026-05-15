import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentService, Appointment } from '../../../core/services/appointment.service';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Próxima',
  scheduled: 'Próxima',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const STATUS_CLASS: Record<string, string> = {
  pending: 'badge-green',
  scheduled: 'badge-green',
  completed: 'badge-blue',
  cancelled: 'badge-red',
};

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page" style="max-width:640px;margin:0 auto">
      <h1 style="font-size:1.4rem;font-weight:700;margin-bottom:4px">Mis citas</h1>
      <p style="color:#888;font-size:13px;margin-bottom:20px">Historial de citas agendadas</p>

      <!-- Filtros -->
      <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">
        @for (f of filters; track f.value) {
          <button class="btn btn-sm"
                  [class]="activeFilter() === f.value ? 'btn-primary' : 'btn-secondary'"
                  (click)="activeFilter.set(f.value)">
            {{ f.label }} ({{ count(f.value) }})
          </button>
        }
      </div>

      <!-- Cargando -->
      @if (loading()) {
        <div style="text-align:center;padding:48px;color:#aaa">
          <div class="spinner" style="margin:0 auto 12px"></div>
          <p>Cargando citas...</p>
        </div>

      } @else if (error()) {
        <div style="text-align:center;padding:48px;color:#ef4444">
          <p>{{ error() }}</p>
          <button class="btn btn-secondary" style="margin-top:12px" (click)="reload()">Reintentar</button>
        </div>

      } @else {
        <!-- Lista -->
        <div style="display:flex;flex-direction:column;gap:12px">
          @for (appt of filtered(); track appt.id) {
            <div class="card">
              <div class="flex-between" style="margin-bottom:8px">
                <div>
                  <div style="font-weight:600;font-size:15px">{{ appt.companyName }}</div>
                  <div style="color:#888;font-size:13px;margin-top:2px">{{ appt.serviceName }}</div>
                </div>
                <span class="badge" [class]="STATUS_CLASS[appt.status]">
                  {{ STATUS_LABEL[appt.status] }}
                </span>
              </div>

              <div style="display:flex;gap:16px;font-size:13px;color:#555;border-top:1px solid #f0f0f0;padding-top:10px;margin-top:8px;flex-wrap:wrap">
                <span style="display:inline-flex;align-items:center;gap:4px">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {{ formatDate(appt.date) }}
                </span>
                <span style="display:inline-flex;align-items:center;gap:4px">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{ appt.startTime }}
                </span>
                <span style="display:inline-flex;align-items:center;gap:4px">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{ appt.serviceDuration }} min
                </span>
                @if (appt.price) {
                  <span style="margin-left:auto;font-weight:600;color:var(--purple)">
                    $ {{ appt.price | number }}
                  </span>
                }
              </div>

              <!-- Acción cancelar -->
              @if (appt.status === 'pending' || appt.status === 'scheduled') {
                <div style="margin-top:12px">
                  @if (confirmCancelId() === appt.id) {
                    <div style="display:flex;gap:8px;align-items:center">
                      <span style="font-size:13px;color:#555">¿Cancelar esta cita?</span>
                      <button class="btn btn-danger btn-sm" (click)="doCancel(appt.id!)" [disabled]="cancelling()">
                        @if (cancelling()) { ... } @else { Sí, cancelar }
                      </button>
                      <button class="btn btn-secondary btn-sm" (click)="confirmCancelId.set(null)">No</button>
                    </div>
                  } @else {
                    <button class="btn btn-secondary btn-sm" (click)="confirmCancelId.set(appt.id!)">
                      Cancelar cita
                    </button>
                  }
                </div>
              }
            </div>
          }

          @if (filtered().length === 0) {
            <div style="text-align:center;padding:48px;color:#aaa">
              <div style="display:flex;justify-content:center;margin-bottom:12px">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <p>No tenés citas en esta categoría.</p>
              <a routerLink="/" class="btn btn-primary" style="margin-top:16px;display:inline-block">
                Buscar negocios
              </a>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner {
      width: 32px; height: 32px;
      border: 3px solid #ede9fe;
      border-top-color: var(--purple);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
  `],
})
export class AppointmentsComponent implements OnDestroy {
  private auth = inject(AuthService);
  private aptSvc = inject(AppointmentService);

  STATUS_CLASS = STATUS_CLASS;
  STATUS_LABEL = STATUS_LABEL;

  appointments = signal<Appointment[]>([]);
  activeFilter = signal<string>('all');
  loading = signal(true);
  error = signal('');
  confirmCancelId = signal<string | null>(null);
  cancelling = signal(false);

  private sub: Subscription | null = null;

  filters = [
    { value: 'all',       label: 'Todas'       },
    { value: 'upcoming',  label: 'Próximas'    },
    { value: 'completed', label: 'Completadas' },
    { value: 'cancelled', label: 'Canceladas'  },
  ];

  filtered = computed(() => {
    const f = this.activeFilter();
    const all = this.appointments();
    if (f === 'all')       return all;
    if (f === 'upcoming')  return all.filter(a => a.status === 'pending' || a.status === 'scheduled');
    return all.filter(a => a.status === f);
  });

  count(filter: string): number {
    const all = this.appointments();
    if (filter === 'all')      return all.length;
    if (filter === 'upcoming') return all.filter(a => a.status === 'pending' || a.status === 'scheduled').length;
    return all.filter(a => a.status === filter).length;
  }

  constructor() {
    this.load();
  }

  load() {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) { this.loading.set(false); return; }

    this.loading.set(true);
    this.error.set('');
    this.sub?.unsubscribe();

    this.sub = this.aptSvc.watchByClient(uid).subscribe({
      next: (apts) => {
        this.appointments.set(apts);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las citas. Verificá tu conexión.');
        this.loading.set(false);
      },
    });
  }

  reload() { this.load(); }

  async doCancel(id: string) {
    this.cancelling.set(true);
    try {
      await this.aptSvc.cancelAppointment(id, 'client');
      this.confirmCancelId.set(null);
    } catch {
      this.error.set('No se pudo cancelar. Intentá de nuevo.');
    } finally {
      this.cancelling.set(false);
    }
  }

  formatDate(date: string): string {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }
}
