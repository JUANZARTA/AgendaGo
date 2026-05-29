import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
<div class="auth-split">

  <div class="auth-form-panel">

    <a routerLink="/auth/login"
       style="position:absolute;top:24px;left:24px;display:flex;align-items:center;gap:8px;color:#7c3aed;font-size:14px;font-weight:700;text-decoration:none;background:#f5f0ff;padding:8px 14px;border-radius:20px;transition:all .15s;border:1.5px solid #ede9fe"
       onmouseover="this.style.background='#ede9fe'"
       onmouseout="this.style.background='#f5f0ff'">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      Volver al login
    </a>

    <div class="auth-card">

      @if (sent()) {
        <div style="text-align:center;padding:24px 0">
          <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#d1fae5,#a7f3d0);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;color:#065f46">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style="font-weight:800;font-size:1.4rem;margin-bottom:8px;color:#1a1a2e">¡Email enviado!</h2>
          <p style="color:#a0a0b8;font-size:14px;line-height:1.6;margin-bottom:24px">
            Revisá tu bandeja de entrada y seguí el link para restablecer tu contraseña.
          </p>
          <a routerLink="/auth/login"
             style="display:inline-flex;align-items:center;gap:8px;padding:12px 24px;background:var(--gradient);color:white;border-radius:12px;font-size:14px;font-weight:700;text-decoration:none">
            Volver al login
          </a>
        </div>
      } @else {

        <div style="text-align:center;margin-bottom:28px">
          <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#f5f0ff,#ede9fe);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:#7c3aed">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 style="font-size:1.5rem;font-weight:900;color:#1a1a2e;margin-bottom:6px">Recuperar contraseña</h2>
          <p style="color:#a0a0b8;font-size:14px">Te enviamos un link para restablecer tu contraseña</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">

          <div style="margin-bottom:20px">
            <label style="display:block;font-weight:700;font-size:13px;color:#444;margin-bottom:6px">Email</label>
            <input class="auth-input" type="email" formControlName="email" placeholder="tu@email.com" />
            @if (form.get('email')?.touched && form.get('email')?.hasError('email')) {
              <span style="color:#f43f5e;font-size:12px;font-weight:600;margin-top:4px;display:block">Email inválido</span>
            }
          </div>

          @if (error()) {
            <div style="background:#ffe4e8;border:1.5px solid #fda4af;border-radius:10px;padding:10px 14px;color:#be123c;font-size:13px;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px">
              <span style="display:inline-flex;align-items:center;flex-shrink:0"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></span>
              {{ error() }}
            </div>
          }

          <button type="submit" class="btn btn-primary btn-shimmer"
            style="width:100%;padding:14px;font-size:15px;border-radius:14px;letter-spacing:.02em"
            [disabled]="loading() || form.invalid">
            {{ loading() ? 'Enviando...' : 'Enviar link de recuperación' }}
          </button>

        </form>

        <p style="text-align:center;margin-top:22px;font-size:14px;color:#a0a0b8">
          ¿Recordaste tu contraseña?
          <a routerLink="/auth/login" style="color:#7c3aed;font-weight:800;margin-left:4px">Iniciá sesión</a>
        </p>

      }
    </div>
  </div>

  <div class="auth-brand">
    <div class="auth-blob auth-blob-1"></div>
    <div class="auth-blob auth-blob-2"></div>
    <div class="auth-blob auth-blob-3"></div>
    <div class="auth-blob auth-blob-4"></div>

    <div class="auth-brand-content">
      <svg width="160" height="160" viewBox="0 0 100 100" fill="none" style="margin-bottom:4px;filter:drop-shadow(0 8px 24px rgba(0,0,0,.25))">
        <circle cx="30" cy="73" r="12" stroke="white" stroke-width="8.5"/>
        <polyline points="30,61 50,51 80,18" stroke="white" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="70" cy="73" r="12" stroke="white" stroke-width="8.5"/>
        <polyline points="70,61 50,51 20,18" stroke="white" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>

      <h1 class="auth-brand-title">Agenda Co</h1>
      <p class="auth-brand-tagline">Sin contraseña, sin problema</p>

      <div class="auth-feature-list">
        <div class="auth-feature-item">
          <span style="display:inline-flex;align-items:center;flex-shrink:0"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
          <span>Te enviamos un link por email</span>
        </div>
        <div class="auth-feature-item">
          <span style="display:inline-flex;align-items:center;flex-shrink:0"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
          <span>Link seguro — expira en 1 hora</span>
        </div>
        <div class="auth-feature-item">
          <span style="display:inline-flex;align-items:center;flex-shrink:0"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
          <span>Sin pérdida de datos</span>
        </div>
      </div>
    </div>
  </div>

</div>
  `,
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  loading = signal(false);
  error = signal('');
  sent = signal(false);

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.auth.resetPassword(this.form.value.email!).subscribe({
      next: () => this.sent.set(true),
      error: () => { this.error.set('Email no encontrado.'); this.loading.set(false); },
    });
  }
}
