import { Component, input } from '@angular/core';
import { AdminNavIconName } from './admin-nav-item.model';

/**
 * Formas SVG de los íconos de navegación del admin.
 * Se usa como atributo sobre el <svg> del padre (`<svg [appAdminNavIcon]="icon">`),
 * así el <svg> (clases, tamaño, stroke) sigue perteneciendo al template padre.
 */
@Component({
  selector: 'svg[appAdminNavIcon]',
  standalone: true,
  template: `
    @switch (icon()) {
      @case ('bar-chart') {
        <svg:line x1="18" y1="20" x2="18" y2="10"/>
        <svg:line x1="12" y1="20" x2="12" y2="4"/>
        <svg:line x1="6"  y1="20" x2="6"  y2="14"/>
      }
      @case ('home') {
        <svg:path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <svg:polyline points="9 22 9 12 15 12 15 22"/>
      }
      @case ('users') {
        <svg:path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <svg:circle cx="9" cy="7" r="4"/>
        <svg:path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <svg:path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      }
      @case ('credit-card') {
        <svg:rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <svg:line x1="1" y1="10" x2="23" y2="10"/>
      }
      @case ('message') {
        <svg:path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      }
      @case ('settings') {
        <svg:circle cx="12" cy="12" r="3"/>
        <svg:path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      }
    }
  `,
})
export class AdminNavIconComponent {
  readonly icon = input.required<AdminNavIconName>({ alias: 'appAdminNavIcon' });
}
