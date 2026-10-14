import { Component, input, model, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceItem } from '../../../../core/services/service-catalog.service';
import { DayOption, PAYMENT_METHODS } from '../company-profile.utils';

/** Paso 4: datos del cliente, resumen y medio de pago. */
@Component({
  selector: 'app-cp-client-step',
  standalone: true,
  imports: [DecimalPipe, FormsModule],
  styles: [`
    :host { display: block; }

    @media (max-width: 640px) {
      input, select, textarea { font-size: 16px !important; }
    }
  `],
  template: `
          <div class="card" style="animation:fadeInUp .3s ease">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
              <button (click)="back.emit()" class="btn btn-secondary btn-sm" style="display:inline-flex;align-items:center;flex-shrink:0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <h2 style="font-size:1.05rem;font-weight:800">Tus datos y forma de pago</h2>
            </div>

            <div style="background:var(--gradient-soft);border-radius:12px;padding:16px;margin-bottom:22px;border:1.5px solid var(--form-border)">
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;font-size:13px">
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
              <div style="border-top:1.5px solid var(--form-border);margin-top:12px;padding-top:12px;display:flex;justify-content:space-between;align-items:center">
                <span class="text-muted">Total</span>
                <span style="font-weight:800;font-size:18px;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
                  $ {{ (selectedService()!.price ?? 0) | number }}
                </span>
              </div>
            </div>

            @if (isLoggedIn()) {
              <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:10px 14px;margin-bottom:16px;display:flex;align-items:center;gap:8px;font-size:13px;color:#166534">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Agendar como <strong style="margin-left:4px">{{ displayName() }}</strong>
              </div>
            }
            <div class="form-group">
              <label>Tu nombre completo *</label>
              <input [ngModel]="clientName()" (ngModelChange)="clientName.set($event)" placeholder="Juan García" />
            </div>
            <div class="form-group">
              <label>Teléfono *</label>
              <input [ngModel]="clientPhone()" (ngModelChange)="clientPhone.set($event)" placeholder="3001234567" type="tel" />
            </div>
            <div class="form-group" style="margin-bottom:22px">
              <label>Nota para el negocio (opcional)</label>
              <input [ngModel]="clientNote()" (ngModelChange)="clientNote.set($event)" placeholder="Primera vez, alguna preferencia..." />
            </div>

            <p style="font-weight:700;font-size:13px;color:#444;margin-bottom:10px">Medio de pago *</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-bottom:20px">
              @for (pm of paymentMethods; track pm) {
                <button (click)="selectedPayment.set(pm)"
                  style="padding:11px 14px;border-radius:10px;border:2px solid;cursor:pointer;text-align:left;font-size:13px;font-weight:600;transition:all .18s;font-family:inherit;display:flex;align-items:center;gap:8px"
                  [style.borderColor]="selectedPayment()===pm ? 'var(--purple)' : 'var(--form-border)'"
                  [style.background]="selectedPayment()===pm ? 'var(--gradient-soft)' : 'white'"
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
              (click)="confirmBooking.emit()" [disabled]="!clientName() || !clientPhone() || !selectedPayment() || booking()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {{ booking() ? 'Reservando...' : 'Confirmar y enviar por WhatsApp' }}
            </button>
            <p class="text-muted" style="text-align:center;margin-top:10px;font-size:12px">
              Se abrirá WhatsApp con el mensaje listo para enviar
            </p>
          </div>
  `,
})
export class ClientStepComponent {
  selectedService = input.required<ServiceItem | null>();
  selectedDay = input.required<DayOption | null>();
  selectedSlot = input<string | null>(null);
  booking = input(false);
  isLoggedIn = input(false);
  displayName = input('');

  clientName  = model('');
  clientPhone = model('');
  clientNote  = model('');
  selectedPayment = model<string | null>(null);

  readonly paymentMethods = PAYMENT_METHODS;

  back = output<void>();
  confirmBooking = output<void>();
}
