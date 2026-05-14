import { Injectable, computed, inject } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  IdTokenResult,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, from, EMPTY } from 'rxjs';
import { signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth, { optional: true });

  private idTokenResult = this.auth
    ? toSignal(
        new Observable<IdTokenResult | null>((observer) => {
          return this.auth!.onIdTokenChanged(async (user) => {
            if (user) {
              const result = await user.getIdTokenResult();
              observer.next(result);
            } else {
              observer.next(null);
            }
          });
        })
      )
    : signal(null);

  isLoggedIn = computed(() => !!this.idTokenResult());
  role = computed(() => (this.idTokenResult()?.claims?.['role'] as string) ?? 'client');
  currentUser = computed(() => this.auth?.currentUser ?? null);

  loginWithEmail(email: string, password: string) {
    if (!this.auth) return EMPTY;
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  loginWithGoogle() {
    if (!this.auth) return EMPTY;
    return from(signInWithPopup(this.auth, new GoogleAuthProvider()));
  }

  register(email: string, password: string) {
    if (!this.auth) return EMPTY;
    return from(createUserWithEmailAndPassword(this.auth, email, password));
  }

  resetPassword(email: string) {
    if (!this.auth) return EMPTY;
    return from(sendPasswordResetEmail(this.auth, email));
  }

  logout() {
    if (!this.auth) return EMPTY;
    return from(signOut(this.auth));
  }
}
