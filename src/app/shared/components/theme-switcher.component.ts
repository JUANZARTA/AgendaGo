import { Component, inject } from '@angular/core';
import { ThemeService, THEMES, Theme } from '../../core/services/theme.service';

const PRIMARY: Record<Theme, string> = {
  azul:    '#2563eb',
  violeta: '#7c3aed',
  dorado:  '#d97706',
  oceano:  '#0891b2',
};

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  styles: [`
    .switcher {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .dot {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      outline: none;
      padding: 0;
      flex-shrink: 0;
    }
    .dot:hover { transform: scale(1.25); }
    .dot:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
  `],
  template: `
    <div class="switcher" role="group" aria-label="Tema de color">
      @for (t of themes; track t.id) {
        <button
          class="dot"
          [style.background]="t.gradient"
          [style.box-shadow]="svc.current() === t.id
            ? '0 0 0 2px white, 0 0 0 4px ' + primary(t.id)
            : 'none'"
          [style.transform]="svc.current() === t.id ? 'scale(1.15)' : ''"
          [title]="t.label"
          (click)="svc.apply(t.id)"
        ></button>
      }
    </div>
  `,
})
export class ThemeSwitcherComponent {
  svc    = inject(ThemeService);
  themes = THEMES;

  primary(id: Theme): string {
    return PRIMARY[id];
  }
}
