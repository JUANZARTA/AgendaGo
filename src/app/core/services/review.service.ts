import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, query, where, onSnapshot,
  addDoc, doc, updateDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Review {
  id?: string;
  companyId: string;
  clientId: string;
  clientName: string;
  clientPhotoUrl?: string;
  rating: number;
  comment: string;
  createdAt: number;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private firestore = inject(Firestore);

  getByCompany(companyId: string): Observable<Review[]> {
    return new Observable(observer => {
      const q = query(
        collection(this.firestore, 'reviews'),
        where('companyId', '==', companyId)
      );
      const unsub = onSnapshot(q,
        snap => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Review);
          list.sort((a, b) => b.createdAt - a.createdAt);
          observer.next(list);
        },
        err => observer.error(err)
      );
      return unsub;
    });
  }

  async addReview(review: Omit<Review, 'id'>, existingReviews: Review[]): Promise<void> {
    const clean = Object.fromEntries(Object.entries(review).filter(([, v]) => v !== undefined));
    await addDoc(collection(this.firestore, 'reviews'), clean);
    const all = [...existingReviews, review as Review];
    const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
    await updateDoc(doc(this.firestore, 'companies', review.companyId), {
      averageRating: Math.round(avg * 10) / 10,
      reviewCount: all.length,
    });
  }
}
