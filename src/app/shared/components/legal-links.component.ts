import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Links a Términos y condiciones (/terminos) y Política de privacidad (/privacidad).
 * - variant 'card': tarjeta "Legal" para perfiles y Configuración.
 * - variant 'footer': línea chica centrada para el pie de las páginas públicas.
 */
@Component({
  selector: 'app-legal-links',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    :host { display: block; }
    .legal-card { margin-top: 20px; }
    .legal-card:hover { transform: none; }
    .legal-title { font-size: 1rem; font-weight: 800; color: #1a1a2e; margin: 0 0 4px; }
    .legal-sub { font-size: 12px; color: #888; margin: 0 0 14px; line-height: 1.5; }
    .legal-list { display: flex; flex-direction: column; gap: 8px; }
    .legal-link {
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      padding: 11px 14px; border-radius: 10px; border: 1.5px solid #f0ebff; background: #faf8ff;
      font-size: 13.5px; font-weight: 700; color: var(--purple); text-decoration: none;
      transition: background .15s, border-color .15s;
    }
    .legal-link:hover { background: #f3eeff; border-color: #ddd6fe; }
    .legal-footer {
      text-align: center; font-size: 12px; color: #a0a0b8; padding: 24px 16px 32px; line-height: 1.8;
    }
    .legal-footer a { color: #8b8ba7; font-weight: 600; text-decoration: none; }
    .legal-footer a:hover { color: var(--purple); text-decoration: underline; }
    .dot { margin: 0 8px; }
  `],
  template: `
    @if (variant() === 'card') {
      <section class="card legal-card">
        <h2 class="legal-title">Legal</h2>
        <p class="legal-sub">Cómo funciona el servicio y cómo cuidamos tus datos personales.</p>
        <div class="legal-list">
          <a class="legal-link" routerLink="/terminos">Términos y condiciones <span aria-hidden="true">›</span></a>
          <a class="legal-link" routerLink="/privacidad">Política de privacidad <span aria-hidden="true">›</span></a>
        </div>
      </section>
    } @else {
      <footer class="legal-footer">
        © {{ year }} AgendaCo
        <span class="dot" aria-hidden="true">·</span><a routerLink="/terminos">Términos y condiciones</a>
        <span class="dot" aria-hidden="true">·</span><a routerLink="/privacidad">Política de privacidad</a>
      </footer>
    }
  `,
})
export class LegalLinksComponent {
  readonly variant = input<'card' | 'footer'>('card');
  readonly year = new Date().getFullYear();
}
