import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServiceItem } from '../../../../core/services/service-catalog.service';
import { OB_SHARED_STYLES } from '../onboarding.styles';
import { StepNavigation } from '../onboarding.constants';

@Component({
  selector: 'app-onboarding-services-step',
  standalone: true,
  imports: [FormsModule],
  styles: [OB_SHARED_STYLES, `
    :host { display: block; }
  `],
  template: `
    <!-- ══ PASO 6: ¿Configurar servicios? ══ -->
    @if (step() === 6) {
        <div class="anim">
          <button class="ob-btn-back" (click)="navigate.emit({ to: prevStep() })">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Volver
          </button>
  
          <div class="ob-step-label">Paso 4 de 4 — Servicios</div>
          <h1 class="ob-title">¿Configurás tus servicios ahora?</h1>
          <p class="ob-subtitle">Si preferís, podés hacerlo después desde el panel de Servicios</p>
  
          <div class="choice-grid">
            <!-- Configurar ahora -->
            <button class="choice-card primary-choice" (click)="navigate.emit({ to: 7 })">
              <div class="choice-icon" style="background:rgba(255,255,255,.2)">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <div class="choice-title">Configurar ahora</div>
              <div class="choice-desc">Agregá tus servicios con precio y duración</div>
            </button>
  
            <!-- Después -->
            <button class="choice-card" (click)="create.emit()" [disabled]="creating()">
              <div class="choice-icon" style="background:#f0e8ff">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div class="choice-title" style="color:#1a1a2e">
                {{ creating() ? 'Creando...' : 'Hacerlo después' }}
              </div>
              <div class="choice-desc">Empezar sin servicios configurados</div>
            </button>
          </div>
  
          @if (error()) { <div class="error-box" style="margin-top:16px">{{ error() }}</div> }
        </div>
    }

    <!-- ══ PASO 7: Editor de servicios ══ -->
    @if (step() === 7) {
        <div class="anim">
          <button class="ob-btn-back" (click)="navigate.emit({ to: 6 })">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Volver
          </button>
  
          <div class="ob-step-label">Paso 4 de 4 — Servicios</div>
          <h1 class="ob-title">Tus servicios</h1>
          <p class="ob-subtitle">Podés ajustar precios y detalles desde el panel de Servicios</p>
  
          <!-- Lista de servicios agregados -->
          @if (pendingServices().length > 0) {
            <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
              @for (s of pendingServices(); track $index) {
                <div style="display:flex;align-items:center;gap:10px;background:#f9f5ff;border:1.5px solid #f0e8ff;border-radius:12px;padding:10px 14px">
                  <div style="flex:1;min-width:0">
                    <div style="font-size:13px;font-weight:700;color:#1a1a2e">{{ s.name }}</div>
                    <div style="font-size:11px;color:#888;margin-top:2px">
                      {{ s.duration }} min
                      @if (s.price) {<span> - {{ '$' + s.price }}</span>}
                      @if (s.description) {<span> - {{ s.description }}</span>}
                    </div>
                  </div>
                  <button (click)="removed.emit($index)" style="background:none;border:none;cursor:pointer;color:#bbb;padding:4px;display:flex;align-items:center" title="Eliminar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              }
            </div>
          }
  
          <!-- Formulario inline para agregar servicio -->
          <div style="background:#fafafa;border:1.5px dashed #e5e7eb;border-radius:16px;padding:16px;margin-bottom:20px">
            <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px">Agregar servicio</div>
  
            <div class="ob-form-group" style="margin-bottom:10px">
              <input [(ngModel)]="newSvc().name" placeholder="Nombre del servicio *"
                style="width:100%;border:1.5px solid #e5e7eb;border-radius:10px;padding:10px 13px;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box" />
            </div>
  
            <div class="ob-form-group" style="margin-bottom:10px">
              <textarea [(ngModel)]="newSvc().description" placeholder="Descripción (opcional)"
                style="width:100%;border:1.5px solid #e5e7eb;border-radius:10px;padding:10px 13px;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box;resize:vertical;min-height:56px;line-height:1.5"></textarea>
            </div>
  
            <div class="grid-2" style="margin-bottom:10px">
              <div>
                <label style="font-size:12px;font-weight:700;color:#374151;display:block;margin-bottom:5px">Duración (minutos)</label>
                <div style="display:flex;align-items:center;border:1.5px solid #e5e7eb;border-radius:10px;overflow:hidden">
                  <input type="number" [(ngModel)]="newSvc().duration" min="5" step="5"
                    style="flex:1;border:none;padding:10px 13px;font-size:13px;font-family:inherit;outline:none;width:100%;box-sizing:border-box" />
                  <span style="padding:10px 11px;background:#f9f5ff;border-left:1.5px solid #e5e7eb;font-size:12px;color:#888;flex-shrink:0;user-select:none">min</span>
                </div>
                <p style="font-size:11px;color:#aaa;margin:4px 0 0">Recomendamos múltiplos de 15 (15, 30, 45, 60, 90, 120…)</p>
              </div>
              <div>
                <label style="font-size:12px;font-weight:700;color:#374151;display:block;margin-bottom:5px">Precio</label>
                <div style="display:flex;align-items:center;border:1.5px solid #e5e7eb;border-radius:10px;overflow:hidden">
                  <span style="padding:10px 11px;background:#f5f0ff;border-right:1.5px solid #e5e7eb;font-weight:700;color:var(--purple);font-size:14px;flex-shrink:0;user-select:none">$</span>
                  <input type="text" inputmode="numeric" [value]="newSvcPriceDisplay()" (input)="onPriceInput($event)" placeholder="0"
                    style="border:none;outline:none;padding:10px 11px;font-size:13px;font-family:inherit;flex:1;min-width:0;background:white;color:#1a1a2e" />
                </div>
              </div>
            </div>
  
            <div style="margin-bottom:14px">
              <label style="font-size:12px;font-weight:700;color:#374151;display:block;margin-bottom:5px">Profesionales necesarios</label>
              <input [(ngModel)]="newSvc().staffCount" type="number" min="1" max="10"
                style="width:80px;border:1.5px solid #e5e7eb;border-radius:10px;padding:10px 13px;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box" />
              <span style="font-size:12px;color:#aaa;margin-left:8px">persona(s) por turno</span>
            </div>
  
            <button (click)="addService()"
                    [disabled]="!newSvc().name.trim()"
                    [style.opacity]="!newSvc().name.trim() ? '0.5' : '1'"
                    style="display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:10px;border:none;background:var(--gradient);color:white;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Agregar
            </button>
          </div>
  
          @if (error()) { <div class="error-box">{{ error() }}</div> }
  
          <button class="ob-btn-primary" (click)="create.emit()" [disabled]="creating()">
            @if (creating()) {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Creando tu negocio...
            } @else {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {{ pendingServices().length > 0 ? 'Finalizar con ' + pendingServices().length + (pendingServices().length === 1 ? ' servicio' : ' servicios') : 'Finalizar configuración' }}
            }
          </button>
        </div>
    }
  `,
})
export class OnboardingServicesStepComponent {
  /** Sub-paso del contenedor: 6 = pregunta, 7 = editor */
  readonly step = input.required<number>();
  /** Paso al que vuelve el botón "Volver" de la pregunta (4 o 5) */
  readonly prevStep = input<number>(4);
  // El array vive en el contenedor (doCreate lo recorre): acá solo se lee; las mutaciones salen por outputs
  readonly pendingServices = input.required<Omit<ServiceItem, 'id'>[]>();
  readonly error = input<string>('');
  readonly creating = input<boolean>(false);

  readonly added = output<Omit<ServiceItem, 'id'>>();
  readonly removed = output<number>();
  readonly navigate = output<StepNavigation>();
  readonly create = output<void>();

  // Borradores: viven en el contenedor para sobrevivir a la navegación entre pasos
  readonly newSvc = model<{ name: string; description: string; duration: number; staffCount: number }>({ name: '', description: '', duration: 30, staffCount: 1 });
  readonly newSvcPriceDisplay = model<string>('');

  onPriceInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '');
    if (!raw) { this.newSvcPriceDisplay.set(''); input.value = ''; return; }
    const formatted = parseInt(raw, 10).toLocaleString('es-CO');
    this.newSvcPriceDisplay.set(formatted);
    input.value = formatted;
  }

  addService() {
    const name = this.newSvc().name.trim();
    if (!name) return;

    const service: Omit<ServiceItem, 'id'> = {
      name,
      duration:   this.newSvc().duration,
      staffCount: this.newSvc().staffCount || 1,
      isActive:   true,
    };
    const desc = this.newSvc().description.trim();
    if (desc) service.description = desc;
    const price = parseInt(this.newSvcPriceDisplay().replace(/\D/g, ''), 10);
    if (price > 0) service.price = price;

    this.added.emit(service);
    this.newSvc.set({ name: '', description: '', duration: 30, staffCount: 1 });
    this.newSvcPriceDisplay.set('');
  }
}
