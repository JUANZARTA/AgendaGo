import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: 'grid' | 'list' | 'clock' | 'settings';
}

@Component({
  selector: 'app-company-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">

      <!-- ── SIDEBAR (desktop) ───────────────────────────────────── -->
      <aside class="sidebar">

        <!-- Logo -->
        <div class="logo">
          <svg class="logo-icon" viewBox="0 0 24 24" fill="none"
               stroke="white" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <circle cx="6" cy="6" r="3"/>
            <circle cx="18" cy="6" r="3"/>
            <line x1="8.5" y1="8.5" x2="18" y2="18"/>
            <line x1="5.5" y1="8.5" x2="15" y2="18"/>
            <line x1="12" y1="16" x2="12" y2="22"/>
          </svg>
          <span class="logo-text">Agenda Co</span>
        </div>

        <!-- Navigation -->
        <nav class="nav">
          @for (item of navItems; track item.route) {
            <a
              class="nav-item"
              [routerLink]="item.route"
              routerLinkActive="nav-item--active"
              [routerLinkActiveOptions]="{ exact: false }"
            >
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                @switch (item.icon) {
                  @case ('grid') {
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                  }
                  @case ('list') {
                    <line x1="8" y1="6" x2="21" y2="6"/>
                    <line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                  }
                  @case ('clock') {
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  }
                  @case ('settings') {
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  }
                }
              </svg>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          }
        </nav>

        <!-- Company info -->
        <div class="company-info">
          <span class="company-name">Barberia El Padrino</span>
          <span class="company-badge">Trial · 23 dias</span>
        </div>

      </aside>

      <!-- ── MAIN CONTENT ────────────────────────────────────────── -->
      <main class="content">
        <router-outlet/>
      </main>

      <!-- ── BOTTOM BAR (mobile) ────────────────────────────────── -->
      <nav class="bottom-bar">
        @for (item of navItems; track item.route) {
          <a
            class="bottom-item"
            [routerLink]="item.route"
            routerLinkActive="bottom-item--active"
            [routerLinkActiveOptions]="{ exact: false }"
          >
            <svg class="bottom-icon" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              @switch (item.icon) {
                @case ('grid') {
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                }
                @case ('list') {
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                }
                @case ('clock') {
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                }
                @case ('settings') {
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                }
              }
            </svg>
            <span class="bottom-label">{{ item.label }}</span>
          </a>
        }
      </nav>

    </div>
  `,
  styles: [`
    /* ── Keyframes ─────────────────────────────────────────────── */
    @keyframes fadeInLeft {
      from { opacity: 0; transform: translateX(-24px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Shell ──────────────────────────────────────────────────── */
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* ── Sidebar ────────────────────────────────────────────────── */
    .sidebar {
      width: 220px;
      min-width: 220px;
      background: #1a1a2e;
      border-right: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      flex-direction: column;
      padding: 24px 12px 20px;
      gap: 8px;
      animation: fadeInLeft 0.35s ease both;
    }

    /* Logo */
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 8px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      margin-bottom: 8px;
    }

    .logo-icon {
      width: 28px;
      height: 28px;
      flex-shrink: 0;
    }

    .logo-text {
      font-size: 1.05rem;
      font-weight: 700;
      background: linear-gradient(135deg, #a78bfa, #f43f5e);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.02em;
    }

    /* Nav */
    .nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      color: #a0a0b8;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: background 0.18s ease, color 0.18s ease;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }

    .nav-item--active {
      background: linear-gradient(135deg, #7c3aed, #f43f5e);
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);
    }

    .nav-item--active:hover {
      background: linear-gradient(135deg, #7c3aed, #f43f5e);
    }

    .nav-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .nav-label {
      white-space: nowrap;
    }

    /* Company info */
    .company-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 16px 12px 4px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      margin-top: auto;
    }

    .company-name {
      font-size: 0.8rem;
      font-weight: 600;
      color: #e2e2f0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .company-badge {
      font-size: 0.7rem;
      font-weight: 600;
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 20px;
      padding: 2px 10px;
      width: fit-content;
      letter-spacing: 0.02em;
    }

    /* ── Main content ───────────────────────────────────────────── */
    .content {
      flex: 1;
      overflow-y: auto;
      background: linear-gradient(160deg, #fdf4ff 0%, #f0f4ff 100%);
      animation: fadeInUp 0.35s ease 0.1s both;
    }

    /* ── Bottom bar (mobile only) ───────────────────────────────── */
    .bottom-bar {
      display: none;
    }

    /* ── Responsive ─────────────────────────────────────────────── */
    @media (max-width: 768px) {
      .sidebar {
        display: none;
      }

      .shell {
        flex-direction: column;
      }

      .content {
        flex: 1;
        padding-bottom: 72px;
      }

      .bottom-bar {
        display: flex;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #ffffff;
        box-shadow: 0 -1px 12px rgba(0, 0, 0, 0.08);
        z-index: 100;
        height: 64px;
        padding: 0 8px;
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
        color: #7c3aed;
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
export class CompanyShellComponent {
  readonly navItems: NavItem[] = [
    { label: 'Dashboard', route: '/empresa/dashboard', icon: 'grid'     },
    { label: 'Servicios', route: '/empresa/servicios',  icon: 'list'     },
    { label: 'Horarios',  route: '/empresa/horarios',   icon: 'clock'    },
    { label: 'Perfil',    route: '/empresa/perfil',     icon: 'settings' },
  ];
}
