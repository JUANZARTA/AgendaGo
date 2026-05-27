import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
} from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

export interface StaffMember {
  id?: string;
  name: string;
  phone?: string;
  photoURL?: string;
  serviceIds: string[];
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class StaffService {
  private firestore = inject(Firestore);
  private storage   = inject(Storage);

  private ref(companyId: string) {
    return collection(this.firestore, 'companies', companyId, 'staff');
  }

  async getStaff(companyId: string): Promise<StaffMember[]> {
    const q    = query(this.ref(companyId), orderBy('name'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as StaffMember);
  }

  async getActiveStaff(companyId: string): Promise<StaffMember[]> {
    const q    = query(this.ref(companyId), where('isActive', '==', true), orderBy('name'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as StaffMember);
  }

  async getStaffForService(companyId: string, serviceId: string): Promise<StaffMember[]> {
    const q = query(
      this.ref(companyId),
      where('isActive', '==', true),
      where('serviceIds', 'array-contains', serviceId),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as StaffMember);
  }

  async createStaff(companyId: string, data: Omit<StaffMember, 'id'>): Promise<string> {
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    const docRef = await addDoc(this.ref(companyId), clean);
    return docRef.id;
  }

  async updateStaff(companyId: string, staffId: string, data: Partial<StaffMember>): Promise<void> {
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    await updateDoc(doc(this.ref(companyId), staffId), clean);
  }

  async deleteStaff(companyId: string, staffId: string): Promise<void> {
    await deleteDoc(doc(this.ref(companyId), staffId));
  }

  async uploadPhoto(companyId: string, staffId: string, file: File): Promise<string> {
    const storageRef = ref(this.storage, `staff/${companyId}/${staffId}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }
}
