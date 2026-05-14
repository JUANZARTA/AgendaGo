import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Company {
  id: string;
  name: string;
  category: string;
  ownerEmail: string;
  city: string;
  subscriptionStatus: 'trial' | 'active' | 'expired';
  trialEnds: string;
  active: boolean;
  createdAt: string;
}

const MOCK: Company[] = [
  { id: '1', name: 'Barbería El Padrino', category: 'Barbería', ownerEmail: 'padrino@gmail.com', city: 'Bogotá', subscriptionStatus: 'active', trialEnds: '—', active: true, createdAt: '2026-01-15' },
  { id: '2', name: 'Salón Valentina', category: 'Salón', ownerEmail: 'valentina@gmail.com', city: 'Medellín', subscriptionStatus: 'trial', trialEnds: '2026-06-01', active: true, createdAt: '2026-05-02' },
  { id: '3', name: 'Spa Serenidad', category: 'Spa', ownerEmail: 'spa@serenidad.co', city: 'Cali', subscriptionStatus: 'expired', trialEnds: '—', active: false, createdAt: '2026-02-20' },
  { id: '4', name: 'Peluquería Sofía', category: 'Peluquería', ownerEmail: 'sofia@peluqueria.co', city: 'Cartagena', subscriptionStatus: 'trial', trialEnds: '2026-05-28', active: true, createdAt: '2026-04-28' },
  { id: '5', name: 'Estética Lumina', category: 'Salón', ownerEmail: 'lumina@estetica.co', city: 'Bogotá', subscriptionStatus: 'active', trialEnds: '—', active: true, createdAt: '2026-03-10' },
];

const SUB_CLASS: Record<string, string> = { trial: 'badge-blue', active: 'badge-green', expired: 'badge-red' };
const SUB_LABEL: Record<string, string> = { trial: 'Trial', active: 'Activa', expired: 'Vencida' };

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="flex-between" style="margin-bottom:24px">
        <div>
          <h1 style="font-size:1.4rem">Empresas</h1>
          <p style="color:#888;font-size:13px">{{ companies().length }} registradas · {{ activeCount() }} activas</p>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <input [(ngModel)]="search" placeholder="Buscar empresa..." style="flex:1;min-width:200px;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px" />
          <select [(ngModel)]="filterStatus" style="padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px">
            <option value="">Todos los estados</option>
            <option value="trial">Trial</option>
            <option value="active">Activas</option>
            <option value="expired">Vencidas</option>
          </select>
        </div>
      </div>

      <div class="card" style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead>
            <tr style="border-bottom:2px solid #f0f0f0">
              <th style="text-align:left;padding:10px 12px;color:#888;font-weight:600">Empresa</th>
              <th style="text-align:left;padding:10px 12px;color:#888;font-weight:600">Propietario</th>
              <th style="text-align:left;padding:10px 12px;color:#888;font-weight:600">Ciudad</th>
              <th style="text-align:left;padding:10px 12px;color:#888;font-weight:600">Suscripción</th>
              <th style="text-align:left;padding:10px 12px;color:#888;font-weight:600">Estado</th>
              <th style="padding:10px 12px"></th>
            </tr>
          </thead>
          <tbody>
            @for (c of filtered(); track c.id) {
              <tr style="border-bottom:1px solid #f7f7f7" [style.opacity]="c.active?'1':'0.55'">
                <td style="padding:12px">
                  <div style="font-weight:600">{{ c.name }}</div>
                  <div style="color:#aaa;font-size:11px">{{ c.category }}</div>
                </td>
                <td style="padding:12px;color:#555">{{ c.ownerEmail }}</td>
                <td style="padding:12px;color:#555">{{ c.city }}</td>
                <td style="padding:12px">
                  <span class="badge" [class]="SUB_CLASS[c.subscriptionStatus]">{{ SUB_LABEL[c.subscriptionStatus] }}</span>
                  @if (c.subscriptionStatus === 'trial') {
                    <div style="font-size:11px;color:#aaa;margin-top:3px">hasta {{ c.trialEnds }}</div>
                  }
                </td>
                <td style="padding:12px">
                  <span class="badge" [class]="c.active?'badge-green':'badge-red'">{{ c.active ? 'Activa' : 'Inactiva' }}</span>
                </td>
                <td style="padding:12px;text-align:right">
                  <button class="btn btn-sm" [class]="c.active?'btn-danger':'btn-primary'" (click)="toggle(c.id)">
                    {{ c.active ? 'Deshabilitar' : 'Habilitar' }}
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>

        @if (filtered().length === 0) {
          <div style="text-align:center;padding:40px;color:#aaa">Sin resultados para esos filtros.</div>
        }
      </div>
    </div>
  `,
})
export class CompaniesComponent {
  SUB_CLASS = SUB_CLASS;
  SUB_LABEL = SUB_LABEL;
  companies = signal<Company[]>([...MOCK]);
  search = '';
  filterStatus = '';

  activeCount = computed(() => this.companies().filter(c => c.active).length);

  filtered = computed(() => {
    return this.companies().filter(c => {
      const matchSearch = c.name.toLowerCase().includes(this.search.toLowerCase()) || c.ownerEmail.toLowerCase().includes(this.search.toLowerCase());
      const matchStatus = this.filterStatus ? c.subscriptionStatus === this.filterStatus : true;
      return matchSearch && matchStatus;
    });
  });

  toggle(id: string) {
    this.companies.update(list => list.map(c => c.id === id ? { ...c, active: !c.active } : c));
  }
}
