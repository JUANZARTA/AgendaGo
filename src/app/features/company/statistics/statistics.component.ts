import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { CompanyStore } from '../../../core/services/company-store.service';
import { Appointment } from '../../../core/services/appointment.service';

interface DayStat  { label: string; count: number; }
interface SvcStat  { name: string;  count: number; }
interface HourStat { label: string; count: number; }
interface DonutSeg { key: string; label: string; color: string; count: number; dash: number; offset: number; }

const CIRC = 2 * Math.PI * 45;

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host { display: block; }
    .wrap { padding: 24px 20px 48px; max-width: 960px; margin: 0 auto; }

    /* ── Header ── */
    .page-head { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
    .page-title { font-size: 1.4rem; font-weight: 800; margin: 0 0 2px; }
    .page-sub   { font-size: 13px; color: #888; margin: 0; }

    /* ── Period filter ── */
    .period-bar { display: flex; gap: 6px; flex-wrap: wrap; }
    .period-btn {
      padding: 7px 16px; border-radius: 20px; border: 1.5px solid #e0d9ff;
      font-size: 13px; font-weight: 700; font-family: inherit; cursor: pointer;
      background: white; color: #555; transition: all .15s;
    }
    .period-btn:hover  { border-color: var(--purple); color: var(--purple); }
    .period-btn.active { background: var(--gradient); border-color: transparent; color: white; box-shadow: 0 4px 14px rgba(124,58,237,.3); }

    /* ── KPI grids ── */
    .kpi-grid  { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .kpi-grid2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .kpi-card  { background: white; border-radius: 16px; padding: 16px 18px; box-shadow: 0 2px 12px rgba(0,0,0,.06); display: flex; align-items: center; gap: 12px; }
    .kpi-icon  { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .kpi-icon.purple  { background: #ede9fe; color: var(--purple); }
    .kpi-icon.green   { background: #d1fae5; color: #065f46; }
    .kpi-icon.red     { background: #fee2e2; color: #991b1b; }
    .kpi-icon.blue    { background: #dbeafe; color: #1e40af; }
    .kpi-icon.orange  { background: #ffedd5; color: #c2410c; }
    .kpi-icon.teal    { background: #ccfbf1; color: #0f766e; }
    .kpi-icon.indigo  { background: #e0e7ff; color: #4338ca; }
    .kpi-label { font-size: 11px; color: #888; font-weight: 600; margin-bottom: 2px; }
    .kpi-value { font-size: 1.4rem; font-weight: 800; color: #1a1a2e; line-height: 1.1; }
    .kpi-sub   { font-size: 11px; color: #aaa; margin-top: 2px; }

    /* ── Rows ── */
    .charts-row  { display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 16px; }
    .charts-row2 { display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 16px; }
    /* min-width:0 evita que el contenido (SVG ancho) expanda la columna */
    .charts-row > *, .charts-row2 > * { min-width: 0; }
    @media (min-width: 640px) {
      .charts-row  { grid-template-columns: 2fr 1fr; }
      .charts-row2 { grid-template-columns: 1fr 1fr; }
    }

    /* ── Chart card ── */
    .chart-card  { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,.06); margin-bottom: 16px; overflow: hidden; }
    .chart-title { font-size: 14px; font-weight: 800; color: #1a1a2e; margin: 0 0 14px; }

    /* ── Bar chart (scrollable) ── */
    .bar-wrap { overflow-x: auto; padding-bottom: 4px; -webkit-overflow-scrolling: touch; }
    .bar-svg  { display: block; overflow: visible; }

    /* ── Donut ── */
    .donut-wrap   { display: flex; align-items: center; gap: 16px; }
    .donut-svg    { width: min(130px, 40%); aspect-ratio: 1; flex-shrink: 0; }
    .donut-legend { flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
    .legend-row   { display: flex; align-items: center; gap: 8px; font-size: 12px; }
    .legend-dot   { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .legend-name  { flex: 1; color: #555; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .legend-count { font-weight: 700; color: #1a1a2e; }

    /* ── Horizontal bars (services, staff, hours) ── */
    .hbar-row  { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .hbar-name { font-size: 12px; font-weight: 600; color: #374151; width: 60px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .hbar-name.wide { width: 130px; }
    .hbar-bg   { flex: 1; height: 10px; background: #f0ebff; border-radius: 10px; overflow: hidden; }
    .hbar-fill { height: 100%; background: var(--gradient); border-radius: 10px; transition: width .4s ease; }
    .hbar-fill.alt { background: #ccfbf1; border: 1px solid #0d9488; }
    .hbar-fill.rev { background: #e0e7ff; border: 1px solid #6366f1; }
    .hbar-val  { font-size: 12px; font-weight: 700; color: var(--purple); min-width: 24px; text-align: right; flex-shrink: 0; }
    .hbar-val.sm { font-size: 11px; min-width: auto; white-space: nowrap; }

    /* ── Client retention cards ── */
    .retention-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .retention-card { border-radius: 12px; padding: 16px; text-align: center; }
    .retention-card.new { background: #f0fdf4; }
    .retention-card.rec { background: #eff6ff; }
    .retention-num   { font-size: 2rem; font-weight: 800; }
    .retention-num.new { color: #16a34a; }
    .retention-num.rec { color: #2563eb; }
    .retention-lbl   { font-size: 12px; color: #888; margin-top: 2px; }

    /* ── Empty / Loading ── */
    .empty { text-align: center; padding: 32px 20px; color: #aaa; font-size: 13px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { width: 36px; height: 36px; border: 3px solid #ede9fe; border-top-color: var(--purple); border-radius: 50%; animation: spin .7s linear infinite; margin: 48px auto; }
  `],
  template: `
  <div class="wrap">

    <!-- Header -->
    <div class="page-head">
      <div>
        <h1 class="page-title">Estadísticas</h1>
        <p class="page-sub">Métricas de tu negocio</p>
      </div>
      <div class="period-bar">
        @for (p of periods; track p.days) {
          <button class="period-btn" [class.active]="period() === p.days" (click)="period.set(p.days)">
            {{ p.label }}
          </button>
        }
      </div>
    </div>

    @if (loading()) {
      <div class="spinner"></div>
    } @else {

      <!-- KPI row 1 -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon purple">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div><div class="kpi-label">Total citas</div><div class="kpi-value">{{ stats().total }}</div></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon green">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <div class="kpi-label">Completadas</div>
            <div class="kpi-value">{{ stats().completed }}</div>
            <div class="kpi-sub">{{ stats().completionRate }}% tasa</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon red">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
          <div>
            <div class="kpi-label">Canceladas</div>
            <div class="kpi-value">{{ stats().cancelled }}</div>
            <div class="kpi-sub">{{ stats().cancelRate }}% tasa</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div><div class="kpi-label">Ingresos</div><div class="kpi-value" style="font-size:1.1rem">{{ formatRevenue(stats().revenue) }}</div></div>
        </div>
      </div>

      <!-- Charts row 1: day bars + donut -->
      <div class="charts-row">
        <div class="chart-card" style="margin-bottom:0">
          <h3 class="chart-title">Citas por {{ period() === 90 ? 'semana' : 'día' }}</h3>
          @if (stats().total === 0) {
            <div class="empty">Sin citas en este período</div>
          } @else {
            <div class="bar-wrap">
              <svg class="bar-svg" [attr.width]="barTotal()" height="160" [attr.viewBox]="'0 0 ' + barTotal() + ' 160'">
                @for (gl of gridLines(); track gl.y) {
                  <line x1="0" [attr.x2]="barTotal()" [attr.y1]="gl.y" [attr.y2]="gl.y" stroke="#f0e8ff" stroke-width="1"/>
                  <text [attr.x]="barTotal() - 2" [attr.y]="gl.y - 3" text-anchor="end" font-size="8" fill="#ccc">{{ gl.label }}</text>
                }
                @for (day of dayStats(); track day.label; let i = $index) {
                  <rect [attr.x]="i * (barW() + barGap())" [attr.y]="barY(day.count)"
                        [attr.width]="barW()" [attr.height]="barPixH(day.count)"
                        fill="var(--purple)" rx="3" opacity="0.85">
                    <title>{{ day.count }} cita{{ day.count !== 1 ? 's' : '' }}</title>
                  </rect>
                  @if (shouldLabel(i)) {
                    <text [attr.x]="i * (barW() + barGap()) + barW() / 2" y="156"
                          text-anchor="middle" font-size="9" fill="#aaa">{{ day.label }}</text>
                  }
                }
              </svg>
            </div>
          }
        </div>

        <div class="chart-card" style="margin-bottom:0">
          <h3 class="chart-title">Por estado</h3>
          <div class="donut-wrap">
            <svg class="donut-svg" viewBox="0 0 120 120">
              @if (stats().total === 0) {
                <circle cx="60" cy="60" r="45" fill="none" stroke="#f0e8ff" stroke-width="18"/>
                <text x="60" y="65" text-anchor="middle" font-size="11" fill="#ccc">Sin datos</text>
              } @else {
                @for (seg of donutSegments(); track seg.key) {
                  <circle cx="60" cy="60" r="45" fill="none"
                    [attr.stroke]="seg.color" stroke-width="18"
                    [attr.stroke-dasharray]="seg.dash + ' ' + (CIRC - seg.dash)"
                    [attr.stroke-dashoffset]="-seg.offset"
                    transform="rotate(-90, 60, 60)">
                    <title>{{ seg.label }}: {{ seg.count }}</title>
                  </circle>
                }
                <text x="60" y="56" text-anchor="middle" font-size="18" font-weight="800" fill="#1a1a2e">{{ stats().total }}</text>
                <text x="60" y="70" text-anchor="middle" font-size="9" fill="#aaa">Total</text>
              }
            </svg>
            <div class="donut-legend">
              @for (seg of donutSegments(); track seg.key) {
                <div class="legend-row">
                  <span class="legend-dot" [style.background]="seg.color"></span>
                  <span class="legend-name">{{ seg.label }}</span>
                  <span class="legend-count">{{ seg.count }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Hora pico (full width) -->
      <div class="chart-card">
        <h3 class="chart-title">Hora pico</h3>
        @if (stats().total === 0) {
          <div class="empty">Sin datos</div>
        } @else {
          @for (h of hourStats(); track h.label) {
            @if (h.count > 0) {
              <div class="hbar-row">
                <div class="hbar-name">{{ h.label }}</div>
                <div class="hbar-bg">
                  <div class="hbar-fill alt" [style.width.%]="hourPct(h.count)"></div>
                </div>
                <div class="hbar-val">{{ h.count }}</div>
              </div>
            }
          }
        }
      </div>

      <!-- KPI row 2: clientes -->
      <div class="kpi-grid2">
        <div class="kpi-card">
          <div class="kpi-icon teal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div><div class="kpi-label">Clientes únicos</div><div class="kpi-value">{{ clientStats().unique }}</div></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon indigo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <div class="kpi-label">Recurrentes</div>
            <div class="kpi-value">{{ clientStats().returning }}</div>
            <div class="kpi-sub">{{ clientStats().unique ? ((clientStats().returning / clientStats().unique * 100) | number:'1.0-0') + '%' : '0%' }} retención</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon orange">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div><div class="kpi-label">Hora pico</div><div class="kpi-value" style="font-size:1.1rem">{{ peakHour() }}</div></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon green">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div><div class="kpi-label">Nuevos clientes</div><div class="kpi-value">{{ clientStats().new }}</div></div>
        </div>
      </div>

      <!-- Row 3: servicios + ingresos por empleado -->
      <div class="charts-row2">
        <div class="chart-card" style="margin-bottom:0">
          <h3 class="chart-title">Servicios más solicitados</h3>
          @if (svcStats().length === 0) {
            <div class="empty">Sin datos</div>
          } @else {
            @for (svc of svcStats(); track svc.name) {
              <div class="hbar-row">
                <div class="hbar-name wide" [title]="svc.name">{{ svc.name }}</div>
                <div class="hbar-bg"><div class="hbar-fill" [style.width.%]="svcPct(svc.count)"></div></div>
                <div class="hbar-val">{{ svc.count }}</div>
              </div>
            }
          }
        </div>

        <div class="chart-card" style="margin-bottom:0">
          <h3 class="chart-title">Ingresos por empleado</h3>
          @if (staffStats().length === 0) {
            <div class="empty">Sin datos con precio</div>
          } @else {
            @for (s of staffStats(); track s.name) {
              <div class="hbar-row">
                <div class="hbar-name wide" [title]="s.name">{{ s.name }}</div>
                <div class="hbar-bg"><div class="hbar-fill rev" [style.width.%]="staffPct(s.revenue)"></div></div>
                <div class="hbar-val sm">{{ formatRevenue(s.revenue) }}</div>
              </div>
            }
          }
        </div>
      </div>

    }
  </div>
  `,
})
export class StatisticsComponent {
  private companyStore = inject(CompanyStore);
  private firestore    = inject(Firestore);

  readonly CIRC = CIRC;

  loading = signal(true);
  allApts = signal<Appointment[]>([]);
  period  = signal(30);

  readonly periods = [
    { days: 7,  label: '7 días'  },
    { days: 30, label: '30 días' },
    { days: 90, label: '90 días' },
  ];

  filtered = computed(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.period());
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return this.allApts().filter(a => a.date >= cutoffStr);
  });

  stats = computed(() => {
    const a = this.filtered();
    const completed = a.filter(x => x.status === 'completed');
    const cancelled = a.filter(x => x.status === 'cancelled');
    return {
      total:          a.length,
      completed:      completed.length,
      cancelled:      cancelled.length,
      upcoming:       a.filter(x => x.status === 'pending' || x.status === 'scheduled').length,
      revenue:        completed.reduce((s, x) => s + (x.price ?? 0), 0),
      cancelRate:     a.length ? Math.round(cancelled.length / a.length * 100) : 0,
      completionRate: a.length ? Math.round(completed.length / a.length * 100) : 0,
    };
  });

  // ── Clients ───────────────────────────────────────────────
  clientStats = computed(() => {
    const filtered   = this.filtered();
    const all        = this.allApts();
    const cutoff     = new Date();
    cutoff.setDate(cutoff.getDate() - this.period());
    const cutoffStr  = cutoff.toISOString().slice(0, 10);
    const uniqueIds  = new Set(filtered.filter(a => a.clientId).map(a => a.clientId!));
    const returning  = [...uniqueIds].filter(id =>
      all.some(a => a.clientId === id && a.date < cutoffStr)
    ).length;
    return { unique: uniqueIds.size, returning, new: uniqueIds.size - returning };
  });

  // ── Hour peak ─────────────────────────────────────────────
  hourStats = computed((): HourStat[] =>
    Array.from({ length: 17 }, (_, i) => {
      const h = i + 6;
      const count = this.filtered().filter(a => parseInt(a.startTime.slice(0, 2), 10) === h).length;
      return { label: `${h}:00`, count };
    })
  );

  maxHourCount = computed(() => Math.max(...this.hourStats().map(h => h.count), 1));
  hourPct(count: number) { return Math.round((count / this.maxHourCount()) * 100); }

  peakHour = computed(() => {
    const h = this.hourStats().reduce((best, cur) => cur.count > best.count ? cur : best, { label: '—', count: 0 });
    return h.count > 0 ? h.label : '—';
  });

  // ── Bar chart ────────────────────────────────────────────
  barW   = computed(() => this.period() === 30 ? 18 : 30);
  barGap = computed(() => 8);

  dayStats = computed((): DayStat[] => {
    const n = this.period();
    const apts = this.filtered();
    if (n === 90) {
      return Array.from({ length: 13 }, (_, i) => {
        const end   = new Date(); end.setDate(end.getDate() - (12 - i) * 7);
        const start = new Date(end); start.setDate(end.getDate() - 6);
        const s = start.toISOString().slice(0, 10);
        const e = end.toISOString().slice(0, 10);
        return { label: `S${i + 1}`, count: apts.filter(a => a.date >= s && a.date <= e).length };
      });
    }
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (n - 1 - i));
      const key   = d.toISOString().slice(0, 10);
      const label = n === 7
        ? d.toLocaleDateString('es-CO', { weekday: 'short' })
        : `${d.getDate()}/${d.getMonth() + 1}`;
      return { label, count: apts.filter(a => a.date === key).length };
    });
  });

  maxCount  = computed(() => Math.max(...this.dayStats().map(d => d.count), 1));
  barTotal  = computed(() => this.dayStats().length * (this.barW() + this.barGap()));

  barPixH(count: number) { return Math.round((count / this.maxCount()) * 120); }
  barY(count: number)    { return 130 - this.barPixH(count); }
  shouldLabel(i: number) { return this.period() !== 30 || i % 5 === 0; }

  gridLines = computed(() =>
    [0.25, 0.5, 0.75, 1].map(pct => ({
      y:     130 - Math.round(pct * 120),
      label: Math.round(pct * this.maxCount()).toString(),
    }))
  );

  // ── Services ─────────────────────────────────────────────
  svcStats = computed((): SvcStat[] => {
    const map = new Map<string, number>();
    for (const a of this.filtered()) map.set(a.serviceName, (map.get(a.serviceName) ?? 0) + 1);
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  });

  maxSvcCount = computed(() => Math.max(...this.svcStats().map(s => s.count), 1));
  svcPct(count: number) { return Math.round((count / this.maxSvcCount()) * 100); }

  // ── Staff revenue ─────────────────────────────────────────
  staffStats = computed(() => {
    const map = new Map<string, number>();
    for (const a of this.filtered()) {
      if (a.status !== 'completed' || !a.price) continue;
      const name = a.staffName?.trim() || 'Sin asignar';
      map.set(name, (map.get(name) ?? 0) + a.price);
    }
    return [...map.entries()].map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue);
  });

  maxStaffRevenue = computed(() => Math.max(...this.staffStats().map(s => s.revenue), 1));
  staffPct(revenue: number) { return Math.round((revenue / this.maxStaffRevenue()) * 100); }

  // ── Donut ─────────────────────────────────────────────────
  private readonly STATUS_COLORS: Record<string, string> = {
    completed: '#3b82f6', scheduled: '#10b981', pending: '#f59e0b', cancelled: '#ef4444',
  };
  private readonly STATUS_LABELS: Record<string, string> = {
    completed: 'Completadas', scheduled: 'Próximas', pending: 'Pendientes', cancelled: 'Canceladas',
  };

  donutSegments = computed((): DonutSeg[] => {
    const apts  = this.filtered();
    const total = apts.length;
    if (!total) return [];
    const counts: Record<string, number> = {
      completed: apts.filter(a => a.status === 'completed').length,
      scheduled: apts.filter(a => a.status === 'scheduled').length,
      pending:   apts.filter(a => a.status === 'pending').length,
      cancelled: apts.filter(a => a.status === 'cancelled').length,
    };
    let offset = 0;
    return Object.entries(counts).filter(([, c]) => c > 0).map(([key, count]) => {
      const dash = (count / total) * CIRC;
      const seg: DonutSeg = { key, count, color: this.STATUS_COLORS[key], label: this.STATUS_LABELS[key], dash, offset };
      offset += dash;
      return seg;
    });
  });

  // ── Load ──────────────────────────────────────────────────
  constructor() {
    effect(() => {
      const cid = this.companyStore.companyId();
      if (cid) this.load(cid);
    });
  }

  private async load(companyId: string) {
    this.loading.set(true);
    try {
      const snap = await getDocs(query(collection(this.firestore, 'appointments'), where('companyId', '==', companyId)));
      this.allApts.set(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Appointment));
    } finally {
      this.loading.set(false);
    }
  }

  formatRevenue(n: number): string {
    return '$ ' + n.toLocaleString('es-CO');
  }
}
