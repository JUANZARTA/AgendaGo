import { Injectable, inject } from '@angular/core';
import { Messaging, getToken } from '@angular/fire/messaging';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushService {
  private messaging = inject(Messaging, { optional: true });
  private firestore  = inject(Firestore);

  async initialize(uid: string): Promise<void> {
    if (!this.messaging || !('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    try {
      const token = await getToken(this.messaging, { vapidKey: environment.firebase.vapidKey });
      if (token) {
        await updateDoc(doc(this.firestore, 'users', uid), { fcmToken: token });
      }
    } catch {}
  }
}
