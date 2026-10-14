import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, query, where, onSnapshot,
  doc, updateDoc, deleteDoc, runTransaction,
  getAggregateFromServer, getCountFromServer, sum,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface RatingSummary {
  /** Promedio redondeado a 1 decimal; 0 si no hay reseñas. */
  average: number;
  count: number;
}

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

  /**
   * Una reseña por cita: el id del doc ES el appointmentId (las reglas lo exigen y validan
   * que la cita sea del cliente y esté 'completed'). Un segundo intento sobre la misma cita
   * se rechaza (sería un update de campos inmutables).
   */
  async addReview(review: Omit<Review, 'id'>): Promise<void> {
    if (!review.appointmentId) throw new Error('APPOINTMENT_REQUIRED');
    const clean = Object.fromEntries(Object.entries(review).filter(([, v]) => v !== undefined));
    const ref = doc(this.firestore, 'reviews', review.appointmentId);
    await runTransaction(this.firestore, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) throw new Error('ALREADY_REVIEWED');
      tx.set(ref, clean);
    });
  }

  async updateReview(reviewId: string, rating: number, comment: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'reviews', reviewId), {
      rating,
      comment: comment.trim(),
      updatedAt: Date.now(),
    });
  }

  async deleteReview(reviewId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'reviews', reviewId));
  }

  /**
   * Rating de la empresa calculado en el servidor sobre las reseñas reales (agregación de Firestore).
   * Reemplaza al `averageRating` guardado en companies, que cualquier usuario podía escribir
   * porque sin Cloud Functions (plan Spark) no había otra forma de mantenerlo.
   */
  async getRatingSummary(companyId: string): Promise<RatingSummary> {
    const q = query(collection(this.firestore, 'reviews'), where('companyId', '==', companyId));
    const [agg, cnt] = await Promise.all([
      getAggregateFromServer(q, { total: sum('rating') }),
      getCountFromServer(q),
    ]);
    const count = cnt.data().count;
    const total = agg.data().total ?? 0;
    return { count, average: count ? Math.round((total / count) * 10) / 10 : 0 };
  }
}
