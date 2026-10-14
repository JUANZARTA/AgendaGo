import { Component, input } from '@angular/core';
import { NavIcon } from './nav-item.model';

/**
 * Formas SVG de los íconos de navegación.
 * Se usa como atributo sobre el <svg> del padre (`<svg [appNavIcon]="icon">`),
 * así el <svg> (clases, tamaño, stroke) sigue perteneciendo al template padre.
 */
@Component({
  selector: 'svg[appNavIcon]',
  standalone: true,
  template: `
    @switch (icon()) {
      @case ('grid') {
        <svg:rect x="3" y="3" width="7" height="7"/>
        <svg:rect x="14" y="3" width="7" height="7"/>
        <svg:rect x="14" y="14" width="7" height="7"/>
        <svg:rect x="3" y="14" width="7" height="7"/>
      }
      @case ('list') {
        <svg:line x1="8" y1="6" x2="21" y2="6"/>
        <svg:line x1="8" y1="12" x2="21" y2="12"/>
        <svg:line x1="8" y1="18" x2="21" y2="18"/>
        <svg:line x1="3" y1="6" x2="3.01" y2="6"/>
        <svg:line x1="3" y1="12" x2="3.01" y2="12"/>
        <svg:line x1="3" y1="18" x2="3.01" y2="18"/>
      }
      @case ('clock') {
        <svg:circle cx="12" cy="12" r="10"/>
        <svg:polyline points="12 6 12 12 16 14"/>
      }
      @case ('settings') {
        <svg:circle cx="12" cy="12" r="3"/>
        <svg:path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      }
      @case ('star') {
        <svg:polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      }
      @case ('credit-card') {
        <svg:rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <svg:line x1="1" y1="10" x2="23" y2="10"/>
      }
      @case ('users') {
        <svg:path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <svg:circle cx="9" cy="7" r="4"/>
        <svg:path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <svg:path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      }
      @case ('message') {
        <svg:path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      }
      @case ('bar-chart') {
        <svg:line x1="18" y1="20" x2="18" y2="10"/>
        <svg:line x1="12" y1="20" x2="12" y2="4"/>
        <svg:line x1="6" y1="20" x2="6" y2="14"/>
      }
    }
  `,
})
export class NavIconComponent {
  readonly icon = input.required<NavIcon>({ alias: 'appNavIcon' });
}
