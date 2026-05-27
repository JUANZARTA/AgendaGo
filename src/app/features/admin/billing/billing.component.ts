import { Component, signal, computed, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore, collection, onSnapshot, getDocs, updateDoc, doc, serverTimestamp,
} from '@angular/fire/firestore';

const STATUS_LABEL: Record<string, string> = {
  trial: 'Trial', active: 'Activa', expired: 'Vencida', disabled: 'Deshabilitada', free: 'Gratuita',
};
const STATUS_CLASS: Record<string, string> = {
  trial: 'badge-blue', active: 'badge-green', expired: 'badge-red', disabled: 'badge-red', free: 'badge-purple',
};

interface AdminSub {
  companyId: string;
  companyName: string;
  ownerEmail: string;
  status: string;
  trialEndLabel: string;
  periodEndLabel: string;
  lastPaymentLabel: string;
}

@Component({
  selector: 'app-admin-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div style="margin-bottom:24px">
        <h1 style="font-size:1.4rem;margin:0 0 4px">Facturación</h1>
        <p style="color:#888;font-size:13px;margin:0">Gestión de suscripciones y pagos por empresa</p>
      </div>

      <!-- Resumen -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:24px">
        @for (card of summaryCards(); track card.label) {
          <div class="card" style="padding:20px;text-align:center">
            <div style="font-size:1.8rem;font-weight:800;color:#1a1a2e">{{ card.value }}</div>
            <div style="font-size:12px;color:#888;margin-top:4px;font-weight:600">{{ card.label }}</div>
          </div>
        }
      </div>

      <!-- Filtro -->
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
            <option value="disabled">Deshabilitadas</option>
          </select>
        </div>
      </div>

      <!-- Tabla -->
      @if (loading()) {
        <div class="card" style="text-align:center;padding:40px;color:#aaa">Cargando...</div>
      } @else {
        <div class="card" style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead>
              <tr style="border-bottom:2px solid #f0f0f0">
                <th style="text-align:left;padding:10px 12px;color:#888;font-weight:600">Empresa</th>
                <th style="text-align:left;padding:10px 12px;color:#888;font-weight:600">Email</th>
                <th style="text-align:left;padding:10px 12px;color:#888;font-weight:600">Estado</th>
                <th style="text-align:left;padding:10px 12px;color:#888;font-weight:600">Vence / Venció</th>
                <th style="text-align:left;padding:10px 12px;color:#888;font-weight:600">Último pago</th>
                <th style="padding:10px 12px"></th>
              </tr>
            </thead>
            <tbody>
              @for (s of filtered(); track s.companyId) {
                <tr style="border-bottom:1px solid #f7f7f7">
                  <td style="padding:12px;font-weight:600">{{ s.companyName }}</td>
                  <td style="padding:12px;color:#555;font-size:13px">{{ s.ownerEmail }}</td>
                  <td style="padding:12px">
                    <span class="badge" [class]="STATUS_CLASS[s.status] ?? 'badge-blue'">
                      {{ STATUS_LABEL[s.status] ?? s.status }}
                    </span>
                  </td>
                  <td style="padding:12px;color:#555;font-size:13px">{{ s.periodEndLabel || s.trialEndLabel }}</td>
                  <td style="padding:12px;color:#555;font-size:13px">{{ s.lastPaymentLabel }}</td>
                  <td style="padding:12px;text-align:right">
                    <button class="btn btn-sm btn-primary"
                            (click)="openModal(s)">
                      Gestionar
                    </button>
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

    <!-- Modal confirmación cuenta gratuita -->
    @if (confirmFree()) {
      <div style="position:fixed;inset:0;z-index:1100;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:24px">
        <div style="background:white;border-radius:16px;padding:32px;max-width:420px;width:100%;box-shadow:0 16px 48px rgba(0,0,0,.2);border-top:4px solid #7c3aed;text-align:center">
          <div style="width:56px;height:56px;border-radius:50%;background:#f5f3ff;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px">⭐</div>
          <h3 style="font-size:1rem;font-weight:800;color:#1a1a2e;margin-bottom:8px">¿Confirmar cuenta gratuita?</h3>
          <p style="font-size:13px;color:#666;line-height:1.6;margin-bottom:8px">
            Vas a otorgarle acceso <strong>gratuito e ilimitado</strong> a <strong>{{ selected()?.companyName }}</strong>.
          </p>
          <p style="font-size:12px;color:#ef4444;margin-bottom:24px;font-weight:600">
            Esta empresa no generará ingresos. Asegurate de que es un caso autorizado.
          </p>
          <div style="display:flex;gap:10px">
            <button (click)="confirmFree.set(false)"
              style="flex:1;padding:11px;border-radius:10px;border:1.5px solid #e5e7eb;background:none;font-size:13px;font-weight:600;color:#888;cursor:pointer;font-family:inherit">
              Cancelar
            </button>
            <button (click)="doSave()" [disabled]="saving()"
              style="flex:1;padding:11px;border-radius:10px;border:none;background:linear-gradient(135deg,#7c3aed,#db2777);color:white;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit"
              [style.opacity]="saving() ? '0.6' : '1'">
              {{ saving() ? 'Guardando...' : 'Sí, confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal gestión -->
    @if (selected()) {
      <div style="position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:24px"
           (click)="closeModal()">
        <div style="background:white;border-radius:16px;padding:32px;max-width:460px;width:100%;box-shadow:0 16px 48px rgba(0,0,0,.18)"
             (click)="$event.stopPropagation()">

          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
            <h3 style="margin:0;font-size:1rem;font-weight:800;color:#1a1a2e">{{ selected()!.companyName }}</h3>
            <button (click)="closeModal()"
              style="width:28px;height:28px;border-radius:8px;border:none;background:#f5f5f5;cursor:pointer;font-size:18px;line-height:1;color:#888">×</button>
          </div>

          <div style="display:flex;flex-direction:column;gap:14px">

            <!-- Cambiar estado -->
            <div>
              <label style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.05em">Estado de suscripción</label>
              <select [(ngModel)]="editStatus"
                style="width:100%;margin-top:6px;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px">
                <option value="trial">Trial</option>
                <option value="active">Activa</option>
                <option value="expired">Vencida</option>
                <option value="disabled">Deshabilitada</option>
                <option value="free">⭐ Gratuita (tiempo ilimitado)</option>
              </select>
              @if (editStatus === 'free') {
                <div style="margin-top:8px;padding:10px 14px;background:#faf5ff;border:1.5px solid #e9d5ff;border-radius:8px;font-size:12px;color:#7c3aed;font-weight:600;display:flex;gap:8px;align-items:flex-start">
                  <span style="flex-shrink:0">⚠️</span>
                  <span>Esta empresa no pagará por el servicio. Acceso ilimitado sin fecha de vencimiento. Se te pedirá confirmación antes de guardar.</span>
                </div>
              }
            </div>

            <!-- Fecha de vencimiento -->
            <div>
              <label style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.05em">Fecha de vencimiento</label>
              <input type="date" [(ngModel)]="editPeriodEnd"
                style="width:100%;margin-top:6px;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;box-sizing:border-box" />
              <p style="font-size:11px;color:#aaa;margin:4px 0 0">Dejá vacío para no modificar</p>
            </div>

            <!-- Nota -->
            <div>
              <label style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.05em">Nota interna (opcional)</label>
              <textarea [(ngModel)]="editNote" rows="2" placeholder="Ej: Pago recibido por transferencia..."
                style="width:100%;margin-top:6px;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;resize:none;font-family:inherit;box-sizing:border-box"></textarea>
            </div>

            <div style="display:flex;gap:10px;margin-top:4px">
              <button (click)="closeModal()"
                style="flex:1;padding:11px;border-radius:10px;border:1.5px solid #e5e7eb;background:none;font-size:13px;font-weight:600;color:#888;cursor:pointer;font-family:inherit">
                Cancelar
              </button>
              <button (click)="save()" [disabled]="saving()"
                style="flex:1;padding:11px;border-radius:10px;border:none;background:var(--gradient, linear-gradient(135deg,#7c3aed,#db2777));color:white;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit"
                [style.opacity]="saving() ? '0.6' : '1'">
                {{ saving() ? 'Guardando...' : 'Guardar cambios' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminBillingComponent implements OnDestroy {
  STATUS_CLASS = STATUS_CLASS;
  STATUS_LABEL = STATUS_LABEL;

  private firestore = inject(Firestore);

  private rawSubs    = signal<any[]>([]);
  private companyMap = signal<Record<string, { name: string; ownerEmail: string }>>({});

  loading      = signal(true);
  search       = '';
  filterStatus = '';
  saving       = signal(false);

  selected     = signal<AdminSub | null>(null);
  confirmFree  = signal(false);
  editStatus   = '';
  editPeriodEnd = '';
  editNote     = '';

  private unsub?: () => void;

  subs = computed<AdminSub[]>(() => {
    const cmap = this.companyMap();
    return this.rawSubs().map(s => {
      const co = cmap[s.id] ?? { name: s.id, ownerEmail: '—' };
      return {
        companyId:        s.id,
        companyName:      co.name,
        ownerEmail:       co.ownerEmail,
        status:           s.status ?? 'trial',
        trialEndLabel:    this.fmtTs(s.trialEndDate),
        periodEndLabel:   this.fmtTs(s.currentPeriodEnd),
        lastPaymentLabel: this.fmtTs(s.lastPaymentDate),
      };
    });
  });

  filtered = computed(() =>
    this.subs().filter(s => {
      const matchSearch = s.companyName.toLowerCase().includes(this.search.toLowerCase())
        || s.ownerEmail.toLowerCase().includes(this.search.toLowerCase());
      const matchStatus = this.filterStatus ? s.status === this.filterStatus : true;
      return matchSearch && matchStatus;
    })
  );

  summaryCards = computed(() => {
    const list = this.subs();
    return [
      { label: 'Total empresas', value: list.length },
      { label: 'Activas',        value: list.filter(s => s.status === 'active').length },
      { label: 'En trial',       value: list.filter(s => s.status === 'trial').length },
      { label: 'Vencidas',       value: list.filter(s => s.status === 'expired').length },
    ];
  });

  constructor() {
    this.unsub = onSnapshot(collection(this.firestore, 'subscriptions'), snap => {
      this.rawSubs.set(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      this.loading.set(false);
    });

    this.loadEmailsForCompanies();
  }

  private async loadEmailsForCompanies() {
    const [csnap, usnap] = await Promise.all([
      getDocs(collection(this.firestore, 'companies')),
      getDocs(collection(this.firestore, 'users')),
    ]);

    const userEmails: Record<string, string> = {};
    usnap.docs.forEach(d => { userEmails[d.id] = (d.data() as any).email ?? '—'; });

    const cmap: Record<string, { name: string; ownerEmail: string }> = {};
    csnap.docs.forEach(d => {
      const data = d.data() as any;
      cmap[d.id] = {
        name:       data.name ?? d.id,
        ownerEmail: userEmails[data.ownerId] ?? '—',
      };
    });

    this.companyMap.set(cmap);
  }

  ngOnDestroy() { this.unsub?.(); }

  openModal(s: AdminSub) {
    this.selected.set(s);
    this.editStatus   = s.status;
    this.editPeriodEnd = '';
    this.editNote     = '';
  }

  closeModal() { this.selected.set(null); }

  save() {
    if (this.editStatus === 'free') {
      this.confirmFree.set(true);
      return;
    }
    this.doSave();
  }

  async doSave() {
    const s = this.selected();
    if (!s) return;
    this.saving.set(true);
    this.confirmFree.set(false);

    const update: Record<string, any> = { status: this.editStatus };

    if (this.editStatus === 'free') {
      update['currentPeriodEnd'] = null;
      update['adminNote'] = (this.editNote.trim() || '') + ' [Cuenta gratuita otorgada por admin]';
    } else {
      if (this.editPeriodEnd) {
        update['currentPeriodEnd'] = new Date(this.editPeriodEnd);
        if (this.editStatus === 'active') {
          update['lastPaymentDate'] = serverTimestamp();
        }
      }
      if (this.editNote.trim()) {
        update['adminNote'] = this.editNote.trim();
      }
    }

    await updateDoc(doc(this.firestore, 'subscriptions', s.companyId), update);
    this.saving.set(false);
    this.closeModal();
  }

  private fmtTs(ts: any): string {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
