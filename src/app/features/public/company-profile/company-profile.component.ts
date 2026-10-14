import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { categoryMeta } from '../../../core/domain/categories';
import { PublicNavComponent } from '../../../shared/components/public-nav.component';
import { Company, CompanyService } from '../../../core/services/company.service';
import { ServiceCatalogService, ServiceItem } from '../../../core/services/service-catalog.service';
import { DAY_KEYS, toMin } from '../../../core/domain/scheduling';
import { availableSlots, isStaffFree, serviceCapacity } from '../../../core/domain/availability';
import { toLocalDateKey } from '../../../core/utils/date.utils';
import { AppointmentService, SlotLockEntry } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import { StaffService, StaffMember } from '../../../core/services/staff.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DayOption, buildDays } from './company-profile.utils';
import { ClientBlockedModalComponent } from './components/client-blocked-modal.component';
import { CompanyInactiveComponent } from './components/company-inactive.component';
import { CompanyHeaderComponent } from './components/company-header.component';
import { ServiceStepComponent } from './components/service-step.component';
import { DateTimeStepComponent } from './components/datetime-step.component';
import { StaffStepComponent } from './components/staff-step.component';
import { ClientStepComponent } from './components/client-step.component';
import { ConfirmationStepComponent } from './components/confirmation-step.component';
import { ChatWidgetComponent } from './components/chat-widget.component';

@Component({
  selector: 'app-company-profile',
  standalone: true,
  imports: [
    RouterLink, PublicNavComponent,
    ClientBlockedModalComponent, CompanyInactiveComponent, CompanyHeaderComponent,
    ServiceStepComponent, DateTimeStepComponent, StaffStepComponent,
    ClientStepComponent, ConfirmationStepComponent, ChatWidgetComponent,
  ],
  styles: [`
    :host { display: block; }
  `],
  template: `
    <app-public-nav />

    <!-- Modal: cliente suspendido -->
    @if (isClientBlocked()) {
      <app-cp-client-blocked (logout)="doLogout()" />
    }

    <!-- Toast: slot no disponible -->
    @if (showUnavailable()) {
      <div style="position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:999;
                  background:#1a1a2e;color:white;padding:12px 22px;border-radius:12px;
                  font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px;
                  box-shadow:0 8px 32px rgba(0,0,0,.25);animation:toast-in .25s ease;
                  max-width:calc(100vw - 32px);white-space:normal;text-align:center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Ese horario no está disponible. Elegí otro.
      </div>
    }

    <!-- Toast: error al reservar -->
    @if (bookingError()) {
      <div style="position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:999;
                  background:#dc2626;color:white;padding:12px 22px;border-radius:12px;
                  font-size:14px;font-weight:600;box-shadow:0 8px 32px rgba(0,0,0,.25);
                  max-width:calc(100vw - 32px);text-align:center">
        {{ bookingError() }}
      </div>
    }

    <div class="page" style="max-width:680px;margin:0 auto">

      <a routerLink="/" style="color:var(--purple);font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;margin-bottom:16px;text-decoration:none">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Volver
      </a>

      @if (loading()) {
        <div class="card" style="text-align:center;padding:48px;color:#aaa">Cargando negocio...</div>
      } @else if (!company()) {
        <div class="card" style="text-align:center;padding:48px;color:#aaa">Negocio no encontrado.</div>
      } @else if (company()!.isActive === false) {
        <app-cp-company-inactive />
      } @else {

        <!-- Header empresa -->
        <app-cp-company-header
          [company]="company()!"
          [companyColor]="companyColor()"
          [companyCategory]="companyCategory()"
          [currentStep]="currentStep()" />

        <!-- ══ PASO 1: Servicio ══ -->
        @if (currentStep() === 1) {
          <app-cp-service-step
            [services]="services()"
            [selectedService]="selectedService()"
            (serviceSelect)="selectService($event)"
            (next)="currentStep.set(2)" />
        }

        <!-- ══ PASO 2: Fecha y hora ══ -->
        @if (currentStep() === 2) {
          <app-cp-datetime-step
            [selectedService]="selectedService()"
            [days]="days"
            [selectedDay]="selectedDay()"
            [selectedSlot]="selectedSlot()"
            [loadingSlots]="loadingSlots()"
            [allSlots]="allSlots()"
            (back)="goBack()"
            (daySelect)="selectDay($event)"
            (slotSelect)="selectSlot($event)"
            (next)="goToStaffStep()" />
        }

        <!-- ══ PASO 3: Profesional ══ -->
        @if (currentStep() === 3) {
          <app-cp-staff-step
            [selectedService]="selectedService()"
            [selectedDay]="selectedDay()"
            [selectedSlot]="selectedSlot()"
            [selectedStaff]="selectedStaff()"
            [availableStaff]="availableStaff()"
            (back)="goBack()"
            (staffSelect)="selectStaff($event)"
            (next)="currentStep.set(4)" />
        }

        <!-- ══ PASO 4: Datos + Pago ══ -->
        @if (currentStep() === 4) {
          <app-cp-client-step
            [selectedService]="selectedService()"
            [selectedDay]="selectedDay()"
            [selectedSlot]="selectedSlot()"
            [booking]="booking()"
            [isLoggedIn]="authSvc.isLoggedIn()"
            [displayName]="authSvc.displayName()"
            [(clientName)]="clientName"
            [(clientPhone)]="clientPhone"
            [(clientNote)]="clientNote"
            [(selectedPayment)]="selectedPayment"
            (back)="goBack()"
            (confirmBooking)="confirm()" />
        }

        <!-- ══ PASO 5: Confirmado ══ -->
        @if (currentStep() === 5) {
          <app-cp-confirmation-step
            [selectedService]="selectedService()"
            [selectedDay]="selectedDay()"
            [selectedSlot]="selectedSlot()"
            [companyName]="company()!.name"
            [companyPhone]="company()!.phone"
            [whatsappPreview]="whatsappPreview()"
            [whatsappUrl]="whatsappUrl()"
            (restart)="reset()" />
        }

      }
    </div>

    <app-cp-chat-widget [company]="company()" />

    <style>
      @keyframes toast-in {
        from { opacity:0; transform: translateX(-50%) translateY(-10px); }
        to   { opacity:1; transform: translateX(-50%) translateY(0); }
      }
    </style>
  `,
})
export class CompanyProfileComponent implements OnInit {
  private route      = inject(ActivatedRoute);
  private companySvc = inject(CompanyService);
  private catalogSvc = inject(ServiceCatalogService);
  private aptSvc     = inject(AppointmentService);
  readonly authSvc   = inject(AuthService);
  private staffSvc   = inject(StaffService);
  private notifSvc   = inject(NotificationService);

  isClientBlocked = computed(() =>
    this.authSvc.role() === 'client' && this.authSvc.profile()?.isActive === false
  );

  company  = signal<Company | null>(null);
  services = signal<ServiceItem[]>([]);
  loading  = signal(true);

  readonly days = buildDays(8);

  currentStep      = signal(1);
  selectedService  = signal<ServiceItem | null>(null);
  selectedDay      = signal<DayOption | null>(null);
  selectedSlot     = signal<string | null>(null);
  selectedPayment  = signal<string | null>(null);
  showUnavailable  = signal(false);
  loadingSlots     = signal(false);
  booking          = signal(false);
  bookingError     = signal('');
  existingApts     = signal<SlotLockEntry[]>([]);
  staffList        = signal<StaffMember[]>([]);
  selectedStaff    = signal<StaffMember | null>(null);
  loadingStaff     = signal(false);

  companyColor = computed(() => this.company()?.logoColor ?? '#7c3aed');
  companyCategory = computed(() => {
    const cat = this.company()?.category;
    return cat ? categoryMeta(cat).label : '';
  });

  /**
   * Capacidad del servicio: si tiene profesionales asignados, son ellos (cada uno atiende una cita a la vez);
   * si no, el `staffCount` configurado en el servicio. El detalle por horario (quién trabaja a esa hora)
   * lo resuelve después el filtro de `isStaffFree`.
   */
  capacity = computed(() => serviceCapacity(this.staffList().length, this.selectedService()?.staffCount));

  /** Horarios disponibles: la lógica vive en core/domain/availability.ts (testeada). */
  allSlots = computed(() => {
    const day     = this.selectedDay();
    const company = this.company();
    const svc     = this.selectedService();
    if (!day || !company || !svc) return [];

    // Para hoy (hora LOCAL) se descartan los horarios ya pasados
    const now = new Date();
    return availableSlots({
      company,
      dayKey:            DAY_KEYS[day.dayOfWeek],
      dateKey:           day.date,
      duration:          svc.duration,
      staff:             this.staffList(),
      selectedStaff:     this.selectedStaff(),
      apts:              this.existingApts(),
      serviceStaffCount: svc.staffCount,
      nowMin:            day.date === toLocalDateKey() ? now.getHours() * 60 + now.getMinutes() : null,
    });
  });

  /**
   * Profesionales que pueden atender en el día y hora elegidos:
   * trabajan ese día (horario propio, o el de la empresa si no tienen),
   * el servicio entra completo en su horario y no tienen otra cita que se solape.
   */
  availableStaff = computed(() => {
    const day  = this.selectedDay();
    const slot = this.selectedSlot();
    const svc  = this.selectedService();
    if (!day || !slot || !svc) return this.staffList();

    const key   = DAY_KEYS[day.dayOfWeek];
    const start = toMin(slot);
    const end   = start + (svc.duration ?? this.company()?.slotInterval ?? 30);
    const apts  = this.existingApts();
    return this.staffList().filter(s => isStaffFree(s, key, start, end, apts));
  });


  clientName  = signal('');
  clientPhone = signal('');
  clientNote  = signal('');


  constructor() {
    effect(() => {
      const p = this.authSvc.profile();
      if (!p) return;
      if (!this.clientName())  this.clientName.set(p.displayName ?? '');
      if (!this.clientPhone()) this.clientPhone.set(p.phone ?? '');
    });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading.set(false); return; }
    try {
      const [comp, svcs] = await Promise.all([
        this.companySvc.getCompany(id),
        this.catalogSvc.getActiveServices(id),
      ]);
      this.company.set(comp);
      this.services.set(svcs);
    } finally {
      this.loading.set(false);
    }

  }

  alertUnavailable() {
    this.showUnavailable.set(true);
    setTimeout(() => this.showUnavailable.set(false), 3000);
  }

  private serviceSeq = 0;
  private daySeq     = 0;

  selectService(s: ServiceItem) {
    const seq = ++this.serviceSeq;
    this.selectedService.set(s);
    // Cambió el servicio (duración/capacidad): el slot elegido ya no es válido
    this.selectedSlot.set(null);
    this.staffList.set([]);
    this.selectedStaff.set(null);
    const cid = this.company()?.id;
    if (cid) {
      this.staffSvc.getStaffForService(cid, s.id!)
        .then(staff => { if (seq === this.serviceSeq) this.staffList.set(staff); })
        .catch(() => {});
    }
  }

  /** Cambia el profesional y revalida el slot elegido contra los slots recalculados. */
  selectStaff(staff: StaffMember | null) {
    this.selectedStaff.set(staff);
    const slot = this.selectedSlot();
    if (slot && !this.allSlots().includes(slot)) {
      this.selectedSlot.set(null);
      this.currentStep.set(2);
      this.alertUnavailable();
    }
  }

  async selectDay(day: DayOption) {
    const seq = ++this.daySeq;
    this.selectedDay.set(day);
    this.selectedSlot.set(null);
    const cid = this.company()?.id;
    if (!cid) return;
    this.loadingSlots.set(true);
    try {
      const apts = await this.aptSvc.getDayOccupancy(cid, day.date);
      // Respuesta obsoleta (el usuario ya eligió otro día): se descarta
      if (seq === this.daySeq) this.existingApts.set(apts);
    } catch (e) {
      // Sin ocupación visible: la transacción de reserva igual valida el cupo contra el lock
      console.error('[CompanyProfile] No se pudo leer la ocupación del día:', e);
      if (seq === this.daySeq) this.existingApts.set([]);
    } finally {
      if (seq === this.daySeq) this.loadingSlots.set(false);
    }
  }

  selectSlot(slot: string) { this.selectedSlot.set(slot); }

  /** Paso 2 → 3. Si nadie puede atender en ese horario, se salta directo a Datos con "cualquier profesional". */
  goToStaffStep() {
    const current = this.selectedStaff();
    // El profesional elegido antes ya no está disponible en el nuevo día/hora
    if (current && !this.availableStaff().some(s => s.id === current.id)) this.selectedStaff.set(null);
    this.currentStep.set(this.availableStaff().length > 0 ? 3 : 4);
  }

  goBack() {
    const s = this.currentStep();
    if (s === 4 && this.availableStaff().length === 0) {
      this.currentStep.set(2);
    } else {
      this.currentStep.update(n => n - 1);
    }
  }

  whatsappPreview = computed(() => {
    if (!this.selectedService() || !this.selectedDay() || !this.selectedSlot()) return '';
    const svc = this.selectedService()!;
    const day = this.selectedDay()!;
    return `Hola, soy *${this.clientName() || 'Cliente'}*

Quiero agendar mi cita en *${this.company()?.name ?? ''}*

Servicio:  *${svc.name}* (${svc.duration} min)
Fecha:     *${day.label} ${day.sub}*
Hora:      *${this.selectedSlot()}*
${this.selectedStaff() ? `Profesional: *${this.selectedStaff()!.name}*\n` : ''}Total:     *$${(svc.price ?? 0).toLocaleString('es-CO')}*
Pago:      *${this.selectedPayment() ?? ''}*
${this.clientNote() ? `\nNota: ${this.clientNote()}` : ''}
¡Gracias!`;
  });

  whatsappUrl = computed(() => {
    const msg = encodeURIComponent(this.whatsappPreview());
    return `https://wa.me/${this.company()?.phone ?? ''}?text=${msg}`;
  });

  async confirm() {
    const cid  = this.company()?.id;
    const svc  = this.selectedService();
    const day  = this.selectedDay();
    const slot = this.selectedSlot();
    if (!cid || !svc || !day || !slot) return;

    // Revalidar el slot contra la disponibilidad actual (servicio/profesional/bloqueos)
    if (!this.allSlots().includes(slot)) {
      this.selectedSlot.set(null);
      this.currentStep.set(2);
      this.alertUnavailable();
      return;
    }

    this.booking.set(true);
    this.bookingError.set('');
    try {
      const dur = svc.duration ?? 30;
      const [h, m] = slot.split(':').map(Number);
      const endTotal = h * 60 + m + dur;
      const endTime  = `${String(Math.floor(endTotal/60)).padStart(2,'0')}:${String(endTotal%60).padStart(2,'0')}`;

      const uid         = this.authSvc.currentUser()?.uid;
      const staffMember = this.selectedStaff();
      await this.aptSvc.bookAppointment({
        companyId:       cid,
        companyName:     this.company()!.name,
        serviceId:       svc.id!,
        serviceName:     svc.name,
        serviceDuration: dur,
        clientName:      this.clientName(),
        clientPhone:     this.clientPhone(),
        clientEmail:     this.authSvc.profile()?.email,
        clientPhotoUrl:  uid ? (this.authSvc.profile()?.photoUrl || undefined) : undefined,
        clientId:        uid,
        isGuestClient:   !uid,
        clientNote:      this.clientNote().trim() || undefined,
        date:            day.date,
        startTime:       slot,
        endTime,
        price:           svc.price,
        staffId:         staffMember?.id,
        staffName:       staffMember?.name,
        source:          'app',
      }, this.capacity(), this.company()?.autoConfirm ?? false, {
        slotInterval:  this.company()?.slotInterval ?? 30,
        blockedDates:  this.company()?.blockedDates,
        disabledSlots: this.company()?.disabledSlots,
      });

      this.currentStep.set(5);

      // Notify company owner about new appointment
      const owner = this.company()?.ownerId;
      const svc2 = this.selectedService();
      const day2 = this.selectedDay();
      const slot2 = this.selectedSlot();
      if (owner && svc2 && day2 && slot2) {
        this.notifSvc.create({
          recipientId: owner,
          type: 'new_appointment',
          title: 'Nueva cita',
          body: `${this.clientName()} · ${svc2.name} · ${day2.label} ${day2.sub} ${slot2}`,
          link: `/empresa/dashboard?date=${day2.date}`,
        }).catch(() => {});
      }

      if (this.company()?.phone) {
        setTimeout(() => window.open(this.whatsappUrl(), '_blank'), 400);
      }
    } catch (e: any) {
      if (e.message === 'SLOT_TAKEN' || e.message === 'DATE_BLOCKED' || e.message === 'SLOT_DISABLED') {
        this.bookingError.set(e.message === 'SLOT_TAKEN'
          ? 'Ese turno ya fue tomado. Por favor elegí otro horario.'
          : 'Ese horario ya no está disponible. Por favor elegí otro.');
        const day = this.selectedDay();
        if (day) {
          this.aptSvc.getDayOccupancy(cid, day.date).then(apts => this.existingApts.set(apts)).catch(() => {});
        }
        this.selectedSlot.set(null);
        this.currentStep.set(2);
      } else {
        this.bookingError.set('Ocurrió un error. Intentá de nuevo.');
      }
      setTimeout(() => this.bookingError.set(''), 4000);
    } finally {
      this.booking.set(false);
    }
  }


  doLogout() {
    this.authSvc.logout().subscribe({ complete: () => window.location.assign('/') });
  }

  reset() {
    this.selectedService.set(null);
    this.selectedDay.set(null);
    this.selectedSlot.set(null);
    this.selectedPayment.set(null);
    this.existingApts.set([]);
    this.staffList.set([]);
    this.selectedStaff.set(null);
    this.currentStep.set(1);
    this.clientNote.set('');
    const p = this.authSvc.profile();
    this.clientName.set(p?.displayName ?? '');
    this.clientPhone.set(p?.phone ?? '');
  }
}
