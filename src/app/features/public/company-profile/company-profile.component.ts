import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PublicNavComponent } from '../../../shared/components/public-nav.component';
import { Company, CompanyService } from '../../../core/services/company.service';
import { ServiceCatalogService, ServiceItem } from '../../../core/services/service-catalog.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import { StaffService, StaffMember } from '../../../core/services/staff.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MessageService, Message } from '../../../core/services/message.service';

const PAYMENT_METHODS = ['Efectivo', 'Nequi', 'Daviplata', 'Transferencia bancaria', 'Tarjeta débito/crédito'];

const DAY_KEYS = ['dom','lun','mar','mie','jue','vie','sab'];

function buildDays(n: number) {
  const days = [];
  const NAMES  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const today  = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    days.push({
      date: iso,
      dateObj: d,
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
  styles: [`
    :host { display: block; }

    @media (max-width: 640px) {
      input, select, textarea { font-size: 16px !important; }
      .step-dot { width: 22px !important; height: 22px !important; font-size: 11px !important; }
    }

    @media (max-width: 480px) {
      .step4-actions { flex-direction: column !important; align-items: stretch !important; }
      .step4-actions .btn { width: 100% !important; justify-content: center !important; }
    }

    @media (max-width: 360px) {
      .service-btn { padding: 12px 10px !important; }
    }
  `],
  template: `
    <app-public-nav />

    <!-- Modal: cliente suspendido -->
    @if (isClientBlocked()) {
      <div style="position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(2px)">
        <div style="max-width:400px;width:100%;background:white;border-radius:20px;padding:40px 32px;text-align:center;box-shadow:0 16px 60px rgba(0,0,0,.2);border-top:4px solid #ef4444">
          <div style="width:64px;height:64px;border-radius:50%;background:#fee2e2;display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </div>
          <h2 style="font-size:1.2rem;font-weight:800;color:#1a1a2e;margin-bottom:10px">Cuenta suspendida</h2>
          <p style="font-size:14px;color:#666;line-height:1.6;margin-bottom:28px">
            Tu cuenta fue suspendida. No podés agendar citas en este momento. Contactá al administrador para más información.
          </p>
          <div style="display:flex;flex-direction:column;gap:10px">
            <a href="https://wa.me/573128622945?text=Hola%2C%20mi%20cuenta%20de%20cliente%20en%20Agenda%20Co%20fue%20suspendida" target="_blank"
              style="width:100%;padding:13px;border-radius:12px;background:#25d366;color:white;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;box-shadow:0 4px 14px rgba(37,211,102,.3)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contactar administrador
            </a>
            <button (click)="doLogout()"
              style="width:100%;padding:11px;border-radius:12px;border:1.5px solid #e5e7eb;background:none;font-size:13px;font-weight:600;color:#888;cursor:pointer;font-family:inherit">
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
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
        <div class="card" style="text-align:center;padding:48px 32px">
          <div style="width:60px;height:60px;border-radius:50%;background:#fee2e2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h3 style="font-size:1.1rem;font-weight:800;color:#1a1a2e;margin-bottom:8px">Empresa fuera de servicio</h3>
          <p style="font-size:14px;color:#666;line-height:1.6;margin-bottom:20px">
            Por el momento esta empresa no está disponible para agendar citas.<br>Comunicate con el administrador para más información.
          </p>
          <a href="https://wa.me/573128622945?text=Hola%2C%20quiero%20información%20sobre%20el%20estado%20de%20una%20empresa%20en%20Agenda%20Co" target="_blank"
             style="display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:12px;background:#25d366;color:white;font-size:14px;font-weight:700;text-decoration:none;box-shadow:0 4px 14px rgba(37,211,102,.3)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Contactar administrador
          </a>
        </div>
      } @else {

        <!-- Header empresa -->
        <div class="card" [style.borderTop]="'4px solid ' + companyColor()" style="padding:0;overflow:hidden;margin-bottom:20px">
          <div [style.background]="companyColor() + '12'" style="padding:24px">
            <div style="display:flex;gap:16px;align-items:center">
              <div style="width:72px;height:72px;border-radius:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden"
                   [style.background]="company()!.logoUrl ? 'transparent' : companyColor() + '22'"
                   [style.color]="companyColor()">
                @if (company()!.logoUrl) {
                  <img [src]="company()!.logoUrl!" alt="logo"
                       style="width:100%;height:100%;object-fit:cover;border-radius:18px" />
                } @else {
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="6" y1="3" x2="6" y2="15"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="6" r="3"/>
                    <line x1="18" y1="9" x2="18" y2="21"/><line x1="18" y1="3" x2="6" y2="15"/>
                  </svg>
                }
              </div>
              <div style="flex:1">
                <h1 style="font-size:1.5rem;font-weight:800">{{ company()!.name }}</h1>
                <p style="font-weight:600;font-size:13px;margin-top:2px" [style.color]="companyColor()">{{ companyCategory() }}</p>
              </div>
            </div>
            <p style="color:#555;line-height:1.6;margin-top:14px;font-size:14px">{{ company()!.description }}</p>
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

            @if (services().length === 0) {
              <div style="text-align:center;padding:24px;color:#aaa">Este negocio aún no publicó servicios.</div>
            } @else {
              <div style="display:flex;flex-direction:column;gap:10px">
                @for (s of services(); track s.id) {
                  <button class="service-btn" (click)="selectService(s)"
                    style="display:flex;align-items:center;justify-content:space-between;padding:16px;border-radius:12px;border:2px solid var(--form-border);background:white;cursor:pointer;text-align:left;width:100%;transition:all .18s"
                    [style.borderColor]="selectedService()?.id === s.id ? 'var(--purple)' : 'var(--form-border)'"
                    [style.background]="selectedService()?.id === s.id ? 'var(--form-bg)' : 'white'"
                    onmouseover="this.style.borderColor='var(--purple)';this.style.background='var(--form-bg)'"
                    onmouseout="if(!this.getAttribute('data-selected')){this.style.borderColor='var(--form-border)';this.style.background='white'}">
                    <div>
                      <div style="font-weight:700;font-size:15px;color:#1a1a2e">{{ s.name }}</div>
                      <div style="color:#888;font-size:13px;margin-top:3px">{{ s.description }}</div>
                      <div style="display:inline-flex;align-items:center;gap:4px;margin-top:6px;color:#a0a0b8;font-size:12px">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {{ s.duration }} min
                      </div>
                    </div>
                    <div style="text-align:right;flex-shrink:0;margin-left:16px">
                      <div style="font-weight:800;font-size:17px;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
                        $ {{ (s.price ?? 0) | number }}
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

            <p style="font-size:12px;font-weight:700;color:#a0a0b8;letter-spacing:.06em;margin-bottom:10px">DÍA</p>
            <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;margin-bottom:20px">
              @for (day of days; track day.sub) {
                <button (click)="selectDay(day)"
                  style="flex-shrink:0;min-width:68px;padding:10px 8px;border-radius:12px;border:2px solid;cursor:pointer;text-align:center;transition:all .18s;font-family:inherit"
                  [style.borderColor]="selectedDay()?.sub === day.sub ? 'var(--purple)' : 'var(--form-border)'"
                  [style.background]="selectedDay()?.sub === day.sub ? 'var(--gradient)' : 'white'"
                  [style.color]="selectedDay()?.sub === day.sub ? 'white' : '#1a1a2e'"
                  [style.boxShadow]="selectedDay()?.sub === day.sub ? '0 4px 14px rgba(var(--primary-rgb),.3)' : 'none'">
                  <div style="font-weight:800;font-size:13px">{{ day.label }}</div>
                  <div style="font-size:11px;margin-top:3px;opacity:.75">{{ day.sub }}</div>
                </button>
              }
            </div>

            @if (selectedDay()) {
              @if (loadingSlots()) {
                <div style="text-align:center;padding:24px;color:#aaa">Cargando disponibilidad...</div>
              } @else {
                <p style="font-size:12px;font-weight:700;color:#a0a0b8;letter-spacing:.06em;margin-bottom:10px">HORA DISPONIBLE</p>
                @if (allSlots().length === 0) {
                  <div style="text-align:center;padding:20px;color:#aaa">No hay turnos disponibles para este día.</div>
                } @else {
                  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:8px">
                    @for (slot of allSlots(); track slot) {
                      @if (isTaken(slot)) {
                        <button (click)="alertUnavailable()"
                          style="padding:10px;border-radius:10px;border:2px solid #fee2e2;background:#fff5f5;color:#fca5a5;font-weight:600;font-size:13px;cursor:not-allowed;font-family:inherit">
                          {{ slot }}
                          <div style="font-size:10px;font-weight:700;color:#f87171;margin-top:2px">Sin cupo</div>
                        </button>
                      } @else {
                        <button (click)="selectSlot(slot)"
                          style="padding:10px;border-radius:10px;border:2px solid;cursor:pointer;font-weight:700;font-size:13px;transition:all .18s;font-family:inherit"
                          [style.borderColor]="selectedSlot()===slot ? 'transparent' : 'var(--form-border)'"
                          [style.background]="selectedSlot()===slot ? 'var(--gradient)' : 'var(--btn-secondary-bg)'"
                          [style.color]="selectedSlot()===slot ? 'white' : 'var(--purple)'"
                          [style.boxShadow]="selectedSlot()===slot ? '0 4px 14px rgba(var(--primary-rgb),.35)' : 'none'"
                          [style.transform]="selectedSlot()===slot ? 'scale(1.05)' : 'scale(1)'">
                          {{ slot }}
                        </button>
                      }
                    }
                  </div>

                  <div style="display:flex;gap:16px;margin-top:14px">
                    <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#888">
                      <div style="width:12px;height:12px;border-radius:3px;background:var(--btn-secondary-bg);border:1.5px solid var(--form-border)"></div>
                      Disponible
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#888">
                      <div style="width:12px;height:12px;border-radius:3px;background:#fff5f5;border:1.5px solid #fee2e2"></div>
                      Sin cupo
                    </div>
                  </div>
                }
              }

              @if (selectedDay() && selectedSlot()) {
                <button class="btn btn-primary" style="width:100%;margin-top:20px" (click)="staffList().length > 0 ? currentStep.set(3) : currentStep.set(4)">
                  Continuar — {{ selectedDay()!.label }} {{ selectedDay()!.sub }} a las {{ selectedSlot() }}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              }
            }
          </div>
        }

        <!-- ══ PASO 3: Profesional ══ -->
        @if (currentStep() === 3) {
          <div class="card" style="animation:fadeInUp .3s ease">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
              <button (click)="goBack()" class="btn btn-secondary btn-sm" style="display:inline-flex;align-items:center;flex-shrink:0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div>
                <h2 style="font-size:1.05rem;font-weight:800">¿Con quién querés atenderte?</h2>
                <p style="color:var(--purple);font-size:13px;font-weight:600;margin-top:1px">{{ selectedService()!.name }} · {{ selectedDay()!.label }} {{ selectedDay()!.sub }} {{ selectedSlot() }}</p>
              </div>
            </div>

            <!-- Cualquier profesional -->
            <button (click)="selectedStaff.set(null)"
              style="display:flex;align-items:center;gap:14px;width:100%;padding:14px;border-radius:12px;border:2px solid;cursor:pointer;text-align:left;margin-bottom:8px;transition:all .18s;font-family:inherit;background:white"
              [style.borderColor]="selectedStaff() === null ? 'var(--purple)' : 'var(--form-border)'"
              [style.background]="selectedStaff() === null ? 'var(--form-bg)' : 'white'">
              <div style="width:48px;height:48px;border-radius:50%;background:var(--gradient);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:white">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:14px;color:#1a1a2e">Cualquier profesional</div>
                <div style="color:#888;font-size:13px;margin-top:2px">El primero disponible</div>
              </div>
              @if (selectedStaff() === null) {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              }
            </button>

            <!-- Lista de staff -->
            @for (s of staffList(); track s.id) {
              <button (click)="selectedStaff.set(s)"
                style="display:flex;align-items:center;gap:14px;width:100%;padding:14px;border-radius:12px;border:2px solid;cursor:pointer;text-align:left;margin-bottom:8px;transition:all .18s;font-family:inherit"
                [style.borderColor]="selectedStaff()?.id === s.id ? 'var(--purple)' : 'var(--form-border)'"
                [style.background]="selectedStaff()?.id === s.id ? 'var(--form-bg)' : 'white'">
                @if (s.photoURL) {
                  <img [src]="s.photoURL" style="width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0" />
                } @else {
                  <div style="width:48px;height:48px;border-radius:50%;background:var(--btn-secondary-bg);color:var(--purple);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;flex-shrink:0">
                    {{ s.name.charAt(0).toUpperCase() }}
                  </div>
                }
                <div style="flex:1">
                  <div style="font-weight:700;font-size:14px;color:#1a1a2e">{{ s.name }}</div>
                  @if (s.phone) {
                    <div style="color:#888;font-size:13px;margin-top:2px">{{ s.phone }}</div>
                  }
                </div>
                @if (selectedStaff()?.id === s.id) {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                }
              </button>
            }

            <button class="btn btn-primary" style="width:100%;margin-top:12px" (click)="currentStep.set(4)">
              Continuar
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        }

        <!-- ══ PASO 4: Datos + Pago ══ -->
        @if (currentStep() === 4) {
          <div class="card" style="animation:fadeInUp .3s ease">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
              <button (click)="goBack()" class="btn btn-secondary btn-sm" style="display:inline-flex;align-items:center;flex-shrink:0">
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

            @if (authSvc.isLoggedIn()) {
              <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:10px 14px;margin-bottom:16px;display:flex;align-items:center;gap:8px;font-size:13px;color:#166534">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Agendar como <strong style="margin-left:4px">{{ authSvc.displayName() }}</strong>
              </div>
            }
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
              (click)="confirm()" [disabled]="!clientName || !clientPhone || !selectedPayment() || booking()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {{ booking() ? 'Reservando...' : 'Confirmar y enviar por WhatsApp' }}
            </button>
            <p class="text-muted" style="text-align:center;margin-top:10px;font-size:12px">
              Se abrirá WhatsApp con el mensaje listo para enviar
            </p>
          </div>
        }

        <!-- ══ PASO 5: Confirmado ══ -->
        @if (currentStep() === 5) {
          <div class="card" style="text-align:center;padding:48px 32px;animation:fadeInUp .35s ease">
            <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#d1fae5,#a7f3d0);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;color:#065f46">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style="font-size:1.5rem;font-weight:800;color:#065f46;margin-bottom:8px">Solicitud enviada</h2>
            <p style="color:#555;margin-bottom:4px">
              <strong>{{ selectedService()!.name }}</strong> — {{ selectedDay()!.label }} {{ selectedDay()!.sub }} a las <strong>{{ selectedSlot() }}</strong>
            </p>
            <p class="text-muted" style="margin-bottom:28px">{{ company()!.name }}</p>

            <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:16px 20px;text-align:left;margin-bottom:24px">
              <p style="font-size:12px;font-weight:700;color:#166534;letter-spacing:.05em;margin-bottom:8px">MENSAJE ENVIADO A WHATSAPP</p>
              <p style="font-size:13px;color:#166534;line-height:1.7;white-space:pre-line;font-family:monospace">{{ whatsappPreview() }}</p>
            </div>

            <div class="step4-actions" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
              <button class="btn btn-secondary" (click)="reset()">Agendar otra cita</button>
              @if (company()!.phone) {
                <a [href]="whatsappUrl()" target="_blank"
                   class="btn" style="background:#25d366;color:white;box-shadow:0 4px 14px rgba(37,211,102,.3);display:inline-flex;align-items:center;gap:6px">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Abrir WhatsApp
                </a>
              }
            </div>
          </div>
        }

      }
    </div>

    @if (authSvc.isLoggedIn() && authSvc.role() === 'client') {
      @if (!chatOpen()) {
        <button (click)="openChat()"
          style="position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:var(--gradient);border:none;cursor:pointer;box-shadow:0 4px 16px rgba(var(--primary-rgb),.35);display:flex;align-items:center;justify-content:center;z-index:100;color:white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
      } @else {
        <div style="position:fixed;bottom:24px;right:24px;width:340px;height:460px;background:white;border-radius:18px;box-shadow:0 8px 40px rgba(0,0,0,.18);display:flex;flex-direction:column;z-index:100;overflow:hidden">
          <div style="padding:16px 18px;background:var(--gradient);display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-size:14px;font-weight:700;color:white">{{ company()?.name }}</div>
              <a [routerLink]="['/cliente/mensajes']"
                 [queryParams]="{companyId: company()?.id, companyName: company()?.name}"
                 style="font-size:11px;color:rgba(255,255,255,.8);text-decoration:underline">
                Ver historial completo
              </a>
            </div>
            <button (click)="closeChat()" style="background:rgba(255,255,255,.2);border:none;border-radius:8px;width:30px;height:30px;cursor:pointer;color:white;display:flex;align-items:center;justify-content:center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px">
            @if (chatMessages().length === 0) {
              <div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:#aaa">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span style="font-size:13px">Iniciá la conversación</span>
              </div>
            }
            @for (m of chatMessages(); track m.id) {
              <div [style.align-self]="m.senderRole === 'client' ? 'flex-end' : 'flex-start'"
                   style="max-width:80%">
                <div [style.background]="m.senderRole === 'client' ? 'var(--gradient)' : '#f5f0ff'"
                     [style.color]="m.senderRole === 'client' ? 'white' : '#1a1a2e'"
                     style="padding:8px 12px;border-radius:12px;font-size:13px;line-height:1.5">
                  {{ m.text }}
                </div>
              </div>
            }
          </div>
          <div style="padding:12px 14px;border-top:1.5px solid #f0ebff;display:flex;gap:8px">
            <input [value]="chatText()" (input)="chatText.set($any($event.target).value)"
                   (keydown.enter)="sendChat()"
                   placeholder="Escribí un mensaje..."
                   style="flex:1;padding:10px 14px;border:1.5px solid #ede9fe;border-radius:10px;font-size:13px;outline:none;font-family:inherit" />
            <button (click)="sendChat()" [disabled]="!chatText().trim() || chatSending()"
                    style="background:var(--gradient);border:none;border-radius:10px;width:38px;height:38px;cursor:pointer;color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      }
    }

    <style>
      @keyframes toast-in {
        from { opacity:0; transform: translateX(-50%) translateY(-10px); }
        to   { opacity:1; transform: translateX(-50%) translateY(0); }
      }
    </style>
  `,
})
export class CompanyProfileComponent implements OnInit, OnDestroy {
  private route      = inject(ActivatedRoute);
  private companySvc = inject(CompanyService);
  private catalogSvc = inject(ServiceCatalogService);
  private aptSvc     = inject(AppointmentService);
  readonly authSvc   = inject(AuthService);
  private staffSvc   = inject(StaffService);
  private notifSvc   = inject(NotificationService);
  private msgService = inject(MessageService);

  isClientBlocked = computed(() =>
    this.authSvc.role() === 'client' && this.authSvc.profile()?.isActive === false
  );

  company  = signal<Company | null>(null);
  services = signal<ServiceItem[]>([]);
  loading  = signal(true);

  readonly paymentMethods = PAYMENT_METHODS;
  readonly days = buildDays(8);

  currentStep      = signal(1);
  selectedService  = signal<ServiceItem | null>(null);
  selectedDay      = signal<any>(null);
  selectedSlot     = signal<string | null>(null);
  selectedPayment  = signal<string | null>(null);
  showUnavailable  = signal(false);
  loadingSlots     = signal(false);
  booking          = signal(false);
  bookingError     = signal('');
  existingApts     = signal<any[]>([]);
  staffList        = signal<StaffMember[]>([]);
  selectedStaff    = signal<StaffMember | null>(null);
  loadingStaff     = signal(false);

  companyColor = computed(() => this.company()?.logoColor ?? '#7c3aed');
  companyCategory = computed(() => {
    const cat = this.company()?.category;
    const labels: Record<string, string> = { salon: 'Salón de belleza', barberia: 'Barbería', spa: 'Spa', peluqueria: 'Peluquería' };
    return cat ? (labels[cat] ?? cat) : '';
  });

  allSlots = computed(() => {
    const day     = this.selectedDay();
    const company = this.company();
    const svc     = this.selectedService();
    if (!day || !company || !svc) return [];

    const key           = DAY_KEYS[day.dayOfWeek];
    const interval      = company.slotInterval ?? 30;
    const duration      = svc.duration ?? interval;
    const selectedStaff = this.selectedStaff();
    const apts          = selectedStaff
      ? this.existingApts().filter(a => a.staffId === selectedStaff.id)
      : this.existingApts();
    const staffCount = selectedStaff ? 1 : (svc.staffCount ?? 1);

    let ranges: { open: string; close: string }[];
    if (selectedStaff?.schedule) {
      const staffDay = selectedStaff.schedule[key];
      if (!staffDay?.enabled) return [];
      ranges = [{ open: staffDay.open, close: staffDay.close }];
    } else {
      if (!company.schedule?.length) return [];
      const sched = company.schedule.find(d => d.key === key);
      if (!sched?.enabled || !sched.ranges?.length) return [];
      ranges = sched.ranges;
    }

    const slots: string[] = [];
    for (const range of ranges) {
      slots.push(...this.aptSvc.calculateAvailableSlots(
        range.open, range.close, interval, duration, staffCount, apts
      ));
    }

    // Para el día de hoy, filtrar slots que ya pasaron (con 10 min de buffer)
    const todayIso = new Date().toISOString().split('T')[0];
    if (day.date === todayIso) {
      const now    = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      return slots.filter(s => {
        const [h, m] = s.split(':').map(Number);
        return h * 60 + m + 10 > nowMin;
      });
    }

    return slots;
  });

  steps = [
    { n: 1, label: 'Servicio' },
    { n: 2, label: 'Fecha/Hora' },
    { n: 3, label: 'Profesional' },
    { n: 4, label: 'Datos' },
    { n: 5, label: 'Listo' },
  ];

  clientName  = '';
  clientPhone = '';
  clientNote  = '';

  chatOpen     = signal(false);
  chatMessages = signal<Message[]>([]);
  chatText     = signal('');
  chatSending  = signal(false);
  private chatSub: Subscription | null = null;

  constructor() {
    effect(() => {
      const p = this.authSvc.profile();
      if (!p) return;
      if (!this.clientName)  this.clientName  = p.displayName ?? '';
      if (!this.clientPhone) this.clientPhone = p.phone ?? '';
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

  stepClass(n: number) {
    if (this.currentStep() > n) return 'done';
    if (this.currentStep() === n) return 'active';
    return 'idle';
  }

  isTaken(_slot: string): boolean { return false; }

  alertUnavailable() {
    this.showUnavailable.set(true);
    setTimeout(() => this.showUnavailable.set(false), 3000);
  }

  selectService(s: ServiceItem) {
    this.selectedService.set(s);
    this.staffList.set([]);
    this.selectedStaff.set(null);
    const cid = this.company()?.id;
    if (cid) {
      this.staffSvc.getStaffForService(cid, s.id!).then(staff => this.staffList.set(staff));
    }
  }

  async selectDay(day: any) {
    this.selectedDay.set(day);
    this.selectedSlot.set(null);
    const cid = this.company()?.id;
    if (!cid) return;
    this.loadingSlots.set(true);
    try {
      const apts = await this.aptSvc.getByCompanyAndDate(cid, day.date);
      this.existingApts.set(apts);
    } finally {
      this.loadingSlots.set(false);
    }
  }

  selectSlot(slot: string) { this.selectedSlot.set(slot); }
  goBack() {
    const s = this.currentStep();
    if (s === 4 && this.staffList().length === 0) {
      this.currentStep.set(2);
    } else {
      this.currentStep.update(n => n - 1);
    }
  }

  whatsappPreview = computed(() => {
    if (!this.selectedService() || !this.selectedDay() || !this.selectedSlot()) return '';
    const svc = this.selectedService()!;
    const day = this.selectedDay()!;
    return `Hola, soy *${this.clientName || 'Cliente'}*

Quiero agendar mi cita en *${this.company()?.name ?? ''}*

Servicio:  *${svc.name}* (${svc.duration} min)
Fecha:     *${day.label} ${day.sub}*
Hora:      *${this.selectedSlot()}*
${this.selectedStaff() ? `Profesional: *${this.selectedStaff()!.name}*\n` : ''}Total:     *$${(svc.price ?? 0).toLocaleString('es-CO')}*
Pago:      *${this.selectedPayment() ?? ''}*
${this.clientNote ? `\nNota: ${this.clientNote}` : ''}
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
        clientName:      this.clientName,
        clientPhone:     this.clientPhone,
        clientEmail:     this.authSvc.profile()?.email,
        clientId:        uid,
        isGuestClient:   !uid,
        clientNote:      this.clientNote.trim() || undefined,
        date:            day.date,
        startTime:       slot,
        endTime,
        price:           svc.price,
        staffId:         staffMember?.id,
        staffName:       staffMember?.name,
        source:          'app',
      }, staffMember ? 1 : (svc.staffCount ?? 1), this.company()?.autoConfirm ?? false);

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
          body: `${this.clientName} · ${svc2.name} · ${day2.label} ${day2.sub} ${slot2}`,
          link: '/empresa/dashboard',
        }).catch(() => {});
      }

      if (this.company()?.phone) {
        setTimeout(() => window.open(this.whatsappUrl(), '_blank'), 400);
      }
    } catch (e: any) {
      if (e.message === 'SLOT_TAKEN') {
        this.bookingError.set('Ese turno ya fue tomado. Por favor elegí otro horario.');
        const day = this.selectedDay();
        if (day) {
          this.aptSvc.getByCompanyAndDate(cid, day.date).then(apts => this.existingApts.set(apts));
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

  openChat() {
    const companyId = this.company()?.id;
    const clientId = this.authSvc.currentUser()?.uid;
    if (!companyId || !clientId) return;
    this.chatOpen.set(true);
    this.chatSub?.unsubscribe();
    this.chatSub = this.msgService.watchMessages(companyId, clientId).subscribe(msgs => {
      this.chatMessages.set(msgs);
    });
  }

  closeChat() {
    this.chatOpen.set(false);
    this.chatSub?.unsubscribe();
    this.chatSub = null;
  }

  async sendChat() {
    const text = this.chatText().trim();
    if (!text) return;
    const companyId = this.company()?.id;
    const user = this.authSvc.currentUser();
    if (!companyId || !user) return;
    this.chatSending.set(true);
    this.chatText.set('');
    const clientName = user.displayName ?? this.authSvc.profile()?.displayName ?? user.email ?? '';
    try {
      await this.msgService.sendMessage({
        companyId,
        companyName: this.company()?.name ?? '',
        clientId: user.uid,
        clientName,
        senderRole: 'client',
        text,
      });
    } catch {
      this.chatText.set(text);
    } finally {
      this.chatSending.set(false);
    }
  }

  ngOnDestroy() {
    this.chatSub?.unsubscribe();
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
    this.clientNote = '';
    const p = this.authSvc.profile();
    this.clientName  = p?.displayName ?? '';
    this.clientPhone = p?.phone ?? '';
  }
}
