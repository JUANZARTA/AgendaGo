import { Component, computed, input } from '@angular/core';

/**
 * Logo de AgendaCo (calendario con check y "A"). Mismo dibujo que public/images/logo*.svg.
 *  - variant 'tile': cuadrado redondeado con el degradé de la marca y la marca en blanco.
 *  - variant 'mark': sólo la marca, del color del texto (currentColor) → blanco en sidebars, color en fondos claros.
 */
@Component({
  selector: 'app-brand-logo',
  standalone: true,
  styles: [`:host { display: inline-flex; flex-shrink: 0; line-height: 0; } svg { display: block; }`],
  template: `
    @if (variant() === 'tile') {
      <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 1254 1254" role="img" aria-label="AgendaCo">
        <defs>
          <linearGradient [attr.id]="gid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#1d5cf5"/><stop offset="1" stop-color="#5658f8"/>
          </linearGradient>
          <mask [attr.id]="mid"><rect width="1254" height="1254" fill="#fff"/>
            <path d="M470 322V393M773 322V393M860 668L965 900" stroke="#000" stroke-width="122" stroke-linecap="round"/></mask>
        </defs>
        <rect width="1254" height="1254" rx="282" [attr.fill]="'url(#' + gid + ')'"/>
        <g transform="translate(627 627) scale(0.92) translate(-649 -609)" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
          <g [attr.mask]="'url(#' + mid + ')'">
            <path d="M910 640V495Q910 410 825 410H418Q333 410 333 495V808Q333 893 418 893H690L860 668" stroke-width="90"/>
            <rect x="333" y="410" width="577" height="85" fill="#fff" stroke="none"/>
          </g>
          <path d="M470 322V393M773 322V393" stroke-width="86"/>
          <path d="M690 893L860 668L965 900" stroke-width="86"/>
          <path d="M490 662L578 748L738 590" stroke-width="78"/>
        </g>
      </svg>
    } @else {
      <svg [attr.width]="size()" [attr.height]="markHeight()" viewBox="285 276 726 666" role="img" aria-label="AgendaCo">
        <defs>
          <mask [attr.id]="mid"><rect x="0" y="0" width="1254" height="1254" fill="#fff"/>
            <path d="M470 322V393M773 322V393M860 668L965 900" stroke="#000" stroke-width="122" stroke-linecap="round"/></mask>
        </defs>
        <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <g [attr.mask]="'url(#' + mid + ')'">
            <path d="M910 640V495Q910 410 825 410H418Q333 410 333 495V808Q333 893 418 893H690L860 668" stroke-width="90"/>
            <rect x="333" y="410" width="577" height="85" fill="currentColor" stroke="none"/>
          </g>
          <path d="M470 322V393M773 322V393" stroke-width="86"/>
          <path d="M690 893L860 668L965 900" stroke-width="86"/>
          <path d="M490 662L578 748L738 590" stroke-width="78"/>
        </g>
      </svg>
    }
  `,
})
export class BrandLogoComponent {
  readonly variant = input<'tile' | 'mark'>('tile');
  /** Ancho en px (en 'tile' también el alto). */
  readonly size = input(40);
  readonly markHeight = computed(() => Math.round(this.size() * 666 / 726));

  // ids únicos: varios logos en la misma página no deben compartir mask/gradient
  private static seq = 0;
  private readonly n = ++BrandLogoComponent.seq;
  readonly gid = `brand-bg-${this.n}`;
  readonly mid = `brand-cut-${this.n}`;
}
