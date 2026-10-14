import { Injectable, Injector, computed, inject, runInInjectionContext, signal } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  User,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from '@angular/fire/auth';
import {
  FieldValue,
  Firestore,
  Timestamp,
  doc,
  getDoc,
  setDoc,
} from '@angular/fire/firestore';
import { from, EMPTY } from 'rxjs';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'client' | 'company' | 'superadmin';
  createdAt: number;
  phone?: string;
  address?: string;
  photoUrl?: string;
  profileComplete?: boolean;
  fcmToken?: string;
  isActive?: boolean;
  /** Cuándo aceptó Términos y Política de privacidad al registrarse (serverTimestamp al crear). */
  acceptedTermsAt?: Timestamp | FieldValue;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth, { optional: true });
  private firestore = inject(Firestore, { optional: true });
  private injector = inject(Injector);

  private _user          = signal<User | null>(null);
  private _role          = signal<string>('client');
  private _displayName   = signal<string>('');
  private _profile       = signal<UserProfile | null>(null);
  private _profileLoaded = signal(false);
  private _profileError  = signal(false);

  isLoggedIn    = computed(() => !!this._user());
  role          = computed(() => this._role());
  currentUser   = computed(() => this._user());
  displayName   = computed(() => this._displayName());
  profile       = computed(() => this._profile());
  profileLoaded = computed(() => this._profileLoaded());
  /** true si el perfil no se pudo leer de Firestore (red/reglas). No se inventa un rol. */
  profileError  = computed(() => this._profileError());

  constructor() {
    if (!this.auth) return;
    this.auth.onAuthStateChanged((user) =>
      runInInjectionContext(this.injector, () => this._handleAuthStateChanged(user))
    );
  }

  private async _handleAuthStateChanged(user: User | null): Promise<void> {
    this._profileLoaded.set(false);
    this._profileError.set(false);
    this._user.set(user);
    if (user && this.firestore) {
      try {
        const profile = await this._loadProfile(user.uid);
        // Sin doc todavía (registro en curso): rol por defecto 'client', igual que antes
        this._role.set(profile?.role ?? 'client');
        this._displayName.set(profile?.displayName ?? '');
        this._profile.set(profile);
      } catch (err) {
        // Error de lectura: NO se inventa un rol (antes se usaba localStorage, manipulable).
        // Rol vacío => roleGuard deniega las zonas protegidas.
        console.error('[Auth] No se pudo cargar el perfil:', err);
        this._profileError.set(true);
        this._role.set('');
        this._displayName.set('');
        this._profile.set(null);
      }
    } else {
      this._role.set('client');
      this._profile.set(null);
    }
    this._profileLoaded.set(true);
  }

  waitForProfile(timeoutMs = 5000): Promise<void> {
    if (this._profileLoaded()) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const deadline = Date.now() + timeoutMs;
      const interval = setInterval(() => {
        if (this._profileLoaded() || Date.now() >= deadline) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }

  async waitForAuth(): Promise<void> {
    if (this.auth && typeof (this.auth as any)['authStateReady'] === 'function') {
      await (this.auth as any)['authStateReady']();
      await Promise.resolve(); // let onAuthStateChanged handlers update _user signal
    }
    // Only wait for Firestore profile if there IS a logged-in user.
    // Avoids resolving with role='client' from the transient null auth state on page reload.
    if (this.isLoggedIn()) {
      await this.waitForProfile();
    }
  }

  /** Lee users/{uid}. Lanza si falla la lectura (el caller decide; nunca se inventa un rol). */
  private async _loadProfile(uid: string): Promise<UserProfile | null> {
    if (!this.firestore) return null;
    // Limpieza del fallback legacy de rol en localStorage (ya no se usa)
    try { localStorage.removeItem(`agenda_role_${uid}`); } catch { /* storage bloqueado */ }
    const snap = await getDoc(doc(this.firestore, 'users', uid));
    return snap.exists() ? snap.data() as UserProfile : null;
  }

  async saveProfile(uid: string, profile: Partial<UserProfile>) {
    if (profile.role) this._role.set(profile.role);
    if (profile.displayName !== undefined) this._displayName.set(profile.displayName);
    this._profile.update(curr => curr ? { ...curr, ...profile } : profile as UserProfile);
    if (!this.firestore) return;
    const clean = Object.fromEntries(Object.entries(profile).filter(([, v]) => v !== undefined));
    await setDoc(doc(this.firestore, 'users', uid), clean, { merge: true });
  }

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
