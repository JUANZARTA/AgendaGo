import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AdminNavItem } from './admin-nav-item.model';
import { AdminNavIconComponent } from './admin-nav-icon.component';

/** Barra de navegación inferior (solo mobile). */
@Component({
  selector: 'app-admin-bottom-bar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AdminNavIconComponent],
  template: `
    <nav class="bottom-bar">
      @for (item of navItems(); track item.route) {
        <a
          class="bottom-item"
          [routerLink]="item.route"
          routerLinkActive="bottom-item--active"
          [routerLinkActiveOptions]="{ exact: false }"
        >
          <svg class="bottom-icon" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"
               [appAdminNavIcon]="item.icon"></svg>
          <span class="bottom-label">{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
  styles: [`
    :host { display: contents; }

    .bottom-bar {
      display: none;
    }

    @media (max-width: 768px) {
      .bottom-bar {
        display: flex;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #ffffff;
        box-shadow: 0 -1px 12px rgba(0, 0, 0, 0.08);
        z-index: 100;
        height: calc(64px + env(safe-area-inset-bottom));
        padding: 0 8px;
        padding-bottom: env(safe-area-inset-bottom);
      }

      .bottom-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        text-decoration: none;
        color: #a0a0b8;
        padding: 8px 4px;
        border-radius: 10px;
        transition: color 0.18s ease;
      }

      .bottom-item--active {
        color: var(--purple);
      }

      .bottom-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      .bottom-label {
        font-size: 0.65rem;
        font-weight: 600;
        letter-spacing: 0.01em;
        white-space: nowrap;
      }
    }
  `],
})
export class AdminBottomBarComponent {
  readonly navItems = input.required<AdminNavItem[]>();
}
