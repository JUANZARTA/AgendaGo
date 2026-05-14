import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Metric {
  label: string;
  value: string | number;
  subtitle: string;
  color: string;
  icon: string;
}

const METRICS: Metric[] = [
  { label: 'Empresas activas', value: 4, subtitle: '+1 esta semana', color: '#e94560', icon: '🏪' },
  { label: 'Usuarios registrados', value: 6, subtitle: '+2 esta semana', color: '#7c3aed', icon: '👤' },
  { label: 'Citas hoy', value: 18, subtitle: '3 canceladas', color: '#1a8c5a', icon: '📅' },
  { label: 'Ingresos del mes', value: '$116.000', subtitle: '4 suscripciones activas', color: '#d97706', icon: '💰' },
  { label: 'Trial venciendo', value: 2, subtitle: 'en los próximos 7 días', color: '#dc2626', icon: '⚠️' },
  { label: 'Tasa de ocupación', value: '74%', subtitle: 'promedio de la semana', color: '#0891b2', icon: '📊' },
];

const RECENT_ACTIVITY = [
  { icon: '🆕', text: 'Estética Lumina se registró', time: 'Hace 2 h' },
  { icon: '💳', text: 'Barbería El Padrino renovó suscripción', time: 'Hace 5 h' },
  { icon: '❌', text: 'Spa Serenidad fue deshabilitada (suscripción vencida)', time: 'Hace 1 día' },
  { icon: '📅', text: '18 citas agendadas hoy', time: 'Hoy 08:00' },
  { icon: '👤', text: 'Carlos López se registró como cliente', time: 'Ayer' },
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
            <div style="font-size:2rem;margin-bottom:4px">{{ m.icon }}</div>
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
              <span style="font-size:20px;width:28px;text-align:center;flex-shrink:0">{{ item.icon }}</span>
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
