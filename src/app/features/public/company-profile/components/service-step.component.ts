import { Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ServiceItem } from '../../../../core/services/service-catalog.service';

/** Paso 1: elegir servicio. */
@Component({
  selector: 'app-cp-service-step',
  standalone: true,
  imports: [DecimalPipe],
  styles: [`
    :host { display: block; }

    .service-btn {
      display:flex; align-items:center; justify-content:space-between; gap:12px;
      padding:16px; border-radius:12px; border:2px solid var(--form-border); background:white;
      cursor:pointer; text-align:left; width:100%; transition:all .18s;
    }
    .service-btn:hover { border-color:rgba(var(--primary-rgb), .5); background:var(--form-bg); }
    .service-btn:focus-visible { outline:3px solid rgba(var(--primary-rgb), .3); outline-offset:2px; }
    .service-btn:focus:not(:focus-visible) { outline:none; }
    .service-btn.selected {
      border-color:var(--purple); background:rgba(var(--primary-rgb), .07);
      box-shadow:0 0 0 3px rgba(var(--primary-rgb), .15);
    }
    .service-check {
      width:22px; height:22px; border-radius:50%; flex-shrink:0;
      border:2px solid var(--form-border); display:inline-flex; align-items:center; justify-content:center;
      color:white; transition:all .18s;
    }
    .service-btn.selected .service-check { background:var(--purple); border-color:var(--purple); }

    @media (max-width: 360px) {
      .service-btn { padding: 12px 10px !important; }
    }
  `],
  template: `
          <div class="card" style="animation:fadeInUp .3s ease">
            <h2 style="font-size:1.05rem;font-weight:800;margin-bottom:4px">¿Qué servicio necesitás?</h2>
            <p class="text-muted" style="margin-bottom:16px">Seleccioná uno para ver disponibilidad</p>

            @if (services().length === 0) {
              <div style="text-align:center;padding:24px;color:#aaa">Este negocio aún no publicó servicios.</div>
            } @else {
              <div style="display:flex;flex-direction:column;gap:10px">
                @for (s of services(); track s.id) {
                  <button type="button" class="service-btn" (click)="serviceSelect.emit(s)"
                    [class.selected]="selectedService()?.id === s.id"
                    [attr.aria-pressed]="selectedService()?.id === s.id">
                    <span class="service-check" aria-hidden="true">
                      @if (selectedService()?.id === s.id) {
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      }
                    </span>
                    <div style="flex:1;min-width:0">
                      <div style="font-weight:700;font-size:15px;color:#1a1a2e">{{ s.name }}</div>
                      <div style="color:#888;font-size:13px;margin-top:3px">{{ s.description }}</div>
                      <div style="display:inline-flex;align-items:center;gap:4px;margin-top:6px;color:#a0a0b8;font-size:12px">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {{ s.duration }} min
                      </div>
                    </div>
                    <div style="text-align:right;flex-shrink:0;margin-left:4px">
                      <div style="font-weight:800;font-size:17px;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
                        $ {{ (s.price ?? 0) | number }}
                      </div>
                    </div>
                  </button>
                }
              </div>

              @if (selectedService()) {
                <button class="btn btn-primary" style="width:100%;margin-top:20px" (click)="next.emit()">
                  Elegir fecha y hora
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              }
            }
          </div>
  `,
})
export class ServiceStepComponent {
  services = input.required<ServiceItem[]>();
  selectedService = input<ServiceItem | null>(null);
  serviceSelect = output<ServiceItem>();
  next = output<void>();
}
