import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from './auth.service';
import { MessageService } from './message.service';
import { NotificationService, AppNotification } from './notification.service';

const APPOINTMENT_NOTIF_TYPES: AppNotification['type'][] = ['appointment_confirmed', 'appointment_cancelled'];

/**
 * Novedades del cliente para los puntitos de la navegación ("Mis citas" y "Mensajes").
 * Singleton: lo comparten el shell del cliente y la navegación pública (Buscar),
 * así ambos encabezados muestran lo mismo con un solo par de listeners.
 */
@Injectable({ providedIn: 'root' })
export class ClientActivityService {
  private auth     = inject(AuthService);
  private msgSvc   = inject(MessageService);
  private notifSvc = inject(NotificationService);

  private msgSub: Subscription | null   = null;
  private notifSub: Subscription | null = null;

  /** Mensajes de empresas sin leer. */
  readonly unreadMessages = signal(0);
  private  aptNotifs      = signal<AppNotification[]>([]);

  readonly hasUnreadMessages = computed(() => this.unreadMessages() > 0);
  /** Citas confirmadas/canceladas sin ver. */
  readonly hasAptNews        = computed(() => this.aptNotifs().length > 0);

  constructor() {
    effect(() => {
      const uid  = this.auth.currentUser()?.uid;
      const role = this.auth.role();
      this.stop();
      if (!uid || role !== 'client') return;

      this.msgSub = this.msgSvc.watchByClient(uid).subscribe({
        next: msgs => this.unreadMessages.set(
          msgs.filter(m => m.senderRole === 'company' && !m.read && !m.deleted).length
        ),
        error: err => console.error('[ClientActivity] watchByClient error', err),
      });
      this.notifSub = this.notifSvc.watch(uid).subscribe({
        next: list => this.aptNotifs.set(list.filter(n => !n.read && APPOINTMENT_NOTIF_TYPES.includes(n.type))),
        error: err => console.error('[ClientActivity] notifications error', err),
      });
    });
  }

  /** Al entrar a "Mis citas" las novedades de citas se dan por vistas. */
  markAptNewsSeen(): void {
    this.aptNotifs().forEach(n => { if (n.id) this.notifSvc.markRead(n.id).catch(() => {}); });
  }

  private stop(): void {
    this.msgSub?.unsubscribe();
    this.notifSub?.unsubscribe();
    this.msgSub = this.notifSub = null;
    this.unreadMessages.set(0);
    this.aptNotifs.set([]);
  }
}
