import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, query, where, onSnapshot,
  doc, updateDoc, deleteDoc, runTransaction,
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

  /**
   * Una reseña por cita: el id del doc ES el appointmentId (las reglas lo exigen y validan
   * que la cita sea del cliente y esté 'completed'). Un segundo intento sobre la misma cita
   * se rechaza (sería un update de campos inmutables).
   */
  async addReview(review: Omit<Review, 'id'>, existingReviews: Review[]): Promise<void> {
    if (!review.appointmentId) throw new Error('APPOINTMENT_REQUIRED');
    const clean = Object.fromEntries(Object.entries(review).filter(([, v]) => v !== undefined));
    const ref = doc(this.firestore, 'reviews', review.appointmentId);
    await runTransaction(this.firestore, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) throw new Error('ALREADY_REVIEWED');
      tx.set(ref, clean);
    });
    const all = [...existingReviews, review as Review];
    await this.syncCompanyRating(review.companyId, all, +1);
  }

  async updateReview(reviewId: string, rating: number, comment: string, review: Review, allReviews: Review[]): Promise<void> {
    await updateDoc(doc(this.firestore, 'reviews', reviewId), {
      rating,
      comment: comment.trim(),
      updatedAt: Date.now(),
    });
    const updated = allReviews.map(r => r.id === reviewId ? { ...r, rating } : r);
    await this.syncCompanyRating(review.companyId, updated, 0);
  }

  async deleteReview(reviewId: string, review: Review, allReviews: Review[]): Promise<void> {
    await deleteDoc(doc(this.firestore, 'reviews', reviewId));
    const remaining = allReviews.filter(r => r.id !== reviewId);
    await this.syncCompanyRating(review.companyId, remaining, -1);
  }

  /**
   * Agregado de rating en companies (sin Cloud Functions / plan Spark).
   * Las reglas sólo dejan a terceros tocar averageRating (0..5) y reviewCount (±1 por escritura),
   * así que el contador se calcula sobre el valor ACTUAL del doc (transacción) y el promedio
   * sobre la lista de reseñas. Best-effort: un fallo acá no invalida la reseña ya guardada.
   */
  private async syncCompanyRating(companyId: string, reviews: Review[], delta: -1 | 0 | 1): Promise<void> {
    const avg = reviews.length
      ? Math.min(5, Math.max(0, Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length * 10) / 10))
      : 0;
    try {
      const ref = doc(this.firestore, 'companies', companyId);
      await runTransaction(this.firestore, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const current = Number((snap.data() as any).reviewCount ?? 0) || 0;
        const patch: Record<string, number> = { averageRating: avg };
        if (delta !== 0) patch['reviewCount'] = Math.max(0, current + delta);
        tx.update(ref, patch);
      });
    } catch (err) {
      console.error('[Reviews] No se pudo actualizar el rating de la empresa:', err);
    }
  }
}
