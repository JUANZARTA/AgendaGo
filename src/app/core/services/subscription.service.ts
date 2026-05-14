import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, onSnapshot } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Subscription {
  companyId: string;
  status: 'trial' | 'active' | 'expired' | 'disabled';
  trialStartDate: any;
  trialEndDate: any;
  currentPeriodEnd?: any;
  lastPaymentDate?: any;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private firestore = inject(Firestore);

  async getStatus(companyId: string): Promise<Subscription | null> {
    const snap = await getDoc(doc(this.firestore, 'subscriptions', companyId));
    return snap.exists() ? snap.data() as Subscription : null;
  }

  watchStatus(companyId: string): Observable<Subscription | null> {
    return new Observable((observer) => {
      return onSnapshot(doc(this.firestore, 'subscriptions', companyId), (snap) =>
        observer.next(snap.exists() ? snap.data() as Subscription : null)
      );
    });
  }

  daysRemaining(sub: Subscription): number {
    const end = sub.status === 'trial' ? sub.trialEndDate?.toDate() : sub.currentPeriodEnd?.toDate();
    if (!end) return 0;
    return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
  }
}
