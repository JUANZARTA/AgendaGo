import { Component, computed, effect, inject, signal } from '@angular/core';
import { CompanyStore } from '../../../core/services/company-store.service';
import { CompanyService } from '../../../core/services/company.service';
import { AuthService } from '../../../core/services/auth.service';
import { StaffService } from '../../../core/services/staff.service';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { ServiceCatalogService, ServiceItem } from '../../../core/services/service-catalog.service';
import { CategoryGroupKey, categoryMeta } from '../../../core/domain/categories';
import { DEFAULT_SCHEDULE, OnboardingForm, PendingStaff, SocialState, StepNavigation } from './onboarding.constants';
import { OnboardingProgressComponent } from './steps/onboarding-progress.component';
import { OnboardingCategoryStepComponent } from './steps/onboarding-category-step.component';
import { OnboardingBusinessStepComponent } from './steps/onboarding-business-step.component';
import { OnboardingTeamStepComponent } from './steps/onboarding-team-step.component';
import { OnboardingScheduleStepComponent } from './steps/onboarding-schedule-step.component';
import { OnboardingServicesStepComponent } from './steps/onboarding-services-step.component';

@Component({
  selector: 'app-company-onboarding',
  standalone: true,
  imports: [
    OnboardingProgressComponent,
    OnboardingCategoryStepComponent,
    OnboardingBusinessStepComponent,
    OnboardingTeamStepComponent,
    OnboardingScheduleStepComponent,
    OnboardingServicesStepComponent,
  ],
  styles: [`
    .onboarding {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px 56px;
      background: var(--body-bg);
    }

    .ob-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 32px;
    }
    .ob-logo-icon {
      width: 32px; height: 32px;
      background: var(--gradient);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ob-logo-text {
      font-size: 1.1rem;
      font-weight: 800;
      background: var(--gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .ob-card {
      background: white;
      border-radius: 24px;
      box-shadow: 0 8px 40px rgba(var(--primary-rgb), .14);
      padding: 36px 40px;
      width: 100%;
      max-width: 580px;
    }

    @media (max-width: 500px) {
      .ob-card { padding: 24px 18px; }
    }
  `],
  template: `
    <div class="onboarding">

      <!-- Logo -->
      <div class="ob-logo">
        <div class="ob-logo-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/>
            <line x1="8.5" y1="8.5" x2="18" y2="18"/><line x1="5.5" y1="8.5" x2="15" y2="18"/>
            <line x1="12" y1="16" x2="12" y2="22"/>
          </svg>
        </div>
        <span class="ob-logo-text">AgendaZco</span>
      </div>

      <div class="ob-card">

        <app-onboarding-progress [bars]="progressBars()" />

        <!-- ══ PASO 1: Tipo de negocio ══ -->
        @if (step() === 1) {
          <app-onboarding-category-step
            [(catGroup)]="catGroup"
            [selectedCat]="selectedCat()"
            (picked)="pickCategory($event)" />
        }

        <!-- ══ PASO 2: Datos del negocio ══ -->
        @if (step() === 2) {
          <app-onboarding-business-step
            [form]="form"
            [socials]="socials"
            [(autoConfirm)]="autoConfirm"
            [selectedCatMeta]="selectedCatMeta()"
            [error]="error()"
            (back)="step.set(1)"
            (next)="step.set(3)" />
        }

        <!-- ══ PASO 3: ¿Tenés equipo? ══ -->
        @if (step() === 3) {
          <app-onboarding-team-step
            [pendingStaff]="pendingStaff"
            [(newStaffName)]="newStaffName"
            [(newStaffPhone)]="newStaffPhone"
            [(newStaffPhoto)]="newStaffPhoto"
            (added)="pendingStaff.push($event)"
            (removed)="pendingStaff.splice($event, 1)"
            (back)="step.set(2)"
            (next)="step.set(4)" />
        }

        <!-- ══ PASO 4 y 5: Horarios (pregunta + editor) ══ -->
        @if (step() === 4 || step() === 5) {
          <app-onboarding-schedule-step
            [step]="step()"
            [scheduleLocal]="scheduleLocal"
            [(slotInterval)]="slotInterval"
            [error]="error()"
            [creating]="creating()"
            (navigate)="goTo($event)" />
        }

        <!-- ══ PASO 6 y 7: Servicios (pregunta + editor) ══ -->
        @if (step() === 6 || step() === 7) {
          <app-onboarding-services-step
            [step]="step()"
            [prevStep]="_prevStep"
            [pendingServices]="pendingServices"
            [(newSvc)]="newSvc"
            [(newSvcPriceDisplay)]="newSvcPriceDisplay"
            [error]="error()"
            [creating]="creating()"
            (added)="pendingServices.push($event)"
            (removed)="pendingServices.splice($event, 1)"
            (navigate)="goTo($event)"
            (create)="doCreate()" />
        }

      </div>
    </div>
  `,
})
export class CompanyOnboardingComponent {
  private companyStore      = inject(CompanyStore);
  private companySvc        = inject(CompanyService);
  private authSvc           = inject(AuthService);
  private staffSvc          = inject(StaffService);
  private serviceCatalogSvc = inject(ServiceCatalogService);
  private subscriptionSvc   = inject(SubscriptionService);


  catGroup    = signal<CategoryGroupKey>('belleza');

  step        = signal(1);
  selectedCat = signal<string>('');
  creating    = signal(false);
  error       = signal('');
  autoConfirm = false;

  // Arrays mutados en el contenedor (push/splice vía outputs de los pasos); doCreate los recorre
  pendingStaff: PendingStaff[] = [];
  pendingServices: Omit<ServiceItem, 'id'>[] = [];
  _prevStep = 4;

  // Borradores de los formularios inline: viven acá para sobrevivir a la navegación entre pasos
  newStaffPhoto = signal<string | null>(null);
  newStaffName  = '';
  newStaffPhone = '';
  newSvc = { name: '', description: '', duration: 30, staffCount: 1 };
  newSvcPriceDisplay = '';

  form: OnboardingForm = { name: '', description: '', city: '', address: '', phone: '' };

  constructor() {
    effect(() => {
      const name = this.authSvc.displayName();
      if (name && !this.form.name) this.form.name = name;
    });
  }

  socials: Record<string, SocialState> = {
    instagram: { enabled: false, handle: '' },
    facebook:  { enabled: false, handle: '' },
    tiktok:    { enabled: false, handle: '' },
    youtube:   { enabled: false, handle: '' },
  };

  scheduleLocal = DEFAULT_SCHEDULE.map(d => ({
    ...d,
    ranges: d.ranges.map(r => ({ ...r })),
  }));

  slotInterval = 30;

  progressBars = computed(() => {
    const s = this.step();
    return [
      s > 1 ? 'done' : 'active',                          // tipo
      s > 3 ? 'done' : s >= 2 ? 'active' : 'inactive',   // datos + equipo
      s > 5 ? 'done' : s >= 4 ? 'active' : 'inactive',   // horarios
      s >= 6 ? 'active' : 'inactive',                     // servicios
    ];
  });

  selectedCatMeta = computed(() => this.selectedCat() ? categoryMeta(this.selectedCat()) : null);

  pickCategory(value: string) {
    this.selectedCat.set(value);
    this.step.set(2);
  }

  goTo(nav: StepNavigation) {
    if (nav.prev !== undefined) this._prevStep = nav.prev;
    this.step.set(nav.to);
  }

  // Idempotencia: si createCompany ya tuvo éxito, un reintento reutiliza el mismo companyId
  private createdCompanyId: string | null = null;
  private staffCreatedCount = 0;
  private servicesCreatedCount = 0;

  async doCreate() {
    if (!this.form.name.trim() || !this.selectedCat()) return;
    this.creating.set(true);
    this.error.set('');
    try {
      const slug = this.form.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const social = (key: string) => {
        const s = this.socials[key];
        return s.enabled && s.handle.trim() ? s.handle.trim() : undefined;
      };

      const companyId = this.createdCompanyId ?? await this.companySvc.createCompany({
        name:         this.form.name.trim(),
        slug,
        category:     this.selectedCat(),
        description:  this.form.description.trim() || undefined,
        phone:        this.form.phone.trim() || undefined,
        city:         this.form.city.trim() || undefined,
        address:      this.form.address.trim() || undefined,
        instagram:    social('instagram'),
        facebook:     social('facebook'),
        tiktok:       social('tiktok'),
        youtube:      social('youtube'),
        logoColor:    categoryMeta(this.selectedCat()).color,
        isActive:     true,
        isPublic:     true,
        autoConfirm:  this.autoConfirm,
        slotInterval: this.slotInterval,
        schedule:     this.scheduleLocal,
        blockedDates: [],
        disabledSlots: {},
      });

      this.createdCompanyId = companyId;

      // Sin Cloud Functions (plan Spark): el trial se crea desde el cliente. Idempotente (transacción);
      // si falla no bloquea el onboarding: el backfill/admin lo cubre y el guard no bloquea sin doc.
      try {
        await this.subscriptionSvc.createTrialIfMissing(companyId);
      } catch (subErr) {
        console.error('[Onboarding] No se pudo crear el trial (se reparará con backfill-subscriptions):', subErr);
      }

      // Los contadores evitan duplicar staff/servicios ya creados en un intento previo
      while (this.staffCreatedCount < this.pendingStaff.length) {
        const m = this.pendingStaff[this.staffCreatedCount];
        await this.staffSvc.createStaff(companyId, {
          name:       m.name,
          phone:      m.phone || undefined,
          photoURL:   m.photoURL,
          serviceIds: [],
          isActive:   true,
        });
        this.staffCreatedCount++;
      }

      while (this.servicesCreatedCount < this.pendingServices.length) {
        await this.serviceCatalogSvc.createService(companyId, this.pendingServices[this.servicesCreatedCount]);
        this.servicesCreatedCount++;
      }

      await this.companyStore.refresh();
    } catch (err: any) {
      console.error('[Onboarding] createCompany error:', err);
      const code = err?.code ?? '';
      this.error.set(
        code === 'permission-denied' ? 'Sin permisos en Firestore. Configurá las reglas de seguridad.' :
        code === 'unauthenticated'   ? 'Sesión expirada. Cerrá sesión e iniciá de nuevo.' :
        err?.message ? `Error: ${err.message}` : 'Error de conexión. Intentá de nuevo.'
      );
    } finally {
      this.creating.set(false);
    }
  }
}
