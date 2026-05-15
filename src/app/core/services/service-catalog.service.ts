import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where, serverTimestamp } from '@angular/fire/firestore';

export interface ServiceItem {
  id?: string;
  name: string;
  description?: string;
  duration: number | null;
  price?: number;
  staffCount: number;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class ServiceCatalogService {
  private firestore = inject(Firestore);

  private ref(companyId: string) {
    return collection(this.firestore, 'companies', companyId, 'services');
  }

  async getServices(companyId: string): Promise<ServiceItem[]> {
    const snap = await getDocs(this.ref(companyId));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ServiceItem);
  }

  async getActiveServices(companyId: string): Promise<ServiceItem[]> {
    const q = query(this.ref(companyId), where('isActive', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ServiceItem);
  }

  async createService(companyId: string, data: Omit<ServiceItem, 'id'>): Promise<string> {
    const ref = await addDoc(this.ref(companyId), { ...data, createdAt: serverTimestamp() });
    return ref.id;
  }

  async updateService(companyId: string, serviceId: string, data: Partial<ServiceItem>): Promise<void> {
    await updateDoc(doc(this.ref(companyId), serviceId), { ...data, updatedAt: serverTimestamp() });
  }

  async deleteService(companyId: string, serviceId: string): Promise<void> {
    await deleteDoc(doc(this.ref(companyId), serviceId));
  }
}
