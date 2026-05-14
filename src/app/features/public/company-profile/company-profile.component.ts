import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicNavComponent } from '../../../shared/components/public-nav.component';

const MOCK = {
  name: 'Barbería El Padrino',
  category: 'Barbería',
  color: '#7c3aed',
  description: 'Cortes clásicos y arreglo de barba. Más de 10 años de experiencia en el arte del barbero.',
  whatsapp: '573009876543',
  rating: 4.9,
  reviews: 142,
  services: [
    { id: '1', name: 'Corte clásico',   duration: 30, price: 20000, desc: 'Corte masculino tradicional' },
    { id: '2', name: 'Corte + barba',   duration: 45, price: 35000, desc: 'Corte y arreglo completo de barba' },
    { id: '3', name: 'Afeitado navaja', duration: 30, price: 25000, desc: 'Afeitado con navaja y espuma caliente' },
  ],
  paymentMethods: ['Efectivo', 'Nequi', 'Daviplata', 'Transferencia bancaria', 'Tarjeta débito/crédito'],
  allSlots: ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00'],
  // Por día de la semana (0=Dom) qué slots están tomados (simulado)
  takenByDay: [
    ['09:00','11:00','15:00'],          // Dom
    ['09:30','10:30','14:00','16:00'],  // Lun
    ['08:30','11:30','15:30'],          // Mar
    ['09:00','10:00','14:30','17:00'],  // Mié
    ['08:00','09:30','11:00','16:30'],  // Jue
    ['09:00','10:30','11:30','15:00','16:00'], // Vie
    ['08:30','09:00','09:30','10:00','14:00'], // Sáb — más ocupado
  ],
};

function buildDays(n: number) {
  const days = [];
  const NAMES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: d,
      label: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : NAMES[d.getDay()],
      sub: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
      dayOfWeek: d.getDay(),
    });
  }
  return days;
}

@Component({
  selector: 'app-company-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PublicNavComponent],
  template: `
    <app-public-nav />

    <!-- Toast de slot no disponible -->
    @if (showUnavailable()) {
      <div style="position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:999;
                  background:#1a1a2e;color:white;padding:12px 22px;border-radius:12px;
                  font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px;
                  box-shadow:0 8px 32px rgba(0,0,0,.25);animation:toast-in .25s ease">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Ese horario no está disponible. Elegí otro.
      </div>
    }

    <div class="page" style="max-width:680px;margin:0 auto">

      <!-- Volver -->
      <a routerLink="/" style="color:var(--purple);font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;margin-bottom:16px;text-decoration:none">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Volver
      </a>

      <!-- Header empresa -->
      <div class="card" style="border-top:4px solid {{ company.color }};padding:0;overflow:hidden;margin-bottom:20px">
        <div [style.background]="company.color + '12'" style="padding:24px">
          <div style="display:flex;gap:16px;align-items:center">
            <div style="width:72px;height:72px;border-radius:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0"
                 [style.background]="company.color + '22'" [style.color]="company.color">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="6" y1="3" x2="6" y2="15"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="6" r="3"/>
                <line x1="18" y1="9" x2="18" y2="21"/><line x1="18" y1="3" x2="6" y2="15"/>
              </svg>
            </div>
            <div style="flex:1">
              <h1 style="font-size:1.5rem;font-weight:800">{{ company.name }}</h1>
              <p style="font-weight:600;font-size:13px;margin-top:2px" [style.color]="company.color">{{ company.category }}</p>
              <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
                <div style="display:flex;gap:2px;color:#f59e0b">
                  @for (s of [1,2,3,4,5]; track s) {
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  }
                </div>
                <span style="font-weight:700;font-size:13px">{{ company.rating }}</span>
                <span style="color:#aaa;font-size:12px">({{ company.reviews }} reseñas)</span>
              </div>
            </div>
          </div>
          <p style="color:#555;line-height:1.6;margin-top:14px;font-size:14px">{{ company.description }}</p>
        </div>

        <!-- Stepper -->
        <div style="padding:14px 24px;border-top:1.5px solid #f0e8ff;display:flex;align-items:center;background:white">
          @for (step of steps; track step.n; let i = $index) {
            <div style="display:flex;align-items:center;flex:1;min-width:0">
              <div class="step-dot" [class]="stepClass(step.n)">
                @if (currentStep() > step.n) {
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                } @else { {{ step.n }} }
              </div>
              <span style="font-size:11px;font-weight:600;margin-left:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
                    [style.color]="currentStep() >= step.n ? 'var(--purple)' : '#c4b5fd'">
                {{ step.label }}
              </span>
              @if (i < steps.length - 1) {
                <div style="flex:1;height:2px;margin:0 8px;min-width:8px;border-radius:2px"
                     [style.background]="currentStep() > step.n ? 'var(--gradient)' : '#f0e8ff'"></div>
              }
            </div>
          }
        </div>
      </div>

      <!-- ══ PASO 1: Servicio ══ -->
      @if (currentStep() === 1) {
        <div class="card" style="animation:fadeInUp .3s ease">
          <h2 style="font-size:1.05rem;font-weight:800;margin-bottom:4px">¿Qué servicio necesitás?</h2>
          <p class="text-muted" style="margin-bottom:16px">Seleccioná uno para ver disponibilidad</p>
          <div style="display:flex;flex-direction:column;gap:10px">
            @for (s of company.services; track s.id) {
              <button (click)="selectService(s)"
                style="display:flex;align-items:center;justify-content:space-between;padding:16px;border-radius:12px;border:2px solid #ede9fe;background:white;cursor:pointer;text-align:left;width:100%;transition:all .18s"
                [style.borderColor]="selectedService()?.id === s.id ? 'var(--purple)' : '#ede9fe'"
                [style.background]="selectedService()?.id === s.id ? '#faf8ff' : 'white'"
                onmouseover="this.style.borderColor='#7c3aed';this.style.background='#faf8ff'"
                onmouseout="this.style.borderColor=this.style.borderColor">
                <div>
                  <div style="font-weight:700;font-size:15px;color:#1a1a2e">{{ s.name }}</div>
                  <div style="color:#888;font-size:13px;margin-top:3px">{{ s.desc }}</div>
                  <div style="display:inline-flex;align-items:center;gap:4px;margin-top:6px;color:#a0a0b8;font-size:12px">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {{ s.duration }} min
                  </div>
                </div>
                <div style="text-align:right;flex-shrink:0;margin-left:16px">
                  <div style="font-weight:800;font-size:17px;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
                    $ {{ s.price | number }}
                  </div>
                </div>
              </button>
            }
          </div>

          @if (selectedService()) {
            <button class="btn btn-primary" style="width:100%;margin-top:20px" (click)="currentStep.set(2)">
              Elegir fecha y hora
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          }
        </div>
      }

      <!-- ══ PASO 2: Fecha y hora ══ -->
      @if (currentStep() === 2) {
        <div class="card" style="animation:fadeInUp .3s ease">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
            <button (click)="goBack()" class="btn btn-secondary btn-sm" style="display:inline-flex;align-items:center;gap:4px;flex-shrink:0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div>
              <h2 style="font-size:1.05rem;font-weight:800">Elegí fecha y hora</h2>
              <p style="font-size:13px;font-weight:600;color:var(--purple);margin-top:1px">{{ selectedService()!.name }}</p>
            </div>
          </div>

          <!-- Selector de días -->
          <p style="font-size:12px;font-weight:700;color:#a0a0b8;letter-spacing:.06em;margin-bottom:10px">DÍA</p>
          <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;margin-bottom:20px">
            @for (day of days; track day.sub) {
              <button (click)="selectDay(day)"
                style="flex-shrink:0;min-width:68px;padding:10px 8px;border-radius:12px;border:2px solid;cursor:pointer;text-align:center;transition:all .18s;font-family:inherit"
                [style.borderColor]="selectedDay()?.sub === day.sub ? 'var(--purple)' : '#ede9fe'"
                [style.background]="selectedDay()?.sub === day.sub ? 'var(--gradient)' : 'white'"
                [style.color]="selectedDay()?.sub === day.sub ? 'white' : '#1a1a2e'"
                [style.boxShadow]="selectedDay()?.sub === day.sub ? '0 4px 14px rgba(124,58,237,.3)' : 'none'">
                <div style="font-weight:800;font-size:13px">{{ day.label }}</div>
                <div style="font-size:11px;margin-top:3px;opacity:.75">{{ day.sub }}</div>
              </button>
            }
          </div>

          <!-- Slots de hora -->
          @if (selectedDay()) {
            <p style="font-size:12px;font-weight:700;color:#a0a0b8;letter-spacing:.06em;margin-bottom:10px">HORA DISPONIBLE</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(82px,1fr));gap:8px">
              @for (slot of company.allSlots; track slot) {
                @if (isTaken(slot)) {
                  <!-- Sin cupo -->
                  <button (click)="alertUnavailable()"
                    style="padding:10px;border-radius:10px;border:2px solid #fee2e2;background:#fff5f5;color:#fca5a5;font-weight:600;font-size:13px;cursor:not-allowed;position:relative;font-family:inherit">
                    {{ slot }}
                    <div style="font-size:10px;font-weight:700;color:#f87171;margin-top:2px">Sin cupo</div>
                  </button>
                } @else {
                  <!-- Disponible -->
                  <button (click)="selectSlot(slot)"
                    style="padding:10px;border-radius:10px;border:2px solid;cursor:pointer;font-weight:700;font-size:13px;transition:all .18s;font-family:inherit"
                    [style.borderColor]="selectedSlot()===slot ? 'transparent' : '#ede9fe'"
                    [style.background]="selectedSlot()===slot ? 'var(--gradient)' : '#f5f0ff'"
                    [style.color]="selectedSlot()===slot ? 'white' : 'var(--purple)'"
                    [style.boxShadow]="selectedSlot()===slot ? '0 4px 14px rgba(124,58,237,.35)' : 'none'"
                    [style.transform]="selectedSlot()===slot ? 'scale(1.05)' : 'scale(1)'">
                    {{ slot }}
                  </button>
                }
              }
            </div>

            <!-- Leyenda -->
            <div style="display:flex;gap:16px;margin-top:14px">
              <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#888">
                <div style="width:12px;height:12px;border-radius:3px;background:#f5f0ff;border:1.5px solid #ede9fe"></div>
                Disponible
              </div>
              <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#888">
                <div style="width:12px;height:12px;border-radius:3px;background:#fff5f5;border:1.5px solid #fee2e2"></div>
                Sin cupo
              </div>
            </div>
          }

          @if (selectedDay() && selectedSlot()) {
            <button class="btn btn-primary" style="width:100%;margin-top:20px" (click)="currentStep.set(3)">
              Continuar — {{ selectedDay()!.label }} {{ selectedDay()!.sub }} a las {{ selectedSlot() }}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          }
        </div>
      }

      <!-- ══ PASO 3: Datos + Pago ══ -->
      @if (currentStep() === 3) {
        <div class="card" style="animation:fadeInUp .3s ease">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
            <button (click)="goBack()" class="btn btn-secondary btn-sm" style="display:inline-flex;align-items:center;flex-shrink:0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <h2 style="font-size:1.05rem;font-weight:800">Tus datos y forma de pago</h2>
          </div>

          <!-- Resumen -->
          <div style="background:linear-gradient(135deg,#f5f0ff,#fff0f4);border-radius:12px;padding:16px;margin-bottom:22px;border:1.5px solid #ede9fe">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
              <div>
                <div class="text-muted">Servicio</div>
                <div style="font-weight:700;margin-top:2px">{{ selectedService()!.name }}</div>
              </div>
              <div>
                <div class="text-muted">Duración</div>
                <div style="font-weight:700;margin-top:2px">{{ selectedService()!.duration }} min</div>
              </div>
              <div>
                <div class="text-muted">Fecha</div>
                <div style="font-weight:700;margin-top:2px">{{ selectedDay()!.label }} {{ selectedDay()!.sub }}</div>
              </div>
              <div>
                <div class="text-muted">Hora</div>
                <div style="font-weight:700;margin-top:2px">{{ selectedSlot() }}</div>
              </div>
            </div>
            <div style="border-top:1.5px solid #ede9fe;margin-top:12px;padding-top:12px;display:flex;justify-content:space-between;align-items:center">
              <span class="text-muted">Total</span>
              <span style="font-weight:800;font-size:18px;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
                $ {{ selectedService()!.price | number }}
              </span>
            </div>
          </div>

          <!-- Datos personales -->
          <div class="form-group">
            <label>Tu nombre completo *</label>
            <input [(ngModel)]="clientName" placeholder="Juan García" />
          </div>
          <div class="form-group">
            <label>Teléfono *</label>
            <input [(ngModel)]="clientPhone" placeholder="3001234567" type="tel" />
          </div>
          <div class="form-group" style="margin-bottom:22px">
            <label>Nota para el negocio (opcional)</label>
            <input [(ngModel)]="clientNote" placeholder="Primera vez, alguna preferencia..." />
          </div>

          <!-- Medio de pago -->
          <p style="font-weight:700;font-size:13px;color:#444;margin-bottom:10px">Medio de pago *</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px">
            @for (pm of company.paymentMethods; track pm) {
              <button (click)="selectedPayment.set(pm)"
                style="padding:11px 14px;border-radius:10px;border:2px solid;cursor:pointer;text-align:left;font-size:13px;font-weight:600;transition:all .18s;font-family:inherit;display:flex;align-items:center;gap:8px"
                [style.borderColor]="selectedPayment()===pm ? 'var(--purple)' : '#ede9fe'"
                [style.background]="selectedPayment()===pm ? 'linear-gradient(135deg,#f5f0ff,#f0ebff)' : 'white'"
                [style.color]="selectedPayment()===pm ? 'var(--purple)' : '#555'">
                <div style="width:18px;height:18px;border-radius:50%;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center"
                     [style.borderColor]="selectedPayment()===pm ? 'var(--purple)' : '#d1d5db'">
                  @if (selectedPayment()===pm) {
                    <div style="width:8px;height:8px;border-radius:50%;background:var(--purple)"></div>
                  }
                </div>
                {{ pm }}
              </button>
            }
          </div>

          <button class="btn btn-primary btn-lg" style="width:100%"
            (click)="confirm()" [disabled]="!clientName || !clientPhone || !selectedPayment()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Confirmar y enviar por WhatsApp
          </button>
          <p class="text-muted" style="text-align:center;margin-top:10px;font-size:12px">
            Se abrirá WhatsApp con el mensaje listo para enviar
          </p>
        </div>
      }

      <!-- ══ PASO 4: Confirmado ══ -->
      @if (currentStep() === 4) {
        <div class="card" style="text-align:center;padding:48px 32px;animation:fadeInUp .35s ease">
          <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#d1fae5,#a7f3d0);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;color:#065f46">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style="font-size:1.5rem;font-weight:800;color:#065f46;margin-bottom:8px">Solicitud enviada</h2>
          <p style="color:#555;margin-bottom:4px">
            <strong>{{ selectedService()!.name }}</strong> — {{ selectedDay()!.label }} {{ selectedDay()!.sub }} a las <strong>{{ selectedSlot() }}</strong>
          </p>
          <p class="text-muted" style="margin-bottom:28px">{{ company.name }}</p>

          <!-- Preview mensaje -->
          <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:16px 20px;text-align:left;margin-bottom:24px">
            <p style="font-size:12px;font-weight:700;color:#166534;letter-spacing:.05em;margin-bottom:8px">MENSAJE ENVIADO A WHATSAPP</p>
            <p style="font-size:13px;color:#166534;line-height:1.7;white-space:pre-line;font-family:monospace">{{ whatsappPreview() }}</p>
          </div>

          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
            <button class="btn btn-secondary" (click)="reset()">Agendar otra cita</button>
            @if (company.whatsapp) {
              <a [href]="whatsappUrl()" target="_blank"
                 class="btn" style="background:#25d366;color:white;box-shadow:0 4px 14px rgba(37,211,102,.3);display:inline-flex;align-items:center;gap:6px">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Abrir WhatsApp
              </a>
            }
          </div>
        </div>
      }
    </div>

    <style>
      @keyframes toast-in {
        from { opacity:0; transform: translateX(-50%) translateY(-10px); }
        to   { opacity:1; transform: translateX(-50%) translateY(0); }
      }
    </style>
  `,
})
export class CompanyProfileComponent {
  company = MOCK;
  days = buildDays(8);

  currentStep    = signal(1);
  selectedService = signal<any>(null);
  selectedDay    = signal<any>(null);
  selectedSlot   = signal<string | null>(null);
  selectedPayment = signal<string | null>(null);
  showUnavailable = signal(false);

  clientName  = '';
  clientPhone = '';
  clientNote  = '';

  steps = [
    { n: 1, label: 'Servicio' },
    { n: 2, label: 'Fecha/Hora' },
    { n: 3, label: 'Datos' },
    { n: 4, label: 'Listo' },
  ];

  stepClass(n: number) {
    if (this.currentStep() > n) return 'done';
    if (this.currentStep() === n) return 'active';
    return 'idle';
  }

  isTaken(slot: string): boolean {
    const day = this.selectedDay();
    if (!day) return false;
    return this.company.takenByDay[day.dayOfWeek]?.includes(slot) ?? false;
  }

  alertUnavailable() {
    this.showUnavailable.set(true);
    setTimeout(() => this.showUnavailable.set(false), 3000);
  }

  selectService(s: any) { this.selectedService.set(s); }
  selectDay(day: any)   { this.selectedDay.set(day); this.selectedSlot.set(null); }
  selectSlot(slot: string) { this.selectedSlot.set(slot); }
  goBack() { this.currentStep.update(s => s - 1); }

  whatsappPreview = computed(() => {
    if (!this.selectedService() || !this.selectedDay() || !this.selectedSlot()) return '';
    const svc = this.selectedService();
    const day = this.selectedDay();
    return `Hola, soy *${this.clientName || 'Cliente'}*

Quiero agendar mi cita en *${this.company.name}*

Servicio:  *${svc.name}* (${svc.duration} min)
Fecha:     *${day.label} ${day.sub}*
Hora:      *${this.selectedSlot()}*
Total:     *$${svc.price.toLocaleString('es-CO')}*
Pago:      *${this.selectedPayment() ?? ''}*
${this.clientNote ? `\nNota: ${this.clientNote}` : ''}
¡Gracias!`;
  });

  whatsappUrl = computed(() => {
    const msg = encodeURIComponent(this.whatsappPreview());
    return `https://wa.me/${this.company.whatsapp}?text=${msg}`;
  });

  confirm() {
    this.currentStep.set(4);
    if (this.company.whatsapp) {
      setTimeout(() => window.open(this.whatsappUrl(), '_blank'), 400);
    }
  }

  reset() {
    this.selectedService.set(null);
    this.selectedDay.set(null);
    this.selectedSlot.set(null);
    this.selectedPayment.set(null);
    this.currentStep.set(1);
    this.clientName = '';
    this.clientPhone = '';
    this.clientNote = '';
  }
}
