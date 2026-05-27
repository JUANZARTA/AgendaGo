import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['client', Validators.required],
  });

  loading = signal(false);
  error = signal('');
  success = signal(false);
  showPassword = signal(false);

  get selectedRole() { return this.form.get('role')?.value; }

  onGoogle() {
    const role = this.form.value.role ?? 'client';
    this.loading.set(true);
    this.error.set('');
    this.auth.loginWithGoogle().subscribe({
      next: async (credential) => {
        await this.auth.saveProfile(credential.user.uid, {
          uid: credential.user.uid,
          email: credential.user.email ?? '',
          displayName: credential.user.displayName ?? '',
          role: role as 'client' | 'company',
          createdAt: Date.now(),
        });
        await this.auth.waitForProfile();
        this.loading.set(false);
        this.router.navigate(role === 'company' ? ['/empresa'] : ['/cliente']);
      },
      error: () => {
        this.error.set('Error al registrarse con Google.');
        this.loading.set(false);
      },
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    if (environment.bypassAuth) {
      const role = this.form.value.role;
      this.router.navigate(role === 'company' ? ['/empresa'] : ['/']);
      return;
    }

    const { email, password, role, displayName } = this.form.value;
    this.auth.register(email!, password!).subscribe({
      next: async (credential) => {
        try {
          await this.auth.saveProfile(credential.user.uid, {
            uid: credential.user.uid,
            email: email!,
            displayName: displayName!,
            role: role as 'client' | 'company',
            createdAt: Date.now(),
          });
        } catch {
          // Si Firestore falla, continuamos igual — el perfil se puede crear después
        }
        this.success.set(true);
        setTimeout(() => {
          this.router.navigate(role === 'company' ? ['/empresa'] : ['/cliente']);
        }, 1500);
      },
      error: (e) => {
        const msg = e.code === 'auth/email-already-in-use'
          ? 'El email ya está registrado.'
          : 'Error al crear la cuenta. Intentá de nuevo.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }
}
