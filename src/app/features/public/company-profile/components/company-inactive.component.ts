import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Company } from '../../../../core/services/company.service';
import { categoryMeta } from '../../../../core/domain/categories';
import { whatsappLink } from '../../../../core/domain/app-config';
import { instagramUrl } from '../../../../core/domain/safe-links';

/**
 * El negocio no recibe reservas (suscripción vencida o deshabilitado por el admin).
 * Mensaje NEUTRO (no se menciona el pago: no le arruinamos la imagen al negocio) y el cliente
 * sigue teniendo cómo contactarlo directo: WhatsApp / llamada / Instagram del NEGOCIO.
 * Sin teléfono: se le ofrecen otros negocios del mismo rubro.
 */
@Component({
  selector: 'app-cp-company-inactive',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    :host { display: contents; }
    .ci-card { text-align: center; padding: 36px 28px; }
    .ci-logo {
      width: 76px; height: 76px; border-radius: 20px; margin: 0 auto 14px; overflow: hidden;
      display: flex; align-items: center; justify-content: center; color: white;
    }
    .ci-logo img { width: 100%; height: 100%; object-fit: cover; }
    .ci-name { font-size: 1.25rem; font-weight: 900; color: #1a1a2e; margin: 0 0 4px; }
    .ci-meta { font-size: 13px; color: #888; margin: 0 0 22px; }
    .ci-box {
      background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 14px; padding: 16px 18px;
      margin: 0 auto 22px; max-width: 440px;
    }
    .ci-title { font-size: 15px; font-weight: 800; color: #92400e; margin: 0 0 4px; }
    .ci-text  { font-size: 13.5px; color: #78350f; line-height: 1.6; margin: 0; }
    .ci-actions { display: flex; flex-direction: column; gap: 10px; max-width: 340px; margin: 0 auto; }
    .ci-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 13px 20px;
      border-radius: 12px; font-size: 14px; font-weight: 700; text-decoration: none; font-family: inherit;
    }
    .ci-btn--wa  { background: #25d366; color: white; box-shadow: 0 4px 14px rgba(37,211,102,.3); }
    .ci-btn--alt { background: white; color: #374151; border: 1.5px solid #e5e7eb; }
    .ci-btn--alt:hover { background: #f9fafb; }
    .ci-btn--brand { background: var(--gradient); color: white; }
    @media (max-width: 480px) { .ci-card { padding: 28px 18px; } }
  `],
  template: `
    <div class="card ci-card">
      <div class="ci-logo" [style.background]="company().logoUrl ? 'white' : meta().color">
        @if (company().logoUrl) {
          <img [src]="company().logoUrl" [alt]="company().name" />
        } @else {
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path [attr.d]="meta().icon"/></svg>
        }
      </div>
      <h2 class="ci-name">{{ company().name }}</h2>
      <p class="ci-meta">
        {{ meta().label }}@if (place()) { · {{ place() }} }
      </p>

      <div class="ci-box">
        <p class="ci-title">Las reservas online no están disponibles en este momento</p>
        <p class="ci-text">
          @if (wa() || tel()) {
            Podés comunicarte directamente con {{ company().name }} para agendar tu cita.
          } @else {
            Mientras tanto, podés buscar otros negocios de {{ meta().label.toLowerCase() }} cerca tuyo.
          }
        </p>
      </div>

      <div class="ci-actions">
        @if (wa(); as link) {
          <a class="ci-btn ci-btn--wa" [href]="link" target="_blank" rel="noopener">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Escribir por WhatsApp
          </a>
        }
        @if (tel(); as t) {
          <a class="ci-btn ci-btn--alt" [href]="t">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Llamar
          </a>
        }
        @if (instagram(); as ig) {
          <a class="ci-btn ci-btn--alt" [href]="ig" target="_blank" rel="noopener">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            Instagram
          </a>
        }
        @if (!wa() && !tel()) {
          <a class="ci-btn ci-btn--brand" routerLink="/" [queryParams]="{ rubro: company().category }">
            Ver otros negocios de {{ meta().label.toLowerCase() }}
          </a>
        }
      </div>
    </div>
  `,
})
export class CompanyInactiveComponent {
  readonly company = input.required<Company>();

  readonly meta  = computed(() => categoryMeta(this.company().category));
  readonly place = computed(() => [this.company().address, this.company().city].filter(Boolean).join(', '));

  readonly wa = computed(() => {
    const base = whatsappLink(this.company().phone);
    if (!base) return null;
    const text = `Hola ${this.company().name}, quería agendar una cita. Vi tu página en AgendaCo.`;
    return `${base}?text=${encodeURIComponent(text)}`;
  });

  readonly tel = computed(() => {
    const digits = (this.company().phone ?? '').replace(/\D/g, '');
    return digits ? `tel:+${digits.length === 10 && digits.startsWith('3') ? '57' + digits : digits}` : null;
  });

  /** Sólo perfiles de instagram.com: una URL cualquiera cargada por la empresa no se convierte en link. */
  readonly instagram = computed(() => instagramUrl(this.company().instagram));
}
