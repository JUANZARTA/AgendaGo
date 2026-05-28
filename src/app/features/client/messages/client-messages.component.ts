import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MessageService, Message } from '../../../core/services/message.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CompanyService } from '../../../core/services/company.service';
import { Subscription } from 'rxjs';

interface CompanyConversation {
  companyId: string;
  companyName: string;
  lastMessage: string;
  lastAt: any;
  unread: number;
}

@Component({
  selector: 'app-client-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .msg-layout { display:flex; height:min(580px, calc(100vh - 180px)); background:white; border-radius:16px; overflow:hidden; box-shadow:var(--shadow); }

    /* ── Lista conversaciones ── */
    .conv-list { width:300px; flex-shrink:0; border-right:1.5px solid #f0ebff; display:flex; flex-direction:column; }
    .conv-top { padding:16px 20px; font-size:1rem; font-weight:800; border-bottom:1.5px solid #f0ebff; flex-shrink:0; }
    .conv-scroll { flex:1; overflow-y:auto; }
    .conv-item { padding:14px 16px; cursor:pointer; border-bottom:1px solid #f7f5ff; transition:background .15s; display:flex; align-items:center; gap:10px; position:relative; }
    .conv-item:hover { background:#faf8ff; }
    .conv-item.active { background:#eff6ff; }
    .conv-avatar { width:40px; height:40px; border-radius:50%; background:var(--gradient); display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:800; color:white; flex-shrink:0; }
    .conv-info { flex:1; min-width:0; }
    .conv-name { font-size:14px; font-weight:700; color:#1a1a2e; }
    .conv-preview { font-size:12px; color:#888; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px; }
    .conv-badge { background:var(--purple); color:white; border-radius:20px; font-size:10px; font-weight:800; padding:2px 7px; }
    .conv-del-btn { opacity:0; width:28px; height:28px; border-radius:8px; border:none; background:#fee2e2; color:#dc2626; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:opacity .15s; }
    .conv-item:hover .conv-del-btn { opacity:1; }

    /* ── Área de chat ── */
    .chat-area { flex:1; display:flex; flex-direction:column; min-width:0; }
    .chat-header { padding:14px 20px; border-bottom:1.5px solid #f0ebff; font-weight:800; font-size:15px; flex-shrink:0; display:flex; align-items:center; gap:10px; }
    .chat-messages { flex:1; overflow-y:auto; padding:16px 20px; display:flex; flex-direction:column; gap:6px; }
    .empty-state { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#aaa; gap:10px; }

    /* ── Burbujas ── */
    .msg-row { display:flex; flex-direction:column; max-width:72%; position:relative; }
    .msg-row.mine { align-self:flex-end; align-items:flex-end; }
    .msg-row.theirs { align-self:flex-start; align-items:flex-start; }

    .msg-bubble {
      padding:9px 13px; border-radius:16px; font-size:14px; line-height:1.5; word-break:break-word; position:relative;
    }
    .mine .msg-bubble { background:var(--gradient); color:white; border-bottom-right-radius:4px; }
    .theirs .msg-bubble { background:#f0f4ff; color:#1a1a2e; border-bottom-left-radius:4px; }
    .msg-deleted { font-size:13px; font-style:italic; color:#aaa; padding:6px 10px; border:1px solid #e5e7eb; border-radius:12px; }
    .msg-meta { display:flex; align-items:center; gap:6px; margin-top:2px; font-size:11px; color:#aaa; }
    .mine .msg-meta { flex-direction:row-reverse; }
    .msg-edited { color:#a0aec0; font-size:10px; }

    /* ── Menú de acciones ── */
    .msg-actions-wrap { position:absolute; top:50%; transform:translateY(-50%); opacity:0; transition:opacity .15s; }
    .mine .msg-actions-wrap { left:-36px; }
    .theirs .msg-actions-wrap { right:-36px; }
    .msg-row:hover .msg-actions-wrap { opacity:1; }
    .msg-menu-btn { width:28px; height:28px; border:none; border-radius:8px; background:#f1f5f9; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#555; font-size:16px; }
    .msg-menu-btn:hover { background:#e2e8f0; }
    .msg-dropdown { position:absolute; z-index:50; background:white; border:1.5px solid #e5e7eb; border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,.12); padding:6px; min-width:120px; }
    .mine .msg-dropdown { right:32px; top:0; }
    .theirs .msg-dropdown { left:32px; top:0; }
    .msg-dropdown button { display:flex; align-items:center; gap:8px; width:100%; padding:8px 12px; border:none; background:none; cursor:pointer; font-size:13px; font-weight:600; border-radius:8px; color:#1a1a2e; font-family:inherit; }
    .msg-dropdown button:hover { background:#f8fafc; }
    .msg-dropdown .del-opt { color:#dc2626; }

    /* ── Edit inline ── */
    .edit-wrap { display:flex; gap:6px; align-items:center; }
    .edit-input { flex:1; padding:8px 12px; border:2px solid var(--purple); border-radius:12px; font-size:14px; outline:none; font-family:inherit; }
    .edit-save { padding:7px 12px; border-radius:10px; border:none; background:var(--gradient); color:white; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; }
    .edit-cancel { padding:7px 10px; border-radius:10px; border:1.5px solid #e5e7eb; background:none; font-size:13px; cursor:pointer; font-family:inherit; }

    /* ── Input de envío ── */
    .chat-input-row { padding:14px 16px; border-top:1.5px solid #f0ebff; display:flex; gap:8px; flex-shrink:0; }
    .chat-input { flex:1; padding:11px 16px; border:1.5px solid #dbeafe; border-radius:24px; font-size:14px; outline:none; font-family:inherit; background:#f8fbff; transition:border-color .15s; }
    .chat-input:focus { border-color:var(--purple); background:white; }
    .send-btn { width:40px; height:40px; border-radius:50%; border:none; background:var(--gradient); color:white; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .send-btn:disabled { opacity:.4; cursor:not-allowed; }

    /* ── Confirm borrar chat ── */
    .confirm-overlay { position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:200; display:flex; align-items:center; justify-content:center; }
    .confirm-card { background:white; border-radius:16px; padding:28px 24px; max-width:340px; width:100%; box-shadow:0 16px 48px rgba(0,0,0,.2); text-align:center; }
    .confirm-card h3 { font-size:1rem; font-weight:800; margin-bottom:8px; }
    .confirm-card p { font-size:13px; color:#666; margin-bottom:20px; }
    .confirm-actions { display:flex; gap:10px; justify-content:center; }

    @media (max-width:640px) {
      .msg-layout { flex-direction:column; height:auto; min-height:400px; }
      .conv-list { width:100%; border-right:none; border-bottom:1.5px solid #f0ebff; max-height:180px; }
      .msg-row { max-width:85%; }
    }
  `],
  template: `
    <!-- Confirm borrar conversación -->
    @if (confirmDeleteChat()) {
      <div class="confirm-overlay" (click)="confirmDeleteChat.set(null)">
        <div class="confirm-card" (click)="$event.stopPropagation()">
          <h3>¿Borrar conversación?</h3>
          <p>Se eliminarán todos los mensajes con <strong>{{ confirmDeleteChat()!.companyName }}</strong>. Esta acción no se puede deshacer.</p>
          <div class="confirm-actions">
            <button class="btn btn-secondary btn-sm" (click)="confirmDeleteChat.set(null)">Cancelar</button>
            <button class="btn btn-danger btn-sm" (click)="doDeleteConversation()">Sí, borrar</button>
          </div>
        </div>
      </div>
    }

    <div style="padding:28px 20px 8px;max-width:960px;margin:0 auto">
      <p style="font-size:1.45rem;font-weight:800;margin:0 0 4px">Mensajes</p>
      <p style="font-size:13px;color:#888;margin:0 0 20px">Tus conversaciones con negocios</p>

      <div class="msg-layout">

        <!-- Lista -->
        <div class="conv-list">
          <div class="conv-top">Conversaciones</div>
          <div class="conv-scroll">
            @if (conversations().length === 0) {
              <div style="padding:24px;text-align:center;color:#aaa;font-size:13px">Sin mensajes aún</div>
            }
            @for (c of conversations(); track c.companyId) {
              <div class="conv-item" [class.active]="selectedCompanyId() === c.companyId"
                   (click)="selectConversation(c)">
                <div class="conv-avatar">{{ c.companyName[0] }}</div>
                <div class="conv-info">
                  <div class="conv-name">{{ c.companyName }}</div>
                  <div class="conv-preview">{{ c.lastMessage }}</div>
                </div>
                @if (c.unread > 0) { <span class="conv-badge">{{ c.unread }}</span> }
                <button class="conv-del-btn" title="Borrar conversación"
                        (click)="$event.stopPropagation(); confirmDeleteChat.set(c)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                  </svg>
                </button>
              </div>
            }
          </div>
        </div>

        <!-- Chat -->
        <div class="chat-area">
          @if (!selectedCompanyId()) {
            <div class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <p>Seleccioná una conversación</p>
            </div>
          } @else {
            <div class="chat-header">
              <div style="width:36px;height:36px;border-radius:50%;background:var(--gradient);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:14px;flex-shrink:0">
                {{ selectedCompanyName()[0] }}
              </div>
              <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ selectedCompanyName() }}</span>
              @if (selectedCompanyWa()) {
                <a [href]="'https://wa.me/' + selectedCompanyWa()!.replace(/\D/g, '')"
                   target="_blank" rel="noopener" title="Escribir por WhatsApp"
                   style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;background:#f0fdf4;border:1.5px solid #bbf7d0;color:#16a34a;flex-shrink:0;text-decoration:none;transition:background .15s"
                   onmouseover="this.style.background='#dcfce7'"
                   onmouseout="this.style.background='#f0fdf4'">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                </a>
              }
            </div>

            <div class="chat-messages" (click)="closeMenu()">
              @for (m of currentMessages(); track m.id) {
                <div class="msg-row" [class.mine]="m.senderRole === 'client'" [class.theirs]="m.senderRole === 'company'">

                  @if (m.deleted) {
                    <div class="msg-deleted">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;margin-right:4px"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                      Mensaje eliminado
                    </div>

                  } @else if (editingId() === m.id) {
                    <div class="edit-wrap">
                      <input class="edit-input" [(ngModel)]="editText"
                             (keydown.enter)="saveEdit(m)"
                             (keydown.escape)="cancelEdit()" />
                      <button class="edit-save" (click)="saveEdit(m)">Guardar</button>
                      <button class="edit-cancel" (click)="cancelEdit()">✕</button>
                    </div>

                  } @else {
                    <div class="msg-bubble">{{ m.text }}</div>
                    <div class="msg-meta">
                      <span>{{ formatTime(m.createdAt) }}</span>
                      @if (m.edited) { <span class="msg-edited">editado</span> }
                    </div>

                    @if (m.senderRole === 'client' && m.id) {
                      <div class="msg-actions-wrap">
                        <button class="msg-menu-btn" (click)="$event.stopPropagation(); toggleMenu(m.id)">⋯</button>
                        @if (menuOpenId() === m.id) {
                          <div class="msg-dropdown">
                            <button (click)="startEdit(m)">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              Editar
                            </button>
                            <button class="del-opt" (click)="deleteMsg(m)">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                              Eliminar
                            </button>
                          </div>
                        }
                      </div>
                    }
                  }

                </div>
              }
            </div>

            <div class="chat-input-row">
              <input class="chat-input" [(ngModel)]="newText" placeholder="Escribí un mensaje..."
                     (keydown.enter)="send()" (click)="closeMenu()" />
              <button class="send-btn" (click)="send()" [disabled]="!newText.trim() || sending()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          }
        </div>

      </div>
    </div>
  `,
})
export class ClientMessagesComponent implements OnDestroy {
  private msgSvc      = inject(MessageService);
  private auth        = inject(AuthService);
  private route       = inject(ActivatedRoute);
  private notifSvc    = inject(NotificationService);
  private companySvc  = inject(CompanyService);

  private ownerIdCache    = new Map<string, string>();
  private whatsappCache   = new Map<string, string>();
  selectedCompanyWa       = signal<string | null>(null);

  conversations       = signal<CompanyConversation[]>([]);
  selectedCompanyId   = signal<string | null>(null);
  selectedCompanyName = signal<string>('');
  currentMessages     = signal<Message[]>([]);
  newText  = '';
  sending  = signal(false);

  menuOpenId         = signal<string | null>(null);
  editingId          = signal<string | null>(null);
  editText           = '';
  confirmDeleteChat  = signal<CompanyConversation | null>(null);

  private allMessages: Message[] = [];
  private listSub: Subscription | null = null;
  private chatSub: Subscription | null = null;

  private queryParams = toSignal(this.route.queryParams, { initialValue: {} as Record<string, string> });

  constructor() {
    effect(() => {
      const uid = this.auth.currentUser()?.uid;
      if (!uid) return;
      this.listSub?.unsubscribe();
      this.listSub = this.msgSvc.watchByClient(uid).subscribe({
        next: (msgs) => { this.allMessages = msgs; this.buildConversations(msgs); },
        error: (err) => console.error('[ClientMessages] lista:', err),
      });
    });

    effect(() => {
      const uid       = this.auth.currentUser()?.uid;
      const params    = this.queryParams();
      const companyId = params['companyId'];
      if (!uid || !companyId) return;
      if (this.selectedCompanyId() === companyId) return;
      this.openChat(companyId, params['companyName'] ?? '', uid);
    });
  }

  private openChat(companyId: string, companyName: string, uid: string) {
    this.selectedCompanyId.set(companyId);
    this.selectedCompanyName.set(companyName);
    this.selectedCompanyWa.set(this.whatsappCache.get(companyId) ?? null);
    this.editingId.set(null);
    this.menuOpenId.set(null);
    this.msgSvc.markRead(companyId, uid, 'client').catch(() => {});
    this.loadCompanyMeta(companyId);
    this.chatSub?.unsubscribe();
    this.chatSub = this.msgSvc.watchMessages(companyId, uid).subscribe({
      next: (msgs) => this.currentMessages.set(msgs),
      error: (err) => console.error('[ClientMessages] chat:', err),
    });
  }

  private async loadCompanyMeta(companyId: string): Promise<void> {
    if (this.ownerIdCache.has(companyId)) return;
    const company = await this.companySvc.getCompany(companyId);
    if (!company) return;
    if (company.ownerId) this.ownerIdCache.set(companyId, company.ownerId);
    if (company.phone) {
      this.whatsappCache.set(companyId, company.phone);
      if (this.selectedCompanyId() === companyId) this.selectedCompanyWa.set(company.phone);
    }
  }

  private async getOwnerId(companyId: string): Promise<string | null> {
    await this.loadCompanyMeta(companyId);
    return this.ownerIdCache.get(companyId) ?? null;
  }

  private buildConversations(msgs: Message[]) {
    const map = new Map<string, CompanyConversation>();
    for (const m of msgs) {
      if (!map.has(m.companyId)) {
        map.set(m.companyId, { companyId: m.companyId, companyName: m.companyName ?? 'Empresa', lastMessage: m.deleted ? 'Mensaje eliminado' : m.text, lastAt: m.createdAt, unread: 0 });
      }
      if (m.senderRole === 'company' && !m.read) map.get(m.companyId)!.unread++;
    }
    this.conversations.set(Array.from(map.values()));
  }

  selectConversation(c: CompanyConversation) {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;
    this.openChat(c.companyId, c.companyName, uid);
  }

  // ── Menú ──────────────────────────────────────────────
  toggleMenu(id: string) { this.menuOpenId.set(this.menuOpenId() === id ? null : id); }
  closeMenu() { this.menuOpenId.set(null); }

  // ── Editar ────────────────────────────────────────────
  startEdit(m: Message) {
    this.editingId.set(m.id!);
    this.editText = m.text;
    this.menuOpenId.set(null);
  }

  async saveEdit(m: Message) {
    const text = this.editText.trim();
    if (!text || !m.id) return;
    this.editingId.set(null);
    try { await this.msgSvc.editMessage(m.id, text); }
    catch (err) { console.error('[ClientMessages] edit:', err); this.editingId.set(m.id); }
  }

  cancelEdit() { this.editingId.set(null); }

  // ── Borrar mensaje ────────────────────────────────────
  async deleteMsg(m: Message) {
    this.menuOpenId.set(null);
    if (!m.id) return;
    try { await this.msgSvc.deleteMessage(m.id); }
    catch (err) { console.error('[ClientMessages] delete msg:', err); }
  }

  // ── Borrar conversación ───────────────────────────────
  async doDeleteConversation() {
    const c = this.confirmDeleteChat();
    if (!c) return;
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;
    this.confirmDeleteChat.set(null);
    try {
      await this.msgSvc.deleteConversation(c.companyId, uid);
      if (this.selectedCompanyId() === c.companyId) {
        this.selectedCompanyId.set(null);
        this.currentMessages.set([]);
        this.chatSub?.unsubscribe();
      }
    } catch (err) { console.error('[ClientMessages] delete conv:', err); }
  }

  // ── Enviar ────────────────────────────────────────────
  async send() {
    const text      = this.newText.trim();
    const uid       = this.auth.currentUser()?.uid;
    const companyId = this.selectedCompanyId();
    if (!text || !uid || !companyId) return;

    this.sending.set(true);
    this.newText = '';

    const optimistic: Message = { companyId, companyName: this.selectedCompanyName(), clientId: uid, clientName: this.auth.displayName() || '', senderRole: 'client', text, createdAt: null };
    this.currentMessages.update(prev => [...prev, optimistic]);

    try {
      const clientName = this.auth.displayName() || this.auth.currentUser()?.email || 'Cliente';
      await this.msgSvc.sendMessage({ companyId, companyName: this.selectedCompanyName(), clientId: uid, clientName, senderRole: 'client', text });
      this.getOwnerId(companyId).then(ownerId => {
        if (!ownerId) return;
        this.notifSvc.create({
          recipientId: ownerId,
          type: 'new_message',
          title: `${clientName} te escribió`,
          body: text.length > 80 ? text.slice(0, 80) + '…' : text,
          link: '/empresa/mensajes',
        }).catch(() => {});
      }).catch(() => {});
    } catch (err) {
      console.error('[ClientMessages] send:', err);
      this.currentMessages.update(prev => prev.filter(m => m !== optimistic));
      this.newText = text;
    } finally { this.sending.set(false); }
  }

  formatTime(ts: any): string {
    if (!ts) return '';
    const d: Date = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  ngOnDestroy() { this.listSub?.unsubscribe(); this.chatSub?.unsubscribe(); }
}
