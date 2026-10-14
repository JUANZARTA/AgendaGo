import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Navegación inferior (mobile) del área cliente con puntos de novedades (presentacional). */
@Component({
  selector: 'app-client-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
      <nav class="bottom-nav">
        <a id="ctour-buscar-mobile" routerLink="/" class="bn-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span>Buscar</span>
        </a>
        <a id="ctour-negocios-mobile" routerLink="/cliente/negocios" routerLinkActive="bn-item--active" class="bn-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span>Mis negocios</span>
        </a>
        <a id="ctour-citas-mobile" routerLink="/cliente/citas" routerLinkActive="bn-item--active" class="bn-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          @if (hasAptNews()) { <span class="nav-dot nav-dot--bottom" aria-label="Novedades"></span> }
          <span>Mis citas</span>
        </a>
        <a id="ctour-mensajes-mobile" routerLink="/cliente/mensajes" routerLinkActive="bn-item--active" class="bn-item" style="position:relative">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          @if (hasUnreadMessages()) { <span class="nav-dot nav-dot--bottom" aria-label="Mensajes sin leer"></span> }
          <span>Mensajes</span>
        </a>
        <a id="ctour-perfil-mobile" routerLink="/cliente/perfil" routerLinkActive="bn-item--active" class="bn-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Perfil</span>
        </a>
      </nav>
  `,
  styles: [`
    :host { display: contents; }

    /* Punto de novedades (estilo Messenger): toma el color del tema */
    .nav-dot {
      position: absolute;
      top: -3px; right: -3px;
      width: 11px; height: 11px;
      border-radius: 50%;
      background: var(--purple);
      box-shadow: 0 0 0 2px #ffffff;
      pointer-events: none;
    }

    /* ── Bottom nav (hidden on desktop) ──────── */
    .bottom-nav { display: none; }

    @media (max-width: 768px) {
      .bottom-nav {
        display: flex;
        position: fixed;
        bottom: 0; left: 0; right: 0;
        height: calc(64px + env(safe-area-inset-bottom));
        background: white;
        border-top: 1px solid #f0ebff;
        box-shadow: 0 -2px 16px rgba(0,0,0,.07);
        z-index: 100;
        padding: 0 4px;
        padding-bottom: env(safe-area-inset-bottom);
      }

      .bn-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        text-decoration: none;
        color: #aaa;
        font-size: 0.65rem;
        font-weight: 600;
        border-radius: 10px;
        transition: color .15s;
        position: relative;
      }
      .bn-item:hover { color: var(--purple); }
      .bn-item--active { color: var(--purple); }

      .nav-dot--bottom { top: 8px; right: calc(50% - 14px); width: 10px; height: 10px; }
    }
  `],
})
export class ClientBottomNavComponent {
  hasAptNews        = input<boolean>(false);
  hasUnreadMessages = input<boolean>(false);
}
