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
  Firestore,
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

  isLoggedIn    = computed(() => !!this._user());
  role          = computed(() => this._role());
  currentUser   = computed(() => this._user());
  displayName   = computed(() => this._displayName());
  profile       = computed(() => this._profile());
  profileLoaded = computed(() => this._profileLoaded());

  constructor() {
    if (!this.auth) return;
    this.auth.onAuthStateChanged((user) =>
      runInInjectionContext(this.injector, () => this._handleAuthStateChanged(user))
    );
  }

  private async _handleAuthStateChanged(user: User | null): Promise<void> {
    this._profileLoaded.set(false);
    this._user.set(user);
    if (user && this.firestore) {
      const profile = await this._loadProfile(user.uid);
      this._role.set(profile?.role ?? 'client');
      this._displayName.set(profile?.displayName ?? '');
      this._profile.set(profile);
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

  private async _loadProfile(uid: string): Promise<UserProfile | null> {
    if (this.firestore) {
      try {
        const snap = await getDoc(doc(this.firestore, 'users', uid));
        if (snap.exists()) return snap.data() as UserProfile;
      } catch { /* reglas no configuradas, usamos fallback */ }
    }
    const local = localStorage.getItem(`agenda_role_${uid}`);
    return local ? { role: local } as UserProfile : null;
  }

  async saveProfile(uid: string, profile: Partial<UserProfile>) {
    if (profile.role) {
      localStorage.setItem(`agenda_role_${uid}`, profile.role);
      this._role.set(profile.role);
    }
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
    const uid = this._user()?.uid;
    if (uid) localStorage.removeItem(`agenda_role_${uid}`);
    return from(signOut(this.auth));
  }
}
