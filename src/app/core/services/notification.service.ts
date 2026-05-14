import { Injectable, inject } from '@angular/core';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, from } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private messaging = inject(Messaging);
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  async requestPermissionAndSaveToken(): Promise<void> {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    const token = await getToken(this.messaging, { vapidKey: environment.firebase.vapidKey });
    const uid = this.auth.currentUser?.uid;
    if (token && uid) {
      await updateDoc(doc(this.firestore, 'users', uid), { fcmToken: token });
    }
  }

  onForegroundMessage(): Observable<any> {
    return new Observable((observer) => onMessage(this.messaging, observer.next.bind(observer)));
  }
}
