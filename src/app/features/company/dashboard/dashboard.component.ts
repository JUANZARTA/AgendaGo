import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppointmentService, Appointment } from '../../../core/services/appointment.service';
import { ServiceCatalogService, ServiceItem } from '../../../core/services/service-catalog.service';
import { CompanyStore } from '../../../core/services/company-store.service';
import { StaffService, StaffMember } from '../../../core/services/staff.service';
import { NotificationService } from '../../../core/services/notification.service';
import { toLocalDateKey } from '../../../core/utils/date.utils';
import { ShareLinkModalComponent } from '../../../shared/components/share-link-modal.component';
import { DashboardStatsComponent } from './components/dashboard-stats.component';
import { AppointmentCardComponent } from './components/appointment-card.component';
import { AppointmentDetailModalComponent } from './components/appointment-detail-modal.component';
import { NewAppointmentModalComponent, NewAppointmentForm } from './components/new-appointment-modal.component';
import { DeleteAppointmentModalComponent } from './components/delete-appointment-modal.component';
import { CancelAppointmentModalComponent } from './components/cancel-appointment-modal.component';
import { DaySlot, buildDaySlots, calcEndTime } from './dashboard.utils';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ShareLinkModalComponent,
    DashboardStatsComponent,
    AppointmentCardComponent,
    AppointmentDetailModalComponent,
    NewAppointmentModalComponent,
    DeleteAppointmentModalComponent,
    CancelAppointmentModalComponent,
  ],
  styles: [`
    .dashboard { animation: fadeInUp .35s ease both; }
    @keyframes fadeInUp {
      from { opacity:0; transform:translateY(16px); }
      to   { opacity:1; transform:translateY(0); }
    }

    /* Título centrado en la página; acciones a la derecha (columna izquierda vacía para equilibrar) */
    .page-header {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      margin-bottom: 28px;
      gap: 12px;
    }
    .page-header-title { grid-column: 2; text-align: center; }
    .page-header-actions { grid-column: 3; justify-self: end; }
    @media (max-width: 1100px) {
      .page-header { grid-template-columns: 1fr; }
      .page-header-title, .page-header-actions { grid-column: 1; justify-self: center; }
    }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; margin: 0; }
    .page-subtitle { font-size: 13px; color: #888; margin: 2px 0 0; }

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

    .slot-empty {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 10px 16px;
      border-radius: 10px;
      border: 1.5px dashed #e5e7eb;
      background: #fafafa;
      opacity: .55;
    }
    .slot-empty-time {
      min-width: 56px;
      text-align: center;
      font-size: 0.95rem;
      font-weight: 700;
      color: #c4b5fd;
    }
    .slot-empty-label {
      font-size: 13px;
      color: #c4b5fd;
      font-weight: 500;
    }

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
  `],
  template: `
    <div class="dashboard">

      <!-- Header -->
      <div class="page-header">
        <div class="page-header-title">
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">{{ selectedDateLabel() }}</p>
        </div>
        <div class="page-header-actions" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">

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

          <button class="btn btn-secondary" (click)="shareOpen.set(true)" title="Compartir mi página"
                  [disabled]="!companyStore.companyId()"
                  style="display:inline-flex;align-items:center;gap:8px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Compartir
          </button>

          <button class="btn btn-primary" (click)="openNewModal()"
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
        <app-dashboard-stats
          [total]="total()"
          [scheduled]="scheduled()"
          [pending]="pending()"
          [cancelled]="cancelled()" />

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
          } @else if (daySlots().length === 0) {
            <div style="text-align:center;padding:32px;color:#aaa">No hay horarios configurados para este día.</div>
          } @else {
            <div class="timeline">
              @for (slot of daySlots(); track slot.time) {
                @if (slot.appointments.length === 0) {
                  <!-- Franja vacía -->
                  <div class="slot-empty">
                    <div class="slot-empty-time">{{ slot.time }}</div>
                    <div class="slot-empty-label">Sin asignar</div>
                  </div>
                } @else {
                  @for (apt of slot.appointments; track apt.id) {
                    <app-appointment-card
                      [apt]="apt"
                      (detailRequested)="detailApt.set($event)"
                      (confirmRequested)="confirmApt($event)"
                      (completeRequested)="completeApt($event)"
                      (cancelRequested)="openCancelModal($event)"
                      (deleteRequested)="deleteTarget.set($event)" />
                  } <!-- /@for appointments -->
                } <!-- /slot con citas -->
              }
            </div>
          }
        </div>
      }
    </div>


    <!-- ===== MODAL: Detalle de cita ===== -->
    @if (detailApt(); as apt) {
      <app-appointment-detail-modal [apt]="apt" (closed)="detailApt.set(null)" />
    }


    @if (actionError()) {
      <div style="position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:3000;background:#dc2626;color:white;padding:12px 22px;border-radius:12px;font-size:14px;font-weight:600;box-shadow:0 8px 32px rgba(0,0,0,.25);max-width:calc(100vw - 32px);text-align:center">
        {{ actionError() }}
      </div>
    }

    @if (shareOpen() && companyStore.companyId()) {
      <app-share-link-modal [companyId]="companyStore.companyId()!" (closed)="shareOpen.set(false)" />
    }

    <!-- ===== MODAL: Nueva cita ===== -->
    @if (showNewModal()) {
      <app-new-appointment-modal
        [services]="services()"
        [staff]="staff()"
        [saving]="saving()"
        [formError]="formError()"
        (closed)="closeNewModal()"
        (saved)="saveNewAppointment($event)" />
    }


    <!-- ===== MODAL: Eliminar cita ===== -->
    @if (deleteTarget(); as target) {
      <app-delete-appointment-modal
        [target]="target"
        [saving]="saving()"
        (closed)="deleteTarget.set(null)"
        (confirmed)="doDelete()" />
    }


    <!-- ===== MODAL: Cancelar cita ===== -->
    @if (cancelTarget(); as target) {
      <app-cancel-appointment-modal
        [target]="target"
        [saving]="saving()"
        (closed)="cancelTarget.set(null)"
        (confirmed)="doCancel()" />
    }
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly companyStore  = inject(CompanyStore);
  private aptSvc         = inject(AppointmentService);
  private catalogSvc     = inject(ServiceCatalogService);
  private staffSvc       = inject(StaffService);
  private notifSvc       = inject(NotificationService);
  private route          = inject(ActivatedRoute);

  private readonly _today = toLocalDateKey();
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

  appointments = signal<Appointment[]>([]);
  services     = signal<ServiceItem[]>([]);
  staff        = signal<StaffMember[]>([]);
  loadingApts  = signal(false);
  saving       = signal(false);

  showNewModal = signal(false);
  detailApt    = signal<Appointment | null>(null);
  cancelTarget = signal<Appointment | null>(null);
  deleteTarget = signal<Appointment | null>(null);
  shareOpen    = signal(false);
  actionError  = signal('');
  formError    = signal('');

  total     = computed(() => this.appointments().length);
  scheduled = computed(() => this.appointments().filter(a => a.status === 'scheduled').length);
  pending   = computed(() => this.appointments().filter(a => a.status === 'pending').length);
  cancelled = computed(() => this.appointments().filter(a => a.status === 'cancelled').length);

  daySlots = computed((): DaySlot[] =>
    buildDaySlots(this.companyStore.company(), this.selectedDate(), this.appointments()));

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
      });
    });
  }

  ngOnInit() {
    const date = this.route.snapshot.queryParamMap.get('date');
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      this.selectedDate.set(date);
    }
  }

  ngOnDestroy() {
    this.aptSub?.unsubscribe();
  }

  navigate(days: number) {
    const [y, m, d] = this.selectedDate().split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    this.selectedDate.set(toLocalDateKey(date));
  }

  goToday() {
    this.selectedDate.set(this._today);
  }

  onDateChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    if (val) this.selectedDate.set(val);
  }

  private showActionError(e: any, fallback: string) {
    const messages: Record<string, string> = {
      INVALID_TRANSITION:  'Esta cita ya cambió de estado y no admite esa acción.',
      FUTURE_APPOINTMENT:  'No podés completar una cita de un día futuro.',
      NOT_FOUND:           'La cita ya no existe.',
    };
    this.actionError.set(messages[e?.message] ?? fallback);
    setTimeout(() => this.actionError.set(''), 4000);
  }

  async confirmApt(id: string) {
    try {
      await this.aptSvc.confirmAppointment(id);
    } catch (e) {
      this.showActionError(e, 'No se pudo confirmar la cita. Intentá de nuevo.');
      return;
    }
    const apt = this.appointments().find(a => a.id === id);
    if (apt?.clientId) {
      this.notifSvc.create({
        recipientId: apt.clientId,
        type: 'appointment_confirmed',
        title: 'Cita confirmada',
        body: `${this.companyStore.company()?.name ?? ''} · ${apt.serviceName} · ${apt.date} ${apt.startTime}`,
        link: '/cliente/citas',
      }).catch(() => {});
    }
  }

  async completeApt(id: string) {
    try {
      await this.aptSvc.completeAppointment(id);
    } catch (e) {
      this.showActionError(e, 'No se pudo completar la cita. Intentá de nuevo.');
    }
  }

  openCancelModal(apt: Appointment) {
    this.cancelTarget.set(apt);
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
      if (target.clientId) {
        this.notifSvc.create({
          recipientId: target.clientId,
          type: 'appointment_cancelled',
          title: 'Cita cancelada',
          body: `Tu cita de ${target.serviceName} en ${this.companyStore.company()?.name ?? ''} fue cancelada`,
          link: '/cliente/citas',
        }).catch(() => {});
      }
      this.cancelTarget.set(null);
    } catch (e) {
      this.cancelTarget.set(null);
      this.showActionError(e, 'No se pudo cancelar la cita. Intentá de nuevo.');
    } finally {
      this.saving.set(false);
    }
  }

  async saveNewAppointment(form: NewAppointmentForm) {
    const cid     = this.companyStore.companyId();
    const company = this.companyStore.company();
    if (!cid || !form.client.trim()) return;

    const svc = this.services().find(s => s.id === form.serviceId) ?? this.services()[0];
    if (!svc) return;

    const staffMember = this.staff().find(s => s.id === form.staffId);
    this.saving.set(true);
    this.formError.set('');
    try {
      await this.aptSvc.createManualAppointment({
        companyId:       cid,
        companyName:     company?.name ?? '',
        serviceId:       svc.id!,
        serviceName:     svc.name,
        serviceDuration: svc.duration ?? 30,
        clientName:      form.client.trim(),
        clientPhone:     form.phone.trim(),
        isGuestClient:   true,
        date:            form.date || this.selectedDate(),
        startTime:       form.time,
        endTime:         calcEndTime(form.time, svc.duration ?? 30),
        price:           svc.price,
        clientNote:      form.note.trim() || undefined,
        staffId:         staffMember?.id,
        staffName:       staffMember?.name,
        source:          'manual',
      }, svc.staffCount ?? 1, { slotInterval: company?.slotInterval ?? 30 });
      this.closeNewModal();
    } catch (e: any) {
      this.formError.set(e?.message === 'SLOT_TAKEN'
        ? 'Ese horario ya está ocupado (sin cupo para el profesional/servicio). Elegí otro.'
        : 'No se pudo guardar la cita. Intentá de nuevo.');
    } finally {
      this.saving.set(false);
    }
  }

  async openNewModal() {
    this.showNewModal.set(true);
    const cid = this.companyStore.companyId();
    if (cid) {
      const staffList = await this.staffSvc.getActiveStaff(cid);
      this.staff.set(staffList);
    }
  }

  closeNewModal() {
    this.showNewModal.set(false);
    this.formError.set('');
  }
}
