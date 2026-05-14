import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  active: boolean;
}

const MOCK_SERVICES: Service[] = [
  { id: '1', name: 'Corte clásico', description: 'Corte de cabello masculino clásico', duration: 30, price: 20000, active: true },
  { id: '2', name: 'Corte + barba', description: 'Corte y arreglo de barba', duration: 45, price: 35000, active: true },
  { id: '3', name: 'Afeitado navaja', description: 'Afeitado tradicional con navaja y espuma', duration: 30, price: 25000, active: true },
  { id: '4', name: 'Cejas', description: 'Depilación y perfilado de cejas', duration: 15, price: 10000, active: false },
];

const EMPTY: Omit<Service, 'id'> = { name: '', description: '', duration: 30, price: 0, active: true };

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page" style="max-width:700px;margin:0 auto">
      <div class="flex-between" style="margin-bottom:24px">
        <h1 style="font-size:1.4rem">Catálogo de servicios</h1>
        <div style="display:flex;gap:8px">
          <a routerLink="/empresa" class="btn btn-secondary btn-sm">← Dashboard</a>
          <button class="btn btn-primary btn-sm" (click)="openNew()">+ Agregar</button>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <p style="color:#888;font-size:13px">{{ active() }} activos · {{ services().length }} en total</p>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px">
        @for (svc of services(); track svc.id) {
          <div class="card" style="display:flex;align-items:center;gap:16px" [style.opacity]="svc.active?'1':'0.6'">
            <div style="width:44px;height:44px;border-radius:10px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">
              ✂️
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:15px">{{ svc.name }}</div>
              <div style="color:#888;font-size:12px;margin-top:2px">{{ svc.description }}</div>
              <div style="display:flex;gap:16px;margin-top:6px">
                <span style="font-size:12px;color:#555">⏱ {{ svc.duration }} min</span>
                <span style="font-size:13px;font-weight:600;color:#e94560">$ {{ svc.price | number }}</span>
              </div>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <button class="btn btn-secondary btn-sm" (click)="openEdit(svc)">Editar</button>
              <button class="btn btn-sm" [class]="svc.active?'btn-danger':'btn-primary'" (click)="toggle(svc.id)">
                {{ svc.active ? 'Desactivar' : 'Activar' }}
              </button>
            </div>
          </div>
        }
      </div>
    </div>

    @if (showModal()) {
      <div style="position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:100" (click)="close()">
        <div class="card" style="width:440px;max-width:95vw" (click)="$event.stopPropagation()">
          <h2 style="margin-bottom:16px">{{ editId() ? 'Editar' : 'Nuevo' }} servicio</h2>

          <div class="form-group">
            <label>Nombre *</label>
            <input [(ngModel)]="draft.name" placeholder="Ej: Corte de cabello" />
          </div>
          <div class="form-group">
            <label>Descripción</label>
            <textarea [(ngModel)]="draft.description" rows="2" placeholder="Descripción breve" style="resize:none"></textarea>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label>Duración (minutos)</label>
              <input type="number" [(ngModel)]="draft.duration" min="5" max="480" step="5" />
            </div>
            <div class="form-group">
              <label>Precio (COP)</label>
              <input type="number" [(ngModel)]="draft.price" min="0" step="500" />
            </div>
          </div>

          <div style="display:flex;gap:10px;margin-top:8px">
            <button class="btn btn-primary" style="flex:1" (click)="save()" [disabled]="!draft.name">Guardar</button>
            <button class="btn btn-secondary" (click)="close()">Cancelar</button>
            @if (editId()) {
              <button class="btn btn-danger" (click)="remove()">Eliminar</button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class ServicesComponent {
  services = signal<Service[]>([...MOCK_SERVICES]);
  showModal = signal(false);
  editId = signal<string | null>(null);
  draft = { ...EMPTY };

  active = computed(() => this.services().filter(s => s.active).length);

  openNew() {
    this.editId.set(null);
    this.draft = { ...EMPTY };
    this.showModal.set(true);
  }

  openEdit(svc: Service) {
    this.editId.set(svc.id);
    this.draft = { name: svc.name, description: svc.description, duration: svc.duration, price: svc.price, active: svc.active };
    this.showModal.set(true);
  }

  save() {
    if (!this.draft.name.trim()) return;
    const id = this.editId();
    if (id) {
      this.services.update(list => list.map(s => s.id === id ? { ...s, ...this.draft } : s));
    } else {
      this.services.update(list => [...list, { id: Date.now().toString(), ...this.draft }]);
    }
    this.close();
  }

  remove() {
    const id = this.editId();
    if (id) this.services.update(list => list.filter(s => s.id !== id));
    this.close();
  }

  toggle(id: string) {
    this.services.update(list => list.map(s => s.id === id ? { ...s, active: !s.active } : s));
  }

  close() {
    this.showModal.set(false);
    this.editId.set(null);
  }
}
