import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-dev-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="devbar">

      <!-- Brand -->
      <div class="devbar-brand">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        DEV
      </div>

      <!-- Primary views -->
      <div class="devbar-group">
        <a routerLink="/" routerLinkActive="dev-active" [routerLinkActiveOptions]="{exact:true}" class="dev-btn dev-btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Cliente
        </a>

        <a routerLink="/empresa/dashboard" routerLinkActive="dev-active" class="dev-btn dev-btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Empresa
        </a>

        <a routerLink="/admin/empresas" routerLinkActive="dev-active" class="dev-btn dev-btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Admin
        </a>
      </div>

      <!-- Divider -->
      <div class="devbar-divider"></div>

      <!-- Secondary links -->
      <div class="devbar-group devbar-secondary">
        <a routerLink="/auth/login" routerLinkActive="dev-active" class="dev-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          Login
        </a>
        <a routerLink="/auth/register" routerLinkActive="dev-active" class="dev-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          Registro
        </a>
        <a routerLink="/empresa/perfil" routerLinkActive="dev-active" class="dev-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Perfil
        </a>
        <a routerLink="/empresa/servicios" routerLinkActive="dev-active" class="dev-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          Servicios
        </a>
        <a routerLink="/empresa/horarios" routerLinkActive="dev-active" class="dev-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          Horarios
        </a>
        <a routerLink="/admin/usuarios" routerLinkActive="dev-active" class="dev-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Usuarios
        </a>
        <a routerLink="/admin/metricas" routerLinkActive="dev-active" class="dev-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          Métricas
        </a>
      </div>

      <!-- Badge -->
      <div class="devbar-badge">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        bypassAuth
      </div>
    </div>

    <style>
      @keyframes devbar-in {
        from { opacity: 0; transform: translateY(-100%); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .devbar {
        background: linear-gradient(90deg, #0f0020 0%, #1e0038 60%, #2d0050 100%);
        padding: 0 16px;
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        min-height: 46px;
        box-shadow: 0 2px 20px rgba(124,58,237,.5), 0 1px 0 rgba(255,255,255,.06) inset;
        animation: devbar-in 0.35s cubic-bezier(.22,1,.36,1) both;
        position: relative;
        z-index: 100;
      }

      .devbar-brand {
        display: flex;
        align-items: center;
        gap: 5px;
        color: #e879f9;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .12em;
        margin-right: 8px;
      }

      .devbar-group {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .devbar-secondary { flex-wrap: wrap; }

      .devbar-divider {
        width: 1px;
        height: 24px;
        background: rgba(255,255,255,.12);
        margin: 0 4px;
      }

      .dev-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 14px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 700;
        text-decoration: none;
        color: #c4b5fd;
        border: 1.5px solid rgba(124,58,237,.35);
        background: rgba(124,58,237,.08);
        transition: all .2s cubic-bezier(.22,1,.36,1);
        white-space: nowrap;
      }
      .dev-btn:hover {
        background: rgba(124,58,237,.25);
        border-color: rgba(124,58,237,.7);
        color: #fff;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(124,58,237,.3);
      }
      .dev-btn:active { transform: translateY(0); }

      .dev-link {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        text-decoration: none;
        color: #7c6fa8;
        transition: all .18s cubic-bezier(.22,1,.36,1);
        white-space: nowrap;
      }
      .dev-link:hover {
        background: rgba(255,255,255,.08);
        color: #c4b5fd;
        transform: translateY(-1px);
      }

      .dev-active {
        background: linear-gradient(135deg,#7c3aed,#f43f5e) !important;
        color: white !important;
        border-color: transparent !important;
        box-shadow: 0 4px 14px rgba(124,58,237,.4) !important;
        transform: none !important;
      }

      .devbar-badge {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        font-weight: 700;
        color: #f9a8d4;
        background: rgba(244,63,94,.15);
        border: 1px solid rgba(244,63,94,.3);
        padding: 4px 10px;
        border-radius: 20px;
        white-space: nowrap;
        animation: devbar-in 0.5s ease both;
      }
    </style>
  `,
})
export class DevNavComponent {}
