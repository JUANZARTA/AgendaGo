import { Component, signal, computed, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, onSnapshot, getDocs } from '@angular/fire/firestore';
import { toLocalDateKey } from '../../../core/utils/date.utils';
import { AdminPlanStatus } from '../../../core/domain/admin-plan';
import { SubscriptionService, OverdueSub } from '../../../core/services/subscription.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PlanKey, formatCop, nextPeriodEnd } from '../../../core/domain/plans';
import { PaymentClaimsComponent } from './payment-claims.component';
import { graceEndOf } from '../../../core/domain/subscription-timeline';
import { AppConfigService } from '../../../core/services/app-config.service';
import { CompanyBillingDetailComponent } from './company-billing-detail.component';
import { VerifyPaymentComponent } from './verify-payment.component';
import { PaymentAttemptsComponent } from './payment-attempts.component';
import { AdminSub, STATUS_CLASS, STATUS_LABEL } from './admin-billing.models';



@Component({
  selector: 'app-admin-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, PaymentClaimsComponent, CompanyBillingDetailComponent, VerifyPaymentComponent, PaymentAttemptsComponent],
  // Facturación usa tablas anchas: aprovechar la pantalla en vez de los 920px del .page global
  styles: [`
    .page { max-width: 1280px; }
    /* Pantallas chicas: cada empresa es una tarjeta (sin scroll horizontal) */
    @media (max-width: 820px) {
      .subs thead { display: none; }
      .subs, .subs tbody, .subs tr, .subs td { display: block; width: 100%; }
      .subs tr { border: 1.5px solid #f0f0f0 !important; border-radius: 12px; padding: 6px 4px; margin-bottom: 10px; }
      .subs td { padding: 6px 10px !important; display: flex; justify-content: space-between; align-items: center; gap: 12px; text-align: right !important; overflow-wrap: anywhere; }
      .subs td::before { content: attr(data-label); color: #888; font-size: 12px; font-weight: 600; text-align: left; flex-shrink: 0; }
      .subs td.actions { justify-content: flex-end; }
      .subs td.actions::before { content: none; }
    }
  `],
  template: `
    <div class="page">
      <div style="margin-bottom:24px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div>
          <h1 style="font-size:1.4rem;margin:0 0 4px">Facturación</h1>
          <p style="color:#888;font-size:13px;margin:0">Gestión de suscripciones y pagos por empresa</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-sm btn-secondary" (click)="verifyOpen.set(true)">Verificar un pago</button>
          <button class="btn btn-sm btn-primary" (click)="startExpiryReview()" [disabled]="reviewing()">
            {{ reviewing() ? 'Revisando...' : 'Revisar vencimientos' }}
          </button>
        </div>
      </div>

      @if (verifyOpen()) {
        <app-verify-payment [companies]="subs()" (closed)="verifyOpen.set(false)" />
      }

      <!-- Detalle de UNA empresa (Gestionar) o la lista de todas -->
      @if (detailSub(); as d) {
        <app-company-billing-detail [sub]="d" (back)="closeDetail()" (manage)="openModal(d)" />
      } @else {

      @if (pendingOverdueCount() > 0) {
        <div style="margin-bottom:16px;padding:12px 16px;background:#fffbeb;border:1.5px solid #fde68a;border-radius:10px;font-size:13px;color:#92400e;font-weight:600">
          Hay {{ pendingOverdueCount() }} suscripción(es) que vencieron y ya pasaron los {{ graceDays() }} días de gracia. Usa "Revisar vencimientos" para suspenderlas.
        </div>
      }

      @if (expiryResult()) {
        <div style="margin-bottom:16px;padding:12px 16px;background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;font-size:13px;color:#166534;font-weight:600;display:flex;justify-content:space-between;gap:12px">
          <span>{{ expiryResult() }}</span>
          <button (click)="expiryResult.set('')" style="background:none;border:none;cursor:pointer;color:#166534;font-size:16px;line-height:1">×</button>
        </div>
      }

      <!-- Reportes de pago de las empresas (vuelta de Wompi) -->
      <app-payment-claims />

      <!-- Abrieron Wompi y no volvieron: puede haber un pago sin reportar -->
      <app-payment-attempts (verify)="verifyOpen.set(true)" />

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
          <table class="subs" style="width:100%;border-collapse:collapse;font-size:14px">
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
                  <td data-label="Empresa" style="padding:12px;font-weight:600">{{ s.companyName }}</td>
                  <td data-label="Email" style="padding:12px;color:#555;font-size:13px">{{ s.ownerEmail }}</td>
                  <td data-label="Estado" style="padding:12px">
                    <span class="badge" [class]="STATUS_CLASS[s.status] || 'badge-blue'">
                      {{ STATUS_LABEL[s.status] || s.status }}
                    </span>
                  </td>
                  <td data-label="Vence / Venció" style="padding:12px;color:#555;font-size:13px">{{ s.periodEndLabel || s.trialEndLabel }}</td>
                  <td data-label="Último pago" style="padding:12px;color:#555;font-size:13px">{{ s.lastPaymentLabel }}</td>
                  <td class="actions" style="padding:12px;text-align:right">
                    <button class="btn btn-sm btn-primary"
                            (click)="openDetail(s)">
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
      } <!-- /lista de empresas -->
    </div>

    <!-- Modal confirmación vencimientos -->
    @if (overdue()) {
      <div style="position:fixed;inset:0;z-index:1100;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:24px">
        <div style="background:white;border-radius:16px;padding:28px;max-width:460px;width:100%;box-shadow:0 16px 48px rgba(0,0,0,.2)">
          <h3 style="font-size:1rem;font-weight:800;color:#1a1a2e;margin:0 0 10px">Revisar vencimientos</h3>
          @if (overdue()!.length === 0) {
            <p style="font-size:13px;color:#666;margin:0 0 20px">No hay suscripciones trial/activas que hayan pasado la gracia ni empresas activas sin suscripción.</p>
            <button (click)="overdue.set(null)" style="width:100%;padding:11px;border-radius:10px;border:1.5px solid #e5e7eb;background:none;font-size:13px;font-weight:600;color:#888;cursor:pointer;font-family:inherit">Cerrar</button>
          } @else {
            <p style="font-size:13px;color:#666;line-height:1.6;margin:0 0 10px">
              Se marcarán como <strong>vencidas</strong> {{ overdue()!.length }} empresa(s) y se desactivarán (isActive = false):
            </p>
            <ul style="max-height:180px;overflow:auto;margin:0 0 20px;padding-left:18px;font-size:13px;color:#444">
              @for (o of overdue()!; track o.companyId) {
                <li>
                  {{ nameOf(o.companyId) }} —
                  @if (o.status === 'missing' || !o.endDate) { activa SIN suscripción (nunca vencería) }
                  @else { {{ o.status === 'trial' ? 'trial' : 'activa' }}, venció {{ o.endDate.toLocaleDateString('es-CO') }} }
                </li>
              }
            </ul>
            <div style="display:flex;gap:10px">
              <button (click)="overdue.set(null)" [disabled]="expiring()"
                style="flex:1;padding:11px;border-radius:10px;border:1.5px solid #e5e7eb;background:none;font-size:13px;font-weight:600;color:#888;cursor:pointer;font-family:inherit">Cancelar</button>
              <button (click)="confirmExpiry()" [disabled]="expiring()"
                style="flex:1;padding:11px;border-radius:10px;border:none;background:#dc2626;color:white;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit"
                [style.opacity]="expiring() ? '0.6' : '1'">
                {{ expiring() ? 'Procesando...' : 'Sí, marcar vencidas' }}
              </button>
            </div>
          }
        </div>
      </div>
    }

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
            Esta empresa no generará ingresos. Asegúrate de que es un caso autorizado.
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
      <div style="position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px"
           (click)="closeModal()">
        <div style="background:white;border-radius:16px;padding:clamp(20px,5vw,32px);max-width:460px;width:100%;max-height:calc(100dvh - 32px);overflow-y:auto;box-shadow:0 16px 48px rgba(0,0,0,.18)"
             (click)="$event.stopPropagation()">

          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
            <h3 style="margin:0;font-size:1rem;font-weight:800;color:#1a1a2e">{{ selected()!.companyName }}</h3>
            <button (click)="closeModal()"
              style="width:28px;height:28px;border-radius:8px;border:none;background:#f5f5f5;cursor:pointer;font-size:18px;line-height:1;color:#888">×</button>
          </div>

          <!-- Registrar pago verificado en Wompi (el webhook no corre en plan Spark) -->
          <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:14px;margin-bottom:18px">
            <div style="font-size:12px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">Registrar pago</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <select [(ngModel)]="payPlan" style="flex:1;min-width:150px;padding:9px 12px;border:1.5px solid #ddd;border-radius:8px;font-size:13px">
                <option value="">Plan pagado…</option>
                @for (p of planList(); track p.key) {
                  <option [value]="p.key">{{ p.label }} — {{ fmtCop(p.amount) }}</option>
                }
              </select>
              <input [(ngModel)]="payRef" placeholder="Referencia (obligatoria)" required
                     style="flex:1.4;min-width:180px;padding:9px 12px;border:1.5px solid #ddd;border-radius:8px;font-size:13px;box-sizing:border-box" />
            </div>
            <!-- La referencia da el id del pago: registrar dos veces el mismo pago falla en vez de duplicar el período -->
            <p style="font-size:11px;color:#4d7c0f;margin:6px 0 0;line-height:1.5">
              N° de transacción de Wompi, o una referencia única si fue efectivo/transferencia
              (ej. EFECTIVO-2026-10-14-GOLDENPANDA).
            </p>
            @if (payPlan) {
              <p style="font-size:12px;color:#166534;margin:8px 0 0">
                Queda activa hasta el <strong>{{ payPreview() }}</strong>. Se suma al historial de la empresa y se le avisa.
              </p>
            }
            @if (payError()) {
              <p style="font-size:12px;color:#dc2626;margin:8px 0 0">{{ payError() }}</p>
            }
            <button (click)="registerPayment()" [disabled]="!payPlan || !payRef.trim() || paying()"
              style="margin-top:10px;width:100%;padding:10px;border-radius:10px;border:none;background:#16a34a;color:white;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit"
              [style.opacity]="!payPlan || !payRef.trim() || paying() ? '0.5' : '1'">
              {{ paying() ? 'Registrando...' : 'Registrar pago y activar' }}
            </button>
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
              <div style="display:flex;align-items:center;gap:10px;margin-top:6px;flex-wrap:wrap">
                <button type="button" (click)="syncWithPayments(selected()!.companyId)" [disabled]="syncing()"
                  style="padding:6px 12px;border-radius:8px;border:1.5px solid #ddd6fe;background:#f5f3ff;color:#6d28d9;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">
                  {{ syncing() ? 'Calculando…' : '↻ Sincronizar con los pagos' }}
                </button>
                @if (syncMsg()) { <span style="font-size:12px;color:#666">{{ syncMsg() }}</span> }
              </div>
              <p style="font-size:11px;color:#aaa;margin:4px 0 0">Es el vencimiento actual; cámbialo sólo si quieres corregirlo</p>
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
  private subSvc    = inject(SubscriptionService);
  private notifSvc  = inject(NotificationService);
  private appConfig = inject(AppConfigService);

  private rawSubs    = signal<any[]>([]);
  private companyMap = signal<Record<string, { name: string; ownerEmail: string }>>({});

  loading      = signal(true);
  search       = '';
  filterStatus = '';
  saving       = signal(false);

  selected     = signal<AdminSub | null>(null);
  confirmFree  = signal(false);

  // Vencimientos (sustituye al cron checkExpired, que no corre en plan Spark; también corre solo en admin-shell)
  reviewing    = signal(false);
  expiring     = signal(false);
  overdue      = signal<OverdueSub[] | null>(null);
  expiryResult = signal('');
  editStatus   = '';
  editPeriodEnd = '';
  editNote     = '';

  // Registro manual de pagos
  // Monto/días configurados por el admin (config/app)
  readonly planList = computed(() => Object.values(this.appConfig.plans()));
  readonly fmtCop   = formatCop;
  payPlan  = '' as PlanKey | '';
  payRef   = '';
  paying   = signal(false);
  payError = signal('');

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
        periodEndMs:      s.currentPeriodEnd?.toDate ? s.currentPeriodEnd.toDate().getTime() : null,
        trialEndMs:       s.trialEndDate?.toDate ? s.trialEndDate.toDate().getTime() : null,
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

  /**
   * Aviso pasivo: se calcula sobre el snapshot ya cargado (0 lecturas extra). La expiración SÍ se
   * ejecuta sola al entrar al panel (admin-shell → expireOverdueSilently); este aviso cubre lo que
   * venció mientras el panel está abierto. "Revisar vencimientos" además detecta empresas activas
   * SIN suscripción (que este conteo, hecho sólo sobre subscriptions, no ve).
   */
  pendingOverdueCount = computed(() => {
    const now = Date.now();
    const graceDays = this.appConfig.timeline().graceDays;
    return this.rawSubs().filter(s => {
      const raw = s.status === 'trial' ? s.trialEndDate : s.status === 'active' ? s.currentPeriodEnd : null;
      const end = raw?.toDate ? raw.toDate() : null;
      return end !== null && graceEndOf(end, graceDays).getTime() < now;
    }).length;
  });

  nameOf(companyId: string): string {
    return this.companyMap()[companyId]?.name ?? companyId;
  }

  async startExpiryReview() {
    this.reviewing.set(true);
    this.expiryResult.set('');
    try {
      this.overdue.set(await this.subSvc.findOverdue());
    } catch (err) {
      console.error('[AdminBilling] Error buscando vencimientos:', err);
      alert('No se pudieron consultar los vencimientos. Intenta de nuevo.');
    } finally {
      this.reviewing.set(false);
    }
  }

  async confirmExpiry() {
    const items = this.overdue();
    if (!items?.length) return;
    this.expiring.set(true);
    try {
      const { expired, failed } = await this.subSvc.expireOverdue(items);
      this.expiryResult.set(
        `Vencimientos procesados: ${expired} marcadas como vencidas` + (failed ? `, ${failed} con error (ver consola)` : '') + '.'
      );
      this.overdue.set(null);
    } finally {
      this.expiring.set(false);
    }
  }

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

  // Detalle por empresa: se guarda el id y se lee de subs() para que refleje los cambios en vivo
  private detailId = signal<string | null>(null);
  verifyOpen = signal(false);
  readonly graceDays = computed(() => this.appConfig.timeline().graceDays);
  detailSub = computed(() => this.subs().find(s => s.companyId === this.detailId()) ?? null);

  openDetail(s: AdminSub) { this.detailId.set(s.companyId); window.scrollTo({ top: 0 }); }
  closeDetail() { this.detailId.set(null); }

  syncing = signal(false);
  syncMsg = signal('');

  /** Pone en la fecha el vencimiento que dan los pagos aprobados (sigue siendo editable). */
  async syncWithPayments(companyId: string): Promise<void> {
    this.syncing.set(true);
    this.syncMsg.set('');
    try {
      const until = await this.subSvc.paidUntil(companyId);
      if (!until) { this.syncMsg.set('No hay pagos aprobados.'); return; }
      this.editPeriodEnd = toLocalDateKey(until);
      this.syncMsg.set(`Según los pagos: vence el ${until.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}.`);
    } catch (err) {
      console.error('[Admin] Error calculando vencimiento por pagos:', err);
      this.syncMsg.set('No se pudo calcular.');
    } finally {
      this.syncing.set(false);
    }
  }

  openModal(s: AdminSub) {
    this.selected.set(s);
    this.editStatus   = s.status;
    // Arranca con el vencimiento vigente (el que calcularon los pagos o el trial)
    const endMs = s.status === 'trial' ? s.trialEndMs : s.periodEndMs;
    this.editPeriodEnd = endMs ? toLocalDateKey(new Date(endMs)) : '';
    this.editNote     = '';
    this.syncMsg.set('');
    this.payPlan  = '';
    this.payRef   = '';
    this.payError.set('');
  }

  /** Vista previa del nuevo vencimiento (misma cuenta que registerManualPayment). */
  payPreview(): string {
    const s = this.selected();
    if (!s || !this.payPlan) return '';
    const currentEnd = s.status === 'active' && s.periodEndMs ? new Date(s.periodEndMs) : null;
    return nextPeriodEnd(currentEnd, this.appConfig.plans()[this.payPlan].days).end
      .toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  async registerPayment() {
    const s = this.selected();
    if (!s || !this.payPlan || this.paying()) return;
    if (!this.payRef.trim()) {
      this.payError.set('Ingresa la referencia del pago (n° de transacción de Wompi o una única para efectivo/transferencia).');
      return;
    }
    const plan = this.appConfig.plans()[this.payPlan];
    this.paying.set(true);
    this.payError.set('');
    try {
      const r = await this.subSvc.registerManualPayment(s.companyId, plan.key, this.payRef);
      if (r.ownerId && !r.disabled) {
        this.notifSvc.create({
          recipientId: r.ownerId,
          type:        'plan_changed',
          title:       '¡Pago confirmado!',
          body:        `Tu plan ${plan.label} fue activado. Válido hasta el ${r.periodEnd.toLocaleDateString('es-CO')}.`,
          link:        '/empresa/facturacion',
        }).catch(err => console.error('[AdminBilling] No se pudo notificar a la empresa:', err));
      }
      if (r.disabled) alert('El pago quedó registrado, pero la cuenta está deshabilitada: no se reactivó.');
      this.closeModal();
    } catch (err: any) {
      console.error('[AdminBilling] Error registrando pago:', err);
      this.payError.set(err?.message === 'DUPLICATE_PAYMENT'
        ? 'Ese pago ya fue registrado (misma referencia).'
        : err?.message === 'REFERENCE_REQUIRED'
        ? 'Ingresa la referencia del pago.'
        : err?.message === 'SANDBOX_BUILD'
        ? 'Este build consulta el SANDBOX de Wompi: no puede activar planes contra la base real. Usa la app publicada.'
        : 'No se pudo registrar el pago. Intenta de nuevo.');
    } finally {
      this.paying.set(false);
    }
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
    if (!s || this.saving()) return;
    this.saving.set(true);
    this.confirmFree.set(false);
    try {
      // Misma lógica y escritura que el modal "Plan" de Empresas (SubscriptionService.adminSetPlan)
      const current = this.rawSubs().find(r => r.id === s.companyId) ?? null;
      const r = await this.subSvc.adminSetPlan(
        s.companyId,
        { status: this.editStatus as AdminPlanStatus, periodEnd: this.editPeriodEnd, note: this.editNote },
        current,
      );
      if (!r.ok) { alert(r.message); return; }
      this.closeModal();
    } catch (err) {
      console.error('[AdminBilling] Error guardando suscripción:', err);
      alert('No se pudo guardar el cambio. Intenta de nuevo.');
    } finally {
      this.saving.set(false);
    }
  }

  private fmtTs(ts: any): string {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
