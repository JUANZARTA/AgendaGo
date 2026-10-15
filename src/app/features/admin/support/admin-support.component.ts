import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { SupportMessage, SupportService, SupportThread } from '../../../core/services/support.service';
import { SupportConversationComponent } from '../../../shared/components/support-conversation.component';

type ThreadFilter = 'all' | 'urgente' | 'consulta';
type Thread = SupportThread & { id: string };

/**
 * Soporte (admin): conversaciones con las empresas. Mismo layout que Mensajes de la empresa.
 * Orden: urgentes sin leer → sin leer → último mensaje más reciente.
 * `?hilo={id}` (link de la notificación) abre ese hilo directo.
 */
@Component({
  selector: 'app-admin-support',
  standalone: true,
  imports: [SupportConversationComponent],
  styles: [`
    .msg-layout { display: flex; height: min(620px, calc(100vh - 180px)); background: white; border-radius: 16px; overflow: hidden; box-shadow: var(--shadow); }
    .conv-list { width: 300px; flex-shrink: 0; border-right: 1.5px solid #f0ebff; display: flex; flex-direction: column; min-height: 0; }
    .conv-header { padding: 16px 20px 12px; font-size: 1rem; font-weight: 800; border-bottom: 1.5px solid #f0ebff; }
    .filters { display: flex; gap: 6px; margin-top: 10px; }
    .filter { padding: 4px 11px; border-radius: 99px; border: 1.5px solid #ede9fe; background: white; font-size: 12px; font-weight: 700; color: #6b7280; cursor: pointer; font-family: inherit; }
    .filter.active { background: var(--gradient); border-color: transparent; color: white; }
    .conv-scroll { flex: 1; overflow-y: auto; }
    .conv-item { padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #f7f5ff; transition: background .15s; }
    .conv-item:hover { background: #faf8ff; }
    .conv-item.active { background: #f5f0ff; }
    .conv-item.resolved { opacity: .55; }
    .conv-top { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
    .conv-name { font-size: 14px; font-weight: 700; color: #1a1a2e; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .conv-item.unread .conv-name { font-weight: 800; }
    .conv-time { font-size: 11px; color: #aaa; flex-shrink: 0; }
    .conv-bottom { display: flex; align-items: center; gap: 6px; }
    .conv-preview { font-size: 12px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; }
    .conv-item.unread .conv-preview { color: #374151; font-weight: 600; }
    .unread-dot { width: 9px; height: 9px; border-radius: 50%; background: #f43f5e; flex-shrink: 0; }
    .tag { font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 99px; flex-shrink: 0; text-transform: uppercase; letter-spacing: .02em; }
    .tag.consulta { background: #dbeafe; color: #1d4ed8; }
    .tag.urgente  { background: #fee2e2; color: #b91c1c; }
    .tag.resolved { background: #f3f4f6; color: #6b7280; }
    .chat-area { flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; }
    .chat-header { padding: 12px 16px 12px 20px; border-bottom: 1.5px solid #f0ebff; display: flex; align-items: center; gap: 10px; }
    .chat-title { flex: 1; min-width: 0; font-weight: 800; font-size: 15px; display: flex; align-items: center; gap: 8px; }
    .chat-title span:first-child { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .back-btn { display: none; background: none; border: none; font-size: 18px; cursor: pointer; padding: 4px 8px; color: #555; font-family: inherit; }
    .status-btn { padding: 7px 14px; border-radius: 10px; border: 1.5px solid #e5e7eb; background: white; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; color: #374151; flex-shrink: 0; }
    .status-btn.resolve { border-color: #bbf7d0; color: #15803d; }
    .status-btn:disabled { opacity: .5; cursor: default; }
    .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #aaa; gap: 12px; }
    .err { margin: 0 12px 8px; padding: 8px 12px; border-radius: 10px; background: #fef2f2; color: #b91c1c; font-size: 12px; }

    /* Mobile: lista y chat como pantallas separadas */
    @media (max-width: 768px) {
      .msg-layout { height: calc(100dvh - 190px - env(safe-area-inset-bottom)); min-height: 380px; }
      .conv-list { width: 100%; border-right: none; }
      .chat-area { display: none; }
      .msg-layout.has-selection .conv-list { display: none; }
      .msg-layout.has-selection .chat-area { display: flex; }
      .back-btn { display: block; padding: 4px 6px; }
      .chat-header { padding: 10px 12px; gap: 6px; }
      .status-btn { padding: 6px 10px; font-size: 12px; }
      /* Nombre arriba y etiqueta abajo: así entra el nombre completo */
      .chat-title { flex-direction: column; align-items: flex-start; gap: 2px; }
      .chat-title span:first-child { max-width: 100%; }
    }
  `],
  template: `
    <div style="padding: 28px 20px 8px; max-width: 1000px; margin: 0 auto">
      <p style="font-size:1.45rem;font-weight:800;margin:0 0 4px">Soporte</p>
      <p style="font-size:13px;color:#888;margin:0 0 20px">Conversaciones con las empresas</p>

      <div class="msg-layout" [class.has-selection]="!!selected()">

        <!-- Lista de hilos -->
        <div class="conv-list">
          <div class="conv-header">
            Conversaciones
            <div class="filters">
              <button class="filter" [class.active]="filter() === 'all'"      (click)="filter.set('all')">Todos</button>
              <button class="filter" [class.active]="filter() === 'urgente'"  (click)="filter.set('urgente')">Urgentes</button>
              <button class="filter" [class.active]="filter() === 'consulta'" (click)="filter.set('consulta')">Consultas</button>
            </div>
          </div>
          <div class="conv-scroll">
            @if (loadError()) {
              <div style="padding:24px;text-align:center;color:#b91c1c;font-size:13px">No se pudieron cargar las conversaciones.</div>
            } @else if (visible().length === 0) {
              <div style="padding:24px;text-align:center;color:#aaa;font-size:13px">Sin conversaciones</div>
            }
            @for (t of visible(); track t.id) {
              <div class="conv-item" [class.active]="selectedId() === t.id" [class.unread]="t.unreadByAdmin"
                   [class.resolved]="t.status === 'resolved'" (click)="select(t.id)">
                <div class="conv-top">
                  <span class="conv-name">{{ t.companyName }}</span>
                  <span class="conv-time">{{ formatWhen(t.lastMessageAt) }}</span>
                </div>
                <div class="conv-bottom">
                  <span class="tag" [class.consulta]="t.kind === 'consulta'" [class.urgente]="t.kind === 'urgente'">
                    {{ t.kind === 'urgente' ? 'Urgente' : 'Consulta' }}
                  </span>
                  @if (t.status === 'resolved') { <span class="tag resolved">Resuelto</span> }
                  <span class="conv-preview">{{ t.lastSender === 'admin' ? 'Tú: ' : '' }}{{ t.lastMessage }}</span>
                  @if (t.unreadByAdmin) { <span class="unread-dot" aria-label="Sin leer"></span> }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Chat -->
        <div class="chat-area">
          @if (selected(); as t) {
            <div class="chat-header">
              <button class="back-btn" (click)="selectedId.set(null)" aria-label="Volver">←</button>
              <div class="chat-title">
                <span>{{ t.companyName }}</span>
                <span class="tag" [class.consulta]="t.kind === 'consulta'" [class.urgente]="t.kind === 'urgente'">
                  {{ t.kind === 'urgente' ? 'Urgente' : 'Consulta' }}
                </span>
              </div>
              @if (t.status === 'resolved') {
                <button class="status-btn" [disabled]="statusBusy()" (click)="setStatus(t, 'open')">Reabrir</button>
              } @else {
                <button class="status-btn resolve" [disabled]="statusBusy()" (click)="setStatus(t, 'resolved')">Marcar resuelto</button>
              }
            </div>
            <app-support-conversation
              [messages]="messages()"
              me="admin"
              [theirLabel]="t.companyName"
              [sending]="sending()"
              placeholder="Escribe tu respuesta..."
              (send)="send(t, $event)" />
            @if (error()) { <div class="err">{{ error() }}</div> }
          } @else {
            <div class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <p>Selecciona una conversación</p>
            </div>
          }
        </div>

      </div>
    </div>
  `,
})
export class AdminSupportComponent {
  private support = inject(SupportService);
  private route   = inject(ActivatedRoute);

  threads    = signal<Thread[]>([]);
  loadError  = signal(false);
  filter     = signal<ThreadFilter>('all');
  selectedId = signal<string | null>(null);
  messages   = signal<SupportMessage[]>([]);
  sending    = signal(false);
  statusBusy = signal(false);
  error      = signal('');

  private conv = viewChild(SupportConversationComponent);

  /** Urgentes sin leer → sin leer → más recientes. */
  sorted = computed(() => {
    const rank = (t: Thread) => t.unreadByAdmin ? (t.kind === 'urgente' ? 0 : 1) : 2;
    // Sin timestamp todavía (escritura pendiente) = lo más nuevo
    const secs = (t: Thread) => t.lastMessageAt?.seconds ?? Number.MAX_SAFE_INTEGER;
    return [...this.threads()].sort((a, b) => rank(a) - rank(b) || secs(b) - secs(a));
  });
  visible  = computed(() => this.filter() === 'all' ? this.sorted() : this.sorted().filter(t => t.kind === this.filter()));
  selected = computed(() => this.threads().find(t => t.id === this.selectedId()) ?? null);

  private requestedId = toSignal(this.route.queryParamMap.pipe(map(p => p.get('hilo'))), { initialValue: null });

  constructor() {
    effect(onCleanup => {
      const sub = this.support.watchAllThreads().subscribe({
        next: list => { this.threads.set(list as Thread[]); this.loadError.set(false); },
        error: err => { console.error('[Soporte admin] hilos:', err); this.loadError.set(true); },
      });
      onCleanup(() => sub.unsubscribe());
    });

    // Link de la notificación: abre ese hilo
    effect(() => {
      const id = this.requestedId();
      if (id) this.selectedId.set(id);
    });

    // Mensajes del hilo elegido (sólo cambia la suscripción si cambia el id)
    effect(onCleanup => {
      const id = this.selectedId();
      this.messages.set([]);
      this.error.set('');
      if (!id) return;
      const sub = this.support.watchMessages(id).subscribe({
        next: list => this.messages.set(list),
        error: err => console.error('[Soporte admin] mensajes:', err),
      });
      onCleanup(() => sub.unsubscribe());
    });

    // Con el hilo abierto, lo que escribe la empresa queda leído
    effect(() => {
      const t = this.selected();
      if (t?.unreadByAdmin) this.support.markReadByAdmin(t.id).catch(() => {});
    });
  }

  select(id: string): void {
    this.selectedId.set(id);
  }

  async send(t: Thread, text: string): Promise<void> {
    this.sending.set(true);
    this.error.set('');
    try {
      await this.support.sendFromAdmin(t, text);
    } catch (err) {
      console.error('[Soporte admin] envío:', err);
      this.error.set('No se pudo enviar la respuesta. Prueba de nuevo.');
      this.conv()?.restore(text);
    } finally {
      this.sending.set(false);
    }
  }

  async setStatus(t: Thread, status: 'open' | 'resolved'): Promise<void> {
    this.statusBusy.set(true);
    try {
      await this.support.setStatus(t.id, status);
    } catch (err) {
      console.error('[Soporte admin] estado:', err);
    } finally {
      this.statusBusy.set(false);
    }
  }

  formatWhen(ts: any): string {
    if (!ts) return '';
    const d: Date = ts?.toDate ? ts.toDate() : new Date(ts);
    return new Date().toDateString() === d.toDateString()
      ? d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  }
}
