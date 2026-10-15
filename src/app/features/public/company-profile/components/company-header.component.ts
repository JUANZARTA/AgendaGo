import { Component, computed, input } from '@angular/core';
import { Company } from '../../../../core/services/company.service';
import { BookingStepperComponent } from './booking-stepper.component';
import { FavoriteHeartComponent } from '../../../../shared/components/favorite-heart.component';
import { companyLogo } from '../../../../core/domain/company-logo';

/** Cabecera de la empresa (logo, nombre, descripción) + indicador de pasos. */
@Component({
  selector: 'app-cp-company-header',
  standalone: true,
  imports: [BookingStepperComponent, FavoriteHeartComponent],
  styles: [`:host { display: block; }`],
  template: `
        <div class="card" [style.borderTop]="'4px solid ' + companyColor()" style="padding:0;overflow:hidden;margin-bottom:20px">
          <div [style.background]="companyColor() + '12'" style="padding:24px">
            <div style="display:flex;gap:16px;align-items:center">
              <div style="width:72px;height:72px;border-radius:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden"
                   [style.background]="company().logoUrl ? 'transparent' : companyColor() + '22'"
                   [style.color]="companyColor()">
                @if (company().logoUrl) {
                  <img [src]="company().logoUrl!" alt="logo"
                       style="width:100%;height:100%;object-fit:cover;border-radius:18px" />
                } @else {
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path [attr.d]="logoIconPath()"/>
                  </svg>
                }
              </div>
              <div style="flex:1;min-width:0">
                <h1 style="font-size:1.5rem;font-weight:800;overflow-wrap:anywhere">{{ company().name }}</h1>
                <p style="font-weight:600;font-size:13px;margin-top:2px" [style.color]="companyColor()">{{ companyCategory() }}</p>
              </div>
              @if (company().id) {
                <app-favorite-heart [companyId]="company().id!" [size]="42" style="align-self:flex-start" />
              }
            </div>
            <p style="color:#555;line-height:1.6;margin-top:14px;font-size:14px">{{ company().description }}</p>
          </div>

          <!-- Stepper -->
          <app-cp-booking-stepper [currentStep]="currentStep()" />
        </div>
  `,
})
export class CompanyHeaderComponent {
  company = input.required<Company>();
  companyColor = input.required<string>();
  companyCategory = input.required<string>();
  currentStep = input.required<number>();
  /** Ícono elegido por el negocio (o el del rubro si no eligió nada). */
  logoIconPath = computed(() => companyLogo(this.company()).iconPath);
}
