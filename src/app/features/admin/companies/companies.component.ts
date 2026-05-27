import { Component, signal, computed, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore, collection, onSnapshot, getDocs, updateDoc, doc, setDoc, serverTimestamp,
} from '@angular/fire/firestore';
import { NotificationService } from '../../../core/services/notification.service';

const CAT_LABEL: Record<string, string> = {
  salon: 'Salón', spa: 'Spa', barberia: 'Barbería', peluqueria: 'Peluquería',
};
const SUB_CLASS: Record<string, string> = {
  trial: 'badge-blue', active: 'badge-green', expired: 'badge-red',
  disabled: 'badge-red', free: 'badge-purple', '—': 'badge-blue',
};
const SUB_LABEL: Record<string, string> = {
  trial: 'Trial', active: 'Activa', expired: 'Vencida', disabled: 'Deshabilitada', free: 'Gratuita', '—': 'Sin plan',
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
                  <td style="padding:12px;text-align:right;display:flex;gap:8px;justify-content:flex-end;align-items:center">
                    <button class="btn btn-sm btn-primary"
                            (click)="openPlanModal(c)">
                      Plan
                    </button>
                    <button class="btn btn-sm" [class]="c.isActive ? 'btn-danger' : 'btn-primary'"
                            (click)="confirmTarget.set({ id: c.id, isActive: c.isActive })">
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

    <!-- Modal: confirmar cuenta gratuita -->
    @if (confirmFreePlan()) {
      <div style="position:fixed;inset:0;z-index:1100;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:24px">
        <div style="background:white;border-radius:16px;padding:32px;max-width:420px;width:100%;box-shadow:0 16px 48px rgba(0,0,0,.2);border-top:4px solid #7c3aed;text-align:center">
          <div style="width:56px;height:56px;border-radius:50%;background:#f5f3ff;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px">⭐</div>
          <h3 style="font-size:1rem;font-weight:800;color:#1a1a2e;margin-bottom:8px">¿Confirmar cuenta gratuita?</h3>
          <p style="font-size:13px;color:#666;line-height:1.6;margin-bottom:8px">
            Vas a otorgarle acceso <strong>gratuito e ilimitado</strong> a <strong>{{ planTarget()?.name }}</strong>.
          </p>
          <p style="font-size:12px;color:#ef4444;margin-bottom:24px;font-weight:600">
            Esta empresa no generará ingresos. Asegurate de que es un caso autorizado.
          </p>
          <div style="display:flex;gap:10px">
            <button (click)="confirmFreePlan.set(false)"
              style="flex:1;padding:11px;border-radius:10px;border:1.5px solid #e5e7eb;background:none;font-size:13px;font-weight:600;color:#888;cursor:pointer;font-family:inherit">
              Cancelar
            </button>
            <button (click)="doSavePlan()" [disabled]="savingPlan()"
              style="flex:1;padding:11px;border-radius:10px;border:none;background:linear-gradient(135deg,#7c3aed,#db2777);color:white;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit"
              [style.opacity]="savingPlan() ? '0.6' : '1'">
              {{ savingPlan() ? 'Guardando...' : 'Sí, confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal: gestión de plan -->
    @if (planTarget(); as company) {
      <div style="position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:24px"
           (click)="planTarget.set(null)">
        <div style="background:white;border-radius:16px;padding:32px;max-width:460px;width:100%;box-shadow:0 16px 48px rgba(0,0,0,.18)"
             (click)="$event.stopPropagation()">

          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
            <h3 style="margin:0;font-size:1rem;font-weight:800;color:#1a1a2e">Plan — {{ company.name }}</h3>
            <button (click)="planTarget.set(null)"
              style="width:28px;height:28px;border-radius:8px;border:none;background:#f5f5f5;cursor:pointer;font-size:18px;line-height:1;color:#888">×</button>
          </div>

          <div style="display:flex;flex-direction:column;gap:14px">
            <div>
              <label style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.05em">Estado de suscripción</label>
              <select [(ngModel)]="editPlanStatus"
                style="width:100%;margin-top:6px;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px">
                <option value="trial">Trial</option>
                <option value="active">Activa</option>
                <option value="expired">Vencida</option>
                <option value="disabled">Deshabilitada</option>
                <option value="free">⭐ Gratuita (tiempo ilimitado)</option>
              </select>
              @if (editPlanStatus === 'free') {
                <div style="margin-top:8px;padding:10px 14px;background:#faf5ff;border:1.5px solid #e9d5ff;border-radius:8px;font-size:12px;color:#7c3aed;font-weight:600;display:flex;gap:8px">
                  <span>⚠️</span>
                  <span>Acceso ilimitado sin fecha de vencimiento. Se pedirá confirmación.</span>
                </div>
              }
            </div>

            @if (editPlanStatus !== 'free') {
              <div>
                <label style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.05em">Fecha de vencimiento</label>
                <input type="date" [(ngModel)]="editPlanPeriodEnd"
                  style="width:100%;margin-top:6px;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;box-sizing:border-box" />
              </div>
            }

            <div>
              <label style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.05em">Nota interna (opcional)</label>
              <textarea [(ngModel)]="editPlanNote" rows="2" placeholder="Ej: Pago recibido por transferencia..."
                style="width:100%;margin-top:6px;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;resize:none;font-family:inherit;box-sizing:border-box"></textarea>
            </div>

            <div style="display:flex;gap:10px;margin-top:4px">
              <button (click)="planTarget.set(null)"
                style="flex:1;padding:11px;border-radius:10px;border:1.5px solid #e5e7eb;background:none;font-size:13px;font-weight:600;color:#888;cursor:pointer;font-family:inherit">
                Cancelar
              </button>
              <button (click)="savePlan()" [disabled]="savingPlan()"
                style="flex:1;padding:11px;border-radius:10px;border:none;background:var(--gradient,linear-gradient(135deg,#7c3aed,#db2777));color:white;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit"
                [style.opacity]="savingPlan() ? '0.6' : '1'">
                {{ savingPlan() ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Modal de confirmación -->
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
            {{ target.isActive ? '¿Deshabilitar empresa?' : '¿Habilitar empresa?' }}
          </h3>
          <p style="text-align:center;font-size:13px;color:#666;line-height:1.6;margin-bottom:24px">
            {{ target.isActive
              ? 'La empresa no podrá operar y verá un aviso de suspensión. Podés revertirlo en cualquier momento.'
              : 'La empresa podrá operar con normalidad nuevamente.' }}
          </p>
          <div style="display:flex;gap:10px">
            <button (click)="confirmTarget.set(null)"
              style="flex:1;padding:11px;border-radius:10px;border:1.5px solid #e5e7eb;background:none;font-size:13px;font-weight:600;color:#888;cursor:pointer;font-family:inherit">
              Cancelar
            </button>
            <button (click)="doToggle(target)"
              style="flex:1;padding:11px;border-radius:10px;border:none;font-size:13px;font-weight:700;color:white;cursor:pointer;font-family:inherit"
              [style.background]="target.isActive ? '#ef4444' : '#16a34a'">
              {{ target.isActive ? 'Sí, deshabilitar' : 'Sí, habilitar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class CompaniesComponent implements OnDestroy {
  SUB_CLASS = SUB_CLASS;
  SUB_LABEL = SUB_LABEL;

  private firestore  = inject(Firestore);
  private notifSvc   = inject(NotificationService);

  private rawCompanies = signal<any[]>([]);
  private subsMap      = signal<Record<string, any>>({});
  private emailMap     = signal<Record<string, string>>({});

  loading         = signal(true);
  search          = '';
  filterStatus    = '';
  confirmTarget   = signal<{ id: string; isActive: boolean } | null>(null);

  planTarget      = signal<{ id: string; name: string; ownerId: string } | null>(null);
  confirmFreePlan = signal(false);
  editPlanStatus  = 'trial';
  editPlanPeriodEnd = '';
  editPlanNote    = '';
  savingPlan      = signal(false);

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

  openPlanModal(c: { id: string; name: string; ownerId: string }) {
    this.planTarget.set({ id: c.id, name: c.name, ownerId: c.ownerId });
    this.editPlanStatus   = 'active';
    this.editPlanPeriodEnd = '';
    this.editPlanNote     = '';
  }

  savePlan() {
    if (this.editPlanStatus === 'free') {
      this.confirmFreePlan.set(true);
      return;
    }
    this.doSavePlan();
  }

  async doSavePlan() {
    const target = this.planTarget();
    if (!target) return;
    this.savingPlan.set(true);
    this.confirmFreePlan.set(false);

    const data: Record<string, any> = {
      companyId: target.id,
      status:    this.editPlanStatus,
    };

    if (this.editPlanStatus === 'free') {
      data['currentPeriodEnd'] = null;
      data['adminNote'] = (this.editPlanNote.trim() || '') + ' [Cuenta gratuita otorgada por admin]';
    } else {
      if (this.editPlanPeriodEnd) {
        data['currentPeriodEnd'] = new Date(this.editPlanPeriodEnd);
        if (this.editPlanStatus === 'active') data['lastPaymentDate'] = serverTimestamp();
      }
      if (this.editPlanNote.trim()) data['adminNote'] = this.editPlanNote.trim();
    }

    await setDoc(doc(this.firestore, 'subscriptions', target.id), data, { merge: true });

    const statusLabels: Record<string, string> = {
      trial: 'Trial', active: 'Plan activo', expired: 'Vencida',
      disabled: 'Deshabilitada', free: 'Gratuita (Beneficiario)',
    };
    if (target.ownerId) {
      await this.notifSvc.create({
        recipientId: target.ownerId,
        type:        'plan_changed',
        title:       'Tu plan fue actualizado',
        body:        `El administrador cambió tu suscripción a: ${statusLabels[this.editPlanStatus] ?? this.editPlanStatus}.`,
        link:        '/empresa/facturacion',
      });
    }

    this.savingPlan.set(false);
    this.planTarget.set(null);
  }

  async doToggle(target: { id: string; isActive: boolean }) {
    this.confirmTarget.set(null);
    await updateDoc(doc(this.firestore, 'companies', target.id), { isActive: !target.isActive });
  }

  private formatTs(ts: any): string {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
