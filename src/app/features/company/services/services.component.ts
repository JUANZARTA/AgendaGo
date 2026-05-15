import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ServiceCatalogService, ServiceItem } from '../../../core/services/service-catalog.service';
import { CompanyStore } from '../../../core/services/company-store.service';

const EMPTY: Omit<ServiceItem, 'id'> = { name: '', description: '', duration: 30, price: 0, staffCount: 1, isActive: true };

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    :host { display: block; }

    .price-wrap {
      display: flex;
      align-items: center;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
      transition: border-color .15s, box-shadow .15s;
    }
    .price-wrap:focus-within {
      border-color: var(--purple);
      box-shadow: 0 0 0 3px rgba(var(--primary-rgb), .1);
    }
    .price-sym {
      padding: 10px 12px;
      background: #f5f0ff;
      border-right: 1.5px solid #e5e7eb;
      font-weight: 700;
      color: var(--purple);
      font-size: 15px;
      flex-shrink: 0;
      user-select: none;
    }
    .price-inp {
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      padding: 10px 12px !important;
      flex: 1;
      min-width: 0;
      background: white;
      font-size: 15px !important;
      font-family: inherit;
      color: #1a1a2e;
    }

    @media (max-width: 480px) {
      .service-card { flex-wrap: wrap !important; }
      .service-actions { width: 100%; justify-content: flex-end; margin-top: 4px; }
    }

    @media (max-width: 640px) {
      input, select, textarea { font-size: 16px !important; }
    }
  `],
  template: `
    <div class="page" style="max-width:700px;margin:0 auto">
      <div class="flex-between" style="margin-bottom:24px;flex-wrap:wrap;gap:10px">
        <h1 style="font-size:1.4rem">Catálogo de servicios</h1>
        <div style="display:flex;gap:8px">
          <a routerLink="/empresa" class="btn btn-secondary btn-sm">← Dashboard</a>
          <button class="btn btn-primary btn-sm" (click)="openNew()" [disabled]="!companyId()">+ Agregar</button>
        </div>
      </div>

      @if (storeLoading()) {
        <div class="card" style="text-align:center;padding:40px;color:#aaa">Cargando...</div>
      } @else if (!companyId()) {
        <div class="card" style="text-align:center;padding:40px;color:#aaa">
          Iniciá sesión para gestionar tus servicios.
        </div>
      } @else {
        <div class="card" style="margin-bottom:16px">
          <p style="color:#888;font-size:13px">{{ active() }} activos · {{ services().length }} en total</p>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px">
          @for (svc of services(); track svc.id) {
            <div class="card service-card" style="display:flex;align-items:center;gap:16px" [style.opacity]="svc.isActive?'1':'0.6'">
              <div style="width:44px;height:44px;border-radius:10px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#555">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><line x1="18" y1="9" x2="18" y2="21"/><line x1="18" y1="3" x2="6" y2="15"/></svg>
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:15px">{{ svc.name }}</div>
                <div style="color:#888;font-size:12px;margin-top:2px">{{ svc.description }}</div>
                <div style="display:flex;gap:16px;margin-top:6px">
                  <span style="font-size:12px;color:#555;display:inline-flex;align-items:center;gap:4px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> {{ svc.duration }} min</span>
                  <span style="font-size:13px;font-weight:600;color:#e94560">$ {{ (svc.price ?? 0) | number }}</span>
                </div>
              </div>
              <div class="service-actions" style="display:flex;gap:6px;flex-shrink:0">
                <button class="btn btn-secondary btn-sm" (click)="openEdit(svc)">Editar</button>
                <button class="btn btn-sm" [class]="svc.isActive?'btn-danger':'btn-primary'" (click)="toggle(svc)" [disabled]="saving()">
                  {{ svc.isActive ? 'Desactivar' : 'Activar' }}
                </button>
              </div>
            </div>
          }

          @if (!loading() && services().length === 0) {
            <div class="card" style="text-align:center;padding:40px;color:#aaa">
              Sin servicios aún. Agregá el primero.
            </div>
          }
        </div>
      }
    </div>

    @if (showModal()) {
      <div style="position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px" (click)="close()">
        <div class="card" style="width:440px;max-width:min(440px,calc(100vw - 16px))" (click)="$event.stopPropagation()">
          <h2 style="margin-bottom:16px">{{ editId() ? 'Editar' : 'Nuevo' }} servicio</h2>

          <div class="form-group">
            <label>Nombre *</label>
            <input [(ngModel)]="draft.name" placeholder="Ej: Corte de cabello" />
          </div>
          <div class="form-group">
            <label>Descripción <span style="font-weight:400;color:#bbb;font-size:12px">(opcional)</span></label>
            <textarea [(ngModel)]="draft.description" rows="2" placeholder="Descripción breve del servicio" style="resize:none"></textarea>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label>Duración (minutos)</label>
              <input type="number" [(ngModel)]="draft.duration" min="5" max="480" step="5" />
            </div>
            <div class="form-group">
              <label>Precio (COP)</label>
              <div class="price-wrap">
                <span class="price-sym">$</span>
                <input class="price-inp" type="text" inputmode="decimal"
                       [value]="priceDisplay"
                       (input)="onPriceInput($event)"
                       placeholder="0" />
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Profesionales que atienden este servicio</label>
            <select [(ngModel)]="draft.staffCount">
              @for (n of [1,2,3,4,5,6,7,8]; track n) {
                <option [ngValue]="n">{{ n }} {{ n === 1 ? 'profesional' : 'profesionales' }}</option>
              }
            </select>
          </div>

          <div style="display:flex;gap:10px;margin-top:8px">
            <button class="btn btn-primary" style="flex:1" (click)="save()" [disabled]="!draft.name || saving()">
              {{ saving() ? 'Guardando...' : 'Guardar' }}
            </button>
            <button class="btn btn-secondary" (click)="close()">Cancelar</button>
            @if (editId()) {
              <button class="btn btn-danger" (click)="remove()" [disabled]="saving()">Eliminar</button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class ServicesComponent {
  private companyStore = inject(CompanyStore);
  private catalogSvc  = inject(ServiceCatalogService);

  companyId    = this.companyStore.companyId;
  storeLoading = this.companyStore.loading;

  services     = signal<ServiceItem[]>([]);
  showModal    = signal(false);
  editId       = signal<string | null>(null);
  loading      = signal(false);
  saving       = signal(false);
  draft        = { ...EMPTY };
  priceDisplay = '';

  active = computed(() => this.services().filter(s => s.isActive).length);

  constructor() {
    effect(() => {
      const id = this.companyStore.companyId();
      if (id) this.loadServices(id);
    });
  }

  private async loadServices(companyId: string) {
    this.loading.set(true);
    try {
      this.services.set(await this.catalogSvc.getServices(companyId));
    } finally {
      this.loading.set(false);
    }
  }

  openNew() {
    this.editId.set(null);
    this.draft = { ...EMPTY };
    this.priceDisplay = '';
    this.showModal.set(true);
  }

  openEdit(svc: ServiceItem) {
    this.editId.set(svc.id!);
    this.draft = { name: svc.name, description: svc.description ?? '', duration: svc.duration, price: svc.price ?? 0, staffCount: svc.staffCount ?? 1, isActive: svc.isActive };
    this.priceDisplay = svc.price ? svc.price.toString() : '';
    this.showModal.set(true);
  }

  onPriceInput(event: Event) {
    const el = event.target as HTMLInputElement;

    // Quitar puntos de formato y dejar solo dígitos + coma decimal
    let raw = el.value.replace(/\./g, '').replace(/[^0-9,]/g, '');

    // Solo una coma
    const firstComma = raw.indexOf(',');
    if (firstComma !== -1) {
      raw = raw.slice(0, firstComma + 1) + raw.slice(firstComma + 1).replace(/,/g, '');
    }

    // Máximo 2 decimales
    const commaIdx = raw.indexOf(',');
    if (commaIdx !== -1) raw = raw.slice(0, commaIdx + 3);

    // Quitar ceros a la izquierda (010000 → 10000; "0,5" se respeta)
    const parts = raw.split(',');
    let intPart = parts[0].replace(/^0+/, '') || (parts.length > 1 ? '0' : '');
    raw = parts.length > 1 ? `${intPart},${parts[1]}` : intPart;

    // Añadir punto como separador de miles (solo visual)
    const rawParts = raw.split(',');
    const displayInt = rawParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const display = rawParts.length > 1 ? `${displayInt},${rawParts[1]}` : displayInt;

    // Valor numérico limpio para la DB (coma → punto para parseFloat)
    const numVal = parseFloat(raw.replace(',', '.')) || 0;

    this.priceDisplay = display;
    el.value = display;
    this.draft.price = numVal;
  }

  async save() {
    const cid = this.companyStore.companyId();
    if (!cid || !this.draft.name.trim()) return;
    this.saving.set(true);
    try {
      const id = this.editId();
      if (id) {
        await this.catalogSvc.updateService(cid, id, this.draft);
      } else {
        await this.catalogSvc.createService(cid, this.draft);
      }
      await this.loadServices(cid);
      this.close();
    } finally {
      this.saving.set(false);
    }
  }

  async remove() {
    const cid = this.companyStore.companyId();
    const id  = this.editId();
    if (!cid || !id) return;
    this.saving.set(true);
    try {
      await this.catalogSvc.deleteService(cid, id);
      await this.loadServices(cid);
      this.close();
    } finally {
      this.saving.set(false);
    }
  }

  async toggle(svc: ServiceItem) {
    const cid = this.companyStore.companyId();
    if (!cid || !svc.id) return;
    await this.catalogSvc.updateService(cid, svc.id, { isActive: !svc.isActive });
    await this.loadServices(cid);
  }

  close() {
    this.showModal.set(false);
    this.editId.set(null);
  }
}
