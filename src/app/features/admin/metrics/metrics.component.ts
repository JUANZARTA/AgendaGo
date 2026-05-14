import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Metric {
  label: string;
  value: string | number;
  subtitle: string;
  color: string;
  icon: string;
}

const SVG_STORE = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
const SVG_USER = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const SVG_CALENDAR = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
const SVG_TRENDING = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`;
const SVG_ALERT = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
const SVG_BARCHART = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`;

const SVG_STORE_SM = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
const SVG_CARD_SM = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`;
const SVG_CLOSE_SM = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
const SVG_CAL_SM = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
const SVG_USER_SM = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

const METRICS: Metric[] = [
  { label: 'Empresas activas', value: 4, subtitle: '+1 esta semana', color: '#e94560', icon: SVG_STORE },
  { label: 'Usuarios registrados', value: 6, subtitle: '+2 esta semana', color: '#7c3aed', icon: SVG_USER },
  { label: 'Citas hoy', value: 18, subtitle: '3 canceladas', color: '#1a8c5a', icon: SVG_CALENDAR },
  { label: 'Ingresos del mes', value: '$116.000', subtitle: '4 suscripciones activas', color: '#d97706', icon: SVG_TRENDING },
  { label: 'Trial venciendo', value: 2, subtitle: 'en los próximos 7 días', color: '#dc2626', icon: SVG_ALERT },
  { label: 'Tasa de ocupación', value: '74%', subtitle: 'promedio de la semana', color: '#0891b2', icon: SVG_BARCHART },
];

const RECENT_ACTIVITY = [
  { icon: SVG_STORE_SM, text: 'Estética Lumina se registró', time: 'Hace 2 h' },
  { icon: SVG_CARD_SM, text: 'Barbería El Padrino renovó suscripción', time: 'Hace 5 h' },
  { icon: SVG_CLOSE_SM, text: 'Spa Serenidad fue deshabilitada (suscripción vencida)', time: 'Hace 1 día' },
  { icon: SVG_CAL_SM, text: '18 citas agendadas hoy', time: 'Hoy 08:00' },
  { icon: SVG_USER_SM, text: 'Carlos López se registró como cliente', time: 'Ayer' },
];

@Component({
  selector: 'app-metrics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h1 style="font-size:1.4rem;margin-bottom:8px">Métricas de la plataforma</h1>
      <p style="color:#888;font-size:13px;margin-bottom:24px">Resumen general · Actualizado hoy</p>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-bottom:28px">
        @for (m of metrics; track m.label) {
          <div class="card" style="text-align:center;border-top:3px solid {{ m.color }}">
            <div style="display:flex;justify-content:center;margin-bottom:4px" [style.color]="m.color" [innerHTML]="m.icon"></div>
            <div style="font-size:2rem;font-weight:700" [style.color]="m.color">{{ m.value }}</div>
            <div style="font-weight:600;font-size:14px;margin-top:4px">{{ m.label }}</div>
            <div style="color:#aaa;font-size:11px;margin-top:4px">{{ m.subtitle }}</div>
          </div>
        }
      </div>

      <div class="card">
        <h2 style="font-size:1rem;margin-bottom:16px">Actividad reciente</h2>
        <div style="display:flex;flex-direction:column;gap:0">
          @for (item of activity; track item.text) {
            <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #f7f7f7">
              <span style="width:28px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;color:#555" [innerHTML]="item.icon"></span>
              <span style="flex:1;font-size:14px;color:#333">{{ item.text }}</span>
              <span style="font-size:12px;color:#aaa;flex-shrink:0">{{ item.time }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class MetricsComponent {
  metrics = METRICS;
  activity = RECENT_ACTIVITY;
}
