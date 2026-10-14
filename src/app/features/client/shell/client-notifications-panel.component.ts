import { Component, input, output } from '@angular/core';
import { AppNotification } from '../../../core/services/notification.service';

/** Panel desplegable de notificaciones del cliente (presentacional). */
@Component({
  selector: 'app-client-notifications-panel',
  standalone: true,
  template: `
      <div class="notif-panel" (click)="$event.stopPropagation()">
        <div class="notif-panel-header">
          <span>Notificaciones</span>
          @if (unreadCount() > 0) {
            <button class="notif-mark-all" (click)="markAllRead.emit()">Marcar todas leídas</button>
          }
        </div>
        @if (notifications().length === 0) {
          <div class="notif-empty">Sin notificaciones</div>
        }
        @for (n of notifications(); track n.id) {
          <div class="notif-item" [class.unread]="!n.read" (click)="openNotif.emit(n)">
            <div class="notif-title">{{ n.title }}</div>
            <div class="notif-body">{{ n.body }}</div>
            <div class="notif-time">{{ formatTime(n.createdAt) }}</div>
          </div>
        }
      </div>
  `,
  styles: [`
    :host { display: contents; }

    .notif-panel {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 320px;
      background: white;
      border-radius: 14px;
      box-shadow: 0 8px 40px rgba(0,0,0,.14);
      z-index: 500;
      overflow: hidden;
      border: 1px solid #f0ebff;
    }
    .notif-panel-header {
      padding: 14px 16px;
      font-weight: 800; font-size: 14px;
      border-bottom: 1px solid #f0ebff;
      display: flex; justify-content: space-between; align-items: center;
    }
    .notif-mark-all {
      background: none; border: none; cursor: pointer;
      font-size: 12px; color: var(--purple); font-weight: 600;
    }
    .notif-empty { padding: 24px; text-align: center; color: #aaa; font-size: 13px; }
    .notif-item {
      padding: 12px 16px;
      border-bottom: 1px solid #f7f5ff;
      cursor: pointer; transition: background .12s;
    }
    .notif-item:hover { background: #faf8ff; }
    .notif-item.unread { background: #f5f0ff; }
    .notif-item.unread:hover { background: #ede9fe; }
    .notif-title { font-size: 13px; font-weight: 700; color: #1a1a2e; margin-bottom: 2px; }
    .notif-body  { font-size: 12px; color: #555; margin-bottom: 4px; }
    .notif-time  { font-size: 11px; color: #aaa; }

    @media (max-width: 768px) {
      .notif-panel {
        position: fixed;
        top: 70px;
        right: 8px;
        left: 8px;
        width: auto;
      }
    }
  `],
})
export class ClientNotificationsPanelComponent {
  notifications = input.required<AppNotification[]>();
  unreadCount   = input.required<number>();

  markAllRead = output<void>();
  openNotif   = output<AppNotification>();

  formatTime(ts: any): string {
    if (!ts) return '';
    const d: Date = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
