import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Payment } from '../billing.models';
import { formatTimestamp } from '../billing.utils';

/** Historial de pagos (tabla o estado vacío). Presentacional. */
@Component({
  selector: 'app-billing-payment-history',
  standalone: true,
  imports: [DecimalPipe],
  styles: [`
    :host { display: contents; }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── History ── */
    .history-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 14px;
    }
    .history-title { font-size: 1rem; font-weight: 800; margin: 0; }

    .history-table {
      width: 100%; border-collapse: collapse;
      background: white; border-radius: 14px;
      overflow: hidden; box-shadow: var(--shadow);
      animation: fadeInUp .5s ease .15s both;
    }
    .history-table th {
      text-align: left; font-size: 11px; font-weight: 700;
      color: #888; letter-spacing: .06em; text-transform: uppercase;
      padding: 14px 18px; background: #fafafa;
      border-bottom: 1.5px solid #f3f4f6;
    }
    .history-table td {
      padding: 14px 18px; font-size: 14px;
      border-bottom: 1px solid #f7f7f7; color: #333;
    }
    .history-table tr:last-child td { border-bottom: none; }
    .history-table tr:hover td { background: #fafafa; }

    .status-chip {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 700;
    }
    .chip-paid    { background: #d1fae5; color: #065f46; }
    .chip-pending { background: #fef3c7; color: #92400e; }
    .chip-failed  { background: #fee2e2; color: #991b1b; }

    .empty-history {
      text-align: center; padding: 40px 20px;
      background: white; border-radius: 14px; box-shadow: var(--shadow);
      color: #aaa; font-size: 14px;
    }
    @media (max-width: 640px) {
      .history-table th:nth-child(3),
      .history-table td:nth-child(3) { display: none; }
    }
  `],
  template: `
  <!-- ── HISTORIAL ── -->
  <div class="history-header">
    <p class="history-title">Historial de pagos</p>
  </div>

  @if (payments().length > 0) {
    <table class="history-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Plan</th>
          <th>Valor</th>
          <th>Válido hasta</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        @for (p of payments(); track $index) {
          <tr>
            <td style="color:#666">{{ formatTimestampShort(p.createdAt) }}</td>
            <td style="font-weight:600;text-transform:capitalize">{{ p.plan }}</td>
            <td style="font-weight:700">{{ p.amount | number }} COP</td>
            <td style="color:#666">{{ formatTimestampShort(p.periodEnd) }}</td>
            <td>
              <span class="status-chip" [class.chip-paid]="p.status === 'approved'"
                    [class.chip-pending]="p.status === 'pending'"
                    [class.chip-failed]="p.status === 'failed'">
                <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
                @switch (p.status) {
                  @case ('approved') { Aprobado }
                  @case ('pending')  { Pendiente }
                  @case ('failed')   { Fallido }
                }
              </span>
            </td>
          </tr>
        }
      </tbody>
    </table>
  } @else {
    <div class="empty-history">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:10px"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
      <p>Sin pagos registrados aún.</p>
    </div>
  }
  `,
})
export class BillingPaymentHistoryComponent {
  readonly payments = input.required<Payment[]>();

  formatTimestampShort(ts: any): string {
    return formatTimestamp(ts);
  }
}
