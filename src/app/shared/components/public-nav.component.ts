import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-public-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header style="background:white;border-bottom:1.5px solid #f0ebff;position:sticky;top:0;z-index:50;box-shadow:0 2px 16px rgba(124,58,237,.08)">
      <div style="max-width:1100px;margin:0 auto;padding:0 20px;height:64px;display:flex;align-items:center;gap:16px">

        <!-- Logo -->
        <a routerLink="/" style="display:flex;align-items:center;gap:10px;text-decoration:none;flex-shrink:0">
          <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#f43f5e);display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 12px rgba(124,58,237,.3)">
            ✂️
          </div>
          <span style="font-weight:900;font-size:1.1rem;background:linear-gradient(135deg,#7c3aed,#f43f5e);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
            Agenda Co
          </span>
        </a>

        <div style="flex:1"></div>

        <!-- CTA empresa -->
        <a routerLink="/auth/register"
           [queryParams]="{role:'company'}"
           style="display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,#f5f0ff,#fff0f4);border:1.5px solid #ede9fe;border-radius:20px;padding:8px 16px;font-size:13px;font-weight:700;color:#7c3aed;text-decoration:none;transition:all .15s;white-space:nowrap"
           onmouseover="this.style.boxShadow='0 4px 14px rgba(124,58,237,.2)'"
           onmouseout="this.style.boxShadow='none'">
          🏪 ¿Tenés un negocio? <span style="color:#f43f5e">Registrate gratis</span>
        </a>

        <!-- Auth buttons -->
        <a routerLink="/auth/login"
           style="padding:9px 18px;border-radius:10px;font-size:14px;font-weight:700;color:#7c3aed;background:#f5f0ff;text-decoration:none;transition:all .15s;white-space:nowrap"
           onmouseover="this.style.background='#ede9fe'"
           onmouseout="this.style.background='#f5f0ff'">
          Iniciar sesión
        </a>

        <a routerLink="/auth/register"
           style="padding:9px 18px;border-radius:10px;font-size:14px;font-weight:700;color:white;background:linear-gradient(135deg,#7c3aed,#f43f5e);text-decoration:none;box-shadow:0 4px 12px rgba(124,58,237,.3);transition:all .15s;white-space:nowrap"
           onmouseover="this.style.opacity='.9'"
           onmouseout="this.style.opacity='1'">
          Registrate
        </a>

      </div>
    </header>
  `,
})
export class PublicNavComponent {}
