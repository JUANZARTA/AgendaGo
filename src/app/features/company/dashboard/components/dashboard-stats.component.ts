import { Component, input } from '@angular/core';

/** Fila de tarjetas con los totales del día. */
@Component({
  selector: 'app-dashboard-stats',
  standalone: true,
  styles: [`
    :host { display: block; }
    @keyframes scaleIn {
      from { opacity:0; transform:scale(0.88); }
      60%  { transform:scale(1.04); }
      to   { opacity:1; transform:scale(1); }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }
    .stat-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(var(--primary-rgb),.12);
      padding: 20px 16px;
      text-align: center;
      animation: scaleIn 0.4s ease both;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }
    .stat-card:hover { transform: translateY(-4px) scale(1.04); box-shadow: 0 10px 32px rgba(var(--primary-rgb),.22); }
    .stats-grid .stat-card:nth-child(1) { animation-delay: 0.00s; }
    .stats-grid .stat-card:nth-child(2) { animation-delay: 0.08s; }
    .stats-grid .stat-card:nth-child(3) { animation-delay: 0.16s; }
    .stats-grid .stat-card:nth-child(4) { animation-delay: 0.24s; }
    .stat-number {
      font-size: 2.2rem;
      font-weight: 800;
      background: var(--gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      margin-bottom: 6px;
    }
    .stat-number.green  { background: linear-gradient(135deg, #059669, #10b981); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
    .stat-number.yellow { background: linear-gradient(135deg, #d97706, #f59e0b); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
    .stat-number.red    { background: linear-gradient(135deg, #dc2626, #f43f5e); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
    .stat-label { font-size: 12px; color: #888; font-weight: 500; letter-spacing: .3px; }

    @media (max-width: 700px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 420px) {
      .stats-grid { grid-template-columns: 1fr 1fr; }
    }
  `],
  template: `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">{{ total() }}</div>
        <div class="stat-label">Total hoy</div>
      </div>
      <div class="stat-card">
        <div class="stat-number green">{{ scheduled() }}</div>
        <div class="stat-label">Confirmadas</div>
      </div>
      <div class="stat-card">
        <div class="stat-number yellow">{{ pending() }}</div>
        <div class="stat-label">Pendientes</div>
      </div>
      <div class="stat-card">
        <div class="stat-number red">{{ cancelled() }}</div>
        <div class="stat-label">Canceladas</div>
      </div>
    </div>
  `,
})
export class DashboardStatsComponent {
  total     = input.required<number>();
  scheduled = input.required<number>();
  pending   = input.required<number>();
  cancelled = input.required<number>();
}
