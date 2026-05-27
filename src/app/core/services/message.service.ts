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
  onSnapshot,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Message {
  id?: string;
  companyId: string;
  companyName?: string;
  clientId: string;
  clientName: string;
  senderRole: 'client' | 'company';
  text: string;
  createdAt?: any;
  read?: boolean;
  deleted?: boolean;
  edited?: boolean;
  editedAt?: any;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  private firestore = inject(Firestore);
  private col = collection(this.firestore, 'messages');

  sendMessage(msg: Omit<Message, 'id' | 'createdAt'>): Promise<void> {
    return addDoc(this.col, { ...msg, createdAt: serverTimestamp(), read: false }).then(() => {});
  }

  editMessage(id: string, newText: string): Promise<void> {
    return updateDoc(doc(this.firestore, 'messages', id), {
      text: newText,
      edited: true,
      editedAt: serverTimestamp(),
    }).then(() => {});
  }

  deleteMessage(id: string): Promise<void> {
    return updateDoc(doc(this.firestore, 'messages', id), {
      deleted: true,
      text: '',
    }).then(() => {});
  }

  async deleteConversation(companyId: string, clientId: string): Promise<void> {
    const q = query(
      this.col,
      where('companyId', '==', companyId),
      where('clientId', '==', clientId),
    );
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  }

  watchMessages(companyId: string, clientId: string): Observable<Message[]> {
    const q = query(
      this.col,
      where('companyId', '==', companyId),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'asc'),
    );
    return new Observable((observer) => {
      return onSnapshot(
        q,
        (snap) => observer.next(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Message)),
        (err) => observer.error(err),
      );
    });
  }

  watchByClient(clientId: string): Observable<Message[]> {
    const q = query(
      this.col,
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc'),
    );
    return new Observable((observer) => {
      return onSnapshot(
        q,
        (snap) => observer.next(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Message)),
        (err) => observer.error(err),
      );
    });
  }

  watchConversations(companyId: string): Observable<Message[]> {
    const q = query(
      this.col,
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc'),
    );
    return new Observable((observer) => {
      return onSnapshot(
        q,
        (snap) => observer.next(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Message)),
        (err) => observer.error(err),
      );
    });
  }
}
