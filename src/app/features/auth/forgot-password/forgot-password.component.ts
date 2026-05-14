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
    <div class="auth-container">
      <h1>Recuperar contraseña</h1>
      @if (sent()) {
        <p>Te enviamos un email con el link de recuperación.</p>
        <a routerLink="/auth/login">Volver al login</a>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <input type="email" formControlName="email" placeholder="Tu email" />
          @if (error()) { <p class="error">{{ error() }}</p> }
          <button type="submit" [disabled]="loading()">Enviar link</button>
        </form>
      }
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
