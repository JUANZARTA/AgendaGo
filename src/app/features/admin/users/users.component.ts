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
                    <span class="badge" [class]="ROLE_CLASS[u.role] || 'badge-blue'">
                      {{ ROLE_LABEL[u.role] || u.role }}
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
                              (click)="confirmTarget.set({ id: u.id, isActive: u.isActive })">
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

    @if (confirmTarget(); as target) {
      <div style="position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:24px" (click)="confirmTarget.set(null)">
        <div style="background:white;border-radius:16px;padding:32px;max-width:400px;width:100%;box-shadow:0 16px 48px rgba(0,0,0,.18)" (click)="$event.stopPropagation()">
          <div style="width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px"
               [style.background]="target.isActive ? '#fee2e2' : '#dcfce7'">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" [attr.stroke]="target.isActive ? '#ef4444' : '#16a34a'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              @if (target.isActive) {
                <circle cx="12" cy="12" r="10"/>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              } @else {
                <polyline points="20 6 9 17 4 12"/>
              }
            </svg>
          </div>
          <h3 style="text-align:center;font-size:1rem;font-weight:800;color:#1a1a2e;margin-bottom:8px">
            {{ target.isActive ? '¿Bloquear usuario?' : '¿Activar usuario?' }}
          </h3>
          <p style="text-align:center;font-size:13px;color:#666;line-height:1.6;margin-bottom:24px">
            {{ target.isActive
              ? 'El usuario verá una pantalla de cuenta suspendida y no podrá usar la app.'
              : 'El usuario podrá acceder a la app con normalidad.' }}
          </p>
          <div style="display:flex;gap:10px">
            <button (click)="confirmTarget.set(null)"
              style="flex:1;padding:11px;border-radius:10px;border:1.5px solid #e5e7eb;background:none;font-size:13px;font-weight:600;color:#888;cursor:pointer;font-family:inherit">
              Cancelar
            </button>
            <button (click)="doToggle(target)"
              style="flex:1;padding:11px;border-radius:10px;border:none;font-size:13px;font-weight:700;color:white;cursor:pointer;font-family:inherit"
              [style.background]="target.isActive ? '#ef4444' : '#16a34a'">
              {{ target.isActive ? 'Sí, bloquear' : 'Sí, activar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class UsersComponent implements OnDestroy {
  ROLE_CLASS = ROLE_CLASS;
  ROLE_LABEL = ROLE_LABEL;

  private firestore = inject(Firestore);

  private rawUsers = signal<any[]>([]);
  loading       = signal(true);
  search        = '';
  filterRole    = '';
  confirmTarget = signal<{ id: string; isActive: boolean } | null>(null);

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

  async doToggle(target: { id: string; isActive: boolean }) {
    this.confirmTarget.set(null);
    await updateDoc(doc(this.firestore, 'users', target.id), { isActive: !target.isActive });
  }

  private formatTs(ts: any): string {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
