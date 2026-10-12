import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, addDoc, onSnapshot, query, where,
  writeBatch, getDocs, serverTimestamp, doc, updateDoc,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';

export interface AppNotification {
  id?: string;
  recipientId: string;
  type: 'new_appointment' | 'appointment_confirmed' | 'appointment_cancelled' | 'new_review' | 'new_company' | 'plan_changed' | 'payment_initiated' | 'new_message';
  title: string;
  body: string;
  read: boolean;
  link?: string;
  createdAt?: any;
  /** uid del emisor (las reglas exigen == request.auth.uid). */
  senderId?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private firestore = inject(Firestore);
  private auth = inject(Auth, { optional: true });

  /**
   * Crea una notificación. Requiere sesión: las reglas exigen senderId == uid
   * (un invitado sin login no puede notificar; se omite en silencio).
   */
  async create(data: Omit<AppNotification, 'id' | 'read' | 'createdAt' | 'senderId'>): Promise<void> {
    const senderId = this.auth?.currentUser?.uid;
    if (!senderId) return;
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    await addDoc(collection(this.firestore, 'notifications'), {
      ...clean,
      senderId,
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
