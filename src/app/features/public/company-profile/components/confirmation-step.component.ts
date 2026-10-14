import { Component, input, output } from '@angular/core';
import { ServiceItem } from '../../../../core/services/service-catalog.service';
import { DayOption } from '../company-profile.utils';

/** Paso 5: confirmación de la solicitud. */
@Component({
  selector: 'app-cp-confirmation-step',
  standalone: true,
  styles: [`
    :host { display: block; }

    @media (max-width: 480px) {
      .step4-actions { flex-direction: column !important; align-items: stretch !important; }
      .step4-actions .btn { width: 100% !important; justify-content: center !important; }
    }
  `],
  template: `
          <div class="card" style="text-align:center;padding:48px 32px;animation:fadeInUp .35s ease">
            <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#d1fae5,#a7f3d0);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;color:#065f46">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style="font-size:1.5rem;font-weight:800;color:#065f46;margin-bottom:8px">Solicitud enviada</h2>
            <p style="color:#555;margin-bottom:4px">
              <strong>{{ selectedService()!.name }}</strong> — {{ selectedDay()!.label }} {{ selectedDay()!.sub }} a las <strong>{{ selectedSlot() }}</strong>
            </p>
            <p class="text-muted" style="margin-bottom:28px">{{ companyName() }}</p>

            <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:16px 20px;text-align:left;margin-bottom:24px">
              <p style="font-size:12px;font-weight:700;color:#166534;letter-spacing:.05em;margin-bottom:8px">MENSAJE ENVIADO A WHATSAPP</p>
              <p style="font-size:13px;color:#166534;line-height:1.7;white-space:pre-line;font-family:monospace">{{ whatsappPreview() }}</p>
            </div>

            <div class="step4-actions" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
              <button class="btn btn-secondary" (click)="restart.emit()">Agendar otra cita</button>
              @if (companyPhone()) {
                <a [href]="whatsappUrl()" target="_blank"
                   class="btn" style="background:#25d366;color:white;box-shadow:0 4px 14px rgba(37,211,102,.3);display:inline-flex;align-items:center;gap:6px">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Abrir WhatsApp
                </a>
              }
            </div>
          </div>
  `,
})
export class ConfirmationStepComponent {
  selectedService = input.required<ServiceItem | null>();
  selectedDay = input.required<DayOption | null>();
  selectedSlot = input<string | null>(null);
  companyName = input('');
  companyPhone = input<string | undefined>('');
  whatsappPreview = input('');
  whatsappUrl = input('');

  restart = output<void>();
}
