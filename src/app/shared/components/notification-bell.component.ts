import { Component, Input, OnChanges, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, AppNotification } from '../../core/services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host { position: relative; display: inline-block; }

    .bell-btn {
      position: relative;
      width: 38px; height: 38px;
      border-radius: 50%;
      border: none;
      background: var(--btn-secondary-bg, #f5f0ff);
      color: var(--purple, #7c3aed);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: background .15s;
      flex-shrink: 0;
    }
    .bell-btn:hover { background: var(--btn-secondary-hover, #ede9fe); }

    .badge {
      position: absolute;
      top: 2px; right: 2px;
      min-width: 16px; height: 16px;
      background: #f43f5e;
      color: white;
      border-radius: 99px;
      font-size: 10px;
      font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      padding: 0 4px;
      pointer-events: none;
    }

    .panel {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 320px;
      max-width: calc(100vw - 24px);
      background: white;
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0,0,0,.18);
      border: 1.5px solid #f0ebff;
      z-index: 200;
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px 10px;
      border-bottom: 1px solid #f5f0ff;
    }
    .panel-title {
      font-size: 14px;
      font-weight: 800;
      color: #1a1a2e;
      margin: 0;
    }
    .mark-all-btn {
      font-size: 12px;
      font-weight: 600;
      color: var(--purple, #7c3aed);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
    }
    .mark-all-btn:disabled { color: #ccc; cursor: default; }

    .notif-list {
      max-height: 340px;
      overflow-y: auto;
    }

    .notif-item {
      display: flex;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      border-bottom: 1px solid #fafafa;
      transition: background .12s;
      align-items: flex-start;
      text-align: left;
      width: 100%;
      border-left: none;
      border-right: none;
      border-top: none;
      background: white;
      font-family: inherit;
    }
    .notif-item:hover { background: #fdfbff; }
    .notif-item.unread { background: #fdf8ff; }
    .notif-item.unread:hover { background: #f8f0ff; }

    .notif-icon {
      width: 34px; height: 34px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .icon-appointment { background: #ede9fe; color: #7c3aed; }
    .icon-confirmed   { background: #d1fae5; color: #065f46; }
    .icon-cancelled   { background: #fee2e2; color: #991b1b; }
    .icon-review      { background: #fef3c7; color: #92400e; }
    .icon-company     { background: #e0f2fe; color: #0369a1; }

    .notif-content { flex: 1; min-width: 0; }
    .notif-title {
      font-size: 13px; font-weight: 700; color: #1a1a2e;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .notif-body {
      font-size: 12px; color: #6b7280; margin-top: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .notif-time { font-size: 11px; color: #aaa; margin-top: 3px; }

    .unread-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--purple, #7c3aed);
      flex-shrink: 0;
      margin-top: 6px;
    }

    .empty {
      padding: 32px 16px;
      text-align: center;
      color: #aaa;
      font-size: 13px;
    }
  `],
  template: `
    <button class="bell-btn" (click)="togglePanel()" [attr.aria-label]="'Notificaciones'">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      @if (unreadCount() > 0) {
        <span class="badge">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
      }
    </button>

    @if (open()) {
      <div class="panel" (click)="$event.stopPropagation()">
        <div class="panel-header">
          <p class="panel-title">Notificaciones</p>
          <button class="mark-all-btn" (click)="markAll()" [disabled]="unreadCount() === 0">
            Leer todo
          </button>
        </div>

        <div class="notif-list">
          @if (notifications().length === 0) {
            <div class="empty">Sin notificaciones aún</div>
          }
          @for (n of notifications(); track n.id) {
            <button class="notif-item" [class.unread]="!n.read" (click)="onItemClick(n)">
              <div class="notif-icon" [class]="iconClass(n.type)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  @switch (n.type) {
                    @case ('new_appointment') {
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    }
                    @case ('appointment_confirmed') {
                      <polyline points="20 6 9 17 4 12"/>
                    }
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
                  }
                </svg>
              </div>
              <div class="notif-content">
                <div class="notif-title">{{ n.title }}</div>
                <div class="notif-body">{{ n.body }}</div>
                <div class="notif-time">{{ timeAgo(n.createdAt) }}</div>
              </div>
              @if (!n.read) {
                <div class="unread-dot"></div>
              }
            </button>
          }
        </div>
      </div>
    }
  `,
})
export class NotificationBellComponent implements OnChanges, OnDestroy {
  @Input() recipientId!: string;

  private notifSvc = inject(NotificationService);
  private sub?: Subscription;

  notifications = signal<AppNotification[]>([]);
  open          = signal(false);
  unreadCount   = computed(() => this.notifications().filter(n => !n.read).length);

  private closeHandler = () => this.open.set(false);

  ngOnChanges() {
    this.sub?.unsubscribe();
    if (!this.recipientId) return;
    this.sub = this.notifSvc.watch(this.recipientId).subscribe(list => {
      this.notifications.set(list.slice(0, 30));
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    document.removeEventListener('click', this.closeHandler);
  }

  togglePanel() {
    const next = !this.open();
    this.open.set(next);
    if (next) {
      setTimeout(() => document.addEventListener('click', this.closeHandler), 0);
    } else {
      document.removeEventListener('click', this.closeHandler);
    }
  }

  async onItemClick(n: AppNotification) {
    if (!n.read && n.id) await this.notifSvc.markRead(n.id);
  }

  async markAll() {
    await this.notifSvc.markAllRead(this.recipientId);
  }

  iconClass(type: AppNotification['type']): string {
    return {
      new_appointment:       'icon-appointment',
      appointment_confirmed: 'icon-confirmed',
      appointment_cancelled: 'icon-cancelled',
      new_review:            'icon-review',
      new_company:           'icon-company',
    }[type] ?? 'icon-appointment';
  }

  timeAgo(ts: any): string {
    if (!ts?.seconds) return '';
    const diff = Math.floor(Date.now() / 1000) - ts.seconds;
    if (diff < 60)   return 'Ahora';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} d`;
  }
}
