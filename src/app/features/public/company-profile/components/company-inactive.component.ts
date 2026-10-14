import { Component } from '@angular/core';

/** Tarjeta que se muestra cuando la empresa está desactivada. */
@Component({
  selector: 'app-cp-company-inactive',
  standalone: true,
  styles: [`:host { display: contents; }`],
  template: `
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
  `,
})
export class CompanyInactiveComponent {}
