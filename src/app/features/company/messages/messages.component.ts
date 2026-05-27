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
    .conv-item { padding: 16px 20px; cursor: pointer; border-bottom: 1px solid #f7f5ff; transition: background .15s; position: relative; }
    .conv-item:hover { background: #faf8ff; }
    .conv-item.active { background: #f5f0ff; }
    .conv-name { font-size: 14px; font-weight: 700; color: #1a1a2e; margin-bottom: 3px; }
    .conv-preview { font-size: 12px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .conv-badge { background: var(--purple); color: white; border-radius: 20px; font-size: 11px; font-weight: 700; padding: 2px 8px; }
    .conv-delete-btn { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #ccc; padding: 4px; border-radius: 6px; opacity: 0; transition: opacity .15s, color .15s; }
    .conv-item:hover .conv-delete-btn { opacity: 1; }
    .conv-delete-btn:hover { color: #ef4444; }
    .chat-area { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .chat-header { padding: 18px 24px; border-bottom: 1.5px solid #f0ebff; font-weight: 800; font-size: 15px; }
    .chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
    .msg-row { display: flex; flex-direction: column; position: relative; }
    .msg-row.company { align-items: flex-end; }
    .msg-row.client  { align-items: flex-start; }
    .msg-wrapper { position: relative; display: flex; align-items: center; gap: 4px; }
    .msg-wrapper.company { flex-direction: row-reverse; }
    .msg-bubble { max-width: 70%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.5; }
    .msg-bubble.client  { background: #f5f0ff; color: #1a1a2e; border-bottom-left-radius: 4px; }
    .msg-bubble.company { background: var(--gradient); color: white; border-bottom-right-radius: 4px; }
    .msg-bubble.deleted { background: #f3f4f6; color: #9ca3af; font-style: italic; }
    .msg-meta { font-size: 11px; color: #aaa; margin-top: 2px; display: flex; gap: 6px; align-items: center; }
    .msg-meta.company { justify-content: flex-end; }
    .msg-meta.client  { justify-content: flex-start; }
    .msg-menu-btn { background: none; border: none; cursor: pointer; color: #aaa; padding: 2px 4px; border-radius: 6px; opacity: 0; transition: opacity .15s; font-size: 16px; line-height: 1; flex-shrink: 0; }
    .msg-row:hover .msg-menu-btn { opacity: 1; }
    .msg-menu-btn:hover { background: #f3f4f6; color: #555; }
    .msg-dropdown { position: absolute; top: 100%; right: 0; background: white; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,.12); z-index: 100; min-width: 130px; overflow: hidden; }
    .msg-row.client .msg-dropdown { right: auto; left: 0; }
    .msg-dropdown button { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px; border: none; background: none; cursor: pointer; font-size: 13px; color: #374151; transition: background .1s; text-align: left; }
    .msg-dropdown button:hover { background: #f9fafb; }
    .msg-dropdown button.danger { color: #ef4444; }
    .msg-dropdown button.danger:hover { background: #fef2f2; }
    .edit-input { padding: 8px 12px; border: 1.5px solid var(--purple); border-radius: 10px; font-size: 14px; font-family: inherit; outline: none; width: 260px; max-width: 70vw; }
    .edit-actions { display: flex; gap: 6px; margin-top: 4px; }
    .chat-input-row { padding: 16px 20px; border-top: 1.5px solid #f0ebff; display: flex; gap: 10px; }
    .chat-input { flex: 1; padding: 12px 16px; border: 1.5px solid #ede9fe; border-radius: 12px; font-size: 14px; outline: none; font-family: inherit; }
    .chat-input:focus { border-color: var(--purple); }
    .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #aaa; gap: 12px; }
    .confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 999; display: flex; align-items: center; justify-content: center; }
    .confirm-card { background: white; border-radius: 16px; padding: 28px 32px; max-width: 360px; width: 90%; box-shadow: 0 8px 40px rgba(0,0,0,.15); }
    .confirm-card h3 { margin: 0 0 8px; font-size: 1.1rem; }
    .confirm-card p { margin: 0 0 20px; font-size: 14px; color: #666; }
    .confirm-actions { display: flex; gap: 10px; justify-content: flex-end; }
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

        <!-- Conversation list -->
        <div class="conv-list">
          <div class="conv-header">Conversaciones</div>
          @if (conversations().length === 0) {
            <div style="padding:24px;text-align:center;color:#aaa;font-size:13px">Sin mensajes aún</div>
          }
          @for (c of conversations(); track c.clientId) {
            <div class="conv-item" [class.active]="selectedClientId() === c.clientId"
                 (click)="selectConversation(c)">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-right:24px">
                <div class="conv-name">{{ c.clientName }}</div>
                @if (c.unread > 0) { <span class="conv-badge">{{ c.unread }}</span> }
              </div>
              <div class="conv-preview">{{ c.lastMessage }}</div>
              <button class="conv-delete-btn" title="Eliminar conversación"
                      (click)="$event.stopPropagation(); confirmDeleteChat.set(c.clientId)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          }
        </div>

        <!-- Chat area -->
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
                <div class="msg-row" [class.company]="m.senderRole === 'company'" [class.client]="m.senderRole === 'client'"
                     (click)="menuOpenId() === m.id ? closeMenu() : null">

                  @if (editingId() === m.id) {
                    <!-- Inline edit -->
                    <input class="edit-input" [(ngModel)]="editText" (keydown.enter)="saveEdit(m.id!)" (keydown.escape)="cancelEdit()" />
                    <div class="edit-actions">
                      <button class="btn btn-primary" style="padding:5px 14px;font-size:13px" (click)="saveEdit(m.id!)">Guardar</button>
                      <button class="btn" style="padding:5px 14px;font-size:13px;border:1.5px solid #ddd" (click)="cancelEdit()">Cancelar</button>
                    </div>
                  } @else {
                    <div class="msg-wrapper" [class.company]="m.senderRole === 'company'">
                      <div class="msg-bubble" [class.client]="m.senderRole === 'client'" [class.company]="m.senderRole === 'company'" [class.deleted]="m.deleted">
                        @if (m.deleted) { <em>Mensaje eliminado</em> }
                        @else { {{ m.text }} }
                      </div>
                      <!-- Menu button only on own (company) messages, not deleted -->
                      @if (m.senderRole === 'company' && !m.deleted) {
                        <button class="msg-menu-btn" (click)="$event.stopPropagation(); toggleMenu(m.id!)">⋯</button>
                        @if (menuOpenId() === m.id) {
                          <div class="msg-dropdown">
                            <button (click)="startEdit(m)">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              Editar
                            </button>
                            <button class="danger" (click)="deleteMsg(m.id!)">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                              Eliminar
                            </button>
                          </div>
                        }
                      }
                    </div>
                    <div class="msg-meta" [class.company]="m.senderRole === 'company'" [class.client]="m.senderRole === 'client'">
                      <span>{{ formatTime(m.createdAt) }}</span>
                      @if (m.edited && !m.deleted) { <span>editado</span> }
                    </div>
                  }
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

    <!-- Confirm delete conversation -->
    @if (confirmDeleteChat()) {
      <div class="confirm-overlay" (click)="confirmDeleteChat.set(null)">
        <div class="confirm-card" (click)="$event.stopPropagation()">
          <h3>Eliminar conversación</h3>
          <p>Se borrarán todos los mensajes con este cliente. Esta acción no se puede deshacer.</p>
          <div class="confirm-actions">
            <button class="btn" style="border:1.5px solid #ddd;padding:8px 18px" (click)="confirmDeleteChat.set(null)">Cancelar</button>
            <button class="btn" style="background:#ef4444;color:white;padding:8px 18px" (click)="doDeleteConversation()">Eliminar</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class MessagesComponent implements OnDestroy {
  private msgService = inject(MessageService);
  private companyStore = inject(CompanyStore);
  private auth = inject(AuthService);

  conversations    = signal<Conversation[]>([]);
  selectedClientId = signal<string | null>(null);
  selectedClientName = signal<string>('');
  currentMessages  = signal<Message[]>([]);
  replyText = '';
  sending = signal(false);

  menuOpenId       = signal<string | null>(null);
  editingId        = signal<string | null>(null);
  editText         = '';
  confirmDeleteChat = signal<string | null>(null);

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
        const preview = m.deleted ? 'Mensaje eliminado' : (m.text || '');
        map.set(m.clientId, {
          clientId: m.clientId,
          clientName: m.clientName,
          lastMessage: preview,
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
        this.allMessages.filter(m => m.clientId === this.selectedClientId()).reverse()
      );
    }
  }

  selectConversation(c: Conversation) {
    this.selectedClientId.set(c.clientId);
    this.selectedClientName.set(c.clientName);
    this.currentMessages.set(
      this.allMessages.filter(m => m.clientId === c.clientId).reverse()
    );
    this.closeMenu();
    this.cancelEdit();
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

  toggleMenu(id: string) {
    this.menuOpenId.set(this.menuOpenId() === id ? null : id);
    this.cancelEdit();
  }

  closeMenu() {
    this.menuOpenId.set(null);
  }

  startEdit(m: Message) {
    this.editingId.set(m.id!);
    this.editText = m.text;
    this.closeMenu();
  }

  async saveEdit(id: string) {
    const text = this.editText.trim();
    if (!text) return;
    await this.msgService.editMessage(id, text);
    this.cancelEdit();
  }

  cancelEdit() {
    this.editingId.set(null);
    this.editText = '';
  }

  async deleteMsg(id: string) {
    this.closeMenu();
    await this.msgService.deleteMessage(id);
  }

  async doDeleteConversation() {
    const clientId = this.confirmDeleteChat();
    const companyId = this.companyStore.companyId();
    if (!clientId || !companyId) return;
    this.confirmDeleteChat.set(null);
    await this.msgService.deleteConversation(companyId, clientId);
    if (this.selectedClientId() === clientId) {
      this.selectedClientId.set(null);
      this.selectedClientName.set('');
      this.currentMessages.set([]);
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
