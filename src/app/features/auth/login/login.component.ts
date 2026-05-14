import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  loading = signal(false);
  error = signal('');
  showPassword = signal(false);

  async onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.value;
    this.auth.loginWithEmail(email!, password!).subscribe({
      next: () => this.redirectByRole(),
      error: (e) => { this.error.set('Credenciales incorrectas.'); this.loading.set(false); },
    });
  }

  async onGoogle() {
    this.loading.set(true);
    this.auth.loginWithGoogle().subscribe({
      next: () => this.redirectByRole(),
      error: () => { this.error.set('Error al iniciar con Google.'); this.loading.set(false); },
    });
  }

  private redirectByRole() {
    const role = this.auth.role();
    if (role === 'company') this.router.navigate(['/empresa']);
    else if (role === 'superadmin') this.router.navigate(['/admin']);
    else this.router.navigate(['/']);
  }
}
