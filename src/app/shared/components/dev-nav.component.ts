import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dev-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav style="background:linear-gradient(135deg,#1e0038,#3d0057);padding:0 20px;display:flex;gap:4px;align-items:center;flex-wrap:wrap;font-family:sans-serif;font-size:13px;min-height:48px;box-shadow:0 2px 16px rgba(124,58,237,.4)">
      <span style="color:#f9a8d4;font-weight:800;margin-right:12px;font-size:14px;white-space:nowrap">✨ Agenda Co · DEV</span>

      <span style="color:#a78bfa;font-size:11px;margin-right:2px;font-weight:600">PÚBLICO</span>
      <a routerLink="/" routerLinkActive="nav-active" [routerLinkActiveOptions]="{exact:true}" class="nav-link">🔍 Búsqueda</a>
      <a routerLink="/auth/login" routerLinkActive="nav-active" class="nav-link">🔐 Login</a>
      <a routerLink="/auth/register" routerLinkActive="nav-active" class="nav-link">📝 Registro</a>

      <span style="color:#a78bfa;font-size:11px;margin:0 2px 0 10px;font-weight:600">CLIENTE</span>
      <a routerLink="/cliente" routerLinkActive="nav-active" class="nav-link">📅 Mis citas</a>

      <span style="color:#a78bfa;font-size:11px;margin:0 2px 0 10px;font-weight:600">EMPRESA</span>
      <a routerLink="/empresa/dashboard" routerLinkActive="nav-active" class="nav-link">📊 Dashboard</a>
      <a routerLink="/empresa/perfil" routerLinkActive="nav-active" class="nav-link">⚙ Perfil</a>
      <a routerLink="/empresa/servicios" routerLinkActive="nav-active" class="nav-link">✂ Servicios</a>
      <a routerLink="/empresa/horarios" routerLinkActive="nav-active" class="nav-link">🕐 Horarios</a>

      <span style="color:#a78bfa;font-size:11px;margin:0 2px 0 10px;font-weight:600">ADMIN</span>
      <a routerLink="/admin/empresas" routerLinkActive="nav-active" class="nav-link">🏪 Empresas</a>
      <a routerLink="/admin/usuarios" routerLinkActive="nav-active" class="nav-link">👤 Usuarios</a>
      <a routerLink="/admin/metricas" routerLinkActive="nav-active" class="nav-link">📈 Métricas</a>

      <span style="color:#f9a8d4;margin-left:auto;font-size:11px;background:rgba(244,63,94,.2);padding:3px 10px;border-radius:20px;white-space:nowrap">⚠ bypassAuth ON</span>
    </nav>

    <style>
      .nav-link {
        color: #e2d9f3;
        text-decoration: none;
        padding: 6px 10px;
        border-radius: 6px;
        transition: all .15s;
        white-space: nowrap;
      }
      .nav-link:hover { background: rgba(255,255,255,.12); color: #fff; }
      .nav-active { background: linear-gradient(135deg,#7c3aed,#f43f5e) !important; color: white !important; }
    </style>
  `,
})
export class DevNavComponent {}
