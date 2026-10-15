import { Component, OnDestroy, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Company } from '../../../../core/services/company.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MessageService, Message } from '../../../../core/services/message.service';

/** Chat flotante cliente ↔ negocio (mantiene su propia suscripción a mensajes). */
@Component({
  selector: 'app-cp-chat-widget',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    :host { display: contents; }

    @media (max-width: 640px) {
      input, select, textarea { font-size: 16px !important; }
    }
  `],
  template: `
    @if (authSvc.isLoggedIn() && authSvc.role() === 'client') {
      @if (!chatOpen()) {
        <button (click)="openChat()"
          style="position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:var(--gradient);border:none;cursor:pointer;box-shadow:0 4px 16px rgba(var(--primary-rgb),.35);display:flex;align-items:center;justify-content:center;z-index:100;color:white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
      } @else {
        <div style="position:fixed;bottom:24px;right:24px;width:340px;height:460px;background:white;border-radius:18px;box-shadow:0 8px 40px rgba(0,0,0,.18);display:flex;flex-direction:column;z-index:100;overflow:hidden">
          <div style="padding:16px 18px;background:var(--gradient);display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-size:14px;font-weight:700;color:white">{{ company()?.name }}</div>
              <a [routerLink]="['/cliente/mensajes']"
                 [queryParams]="{companyId: company()?.id, companyName: company()?.name}"
                 style="font-size:11px;color:rgba(255,255,255,.8);text-decoration:underline">
                Ver historial completo
              </a>
            </div>
            <button (click)="closeChat()" style="background:rgba(255,255,255,.2);border:none;border-radius:8px;width:30px;height:30px;cursor:pointer;color:white;display:flex;align-items:center;justify-content:center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px">
            @if (chatMessages().length === 0) {
              <div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:#aaa">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span style="font-size:13px">Inicia la conversación</span>
              </div>
            }
            @for (m of chatMessages(); track m.id) {
              <div [style.align-self]="m.senderRole === 'client' ? 'flex-end' : 'flex-start'"
                   style="max-width:80%">
                <div [style.background]="m.senderRole === 'client' ? 'var(--gradient)' : '#f5f0ff'"
                     [style.color]="m.senderRole === 'client' ? 'white' : '#1a1a2e'"
                     style="padding:8px 12px;border-radius:12px;font-size:13px;line-height:1.5">
                  {{ m.text }}
                </div>
              </div>
            }
          </div>
          <div style="padding:12px 14px;border-top:1.5px solid #f0ebff;display:flex;gap:8px">
            <input [value]="chatText()" (input)="chatText.set($any($event.target).value)"
                   (keydown.enter)="sendChat()"
                   placeholder="Escribe un mensaje..."
                   style="flex:1;padding:10px 14px;border:1.5px solid #ede9fe;border-radius:10px;font-size:13px;outline:none;font-family:inherit" />
            <button (click)="sendChat()" [disabled]="!chatText().trim() || chatSending()"
                    style="background:var(--gradient);border:none;border-radius:10px;width:38px;height:38px;cursor:pointer;color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      }
    }
  `,
})
export class ChatWidgetComponent implements OnDestroy {
  private msgService = inject(MessageService);
  readonly authSvc   = inject(AuthService);

  company = input<Company | null>(null);

  chatOpen     = signal(false);
  chatMessages = signal<Message[]>([]);
  chatText     = signal('');
  chatSending  = signal(false);
  private chatSub: Subscription | null = null;

  openChat() {
    const companyId = this.company()?.id;
    const clientId = this.authSvc.currentUser()?.uid;
    if (!companyId || !clientId) return;
    this.chatOpen.set(true);
    this.chatSub?.unsubscribe();
    this.chatSub = this.msgService.watchMessages(companyId, clientId).subscribe(msgs => {
      this.chatMessages.set(msgs);
    });
  }

  closeChat() {
    this.chatOpen.set(false);
    this.chatSub?.unsubscribe();
    this.chatSub = null;
  }

  async sendChat() {
    const text = this.chatText().trim();
    if (!text) return;
    const companyId = this.company()?.id;
    const user = this.authSvc.currentUser();
    if (!companyId || !user) return;
    this.chatSending.set(true);
    this.chatText.set('');
    const clientName = user.displayName ?? this.authSvc.profile()?.displayName ?? user.email ?? '';
    try {
      await this.msgService.sendMessage({
        companyId,
        companyName: this.company()?.name ?? '',
        clientId: user.uid,
        clientName,
        senderRole: 'client',
        text,
      });
    } catch {
      this.chatText.set(text);
    } finally {
      this.chatSending.set(false);
    }
  }

  ngOnDestroy() {
    this.chatSub?.unsubscribe();
  }
}
