import { Component, signal, computed, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore, collection, onSnapshot, getDocs, updateDoc, doc,
} from '@angular/fire/firestore';

const CAT_LABEL: Record<string, string> = {
  salon: 'Salón', spa: 'Spa', barberia: 'Barbería', peluqueria: 'Peluquería',
};
const SUB_CLASS: Record<string, string> = {
  trial: 'badge-blue', active: 'badge-green', expired: 'badge-red',
  disabled: 'badge-red', '—': 'badge-blue',
};
const SUB_LABEL: Record<string, string> = {
  trial: 'Trial', active: 'Activa', expired: 'Vencida', disabled: 'Deshabilitada', '—': 'Sin plan',
};

interface AdminCompany {
  id: string;
  name: string;
  category: string;
  ownerId: string;
  ownerEmail: string;
  city: string;
  subscriptionStatus: string;
  trialEndsLabel: string;
  isActive: boolean;
  createdLabel: string;
}

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
          <input [(ngModel)]="search" placeholder="Buscar empresa o email..."
            style="flex:1;min-width:200px;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px" />
          <select [(ngModel)]="filterStatus"
            style="padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px">
            <option value="">Todos los estados</option>
            <option value="trial">Trial</option>
            <option value="active">Activas</option>
            <option value="expired">Vencidas</option>
          </select>
        </div>
      </div>

      @if (loading()) {
        <div class="card" style="text-align:center;padding:40px;color:#aaa">Cargando empresas...</div>
      } @else {
        <div class="card" style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead>
              <tr style="border-bottom:2px solid #f0f0f0">
                <th style="text-align:left;padding:10px 12px;color:#888;font-weight:600">Empresa</th>
                <th style="text-align:left;padding:10px 12px;color:#888;font-weight:600">Propietario</th>
                <th style="text-align:left;padding:10px 12px;color:#888;font-weight:600">Ciudad</th>
                <th style="text-align:left;padding:10px 12px;color:#888;font-weight:600">Suscripción</th>
                <th style="text-align:left;padding:10px 12px;color:#888;font-weight:600">Estado</th>
                <th style="text-align:left;padding:10px 12px;color:#888;font-weight:600">Registro</th>
                <th style="padding:10px 12px"></th>
              </tr>
            </thead>
            <tbody>
              @for (c of filtered(); track c.id) {
                <tr style="border-bottom:1px solid #f7f7f7" [style.opacity]="c.isActive ? '1' : '0.55'">
                  <td style="padding:12px">
                    <div style="font-weight:600">{{ c.name }}</div>
                    <div style="color:#aaa;font-size:11px">{{ c.category }}</div>
                  </td>
                  <td style="padding:12px;color:#555;font-size:13px">{{ c.ownerEmail }}</td>
                  <td style="padding:12px;color:#555">{{ c.city }}</td>
                  <td style="padding:12px">
                    <span class="badge" [class]="SUB_CLASS[c.subscriptionStatus]">
                      {{ SUB_LABEL[c.subscriptionStatus] }}
                    </span>
                    @if (c.subscriptionStatus === 'trial' && c.trialEndsLabel !== '—') {
                      <div style="font-size:11px;color:#aaa;margin-top:3px">hasta {{ c.trialEndsLabel }}</div>
                    }
                  </td>
                  <td style="padding:12px">
                    <span class="badge" [class]="c.isActive ? 'badge-green' : 'badge-red'">
                      {{ c.isActive ? 'Activa' : 'Inactiva' }}
                    </span>
                  </td>
                  <td style="padding:12px;color:#aaa;font-size:12px">{{ c.createdLabel }}</td>
                  <td style="padding:12px;text-align:right">
                    <button class="btn btn-sm" [class]="c.isActive ? 'btn-danger' : 'btn-primary'"
                            (click)="toggle(c.id, c.isActive)">
                      {{ c.isActive ? 'Deshabilitar' : 'Habilitar' }}
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
      }
    </div>
  `,
})
export class CompaniesComponent implements OnDestroy {
  SUB_CLASS = SUB_CLASS;
  SUB_LABEL = SUB_LABEL;

  private firestore = inject(Firestore);

  private rawCompanies = signal<any[]>([]);
  private subsMap      = signal<Record<string, any>>({});
  private emailMap     = signal<Record<string, string>>({});

  loading     = signal(true);
  search      = '';
  filterStatus = '';

  companies = computed<AdminCompany[]>(() => {
    const subs   = this.subsMap();
    const emails = this.emailMap();
    return this.rawCompanies().map(c => {
      const sub = subs[c.id] ?? null;
      return {
        id:                 c.id,
        name:               c.name ?? '—',
        category:           CAT_LABEL[c.category] ?? c.category ?? '—',
        ownerId:            c.ownerId,
        ownerEmail:         emails[c.ownerId] ?? '—',
        city:               c.city ?? '—',
        subscriptionStatus: sub?.status ?? '—',
        trialEndsLabel:     (sub?.status === 'trial' && sub.trialEndDate)
                              ? this.formatTs(sub.trialEndDate) : '—',
        isActive:           c.isActive ?? true,
        createdLabel:       this.formatTs(c.createdAt),
      };
    });
  });

  activeCount = computed(() => this.companies().filter(c => c.isActive).length);

  filtered = computed(() =>
    this.companies().filter(c => {
      const matchSearch = c.name.toLowerCase().includes(this.search.toLowerCase())
        || c.ownerEmail.toLowerCase().includes(this.search.toLowerCase());
      const matchStatus = this.filterStatus
        ? c.subscriptionStatus === this.filterStatus
        : true;
      return matchSearch && matchStatus;
    })
  );

  private unsub?: () => void;

  constructor() {
    this.unsub = onSnapshot(collection(this.firestore, 'companies'), snap => {
      this.rawCompanies.set(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      this.loading.set(false);
    });

    getDocs(collection(this.firestore, 'users')).then(snap => {
      const map: Record<string, string> = {};
      snap.docs.forEach(d => { map[d.id] = (d.data() as any).email ?? '—'; });
      this.emailMap.set(map);
    });

    getDocs(collection(this.firestore, 'subscriptions')).then(snap => {
      const map: Record<string, any> = {};
      snap.docs.forEach(d => { map[d.id] = d.data(); });
      this.subsMap.set(map);
    });
  }

  ngOnDestroy() { this.unsub?.(); }

  async toggle(id: string, currentIsActive: boolean) {
    await updateDoc(doc(this.firestore, 'companies', id), { isActive: !currentIsActive });
  }

  private formatTs(ts: any): string {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
