import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, query, where, onSnapshot,
  addDoc, doc, updateDoc, deleteDoc,
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
  updatedAt?: number;
  appointmentId?: string;
  reply?: string;
  replyAt?: number;
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

  async addReply(reviewId: string, reply: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'reviews', reviewId), {
      reply: reply.trim(),
      replyAt: Date.now(),
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

  async updateReview(reviewId: string, rating: number, comment: string, review: Review, allReviews: Review[]): Promise<void> {
    await updateDoc(doc(this.firestore, 'reviews', reviewId), {
      rating,
      comment: comment.trim(),
      updatedAt: Date.now(),
    });
    const updated = allReviews.map(r => r.id === reviewId ? { ...r, rating } : r);
    const avg = updated.reduce((s, r) => s + r.rating, 0) / updated.length;
    await updateDoc(doc(this.firestore, 'companies', review.companyId), {
      averageRating: Math.round(avg * 10) / 10,
    });
  }

  async deleteReview(reviewId: string, review: Review, allReviews: Review[]): Promise<void> {
    await deleteDoc(doc(this.firestore, 'reviews', reviewId));
    const remaining = allReviews.filter(r => r.id !== reviewId);
    await updateDoc(doc(this.firestore, 'companies', review.companyId), {
      averageRating: remaining.length
        ? Math.round(remaining.reduce((s, r) => s + r.rating, 0) / remaining.length * 10) / 10
        : 0,
      reviewCount: remaining.length,
    });
  }
}
