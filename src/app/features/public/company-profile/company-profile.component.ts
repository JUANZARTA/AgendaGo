import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicNavComponent } from '../../../shared/components/public-nav.component';

const MOCK = {
  name: 'Barbería El Padrino',
  category: 'Barbería',
  emoji: '✂️',
  color: '#7c3aed',
  description: 'Cortes clásicos y arreglo de barba. Más de 10 años de experiencia en el arte del barbero.',
  whatsapp: '573009876543',
  rating: 4.9,
  reviews: 142,
  services: [
    { id: '1', name: 'Corte clásico', duration: 30, price: 20000, desc: 'Corte masculino tradicional' },
    { id: '2', name: 'Corte + barba', duration: 45, price: 35000, desc: 'Corte y arreglo completo de barba' },
    { id: '3', name: 'Afeitado navaja', duration: 30, price: 25000, desc: 'Afeitado con navaja y espuma caliente' },
  ],
  slots: ['09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00','16:00'],
};

@Component({
  selector: 'app-company-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PublicNavComponent],
  template: `
    <app-public-nav />

    <div class="page" style="max-width:680px;margin:0 auto">
      <a routerLink="/" style="color:var(--purple);font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:4px;margin-bottom:16px">
        ← Volver al inicio
      </a>

      <!-- Header empresa -->
      <div class="card" style="border-top:4px solid {{ company.color }};padding:0;overflow:hidden;margin-bottom:20px">
        <div [style.background]="company.color + '12'" style="padding:24px">
          <div style="display:flex;gap:16px;align-items:center">
            <div style="width:72px;height:72px;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:32px;flex-shrink:0"
                 [style.background]="company.color + '22'">
              {{ company.emoji }}
            </div>
            <div style="flex:1">
              <h1 style="font-size:1.5rem;font-weight:800">{{ company.name }}</h1>
              <p style="font-weight:600;font-size:13px;margin-top:2px" [style.color]="company.color">{{ company.category }}</p>
              <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
                <span style="color:#f59e0b">★★★★★</span>
                <span style="font-weight:700;font-size:13px">{{ company.rating }}</span>
                <span style="color:#aaa;font-size:12px">({{ company.reviews }} reseñas)</span>
              </div>
            </div>
            @if (company.whatsapp) {
              <a [href]="'https://wa.me/'+company.whatsapp" target="_blank"
                 class="btn btn-sm" style="background:#25d366;color:white;box-shadow:0 4px 12px rgba(37,211,102,.3);flex-shrink:0">
                💬 WhatsApp
              </a>
            }
          </div>
          <p style="color:#555;line-height:1.6;margin-top:14px;font-size:14px">{{ company.description }}</p>
        </div>

        <!-- Progress de pasos -->
        <div style="padding:14px 24px;border-top:1.5px solid #f0e8ff;display:flex;align-items:center;gap:0;background:white">
          @for (step of steps; track step.n; let i = $index) {
            <div style="display:flex;align-items:center;flex:1;min-width:0">
              <div class="step-dot" [class]="stepClass(step.n)">
                @if (currentStep() > step.n) { ✓ } @else { {{ step.n }} }
              </div>
              <span style="font-size:12px;font-weight:600;margin-left:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
                    [style.color]="currentStep() >= step.n ? 'var(--purple)' : '#b0a8c8'">
                {{ step.label }}
              </span>
              @if (i < steps.length - 1) {
                <div style="flex:1;height:2px;margin:0 10px;min-width:12px;border-radius:2px"
                     [style.background]="currentStep() > step.n ? 'var(--gradient)' : '#f0e8ff'"></div>
              }
            </div>
          }
        </div>
      </div>

      <!-- PASO 1: Servicios -->
      @if (currentStep() === 1) {
        <div class="card">
          <h2 style="font-size:1.1rem;font-weight:800;margin-bottom:16px">¿Qué servicio necesitás?</h2>
          <div style="display:flex;flex-direction:column;gap:10px">
            @for (s of company.services; track s.id) {
              <button (click)="selectService(s)"
                style="display:flex;align-items:center;justify-content:space-between;padding:16px;border-radius:12px;border:2px solid #ede9fe;background:white;cursor:pointer;text-align:left;width:100%;transition:all .15s"
                onmouseover="this.style.borderColor='#7c3aed';this.style.background='#faf8ff'"
                onmouseout="this.style.borderColor='#ede9fe';this.style.background='white'">
                <div>
                  <div style="font-weight:700;font-size:15px;color:#1a1a2e">{{ s.name }}</div>
                  <div style="color:#888;font-size:13px;margin-top:3px">{{ s.desc }}</div>
                </div>
                <div style="text-align:right;flex-shrink:0;margin-left:12px">
                  <div style="font-weight:800;font-size:16px;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent">$ {{ s.price | number }}</div>
                  <div style="color:#aaa;font-size:12px;margin-top:2px">⏱ {{ s.duration }} min</div>
                </div>
              </button>
            }
          </div>
        </div>
      }

      <!-- PASO 2: Horarios -->
      @if (currentStep() === 2) {
        <div class="card">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
            <button (click)="goBack()" class="btn btn-secondary btn-sm">←</button>
            <div>
              <h2 style="font-size:1.1rem;font-weight:800">Elegí un horario</h2>
              <p style="color:var(--purple);font-size:13px;font-weight:600">{{ selectedService()!.name }}</p>
            </div>
          </div>
          <p class="text-muted" style="margin-bottom:16px">Disponibilidad para hoy</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:10px">
            @for (slot of company.slots; track slot) {
              <button (click)="selectSlot(slot)"
                class="btn"
                [style.background]="selectedSlot()===slot ? 'var(--gradient)' : '#f3f0ff'"
                [style.color]="selectedSlot()===slot ? 'white' : 'var(--purple)'"
                [style.boxShadow]="selectedSlot()===slot ? '0 4px 14px rgba(124,58,237,.35)' : 'none'"
                style="font-weight:800;font-size:14px">
                {{ slot }}
              </button>
            }
          </div>
          @if (selectedSlot()) {
            <button class="btn btn-primary" style="width:100%;margin-top:20px" (click)="currentStep.set(3)">
              Continuar → {{ selectedSlot() }}
            </button>
          }
        </div>
      }

      <!-- PASO 3: Datos -->
      @if (currentStep() === 3) {
        <div class="card">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
            <button (click)="goBack()" class="btn btn-secondary btn-sm">←</button>
            <h2 style="font-size:1.1rem;font-weight:800">Confirmá tus datos</h2>
          </div>

          <!-- Resumen -->
          <div style="background:linear-gradient(135deg,#f5f0ff,#fff0f4);border-radius:12px;padding:16px;margin-bottom:20px;border:1.5px solid #ede9fe">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:14px">
              <div>
                <div class="text-muted">Servicio</div>
                <div style="font-weight:700;margin-top:2px">{{ selectedService()!.name }}</div>
              </div>
              <div>
                <div class="text-muted">Hora</div>
                <div style="font-weight:700;margin-top:2px">{{ selectedSlot() }}</div>
              </div>
              <div>
                <div class="text-muted">Duración</div>
                <div style="font-weight:700;margin-top:2px">{{ selectedService()!.duration }} min</div>
              </div>
              <div>
                <div class="text-muted">Total</div>
                <div style="font-weight:800;font-size:16px;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-top:2px">
                  $ {{ selectedService()!.price | number }}
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Tu nombre *</label>
            <input [(ngModel)]="clientName" placeholder="Juan García" />
          </div>
          <div class="form-group">
            <label>Teléfono *</label>
            <input [(ngModel)]="clientPhone" placeholder="3001234567" type="tel" />
          </div>
          <div class="form-group" style="margin-bottom:8px">
            <label>Nota para el negocio (opcional)</label>
            <input [(ngModel)]="clientNote" placeholder="Ej: primera vez, alergia a X..." />
          </div>

          <button class="btn btn-primary btn-lg" style="width:100%;margin-top:12px"
            (click)="confirm()" [disabled]="!clientName || !clientPhone">
            ✓ Confirmar cita
          </button>
        </div>
      }

      <!-- PASO 4: Confirmado -->
      @if (currentStep() === 4) {
        <div class="card" style="text-align:center;padding:48px 32px">
          <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#d1fae5,#a7f3d0);display:flex;align-items:center;justify-content:center;font-size:36px;margin:0 auto 20px">
            ✓
          </div>
          <h2 style="font-size:1.5rem;font-weight:800;color:#065f46;margin-bottom:8px">¡Cita confirmada!</h2>
          <p style="color:#555;margin-bottom:4px;font-size:15px">
            <strong>{{ selectedService()!.name }}</strong> a las <strong>{{ selectedSlot() }}</strong>
          </p>
          <p class="text-muted" style="margin-bottom:28px">{{ company.name }}</p>

          <div style="background:var(--gradient-soft);border-radius:12px;padding:16px;margin-bottom:24px;font-size:14px;color:#555;line-height:1.7">
            📲 Recibirás una confirmación por notificación push si tenés la app instalada.
          </div>

          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
            <button class="btn btn-secondary" (click)="reset()">Agendar otra cita</button>
            @if (company.whatsapp) {
              <a [href]="'https://wa.me/'+company.whatsapp+'?text=Hola!+Agendé+mi+cita+para+'+selectedSlot()" target="_blank"
                 class="btn btn-sm" style="background:#25d366;color:white">
                💬 Confirmar por WhatsApp
              </a>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class CompanyProfileComponent {
  company = MOCK;
  currentStep = signal(1);
  selectedService = signal<any>(null);
  selectedSlot = signal<string | null>(null);
  clientName = '';
  clientPhone = '';
  clientNote = '';

  steps = [
    { n: 1, label: 'Servicio' },
    { n: 2, label: 'Horario' },
    { n: 3, label: 'Datos' },
    { n: 4, label: 'Listo' },
  ];

  stepClass(n: number) {
    if (this.currentStep() > n) return 'done';
    if (this.currentStep() === n) return 'active';
    return 'idle';
  }

  selectService(s: any) { this.selectedService.set(s); this.selectedSlot.set(null); this.currentStep.set(2); }
  selectSlot(slot: string) { this.selectedSlot.set(slot); }
  goBack() { this.currentStep.update(s => s - 1); }
  confirm() { this.currentStep.set(4); }
  reset() { this.selectedService.set(null); this.selectedSlot.set(null); this.currentStep.set(1); this.clientName = ''; this.clientPhone = ''; this.clientNote = ''; }
}
