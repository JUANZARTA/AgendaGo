import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationBellComponent } from '../../shared/components/notification-bell.component';

interface NavItem {
  label: string;
  route: string;
  icon: 'bar-chart' | 'home' | 'users';
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationBellComponent],
  template: `
    <div class="shell">

      <!-- ── SIDEBAR (desktop) ───────────────────────────────────── -->
      <aside class="sidebar">

        <!-- Branding -->
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
          <div class="logo-text-group">
            <span class="logo-text">Agenda Co</span>
            <span class="logo-sub">Admin Panel</span>
          </div>
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
                  @case ('bar-chart') {
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6"  y1="20" x2="6"  y2="14"/>
                  }
                  @case ('home') {
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  }
                  @case ('users') {
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  }
                }
              </svg>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          }
        </nav>

        <!-- Admin info -->
        <div class="admin-info">
          <app-notification-bell recipientId="admin" />
          <span class="admin-email">{{ authSvc.currentUser()?.email }}</span>
          <button class="logout-btn" (click)="logout()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesión
          </button>
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
                @case ('bar-chart') {
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6"  y1="20" x2="6"  y2="14"/>
                }
                @case ('home') {
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                }
                @case ('users') {
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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
      background: var(--sidebar-bg);
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

    .logo-text-group {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .logo-text {
      font-size: 1.05rem;
      font-weight: 700;
      background: var(--sidebar-logo-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }

    .logo-sub {
      font-size: 0.65rem;
      font-weight: 600;
      color: rgba(160, 160, 184, 0.7);
      letter-spacing: 0.08em;
      text-transform: uppercase;
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
      background: var(--gradient);
      color: #ffffff;
      box-shadow: 0 4px 14px var(--nav-active-shadow);
    }

    .nav-item--active:hover {
      background: var(--gradient);
    }

    .nav-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .nav-label {
      white-space: nowrap;
    }

    /* Admin info */
    .admin-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 16px 12px 4px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      margin-top: auto;
    }

    .admin-email {
      font-size: 0.75rem;
      font-weight: 500;
      color: #a0a0b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 8px 12px;
      color: #a0a0b8;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: all 0.18s;
      margin-top: 6px;
      font-family: inherit;
    }

    .logout-btn:hover {
      background: rgba(239, 68, 68, 0.12);
      border-color: rgba(239, 68, 68, 0.3);
      color: #ef4444;
    }

    /* ── Main content ───────────────────────────────────────────── */
    .content {
      flex: 1;
      overflow-y: auto;
      background: var(--body-bg);
      animation: fadeInUp 0.35s ease 0.1s backwards;
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
export class AdminShellComponent {
  readonly authSvc = inject(AuthService);
  private router   = inject(Router);

  logout() {
    this.authSvc.logout().subscribe();
    this.router.navigate(['/auth/login']);
  }

  readonly navItems: NavItem[] = [
    { label: 'Métricas', route: '/admin/metricas', icon: 'bar-chart' },
    { label: 'Empresas', route: '/admin/empresas', icon: 'home'      },
    { label: 'Usuarios', route: '/admin/usuarios', icon: 'users'     },
  ];
}
