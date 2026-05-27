import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Firestore, collection, getDocs, query, where, orderBy, limit,
} from '@angular/fire/firestore';

const SVG_STORE    = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
const SVG_USER     = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const SVG_CALENDAR = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
const SVG_ALERT    = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
const SVG_STORE_SM = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
const SVG_USER_SM  = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

interface MetricCard {
  label: string;
  value: string | number;
  subtitle: string;
  color: string;
  icon: string;
}

interface ActivityItem {
  icon: string;
  text: string;
  time: string;
}

@Component({
  selector: 'app-metrics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:12px">
        <h1 style="font-size:1.4rem;margin:0">Métricas de la plataforma</h1>
        <button class="btn btn-secondary btn-sm" (click)="load()" [disabled]="loading()">
          @if (loading()) { Actualizando... } @else { Actualizar }
        </button>
      </div>
      <p style="color:#888;font-size:13px;margin-bottom:24px">
        Datos en tiempo real · {{ lastUpdated() }}
      </p>

      @if (loading() && metrics().length === 0) {
        <div class="card" style="text-align:center;padding:40px;color:#aaa">Cargando métricas...</div>
      } @else {
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-bottom:28px">
          @for (m of metrics(); track m.label) {
            <div class="card" style="text-align:center;border-top:3px solid {{ m.color }}">
              <div style="display:flex;justify-content:center;margin-bottom:4px"
                   [style.color]="m.color" [innerHTML]="m.icon"></div>
              <div style="font-size:2rem;font-weight:700" [style.color]="m.color">{{ m.value }}</div>
              <div style="font-weight:600;font-size:14px;margin-top:4px">{{ m.label }}</div>
              <div style="color:#aaa;font-size:11px;margin-top:4px">{{ m.subtitle }}</div>
            </div>
          }
        </div>

        <div class="card">
          <h2 style="font-size:1rem;margin-bottom:16px">Actividad reciente</h2>
          @if (activity().length === 0) {
            <div style="text-align:center;padding:20px;color:#aaa;font-size:13px">Sin actividad registrada.</div>
          } @else {
            <div style="display:flex;flex-direction:column;gap:0">
              @for (item of activity(); track item.text) {
                <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #f7f7f7">
                  <span style="width:28px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;color:#555"
                        [innerHTML]="item.icon"></span>
                  <span style="flex:1;font-size:14px;color:#333">{{ item.text }}</span>
                  <span style="font-size:12px;color:#aaa;flex-shrink:0">{{ item.time }}</span>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class MetricsComponent implements OnInit {
  private firestore = inject(Firestore);

  loading     = signal(true);
  metrics     = signal<MetricCard[]>([]);
  activity    = signal<ActivityItem[]>([]);
  lastUpdated = signal('—');

  ngOnInit() { this.load(); }

  async load() {
    this.loading.set(true);
    const today = new Date().toISOString().split('T')[0];

    const [compSnap, userSnap, aptSnap, subSnap, recentCompSnap, recentUserSnap] = await Promise.all([
      getDocs(collection(this.firestore, 'companies')),
      getDocs(collection(this.firestore, 'users')),
      getDocs(query(collection(this.firestore, 'appointments'), where('date', '==', today))),
      getDocs(collection(this.firestore, 'subscriptions')),
      getDocs(query(collection(this.firestore, 'companies'), orderBy('createdAt', 'desc'), limit(5))),
      getDocs(query(collection(this.firestore, 'users'), orderBy('createdAt', 'desc'), limit(5))),
    ]);

    const companies = compSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    const users     = userSnap.docs.map(d => d.data() as any);
    const apts      = aptSnap.docs.map(d => d.data() as any);
    const subs      = subSnap.docs.map(d => d.data() as any);

    const activeCompanies = companies.filter((c: any) => c.isActive).length;
    const clientCount     = users.filter((u: any) => u.role === 'client').length;
    const companyCount    = users.filter((u: any) => u.role === 'company').length;
    const cancelledToday  = apts.filter((a: any) => a.status === 'cancelled').length;
    const trialsActive    = subs.filter((s: any) => s.status === 'trial').length;

    const in7days = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const expiringSoon = subs.filter((s: any) => {
      if (s.status !== 'trial') return false;
      const end = s.trialEndDate?.toDate?.()?.getTime?.();
      return end && end <= in7days;
    }).length;

    this.metrics.set([
      {
        label: 'Empresas activas', value: activeCompanies,
        subtitle: `${companies.length} registradas en total`,
        color: '#e94560', icon: SVG_STORE,
      },
      {
        label: 'Usuarios registrados', value: users.length,
        subtitle: `${companyCount} empresas · ${clientCount} clientes`,
        color: '#7c3aed', icon: SVG_USER,
      },
      {
        label: 'Citas hoy', value: apts.length,
        subtitle: `${cancelledToday} canceladas`,
        color: '#1a8c5a', icon: SVG_CALENDAR,
      },
      {
        label: 'Trials activos', value: trialsActive,
        subtitle: expiringSoon > 0 ? `⚠ ${expiringSoon} vencen en ≤7 días` : 'Sin vencimientos próximos',
        color: '#d97706', icon: SVG_ALERT,
      },
    ]);

    // Activity feed: merge recent companies + users, sort by createdAt desc
    const compActivity = recentCompSnap.docs.map(d => ({
      type: 'company',
      data: d.data() as any,
      ts: (d.data() as any).createdAt?.toDate?.() ?? new Date(0),
    }));
    const userActivity = recentUserSnap.docs.map(d => ({
      type: 'user',
      data: d.data() as any,
      ts: (d.data() as any).createdAt?.toDate?.() ?? new Date(0),
    }));

    const activityItems = [...compActivity, ...userActivity]
      .sort((a, b) => b.ts.getTime() - a.ts.getTime())
      .slice(0, 6)
      .map(item => ({
        icon: item.type === 'company' ? SVG_STORE_SM : SVG_USER_SM,
        text: item.type === 'company'
          ? `${item.data.name ?? 'Empresa'} se registró`
          : `${item.data.displayName ?? item.data.email ?? 'Usuario'} se registró como ${item.data.role === 'company' ? 'empresa' : 'cliente'}`,
        time: this.timeAgo(item.ts),
      }));

    this.activity.set(activityItems);
    this.lastUpdated.set(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));
    this.loading.set(false);
  }

  private timeAgo(d: Date): string {
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1)  return 'Ahora';
    if (mins < 60) return `Hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `Hace ${hrs} h`;
    const days = Math.floor(hrs / 24);
    return `Hace ${days} día${days !== 1 ? 's' : ''}`;
  }
}
