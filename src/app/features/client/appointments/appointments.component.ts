import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentService, Appointment } from '../../../core/services/appointment.service';
import { CompanyService } from '../../../core/services/company.service';
import { NotificationService } from '../../../core/services/notification.service';

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
    <!-- Hero -->
    <div class="hero" style="margin-bottom:0;padding:32px 20px 28px">
      <div style="position:relative;z-index:1;max-width:640px;margin:0 auto">
        <h1 style="font-size:1.6rem;font-weight:800;margin-bottom:4px;color:white">Mis citas</h1>
        <p style="font-size:0.95rem;opacity:.85;color:white">Historial de citas agendadas</p>
      </div>
    </div>

    <!-- Contenido -->
    <div class="apts-body">
      <div class="apts-inner">

        <!-- Filtros -->
        <div class="filter-bar">
          @for (f of filters; track f.value) {
            <button class="filter-btn" [class.active]="activeFilter() === f.value"
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
          <div style="display:flex;flex-direction:column;gap:14px">
            @for (appt of filtered(); track appt.id) {
              <div class="apt-card">
                <!-- Cabecera -->
                <div class="apt-card-head">
                  <div>
                    <div class="apt-company">{{ appt.companyName }}</div>
                    <div class="apt-service">{{ appt.serviceName }}</div>
                  </div>
                  <span class="badge" [class]="STATUS_CLASS[appt.status]">
                    {{ STATUS_LABEL[appt.status] }}
                  </span>
                </div>

                <!-- Meta -->
                <div class="apt-meta">
                  <span class="apt-meta-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {{ formatDate(appt.date) }}
                  </span>
                  <span class="apt-meta-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {{ appt.startTime }}
                  </span>
                  <span class="apt-meta-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {{ appt.serviceDuration }} min
                  </span>
                  @if (appt.price) {
                    <span class="apt-price">$ {{ appt.price | number }}</span>
                  }
                </div>

                <!-- Acción cancelar -->
                @if (appt.status === 'pending' || appt.status === 'scheduled') {
                  <div style="margin-top:14px">
                    @if (confirmCancelId() === appt.id) {
                      <div style="display:flex;gap:8px;align-items:center">
                        <span style="font-size:13px;color:#555">¿Cancelar esta cita?</span>
                        <button class="btn btn-danger btn-sm" (click)="doCancel(appt.id!)" [disabled]="cancelling()">
                          @if (cancelling()) { ... } @else { Sí, cancelar }
                        </button>
                        <button class="btn btn-secondary btn-sm" (click)="confirmCancelId.set(null)">No</button>
                      </div>
                    } @else {
                      <button class="cancel-link" (click)="confirmCancelId.set(appt.id!)">
                        Cancelar cita
                      </button>
                    }
                  </div>
                }
              </div>
            }

            @if (filtered().length === 0) {
              <div class="empty-state">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p style="color:#888;margin-top:12px;margin-bottom:16px">No tenés citas en esta categoría.</p>
                <a routerLink="/" class="btn btn-primary btn-sm">Buscar negocios</a>
              </div>
            }
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* ── Body section ─────────────────────────────────── */
    .apts-body {
      background: #f0f7ff;
      min-height: calc(100vh - 64px - 88px);
      padding: 24px 20px 40px;
    }

    .apts-inner {
      max-width: 640px;
      margin: 0 auto;
    }

    /* ── Filters ──────────────────────────────────────── */
    .filter-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 8px 16px;
      border-radius: 20px;
      border: 1.5px solid #e0d9ff;
      font-size: 13px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      background: white;
      color: #555;
      transition: all .15s;
    }

    .filter-btn:hover { border-color: var(--purple); color: var(--purple); }

    .filter-btn.active {
      background: var(--gradient);
      border-color: transparent;
      color: white;
      box-shadow: 0 4px 14px rgba(124,58,237,.3);
    }

    /* ── Appointment card ─────────────────────────────── */
    .apt-card {
      background: white;
      border-radius: 16px;
      padding: 18px 20px;
      box-shadow: 0 2px 12px rgba(0,0,0,.06);
    }

    .apt-card-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 12px;
      border-bottom: 1px solid #f3f0ff;
      margin-bottom: 12px;
    }

    .apt-company { font-weight: 700; font-size: 15px; }
    .apt-service { color: #888; font-size: 13px; margin-top: 2px; }

    .apt-meta {
      display: flex;
      gap: 14px;
      font-size: 13px;
      color: #555;
      flex-wrap: wrap;
      align-items: center;
    }

    .apt-meta-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .apt-price {
      margin-left: auto;
      font-weight: 700;
      font-size: 14px;
      color: var(--purple);
    }

    /* Cancel link */
    .cancel-link {
      background: none;
      border: none;
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      color: var(--purple);
      padding: 0;
    }
    .cancel-link:hover { text-decoration: underline; }

    /* Empty */
    .empty-state {
      text-align: center;
      padding: 48px 20px;
      background: white;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* Spinner */
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
  private companySvc = inject(CompanyService);
  private notifSvc = inject(NotificationService);

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
    const apt = this.appointments().find(a => a.id === id);
    try {
      await this.aptSvc.cancelAppointment(id, 'client');
      this.confirmCancelId.set(null);
      // Notify company owner
      if (apt?.companyId) {
        this.companySvc.getCompany(apt.companyId).then(company => {
          if (company?.ownerId) {
            this.notifSvc.create({
              recipientId: company.ownerId,
              type: 'appointment_cancelled',
              title: 'Cita cancelada',
              body: `${apt.clientName} canceló su cita de ${apt.serviceName}`,
              link: '/empresa/dashboard',
            }).catch(() => {});
          }
        }).catch(() => {});
      }
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
