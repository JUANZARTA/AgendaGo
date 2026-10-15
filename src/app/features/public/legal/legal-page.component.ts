import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AppConfigService } from '../../../core/services/app-config.service';
import { renderLegalText } from '../../../core/domain/legal';
import { PublicNavComponent } from '../../../shared/components/public-nav.component';
import { LegalLinksComponent } from '../../../shared/components/legal-links.component';

export type LegalKind = 'terms' | 'privacy';

const TITLES: Record<LegalKind, string> = {
  terms: 'Términos y condiciones',
  privacy: 'Política de privacidad',
};

/**
 * Páginas públicas /terminos y /privacidad (sin guard). El texto sale de config/app.legal
 * (o del borrador por defecto) y se muestra como TEXTO PLANO con saltos de línea: nunca innerHTML.
 */
@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [PublicNavComponent, LegalLinksComponent, RouterLink],
  styles: [`
    :host { display: block; }
    .legal-wrap { max-width: 820px; margin: 0 auto; padding: 32px 20px 0; }
    .legal-doc:hover { transform: none; }
    .legal-doc { padding: 32px 28px; }
    .legal-h1 { font-size: 1.5rem; font-weight: 900; color: #1a1a2e; margin: 0 0 6px; }
    .legal-meta { font-size: 12.5px; color: #a0a0b8; margin: 0 0 24px; }
    .legal-text {
      white-space: pre-line; overflow-wrap: anywhere; font-size: 14px; line-height: 1.75; color: #374151;
    }
    .legal-back {
      display: inline-flex; align-items: center; gap: 6px; margin: 0 0 14px; padding: 8px 14px;
      border-radius: 10px; border: 1.5px solid #e5e7eb; background: white; cursor: pointer;
      font-size: 13px; font-weight: 700; color: var(--purple); font-family: inherit;
    }
    .legal-back:hover { background: var(--btn-secondary-bg); }
    .legal-other { margin-top: 18px; font-size: 13px; color: #888; text-align: center; }
    .legal-other a { color: var(--purple); font-weight: 700; }
    @media (max-width: 480px) {
      .legal-wrap { padding: 16px 12px 0; }
      .legal-doc { padding: 22px 16px; }
    }
  `],
  template: `
    <app-public-nav />
    <main class="legal-wrap">
      <button type="button" class="legal-back" (click)="back()">← Volver</button>
      <article class="card legal-doc">
        <h1 class="legal-h1">{{ title() }}</h1>
        <p class="legal-meta">
          @if (updatedAt(); as d) { Última actualización: {{ d }} } @else { AgendaCo }
        </p>
        <div class="legal-text">{{ text() }}</div>
      </article>
      <p class="legal-other">
        @if (kind() === 'terms') {
          Mira también la <a routerLink="/privacidad">Política de privacidad</a>.
        } @else {
          Mira también los <a routerLink="/terminos">Términos y condiciones</a>.
        }
      </p>
    </main>
    <app-legal-links variant="footer" />
  `,
})
export class LegalPageComponent {
  private route = inject(ActivatedRoute);
  private appConfig = inject(AppConfigService);
  private location  = inject(Location);
  private router    = inject(Router);

  /** Vuelve a donde estaba; si se abrió en pestaña nueva (desde el registro) no hay historial: al inicio. */
  back(): void {
    if (window.history.length > 1) this.location.back();
    else this.router.navigate(['/']);
  }

  readonly kind = toSignal(
    this.route.data.pipe(map(d => (d['kind'] === 'privacy' ? 'privacy' : 'terms') as LegalKind)),
    { initialValue: 'terms' as LegalKind },
  );

  readonly title = computed(() => TITLES[this.kind()]);

  readonly text = computed(() => {
    const cfg = this.appConfig.config();
    const raw = this.kind() === 'privacy' ? cfg.legal.privacy : cfg.legal.terms;
    return renderLegalText(raw, cfg.support.email);
  });

  readonly updatedAt = computed(() => {
    const d = this.appConfig.config().legal.updatedAt;
    return d ? d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  });
}
