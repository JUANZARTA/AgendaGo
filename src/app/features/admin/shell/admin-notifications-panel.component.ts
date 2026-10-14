import { Component, input, output } from '@angular/core';
import { AppNotification } from '../../../core/services/notification.service';

/** Drawer lateral de notificaciones del admin. */
@Component({
  selector: 'app-admin-notifications-panel',
  standalone: true,
  template: `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:150" (click)="closed.emit()"></div>
    <div style="position:fixed;top:0;right:0;bottom:0;width:360px;max-width:100vw;background:white;box-shadow:-8px 0 32px rgba(0,0,0,.15);z-index:151;display:flex;flex-direction:column;animation:slideInRight .25s ease">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 20px 14px;border-bottom:1px solid #e0e7ff">
        <h3 style="margin:0;font-size:16px;font-weight:800;color:#1a1a2e">Notificaciones</h3>
        <div style="display:flex;gap:8px;align-items:center">
          <button (click)="markAllRead.emit()" [disabled]="unreadCount() === 0"
            style="font-size:12px;font-weight:600;color:#6366f1;background:none;border:none;cursor:pointer;padding:0;font-family:inherit"
            [style.opacity]="unreadCount() === 0 ? '0.4' : '1'">
            Leer todo
          </button>
          <button (click)="closed.emit()"
            style="width:28px;height:28px;border-radius:8px;border:none;background:#eef2ff;color:#6366f1;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1">
            ×
          </button>
        </div>
      </div>
      <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch">
        @if (notifications().length === 0) {
          <div style="padding:48px 20px;text-align:center;color:#aaa;font-size:13px">Sin notificaciones aún</div>
        }
        @for (n of notifications(); track n.id) {
          <button (click)="notificationClick.emit(n)"
            style="display:flex;gap:12px;padding:14px 20px;cursor:pointer;border:none;border-bottom:1px solid #fafafa;background:white;width:100%;text-align:left;font-family:inherit;align-items:flex-start;transition:background .12s"
            [style.background]="n.read ? 'white' : '#f5f7ff'">
            <div style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0" [class]="notifIconClass(n.type)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                @switch (n.type) {
                  @case ('new_appointment') {
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  }
                  @case ('appointment_confirmed') { <polyline points="20 6 9 17 4 12"/> }
                  @case ('appointment_cancelled') {
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  }
                  @case ('new_review') {
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  }
                  @case ('new_company') {
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  }
                  @case ('plan_changed') {
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  }
                  @case ('payment_initiated') {
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  }
                  @case ('new_message') {
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  }
                  @case ('support_message') {
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  }
                  @case ('support_reply') {
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  }
                }
              </svg>
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:700;color:#1a1a2e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ n.title }}</div>
              <div style="font-size:12px;color:#6b7280;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ n.body }}</div>
              <div style="font-size:11px;color:#aaa;margin-top:3px">{{ notifTimeAgo(n.createdAt) }}</div>
            </div>
            @if (!n.read) {
              <div style="width:7px;height:7px;border-radius:50%;background:#6366f1;flex-shrink:0;margin-top:6px"></div>
            }
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }

    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }

    .icon-appointment { background: #ede9fe; color: #7c3aed; }
    .icon-confirmed   { background: #d1fae5; color: #065f46; }
    .icon-cancelled   { background: #fee2e2; color: #991b1b; }
    .icon-review      { background: #fef3c7; color: #92400e; }
    .icon-company     { background: #e0f2fe; color: #0369a1; }
  `],
})
export class AdminNotificationsPanelComponent {
  readonly notifications = input.required<AppNotification[]>();
  readonly unreadCount = input.required<number>();

  readonly closed = output<void>();
  readonly markAllRead = output<void>();
  readonly notificationClick = output<AppNotification>();

  notifIconClass(type: AppNotification['type']): string {
    return ({
      new_appointment:       'icon-appointment',
      appointment_confirmed: 'icon-confirmed',
      appointment_cancelled: 'icon-cancelled',
      new_review:            'icon-review',
      new_company:           'icon-company',
      plan_changed:          'icon-company',
      payment_initiated:     'icon-appointment',
      new_message:           'icon-appointment',
      support_message:       'icon-company',
      support_reply:         'icon-company',
    } as any)[type] ?? 'icon-appointment';
  }

  notifTimeAgo(ts: any): string {
    if (!ts?.seconds) return '';
    const diff = Math.floor(Date.now() / 1000) - ts.seconds;
    if (diff < 60)    return 'Ahora';
    if (diff < 3600)  return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} d`;
  }
}
