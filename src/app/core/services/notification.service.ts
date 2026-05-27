import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, addDoc, onSnapshot, query, where,
  writeBatch, getDocs, serverTimestamp, doc, updateDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface AppNotification {
  id?: string;
  recipientId: string;
  type: 'new_appointment' | 'appointment_confirmed' | 'appointment_cancelled' | 'new_review' | 'new_company';
  title: string;
  body: string;
  read: boolean;
  link?: string;
  createdAt?: any;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private firestore = inject(Firestore);

  async create(data: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): Promise<void> {
    await addDoc(collection(this.firestore, 'notifications'), {
      ...data,
      read: false,
      createdAt: serverTimestamp(),
    });
  }

  watch(recipientId: string): Observable<AppNotification[]> {
    return new Observable(observer => {
      const q = query(
        collection(this.firestore, 'notifications'),
        where('recipientId', '==', recipientId),
      );
      const unsub = onSnapshot(q,
        snap => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }) as AppNotification);
          list.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
          observer.next(list);
        },
        err => observer.error(err)
      );
      return unsub;
    });
  }

  async markRead(id: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'notifications', id), { read: true });
  }

  async markAllRead(recipientId: string): Promise<void> {
    const q = query(
      collection(this.firestore, 'notifications'),
      where('recipientId', '==', recipientId),
      where('read', '==', false),
    );
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(this.firestore);
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  }
}
