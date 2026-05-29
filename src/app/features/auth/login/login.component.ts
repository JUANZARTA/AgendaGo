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
  styles: [`
    .splash-backdrop {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,.45);
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(3px);
      animation: backdropOut .3s ease forwards;
      animation-delay: .8s;
    }
    .splash-card {
      background: white; border-radius: 24px;
      padding: 40px 48px;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      box-shadow: 0 24px 64px rgba(0,0,0,.25);
      animation: popIn .45s cubic-bezier(.34,1.56,.64,1) forwards;
    }
    .splash-card img { width: min(200px, 55vw); }
    .splash-sub { font-size: 13px; color: #aaa; font-weight: 600; letter-spacing: .04em; }
    .splash-spinner {
      width: 28px; height: 28px; margin-top: 8px;
      border: 3px solid #ede9fe; border-top-color: #7c3aed;
      border-radius: 50%; animation: spin .7s linear infinite;
    }
    @keyframes spin        { to  { transform: rotate(360deg); } }
    @keyframes popIn      { from { opacity:0; transform:scale(.88); } to { opacity:1; transform:scale(1); } }
    @keyframes backdropOut { to  { opacity:0; pointer-events:none; } }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading      = signal(false);
  error        = signal('');
  showPassword = signal(false);
  showSplash   = signal(false);

  async onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.value;
    this.auth.loginWithEmail(email!, password!).subscribe({
      next:  () => this.doSplashAndRedirect(),
      error: () => { this.error.set('Credenciales incorrectas.'); this.loading.set(false); },
    });
  }

  async onGoogle() {
    this.loading.set(true);
    this.auth.loginWithGoogle().subscribe({
      next:  () => this.doSplashAndRedirect(),
      error: () => { this.error.set('Error al iniciar con Google.'); this.loading.set(false); },
    });
  }

  private async doSplashAndRedirect() {
    this.showSplash.set(true);
    await this.auth.waitForProfile();
    setTimeout(() => this.navigateByRole(), 1000);
  }

  private navigateByRole() {
    const role = this.auth.role();
    if (role === 'company')    this.router.navigate(['/empresa']);
    else if (role === 'superadmin') this.router.navigate(['/admin']);
    else                       this.router.navigate(['/']);
  }
}
