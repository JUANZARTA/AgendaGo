import { Component, signal, computed, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, onSnapshot, updateDoc, doc } from '@angular/fire/firestore';

const ROLE_LABEL: Record<string, string> = {
  client: 'Cliente', company: 'Empresa', superadmin: 'Superadmin',
};
const ROLE_CLASS: Record<string, string> = {
  client: 'badge-blue', company: 'badge-green', superadmin: 'badge-red',
};

interface AdminUser {
  id: string;
  displayName: string;
  email: string;
  role: string;
  createdLabel: string;
  isActive: boolean;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="flex-between" style="margin-bottom:24px">
        <div>
          <h1 style="font-size:1.4rem">Usuarios</h1>
          <p style="color:#888;font-size:13px">{{ users().length }} registrados</p>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <input [(ngModel)]="search" placeholder="Buscar por nombre o email..."
            style="flex:1;min-width:200px;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px" />
          <select [(ngModel)]="filterRole"
            style="padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px">
            <option value="">Todos los roles</option>
            <option value="client">Clientes</option>
            <option value="company">Empresas</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>
      </div>

      @if (loading()) {
        <div class="card" style="text-align:center;padding:40px;color:#aaa">Cargando usuarios...</div>
      } @else {
        <div class="card" style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead>
              <tr style="border-bottom:2px solid #f0f0f0">
                <th style="text-align:left;padding:10px 12px;color:#888;font-weight:600">Usuario</th>
                <th style="text-align:left;padding:10px 12px;color:#888;font-weight:600">Email</th>
                <th style="text-align:left;padding:10px 12px;color:#888;font-weight:600">Rol</th>
                <th style="text-align:left;padding:10px 12px;color:#888;font-weight:600">Registrado</th>
                <th style="text-align:left;padding:10px 12px;color:#888;font-weight:600">Estado</th>
                <th style="padding:10px 12px"></th>
              </tr>
            </thead>
            <tbody>
              @for (u of filtered(); track u.id) {
                <tr style="border-bottom:1px solid #f7f7f7" [style.opacity]="u.isActive ? '1' : '0.55'">
                  <td style="padding:12px">
                    <div style="display:flex;align-items:center;gap:10px">
                      <div style="width:36px;height:36px;border-radius:50%;background:var(--btn-secondary-bg);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;color:var(--purple);flex-shrink:0">
                        {{ (u.displayName || u.email).charAt(0).toUpperCase() }}
                      </div>
                      <span style="font-weight:500">{{ u.displayName }}</span>
                    </div>
                  </td>
                  <td style="padding:12px;color:#555;font-size:13px">{{ u.email }}</td>
                  <td style="padding:12px">
                    <span class="badge" [class]="ROLE_CLASS[u.role] ?? 'badge-blue'">
                      {{ ROLE_LABEL[u.role] ?? u.role }}
                    </span>
                  </td>
                  <td style="padding:12px;color:#888;font-size:13px">{{ u.createdLabel }}</td>
                  <td style="padding:12px">
                    <span class="badge" [class]="u.isActive ? 'badge-green' : 'badge-red'">
                      {{ u.isActive ? 'Activo' : 'Bloqueado' }}
                    </span>
                  </td>
                  <td style="padding:12px;text-align:right">
                    @if (u.role !== 'superadmin') {
                      <button class="btn btn-sm" [class]="u.isActive ? 'btn-danger' : 'btn-primary'"
                              (click)="toggle(u.id, u.isActive)">
                        {{ u.isActive ? 'Bloquear' : 'Activar' }}
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>

          @if (filtered().length === 0) {
            <div style="text-align:center;padding:40px;color:#aaa">Sin resultados.</div>
          }
        </div>
      }
    </div>
  `,
})
export class UsersComponent implements OnDestroy {
  ROLE_CLASS = ROLE_CLASS;
  ROLE_LABEL = ROLE_LABEL;

  private firestore = inject(Firestore);

  private rawUsers = signal<any[]>([]);
  loading   = signal(true);
  search    = '';
  filterRole = '';

  users = computed<AdminUser[]>(() =>
    this.rawUsers().map(u => ({
      id:           u.id,
      displayName:  u.displayName ?? u.email ?? 'Sin nombre',
      email:        u.email ?? '—',
      role:         u.role ?? 'client',
      createdLabel: this.formatTs(u.createdAt),
      isActive:     u.isActive ?? true,
    }))
  );

  filtered = computed(() =>
    this.users().filter(u => {
      const matchSearch = u.displayName.toLowerCase().includes(this.search.toLowerCase())
        || u.email.toLowerCase().includes(this.search.toLowerCase());
      const matchRole = this.filterRole ? u.role === this.filterRole : true;
      return matchSearch && matchRole;
    })
  );

  private unsub?: () => void;

  constructor() {
    this.unsub = onSnapshot(collection(this.firestore, 'users'), snap => {
      this.rawUsers.set(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      this.loading.set(false);
    });
  }

  ngOnDestroy() { this.unsub?.(); }

  async toggle(id: string, currentIsActive: boolean) {
    await updateDoc(doc(this.firestore, 'users', id), { isActive: !currentIsActive });
  }

  private formatTs(ts: any): string {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
