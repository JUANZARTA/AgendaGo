import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
  id: string;
  displayName: string;
  email: string;
  role: 'client' | 'company' | 'superadmin';
  createdAt: string;
  active: boolean;
}

const MOCK: User[] = [
  { id: '1', displayName: 'Juan Pérez', email: 'juan@gmail.com', role: 'client', createdAt: '2026-03-10', active: true },
  { id: '2', displayName: 'Valentina Ruiz', email: 'valentina@salon.co', role: 'company', createdAt: '2026-01-15', active: true },
  { id: '3', displayName: 'Carlos López', email: 'carlos@gmail.com', role: 'client', createdAt: '2026-04-02', active: true },
  { id: '4', displayName: 'El Padrino', email: 'padrino@barberia.co', role: 'company', createdAt: '2026-02-20', active: true },
  { id: '5', displayName: 'Miguel Torres', email: 'miguel@gmail.com', role: 'client', createdAt: '2026-05-01', active: false },
  { id: '6', displayName: 'Admin Principal', email: 'admin@agendaco.co', role: 'superadmin', createdAt: '2025-12-01', active: true },
];

const ROLE_LABEL: Record<string, string> = { client: 'Cliente', company: 'Empresa', superadmin: 'Superadmin' };
const ROLE_CLASS: Record<string, string> = { client: 'badge-blue', company: 'badge-green', superadmin: 'badge-red' };

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
          <select [(ngModel)]="filterRole" style="padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px">
            <option value="">Todos los roles</option>
            <option value="client">Clientes</option>
            <option value="company">Empresas</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>
      </div>

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
              <tr style="border-bottom:1px solid #f7f7f7" [style.opacity]="u.active?'1':'0.55'">
                <td style="padding:12px">
                  <div style="display:flex;align-items:center;gap:10px">
                    <div style="width:36px;height:36px;border-radius:50%;background:var(--btn-secondary-bg);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;color:var(--purple);flex-shrink:0">
                      {{ u.displayName.charAt(0) }}
                    </div>
                    <span style="font-weight:500">{{ u.displayName }}</span>
                  </div>
                </td>
                <td style="padding:12px;color:#555">{{ u.email }}</td>
                <td style="padding:12px">
                  <span class="badge" [class]="ROLE_CLASS[u.role]">{{ ROLE_LABEL[u.role] }}</span>
                </td>
                <td style="padding:12px;color:#888;font-size:13px">{{ u.createdAt | date:'d MMM yyyy':'':'es-CO' }}</td>
                <td style="padding:12px">
                  <span class="badge" [class]="u.active?'badge-green':'badge-red'">{{ u.active ? 'Activo' : 'Bloqueado' }}</span>
                </td>
                <td style="padding:12px;text-align:right">
                  @if (u.role !== 'superadmin') {
                    <button class="btn btn-sm" [class]="u.active?'btn-danger':'btn-primary'" (click)="toggle(u.id)">
                      {{ u.active ? 'Bloquear' : 'Activar' }}
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
    </div>
  `,
})
export class UsersComponent {
  ROLE_CLASS = ROLE_CLASS;
  ROLE_LABEL = ROLE_LABEL;
  users = signal<User[]>([...MOCK]);
  search = '';
  filterRole = '';

  filtered = computed(() => {
    return this.users().filter(u => {
      const matchSearch = u.displayName.toLowerCase().includes(this.search.toLowerCase())
        || u.email.toLowerCase().includes(this.search.toLowerCase());
      const matchRole = this.filterRole ? u.role === this.filterRole : true;
      return matchSearch && matchRole;
    });
  });

  toggle(id: string) {
    this.users.update(list => list.map(u => u.id === id ? { ...u, active: !u.active } : u));
  }
}
