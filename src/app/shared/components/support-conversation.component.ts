import { Component, ElementRef, computed, effect, input, output, signal, viewChild } from '@angular/core';
import { SupportMessage, SupportSender, SUPPORT_TEXT_MAX } from '../../core/services/support.service';

/**
 * Burbujas + input del chat de soporte (presentacional). Lo usan el widget de la empresa
 * y la página Soporte del admin. Mismo look que el chat cliente ↔ empresa: lo propio a la
 * derecha con el gradiente de la marca, lo del otro a la izquierda en celeste.
 */
@Component({
  selector: 'app-support-conversation',
  standalone: true,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; }
    .chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 6px; }
    .msg-row { display: flex; flex-direction: column; }
    .msg-row.mine   { align-items: flex-end; }
    .msg-row.theirs { align-items: flex-start; }
    .msg-bubble { padding: 9px 13px; border-radius: 16px; font-size: 14px; line-height: 1.5; word-break: break-word; white-space: pre-wrap; max-width: 80%; }
    .msg-bubble.theirs { background: #f0f4ff; color: #1a1a2e; border-bottom-left-radius: 4px; }
    .msg-bubble.mine   { background: var(--gradient); color: white; border-bottom-right-radius: 4px; }
    .msg-meta { font-size: 11px; color: #aaa; margin-top: 2px; }
    .empty { flex: 1; display: flex; align-items: center; justify-content: center; text-align: center; color: #aaa; font-size: 13px; padding: 24px; line-height: 1.6; }
    .chat-input-row { padding: 10px 12px; border-top: 1.5px solid #f0ebff; display: flex; gap: 8px; align-items: center; }
    .chat-input { flex: 1; min-width: 0; padding: 11px 16px; border: 1.5px solid #ede9fe; border-radius: 24px; font-size: 14px; outline: none; font-family: inherit; }
    .chat-input:focus { border-color: var(--purple); }
    .send-btn { flex-shrink: 0; width: 42px; height: 42px; border-radius: 50%; border: none; background: var(--gradient); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .send-btn:disabled { opacity: .45; cursor: default; }
  `],
  template: `
    <div class="chat-messages" #box>
      @if (messages().length === 0) {
        <div class="empty">{{ emptyText() }}</div>
      }
      @for (m of messages(); track m.id) {
        <div class="msg-row" [class.mine]="m.sender === me()" [class.theirs]="m.sender !== me()">
          <div class="msg-bubble" [class.mine]="m.sender === me()" [class.theirs]="m.sender !== me()">{{ m.text }}</div>
          <div class="msg-meta">
            @if (m.sender !== me()) { {{ theirLabel() }} · }{{ formatTime(m.createdAt) }}
          </div>
        </div>
      }
    </div>
    <div class="chat-input-row">
      <input class="chat-input" [value]="draft()" (input)="draft.set($any($event.target).value)"
             [attr.maxlength]="max" [placeholder]="placeholder()" (keydown.enter)="submit()" />
      <button class="send-btn" (click)="submit()" [disabled]="!canSend()" aria-label="Enviar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </div>
  `,
})
export class SupportConversationComponent {
  readonly messages    = input.required<SupportMessage[]>();
  /** Lado de quien mira: sus mensajes van a la derecha. */
  readonly me          = input.required<SupportSender>();
  readonly theirLabel  = input('');
  readonly placeholder = input('Escribe tu mensaje...');
  readonly emptyText   = input('Todavía no hay mensajes.');
  readonly sending     = input(false);

  readonly send = output<string>();

  readonly max = SUPPORT_TEXT_MAX;
  draft = signal('');
  canSend = computed(() => !!this.draft().trim() && !this.sending());

  private box = viewChild<ElementRef<HTMLElement>>('box');

  constructor() {
    // Con cada mensaje nuevo, bajar al final (después de que se pinte)
    effect(() => {
      this.messages();
      const el = this.box()?.nativeElement;
      if (el) setTimeout(() => el.scrollTop = el.scrollHeight);
    });
  }

  submit(): void {
    const text = this.draft().trim();
    if (!text || this.sending()) return;
    this.draft.set('');
    this.send.emit(text);
  }

  /** Si el envío falla, el contenedor devuelve el texto al input. */
  restore(text: string): void {
    if (!this.draft()) this.draft.set(text);
  }

  formatTime(ts: any): string {
    if (!ts) return '';
    const d: Date = ts?.toDate ? ts.toDate() : new Date(ts);
    const time = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const today = new Date().toDateString() === d.toDateString();
    return today ? time : `${d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} ${time}`;
  }
}
