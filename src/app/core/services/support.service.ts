import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, doc, getDoc, onSnapshot, orderBy, query, runTransaction,
  serverTimestamp, updateDoc, where,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { NotificationService } from './notification.service';

/**
 * Chat de soporte Empresa ↔ Admin (colección propia, NO se mezcla con `messages`).
 * Un hilo por empresa y tipo: supportThreads/{companyId}_{kind}.
 * Mensajes en la subcolección supportThreads/{id}/messages (nadie los borra).
 */
export type SupportKind   = 'consulta' | 'urgente';
export type SupportSender = 'company' | 'admin';

export interface SupportThread {
  id?: string;
  companyId: string;
  companyName: string;
  kind: SupportKind;
  lastMessage: string;
  lastMessageAt?: any;
  lastSender: SupportSender;
  unreadByAdmin: boolean;
  unreadByCompany: boolean;
  status: 'open' | 'resolved';
  createdAt?: any;
}

export interface SupportMessage {
  id?: string;
  sender: SupportSender;
  senderUid: string;
  text: string;
  createdAt?: any;
}

export const SUPPORT_TEXT_MAX = 2000;
/** El resumen del hilo guarda sólo un pedacito del último mensaje. */
const PREVIEW_MAX = 140;

export function supportThreadId(companyId: string, kind: SupportKind): string {
  return `${companyId}_${kind}`;
}

function preview(text: string): string {
  return text.length > PREVIEW_MAX ? text.slice(0, PREVIEW_MAX) + '…' : text;
}

@Injectable({ providedIn: 'root' })
export class SupportService {
  private firestore = inject(Firestore);
  private auth      = inject(Auth, { optional: true });
  private notifSvc  = inject(NotificationService);
  private col = collection(this.firestore, 'supportThreads');

  // ── Lectura ──────────────────────────────────────────────────────

  /** Hilos de una empresa (como mucho dos: consulta y urgente). */
  watchCompanyThreads(companyId: string): Observable<SupportThread[]> {
    const q = query(this.col, where('companyId', '==', companyId));
    return new Observable(observer => onSnapshot(q,
      snap => observer.next(snap.docs.map(d => ({ id: d.id, ...d.data() }) as SupportThread)),
      err => observer.error(err),
    ));
  }

  /** Todos los hilos (admin). Son pocos: se ordenan en memoria, sin índices. */
  watchAllThreads(): Observable<SupportThread[]> {
    return new Observable(observer => onSnapshot(this.col,
      snap => observer.next(snap.docs.map(d => ({ id: d.id, ...d.data() }) as SupportThread)),
      err => observer.error(err),
    ));
  }

  watchMessages(threadId: string): Observable<SupportMessage[]> {
    const q = query(collection(this.firestore, 'supportThreads', threadId, 'messages'), orderBy('createdAt', 'asc'));
    return new Observable(observer => onSnapshot(q,
      snap => observer.next(snap.docs.map(d => ({ id: d.id, ...d.data() }) as SupportMessage)),
      err => observer.error(err),
    ));
  }

  // ── Escritura: empresa ───────────────────────────────────────────

  /**
   * La empresa escribe. En una transacción: crea el hilo si no existe (o lo reabre si estaba
   * resuelto), deja el resumen y agrega el mensaje. Si el hilo pasa a "no leído" avisa al admin.
   */
  async sendFromCompany(company: { id: string; name: string }, kind: SupportKind, rawText: string): Promise<void> {
    const uid  = this.auth?.currentUser?.uid;
    const text = rawText.trim();
    if (!uid || !text || text.length > SUPPORT_TEXT_MAX) return;

    const threadRef = doc(this.col, supportThreadId(company.id, kind));
    const msgRef    = doc(collection(threadRef, 'messages'));
    const summary = {
      companyName:   company.name.slice(0, 200),
      lastMessage:   preview(text),
      lastMessageAt: serverTimestamp(),
      lastSender:    'company' as const,
      unreadByAdmin: true,
    };

    const wasUnread = await runTransaction(this.firestore, async tx => {
      const snap = await tx.get(threadRef);
      if (snap.exists()) {
        const t = snap.data() as SupportThread;
        // Escribir en un hilo resuelto lo vuelve a abrir
        tx.update(threadRef, { ...summary, ...(t.status === 'resolved' ? { status: 'open' } : {}) });
      } else {
        tx.set(threadRef, {
          ...summary, companyId: company.id, kind, unreadByCompany: false, status: 'open', createdAt: serverTimestamp(),
        });
      }
      tx.set(msgRef, { sender: 'company', senderUid: uid, text, createdAt: serverTimestamp() });
      return snap.exists() && (snap.data() as SupportThread).unreadByAdmin === true;
    });

    // Sólo cuando el hilo pasa de leído a no leído: no se manda un aviso por cada mensaje seguido
    if (!wasUnread) {
      const urgent = kind === 'urgente';
      await this.notifSvc.create({
        recipientId: 'admin',
        type:        'support_message',
        title:       urgent ? `🔴 Urgente de ${company.name}` : `Consulta de ${company.name}`,
        body:        preview(text),
        link:        `/admin/soporte?hilo=${supportThreadId(company.id, kind)}`,
      }).catch(err => console.error('[Support] No se pudo avisar al admin:', err));
    }
  }

  async markReadByCompany(threadId: string): Promise<void> {
    await updateDoc(doc(this.col, threadId), { unreadByCompany: false });
  }

  // ── Escritura: admin ─────────────────────────────────────────────

  /** El admin responde: el hilo queda no leído para la empresa y se le avisa al dueño. */
  async sendFromAdmin(thread: SupportThread & { id: string }, rawText: string): Promise<void> {
    const uid  = this.auth?.currentUser?.uid;
    const text = rawText.trim();
    if (!uid || !text || text.length > SUPPORT_TEXT_MAX) return;

    const threadRef = doc(this.col, thread.id);
    const msgRef    = doc(collection(threadRef, 'messages'));
    await runTransaction(this.firestore, async tx => {
      tx.update(threadRef, {
        lastMessage: preview(text), lastMessageAt: serverTimestamp(), lastSender: 'admin',
        unreadByCompany: true, unreadByAdmin: false,
      });
      tx.set(msgRef, { sender: 'admin', senderUid: uid, text, createdAt: serverTimestamp() });
    });

    // Aviso al dueño de la empresa (best-effort: el admin puede leer companies/{id})
    try {
      const ownerId = (await getDoc(doc(this.firestore, 'companies', thread.companyId))).data()?.['ownerId'];
      if (ownerId) {
        await this.notifSvc.create({
          recipientId: ownerId,
          type:        'support_reply',
          title:       thread.kind === 'urgente' ? 'Soporte respondió tu urgencia' : 'Soporte respondió tu consulta',
          body:        preview(text),
          link:        `/empresa/facturacion?soporte=${thread.kind}`,
        });
      }
    } catch (err) {
      console.error('[Support] No se pudo avisar a la empresa:', err);
    }
  }

  async markReadByAdmin(threadId: string): Promise<void> {
    await updateDoc(doc(this.col, threadId), { unreadByAdmin: false });
  }

  async setStatus(threadId: string, status: 'open' | 'resolved'): Promise<void> {
    await updateDoc(doc(this.col, threadId), { status });
  }
}
