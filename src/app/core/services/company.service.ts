import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, updateDoc, getDoc, query, where, getDocs, serverTimestamp } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { from, Observable } from 'rxjs';

export interface DaySchedule {
  key: string;
  label: string;
  enabled: boolean;
  ranges: { open: string; close: string }[];
}

export interface BlockedDate {
  id: string;
  date: string;
  reason: string;
}

export interface Company {
  id?: string;
  ownerId: string;
  name: string;
  slug: string;
  category: 'salon' | 'spa' | 'barberia' | 'peluqueria';
  description?: string;
  logoUrl?: string;
  logoIcon?: string;
  logoColor?: string;
  phone?: string;
  city?: string;
  address?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  isActive: boolean;
  isPublic: boolean;
  slotInterval: number;
  schedule: DaySchedule[];
  blockedDates?: BlockedDate[];
  disabledSlots?: Record<string, boolean>;
  averageRating?: number;
  reviewCount?: number;
}

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  async createCompany(data: Partial<Company>): Promise<string> {
    const uid = this.auth.currentUser!.uid;
    const ref = doc(collection(this.firestore, 'companies'));
    await setDoc(ref, {
      ...this._strip(data),
      ownerId: uid,
      isActive: true,
      isPublic: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }

  async updateCompany(id: string, data: Partial<Company>): Promise<void> {
    await updateDoc(doc(this.firestore, 'companies', id), {
      ...this._strip(data),
      updatedAt: serverTimestamp(),
    });
  }

  private _strip<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== undefined)
    ) as Partial<T>;
  }

  async getCompany(id: string): Promise<Company | null> {
    const snap = await getDoc(doc(this.firestore, 'companies', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Company : null;
  }

  async getCompaniesByOwner(ownerId: string): Promise<Company[]> {
    const q = query(collection(this.firestore, 'companies'), where('ownerId', '==', ownerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Company);
  }

  async searchCompanies(term: string, category?: string): Promise<Company[]> {
    let q = query(collection(this.firestore, 'companies'), where('isPublic', '==', true), where('isActive', '==', true));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Company)
      .filter((c) => {
        const matchName = c.name.toLowerCase().includes(term.toLowerCase());
        const matchCategory = category ? c.category === category : true;
        return matchName && matchCategory;
      });
  }
}
