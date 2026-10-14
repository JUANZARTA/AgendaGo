import { Component, computed, inject, output } from '@angular/core';
import { AppConfigService } from '../../../core/services/app-config.service';
import { mailtoLink, whatsappLink } from '../../../core/domain/app-config';

/** Número que estaba fijo antes de config/app.support: se usa sólo si el admin no configuró uno. */
const LEGACY_WHATSAPP = '573128622945';
const WA_TEXT = '?text=Hola%2C%20necesito%20ayuda%20con%20mi%20cuenta%20de%20empresa%20en%20AgendaCo';

/** Modal bloqueante: empresa deshabilitada. */
@Component({
  selector: 'app-disabled-account-modal',
  standalone: true,
  template: `
    <div style="position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:24px;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)">
      <div style="max-width:440px;width:100%;background:white;border-radius:20px;padding:40px 32px;text-align:center;box-shadow:0 16px 60px rgba(0,0,0,.2);border-top:4px solid #ef4444">
        <div style="width:64px;height:64px;border-radius:50%;background:#fee2e2;display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h2 style="font-size:1.2rem;font-weight:800;color:#1a1a2e;margin-bottom:10px">Tu empresa está deshabilitada</h2>
        <p style="font-size:14px;color:#666;line-height:1.6;margin-bottom:28px">
          Tu cuenta fue suspendida temporalmente. Podés renovar tu plan o contactar al administrador para resolverlo.
        </p>
        <div style="display:flex;flex-direction:column;gap:10px">
          <button (click)="billingClick.emit()"
            style="width:100%;padding:13px;border-radius:12px;border:none;background:var(--gradient);color:white;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 14px rgba(var(--primary-rgb),.3)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            Renovar plan
          </button>
          <a [href]="waHref()" target="_blank" rel="noopener"
            style="width:100%;padding:13px;border-radius:12px;background:#25d366;color:white;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;box-shadow:0 4px 14px rgba(37,211,102,.3)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Contactar administrador
          </a>
          @if (mailHref(); as href) {
            <a [href]="href"
              style="width:100%;padding:11px;border-radius:12px;border:1.5px solid #ddd6fe;background:#f5f3ff;color:#6d28d9;font-size:13px;font-weight:700;font-family:inherit;text-decoration:none;display:block">
              Escribir a {{ email() }}
            </a>
          }
          <button (click)="logoutClick.emit()"
            style="width:100%;padding:11px;border-radius:12px;border:1.5px solid #e5e7eb;background:none;font-size:13px;font-weight:600;color:#888;cursor:pointer;font-family:inherit">
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: contents; }`],
})
export class DisabledAccountModalComponent {
  private appConfig = inject(AppConfigService);

  readonly email    = computed(() => this.appConfig.config().support.email.trim());
  readonly mailHref = computed(() => mailtoLink(this.email()));
  /** WhatsApp de soporte configurado por el admin (o el histórico si no hay). */
  readonly waHref   = computed(() =>
    (whatsappLink(this.appConfig.config().support.whatsapp) ?? whatsappLink(LEGACY_WHATSAPP)) + WA_TEXT);
  readonly billingClick = output<void>();
  readonly logoutClick  = output<void>();
}
