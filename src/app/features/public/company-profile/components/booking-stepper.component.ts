import { Component, input } from '@angular/core';

/** Indicador de pasos del flujo de reserva. */
@Component({
  selector: 'app-cp-booking-stepper',
  standalone: true,
  styles: [`
    :host { display: block; }

    @media (max-width: 640px) {
      .step-dot { width: 22px !important; height: 22px !important; font-size: 11px !important; }
      .step-label { display: none !important; }
    }
  `],
  template: `
          <div style="padding:14px 24px;border-top:1.5px solid #f0e8ff;display:flex;align-items:center;background:white">
            @for (step of steps; track step.n; let i = $index) {
              <div style="display:flex;align-items:center;flex:1;min-width:0">
                <div class="step-dot" [class]="stepClass(step.n)">
                  @if (currentStep() > step.n) {
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  } @else { {{ step.n }} }
                </div>
                <span class="step-label" style="font-size:11px;font-weight:600;margin-left:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
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
  `,
})
export class BookingStepperComponent {
  currentStep = input.required<number>();

  steps = [
    { n: 1, label: 'Servicio' },
    { n: 2, label: 'Fecha/Hora' },
    { n: 3, label: 'Profesional' },
    { n: 4, label: 'Datos' },
    { n: 5, label: 'Listo' },
  ];

  stepClass(n: number) {
    if (this.currentStep() > n) return 'done';
    if (this.currentStep() === n) return 'active';
    return 'idle';
  }
}
