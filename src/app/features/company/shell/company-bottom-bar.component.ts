import { Component, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavIconComponent } from './nav-icon.component';
import { NavItem } from './nav-item.model';

/** Barra inferior móvil: 4 ítems principales + hoja "Más". */
@Component({
  selector: 'app-company-bottom-bar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NavIconComponent],
  template: `
    <nav class="bottom-bar">
      <!-- 4 main items -->
      @for (item of mainItems(); track item.route) {
        <a class="bottom-item" [id]="'cnav-m-' + item.icon" [routerLink]="item.route"
           routerLinkActive="bottom-item--active"
           [routerLinkActiveOptions]="{ exact: false }">
          <svg class="bottom-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               [appNavIcon]="item.icon"></svg>
          <span class="bottom-label">{{ item.label }}</span>
          @if (dotRoutes().includes(item.route)) { <span class="nav-dot nav-dot--bottom" aria-label="Novedades"></span> }
        </a>
      }
      <!-- Más -->
      <button id="cnav-m-more" class="bottom-item" [class.bottom-item--active]="moreMenuOpen()"
              (click)="moreMenuOpen.update(v => !v)" style="border:none;background:none;cursor:pointer;font-family:inherit">
        <svg class="bottom-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>
        </svg>
        <span class="bottom-label">Más</span>
      </button>

      <!-- More sheet -->
      @if (moreMenuOpen()) {
        <div style="position:fixed;inset:0;z-index:149" (click)="moreMenuOpen.set(false)"></div>
        <div class="more-sheet">
          <!-- Notificaciones -->
          <button class="more-item" style="border:none;background:none;cursor:pointer;font-family:inherit;width:100%;text-align:left"
                  (click)="moreMenuOpen.set(false); notificationsOpen.emit()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span style="flex:1">Notificaciones</span>
            @if (unreadCount() > 0) {
              <span style="background:#f43f5e;color:white;border-radius:99px;font-size:10px;font-weight:700;padding:1px 6px;min-width:16px;text-align:center">
                {{ unreadCount() }}
              </span>
            }
          </button>
          @for (item of extraItems(); track item.route) {
            <a class="more-item" [routerLink]="item.route" (click)="moreMenuOpen.set(false)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                   [appNavIcon]="item.icon"></svg>
              {{ item.label }}
            </a>
          }
        </div>
      }
    </nav>
  `,
  styles: [`
    :host { display: contents; }

    .bottom-item { position: relative; }
    .nav-dot {
      position: absolute;
      top: 8px;
      left: 29px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--purple);
      box-shadow: 0 0 0 2px var(--sidebar-bg);
      pointer-events: none;
    }
    .nav-dot--bottom { top: 6px; left: calc(50% + 6px); box-shadow: 0 0 0 2px #ffffff; }

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

      .more-sheet {
        position: fixed;
        bottom: calc(68px + env(safe-area-inset-bottom));
        right: 8px;
        background: white;
        border-radius: 14px;
        box-shadow: 0 8px 32px rgba(0,0,0,.14);
        z-index: 150;
        overflow: hidden;
        min-width: 180px;
        border: 1px solid #f0ebff;
      }

      .more-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 13px 18px;
        text-decoration: none;
        color: #374151;
        font-size: 14px;
        font-weight: 600;
        border-bottom: 1px solid #f7f5ff;
        transition: background .12s;
      }
      .more-item:last-child { border-bottom: none; }
      .more-item:hover { background: #faf8ff; color: var(--purple); }
    }
  `],
})
export class CompanyBottomBarComponent {
  readonly mainItems   = input.required<NavItem[]>();
  readonly extraItems  = input.required<NavItem[]>();
  readonly dotRoutes   = input.required<string[]>();
  readonly unreadCount = input.required<number>();
  readonly notificationsOpen = output<void>();

  readonly moreMenuOpen = signal(false);
}
