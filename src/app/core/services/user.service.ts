import { Injectable, inject } from '@angular/core';
import { Firestore, doc, setDoc, getDoc, updateDoc, serverTimestamp } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  photoURL?: string;
  role: 'client' | 'company' | 'superadmin';
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  async createProfile(data: Partial<UserProfile>): Promise<void> {
    const uid = this.auth.currentUser!.uid;
    await setDoc(doc(this.firestore, 'users', uid), {
      ...data, uid, isActive: true, createdAt: serverTimestamp(),
    });
  }

  async getProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(this.firestore, 'users', uid));
    return snap.exists() ? snap.data() as UserProfile : null;
  }

  async updateProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    await updateDoc(doc(this.firestore, 'users', uid), { ...data, updatedAt: serverTimestamp() });
  }
}
