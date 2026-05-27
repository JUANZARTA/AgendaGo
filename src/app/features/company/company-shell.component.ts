import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription as RxSubscription } from 'rxjs';
import { ThemeSwitcherComponent } from '../../shared/components/theme-switcher.component';
import { CompanyStore } from '../../core/services/company-store.service';
import { CompanyOnboardingComponent } from './onboarding/company-onboarding.component';
import { AuthService } from '../../core/services/auth.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { NotificationService, AppNotification } from '../../core/services/notification.service';

interface NavItem {
  label: string;
  route: string;
  icon: 'grid' | 'list' | 'clock' | 'settings' | 'star' | 'credit-card' | 'users' | 'message';
}

@Component({
  selector: 'app-company-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ThemeSwitcherComponent, CompanyOnboardingComponent],
  template: `
    @if (companyStore.loading()) {
      <!-- Pantalla de carga inicial -->
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--body-bg)">
        <div style="text-align:center">
          <div class="spinner"></div>
          <p style="color:#888;font-size:14px;margin-top:16px">Cargando...</p>
        </div>
      </div>

    } @else if (!companyStore.company()) {
      <!-- Primera vez: wizard de configuración -->
      <app-company-onboarding />

    } @else {
      <!-- Shell normal con sidebar -->
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
                    @case ('star') {
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    }
                    @case ('credit-card') {
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                      <line x1="1" y1="10" x2="23" y2="10"/>
                    }
                    @case ('users') {
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    }
                    @case ('message') {
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    }
                  }
                </svg>
                <span class="nav-label">{{ item.label }}</span>
              </a>
            }
          </nav>

          <!-- Notificaciones -->
          <button class="nav-item" (click)="notifPanelOpen.set(!notifPanelOpen())"
                  style="border:none;background:none;width:100%;cursor:pointer;font-family:inherit;text-align:left">
            <span style="position:relative;display:flex;align-items:center;justify-content:center;width:18px;height:18px;flex-shrink:0">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              @if (unreadCount() > 0) {
                <span style="position:absolute;top:-6px;right:-8px;min-width:16px;height:16px;background:#f43f5e;color:white;border-radius:99px;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 3px;pointer-events:none">
                  {{ unreadCount() > 99 ? '99+' : unreadCount() }}
                </span>
              }
            </span>
            <span class="nav-label">Notificaciones</span>
          </button>

          <!-- Company info -->
          <div class="company-info">
            <span class="company-name">{{ companyStore.company()?.name }}</span>
            @if (sub()?.status === 'active') {
              <span class="company-badge company-badge--active">Plan activo</span>
            } @else if (sub()?.status === 'expired') {
              <span class="company-badge company-badge--expired">Suscripción vencida</span>
            } @else {
              <span class="company-badge">Trial · {{ subDaysLeft() }} días</span>
            }
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

        <!-- ── MOBILE HEADER (hidden on desktop) ────────────────────── -->
        <header class="mobile-header">
          <div style="width:36px;height:36px;border-radius:10px;background:var(--gradient);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(var(--primary-rgb),.3);flex-shrink:0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><line x1="18" y1="9" x2="18" y2="21"/><line x1="18" y1="3" x2="6" y2="15"/></svg>
          </div>
          <span style="font-weight:900;font-size:1.05rem;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">Agenda Co</span>
          <div style="flex:1"></div>
          <!-- Campana -->
          <button class="mh-icon-btn" (click)="notifPanelOpen.set(!notifPanelOpen())" style="position:relative">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            @if (unreadCount() > 0) {
              <span style="position:absolute;top:-3px;right:-3px;background:#f43f5e;color:white;border-radius:99px;font-size:9px;font-weight:700;padding:1px 4px;min-width:14px;text-align:center">{{ unreadCount() }}</span>
            }
          </button>
          <!-- Salir -->
          <button class="mh-icon-btn" title="Cerrar sesión" (click)="logout()">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
          <!-- Avatar → perfil empresa -->
          <a routerLink="/empresa/perfil" class="mh-avatar" title="Configuración">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </a>
        </header>

        <!-- ── MAIN CONTENT ────────────────────────────────────────── -->
        <main class="content">
          <router-outlet/>
        </main>

        <!-- ── BOTTOM BAR (mobile) ────────────────────────────────── -->
        <nav class="bottom-bar">
          <!-- 4 main items -->
          @for (item of mainNavItems; track item.route) {
            <a class="bottom-item" [routerLink]="item.route"
               routerLinkActive="bottom-item--active"
               [routerLinkActiveOptions]="{ exact: false }">
              <svg class="bottom-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                @switch (item.icon) {
                  @case ('grid') { <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/> }
                  @case ('list') { <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/> }
                  @case ('clock') { <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/> }
                  @case ('message') { <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/> }
                }
              </svg>
              <span class="bottom-label">{{ item.label }}</span>
            </a>
          }
          <!-- Más -->
          <button class="bottom-item" [class.bottom-item--active]="moreMenuOpen()"
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
                      (click)="moreMenuOpen.set(false); notifPanelOpen.set(true)">
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
              @for (item of extraNavItems; track item.route) {
                <a class="more-item" [routerLink]="item.route" (click)="moreMenuOpen.set(false)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    @switch (item.icon) {
                      @case ('settings') { <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/> }
                      @case ('users') { <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/> }
                      @case ('star') { <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/> }
                      @case ('credit-card') { <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/> }
                    }
                  </svg>
                  {{ item.label }}
                </a>
              }
            </div>
          }
        </nav>

        <!-- ── NOTIFICATION DRAWER ────────────────────────────────── -->
        @if (notifPanelOpen()) {
          <div style="position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:150" (click)="notifPanelOpen.set(false)"></div>
          <div style="position:fixed;top:0;right:0;height:100vh;width:360px;max-width:100vw;background:white;box-shadow:-8px 0 32px rgba(0,0,0,.15);z-index:151;display:flex;flex-direction:column;animation:slideInRight .25s ease">
            <!-- Header -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 20px 14px;border-bottom:1px solid #f0e8ff">
              <h3 style="margin:0;font-size:16px;font-weight:800;color:#1a1a2e">Notificaciones</h3>
              <div style="display:flex;gap:8px;align-items:center">
                <button (click)="markAllRead()" [disabled]="unreadCount() === 0"
                  style="font-size:12px;font-weight:600;color:var(--purple);background:none;border:none;cursor:pointer;padding:0;font-family:inherit"
                  [style.opacity]="unreadCount() === 0 ? '0.4' : '1'">
                  Leer todo
                </button>
                <button (click)="notifPanelOpen.set(false)"
                  style="width:28px;height:28px;border-radius:8px;border:none;background:#f5f0ff;color:var(--purple);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1">
                  ×
                </button>
              </div>
            </div>
            <!-- Lista -->
            <div style="flex:1;overflow-y:auto">
              @if (notifications().length === 0) {
                <div style="padding:48px 20px;text-align:center;color:#aaa;font-size:13px">Sin notificaciones aún</div>
              }
              @for (n of notifications(); track n.id) {
                <button (click)="markNotifRead(n)"
                  style="display:flex;gap:12px;padding:14px 20px;cursor:pointer;border:none;border-bottom:1px solid #fafafa;background:white;width:100%;text-align:left;font-family:inherit;align-items:flex-start;transition:background .12s"
                  [style.background]="n.read ? 'white' : '#fdf8ff'">
                  <div style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0" [class]="notifIconClass(n.type)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      @switch (n.type) {
                        @case ('new_appointment') {
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        }
                        @case ('appointment_confirmed') { <polyline points="20 6 9 17 4 12"/> }
                        @case ('appointment_cancelled') {
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        }
                        @case ('new_review') {
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        }
                        @case ('new_company') {
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          <polyline points="9 22 9 12 15 12 15 22"/>
                        }
                      }
                    </svg>
                  </div>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:13px;font-weight:700;color:#1a1a2e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ n.title }}</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ n.body }}</div>
                    <div style="font-size:11px;color:#aaa;margin-top:3px">{{ notifTimeAgo(n.createdAt) }}</div>
                  </div>
                  @if (!n.read) {
                    <div style="width:7px;height:7px;border-radius:50%;background:var(--purple);flex-shrink:0;margin-top:6px"></div>
                  }
                </button>
              }
            </div>
          </div>
        }

      </div>
    }
  `,
  styles: [`
    /* ── Keyframes ─────────────────────────────────────────────── */
    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }

    .icon-appointment { background: #ede9fe; color: #7c3aed; }
    .icon-confirmed   { background: #d1fae5; color: #065f46; }
    .icon-cancelled   { background: #fee2e2; color: #991b1b; }
    .icon-review      { background: #fef3c7; color: #92400e; }
    .icon-company     { background: #e0f2fe; color: #0369a1; }

    @keyframes fadeInLeft {
      from { opacity: 0; transform: translateX(-24px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 3px solid #ede9fe;
      border-top-color: var(--purple);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin: 0 auto;
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

    .logo-text {
      font-size: 1.05rem;
      font-weight: 700;
      background: var(--sidebar-logo-gradient);
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

    .company-badge--active {
      color: #10b981;
      background: rgba(16, 185, 129, 0.12);
      border-color: rgba(16, 185, 129, 0.25);
    }

    .company-badge--expired {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.12);
      border-color: rgba(239, 68, 68, 0.25);
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

    /* ── Mobile header (hidden on desktop) ─────────────────────── */
    .mobile-header {
      display: none;
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

      .mobile-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 16px;
        height: 60px;
        background: white;
        border-bottom: 1px solid #f0ebff;
        box-shadow: 0 2px 12px rgba(0,0,0,.06);
        flex-shrink: 0;
      }

      .mh-icon-btn {
        width: 36px; height: 36px;
        border-radius: 50%;
        border: 1.5px solid #e5e7eb;
        background: none;
        display: flex; align-items: center; justify-content: center;
        color: #888;
        cursor: pointer;
        flex-shrink: 0;
      }
      .mh-icon-btn:hover { border-color: var(--purple); color: var(--purple); }

      .mh-avatar {
        width: 36px; height: 36px;
        border-radius: 50%;
        background: var(--gradient);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 4px 10px rgba(var(--primary-rgb),.25);
        text-decoration: none;
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

      .more-sheet {
        position: fixed;
        bottom: 68px;
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
export class CompanyShellComponent implements OnDestroy {
  readonly companyStore        = inject(CompanyStore);
  private auth                 = inject(AuthService);
  private subscriptionService  = inject(SubscriptionService);
  private router               = inject(Router);
  private notifSvc             = inject(NotificationService);

  sub              = signal<{ status: 'trial' | 'active' | 'expired' | 'disabled' } | null>(null);
  notifPanelOpen   = signal(false);
  moreMenuOpen     = signal(false);
  notifications    = signal<AppNotification[]>([]);
  unreadCount      = computed(() => this.notifications().filter(n => !n.read).length);

  private rxSub: RxSubscription | null    = null;
  private notifSub: RxSubscription | null = null;

  constructor() {
    effect(() => {
      const companyId = this.companyStore.companyId();
      if (!companyId) return;

      this.rxSub?.unsubscribe();

      this.rxSub = this.subscriptionService.watchStatus(companyId).subscribe((subscription) => {
        this.sub.set(subscription);
      });
    });

    effect(() => {
      const owner = this.companyStore.company()?.ownerId;
      if (!owner) return;
      this.notifSub?.unsubscribe();
      this.notifSub = this.notifSvc.watch(owner).subscribe(list => {
        this.notifications.set(list.slice(0, 30));
      });
    });
  }

  subDaysLeft(): number {
    const s = this.sub();
    if (!s) return 30;
    return this.subscriptionService.daysRemaining(s as any);
  }

  ngOnDestroy(): void {
    this.rxSub?.unsubscribe();
    this.notifSub?.unsubscribe();
  }

  async markNotifRead(n: AppNotification): Promise<void> {
    if (!n.read && n.id) await this.notifSvc.markRead(n.id);
    this.notifPanelOpen.set(false);
    const dest = n.link ?? this.routeForNotifType(n.type);
    if (dest) this.router.navigateByUrl(dest);
  }

  private routeForNotifType(type: AppNotification['type']): string {
    switch (type) {
      case 'new_appointment':
      case 'appointment_confirmed':
      case 'appointment_cancelled': return '/empresa/dashboard';
      case 'new_review':            return '/empresa/resenas';
      default:                      return '/empresa/dashboard';
    }
  }

  async markAllRead(): Promise<void> {
    const owner = this.companyStore.company()?.ownerId;
    if (owner) await this.notifSvc.markAllRead(owner);
  }

  notifIconClass(type: AppNotification['type']): string {
    return ({
      new_appointment:       'icon-appointment',
      appointment_confirmed: 'icon-confirmed',
      appointment_cancelled: 'icon-cancelled',
      new_review:            'icon-review',
      new_company:           'icon-company',
    } as any)[type] ?? 'icon-appointment';
  }

  notifTimeAgo(ts: any): string {
    if (!ts?.seconds) return '';
    const diff = Math.floor(Date.now() / 1000) - ts.seconds;
    if (diff < 60)    return 'Ahora';
    if (diff < 3600)  return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} d`;
  }

  logout() {
    this.auth.logout().subscribe();
    this.router.navigate(['/auth/login']);
  }

  readonly navItems: NavItem[] = [
    { label: 'Dashboard',   route: '/empresa/dashboard',   icon: 'grid'        },
    { label: 'Servicios',   route: '/empresa/servicios',   icon: 'list'        },
    { label: 'Horarios',    route: '/empresa/horarios',    icon: 'clock'       },
    { label: 'Perfil',      route: '/empresa/perfil',      icon: 'settings'    },
    { label: 'Equipo',      route: '/empresa/equipo',      icon: 'users'       },
    { label: 'Reseñas',     route: '/empresa/resenas',     icon: 'star'        },
    { label: 'Mensajes',    route: '/empresa/mensajes',    icon: 'message'     },
    { label: 'Facturación', route: '/empresa/facturacion', icon: 'credit-card' },
  ];

  // Bottom bar mobile: 4 main + "Más"
  readonly mainNavItems: NavItem[] = [
    { label: 'Dashboard', route: '/empresa/dashboard', icon: 'grid'    },
    { label: 'Servicios', route: '/empresa/servicios', icon: 'list'    },
    { label: 'Horarios',  route: '/empresa/horarios',  icon: 'clock'   },
    { label: 'Mensajes',  route: '/empresa/mensajes',  icon: 'message' },
  ];

  readonly extraNavItems: NavItem[] = [
    { label: 'Perfil',      route: '/empresa/perfil',      icon: 'settings'    },
    { label: 'Equipo',      route: '/empresa/equipo',      icon: 'users'       },
    { label: 'Reseñas',     route: '/empresa/resenas',     icon: 'star'        },
    { label: 'Facturación', route: '/empresa/facturacion', icon: 'credit-card' },
  ];
}
