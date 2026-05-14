import { Injectable, computed, inject, signal } from '@angular/core';
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
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth, { optional: true });
  private firestore = inject(Firestore, { optional: true });

  private _user = signal<User | null>(null);
  private _role = signal<string>('client');
  private _profileLoaded = signal(false);

  isLoggedIn = computed(() => !!this._user());
  role = computed(() => this._role());
  currentUser = computed(() => this._user());

  constructor() {
    if (!this.auth) return;
    this.auth.onAuthStateChanged(async (user) => {
      this._profileLoaded.set(false);
      this._user.set(user);
      if (user && this.firestore) {
        const profile = await this._loadProfile(user.uid);
        this._role.set(profile?.role ?? 'client');
      } else {
        this._role.set('client');
      }
      this._profileLoaded.set(true);
    });
  }

  waitForProfile(): Promise<void> {
    if (this._profileLoaded()) return Promise.resolve();
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this._profileLoaded()) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
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
    }
    if (!this.firestore) return;
    await setDoc(doc(this.firestore, 'users', uid), profile, { merge: true });
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
