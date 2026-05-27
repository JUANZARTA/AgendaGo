import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, Message } from '../../../core/services/message.service';
import { CompanyStore } from '../../../core/services/company-store.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

interface Conversation {
  clientId: string;
  clientName: string;
  lastMessage: string;
  lastAt: any;
  unread: number;
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .msg-layout { display: flex; height: calc(100vh - 120px); gap: 0; background: white; border-radius: 16px; overflow: hidden; box-shadow: var(--shadow); }
    .conv-list { width: 300px; flex-shrink: 0; border-right: 1.5px solid #f0ebff; overflow-y: auto; }
    .conv-header { padding: 20px; font-size: 1rem; font-weight: 800; border-bottom: 1.5px solid #f0ebff; }
    .conv-item { padding: 16px 20px; cursor: pointer; border-bottom: 1px solid #f7f5ff; transition: background .15s; }
    .conv-item:hover { background: #faf8ff; }
    .conv-item.active { background: #f5f0ff; }
    .conv-name { font-size: 14px; font-weight: 700; color: #1a1a2e; margin-bottom: 3px; }
    .conv-preview { font-size: 12px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .conv-badge { background: var(--purple); color: white; border-radius: 20px; font-size: 11px; font-weight: 700; padding: 2px 8px; }
    .chat-area { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .chat-header { padding: 18px 24px; border-bottom: 1.5px solid #f0ebff; font-weight: 800; font-size: 15px; }
    .chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
    .msg-bubble { max-width: 70%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.5; }
    .msg-bubble.client { background: #f5f0ff; color: #1a1a2e; align-self: flex-start; border-bottom-left-radius: 4px; }
    .msg-bubble.company { background: var(--gradient); color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
    .msg-time { font-size: 11px; color: #aaa; margin-top: 2px; text-align: right; }
    .chat-input-row { padding: 16px 20px; border-top: 1.5px solid #f0ebff; display: flex; gap: 10px; }
    .chat-input { flex: 1; padding: 12px 16px; border: 1.5px solid #ede9fe; border-radius: 12px; font-size: 14px; outline: none; font-family: inherit; }
    .chat-input:focus { border-color: var(--purple); }
    .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #aaa; gap: 12px; }
    @media (max-width: 640px) {
      .msg-layout { flex-direction: column; height: auto; }
      .conv-list { width: 100%; border-right: none; border-bottom: 1.5px solid #f0ebff; max-height: 200px; }
    }
  `],
  template: `
    <div style="padding: 28px 20px 8px; max-width: 960px; margin: 0 auto">
      <p style="font-size:1.45rem;font-weight:800;margin:0 0 4px">Mensajes</p>
      <p style="font-size:13px;color:#888;margin:0 0 20px">Conversaciones con tus clientes</p>

      <div class="msg-layout">

        <div class="conv-list">
          <div class="conv-header">Conversaciones</div>
          @if (conversations().length === 0) {
            <div style="padding:24px;text-align:center;color:#aaa;font-size:13px">Sin mensajes aún</div>
          }
          @for (c of conversations(); track c.clientId) {
            <div class="conv-item" [class.active]="selectedClientId() === c.clientId"
                 (click)="selectConversation(c)">
              <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div class="conv-name">{{ c.clientName }}</div>
                @if (c.unread > 0) { <span class="conv-badge">{{ c.unread }}</span> }
              </div>
              <div class="conv-preview">{{ c.lastMessage }}</div>
            </div>
          }
        </div>

        <div class="chat-area">
          @if (!selectedClientId()) {
            <div class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <p>Seleccioná una conversación</p>
            </div>
          } @else {
            <div class="chat-header">{{ selectedClientName() }}</div>
            <div class="chat-messages" #chatBox>
              @for (m of currentMessages(); track m.id) {
                <div>
                  <div class="msg-bubble" [class.client]="m.senderRole === 'client'" [class.company]="m.senderRole === 'company'">
                    {{ m.text }}
                  </div>
                  <div class="msg-time" [style.text-align]="m.senderRole === 'company' ? 'right' : 'left'">
                    {{ formatTime(m.createdAt) }}
                  </div>
                </div>
              }
            </div>
            <div class="chat-input-row">
              <input class="chat-input" [(ngModel)]="replyText" placeholder="Escribí tu respuesta..." (keydown.enter)="sendReply()" />
              <button class="btn btn-primary" (click)="sendReply()" [disabled]="!replyText.trim() || sending()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          }
        </div>

      </div>
    </div>
  `,
})
export class MessagesComponent implements OnDestroy {
  private msgService = inject(MessageService);
  private companyStore = inject(CompanyStore);
  private auth = inject(AuthService);

  conversations = signal<Conversation[]>([]);
  selectedClientId = signal<string | null>(null);
  selectedClientName = signal<string>('');
  currentMessages = signal<Message[]>([]);
  replyText = '';
  sending = signal(false);

  private allMessages: Message[] = [];
  private convSub: Subscription | null = null;

  constructor() {
    effect(() => {
      const companyId = this.companyStore.companyId();
      if (!companyId) return;
      this.convSub?.unsubscribe();
      this.convSub = this.msgService.watchConversations(companyId).subscribe({
        next: (msgs) => {
          this.allMessages = msgs;
          this.buildConversations(msgs);
        },
        error: (err) => console.error('[Mensajes empresa] Firestore error:', err),
      });
    });
  }

  private buildConversations(msgs: Message[]) {
    const map = new Map<string, Conversation>();
    for (const m of msgs) {
      if (!map.has(m.clientId)) {
        map.set(m.clientId, {
          clientId: m.clientId,
          clientName: m.clientName,
          lastMessage: m.text,
          lastAt: m.createdAt,
          unread: 0,
        });
      }
      if (m.senderRole === 'client' && !m.read) {
        map.get(m.clientId)!.unread++;
      }
    }
    this.conversations.set(Array.from(map.values()));
    if (this.selectedClientId()) {
      this.currentMessages.set(
        this.allMessages
          .filter(m => m.clientId === this.selectedClientId())
          .reverse()
      );
    }
  }

  selectConversation(c: Conversation) {
    this.selectedClientId.set(c.clientId);
    this.selectedClientName.set(c.clientName);
    this.currentMessages.set(
      this.allMessages.filter(m => m.clientId === c.clientId).reverse()
    );
  }

  async sendReply() {
    const text = this.replyText.trim();
    if (!text) return;
    const companyId = this.companyStore.companyId();
    const clientId = this.selectedClientId();
    if (!companyId || !clientId) return;
    this.sending.set(true);
    this.replyText = '';
    const clientName = this.selectedClientName();
    try {
      await this.msgService.sendMessage({
        companyId,
        clientId,
        clientName,
        senderRole: 'company',
        text,
      });
    } catch {
      this.replyText = text;
    } finally {
      this.sending.set(false);
    }
  }

  formatTime(ts: any): string {
    if (!ts) return '';
    const d: Date = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  ngOnDestroy() {
    this.convSub?.unsubscribe();
  }
}
