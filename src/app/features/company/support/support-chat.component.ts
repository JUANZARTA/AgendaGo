import { Component, effect, inject, input, signal, viewChild } from '@angular/core';
import { CompanyStore } from '../../../core/services/company-store.service';
import {
  SupportKind, SupportMessage, SupportService, SupportThread, supportThreadId,
} from '../../../core/services/support.service';
import { SupportConversationComponent } from '../../../shared/components/support-conversation.component';

/**
 * Chat de un hilo de soporte del lado empresa (contenedor): escucha los mensajes,
 * marca el hilo como leído mientras está abierto y envía.
 */
@Component({
  selector: 'app-support-chat',
  standalone: true,
  imports: [SupportConversationComponent],
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; }
    .err { margin: 0 12px 8px; padding: 8px 12px; border-radius: 10px; background: #fef2f2; color: #b91c1c; font-size: 12px; }
  `],
  template: `
    <app-support-conversation
      [messages]="messages()"
      me="company"
      theirLabel="Soporte AgendaCo"
      [sending]="sending()"
      [placeholder]="kind() === 'urgente' ? 'Cuéntanos qué está fallando...' : 'Escribe tu consulta...'"
      [emptyText]="kind() === 'urgente'
        ? 'Cuéntanos qué no funciona y lo revisamos cuanto antes.'
        : 'Escribe tu duda y te respondemos en el día.'"
      (send)="send($event)" />
    @if (error()) { <div class="err">{{ error() }}</div> }
  `,
})
export class SupportChatComponent {
  private store   = inject(CompanyStore);
  private support = inject(SupportService);

  readonly kind   = input.required<SupportKind>();
  /** Resumen del hilo (undefined si todavía no existe). */
  readonly thread = input<SupportThread | undefined>();

  messages = signal<SupportMessage[]>([]);
  sending  = signal(false);
  error    = signal('');

  private conv = viewChild(SupportConversationComponent);

  constructor() {
    effect(onCleanup => {
      const companyId = this.store.companyId();
      if (!companyId) return;
      this.messages.set([]);
      const sub = this.support.watchMessages(supportThreadId(companyId, this.kind())).subscribe({
        next: list => this.messages.set(list),
        error: err => console.error('[Soporte empresa] mensajes:', err),
      });
      onCleanup(() => sub.unsubscribe());
    });

    // Mientras el chat está abierto, lo que responde el admin queda leído
    effect(() => {
      const t = this.thread();
      if (t?.id && t.unreadByCompany) this.support.markReadByCompany(t.id).catch(() => {});
    });
  }

  async send(text: string): Promise<void> {
    const c = this.store.company();
    if (!c?.id) return;
    this.sending.set(true);
    this.error.set('');
    try {
      await this.support.sendFromCompany({ id: c.id, name: c.name ?? 'Empresa' }, this.kind(), text);
    } catch (err) {
      console.error('[Soporte empresa] envío:', err);
      this.error.set('No se pudo enviar el mensaje. Prueba de nuevo.');
      this.conv()?.restore(text);
    } finally {
      this.sending.set(false);
    }
  }
}
