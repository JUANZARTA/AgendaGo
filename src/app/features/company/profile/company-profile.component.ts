import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-company-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page" style="max-width:600px;margin:0 auto">
      <div class="flex-between" style="margin-bottom:24px">
        <h1 style="font-size:1.4rem">Perfil de la empresa</h1>
        <a routerLink="/empresa" class="btn btn-secondary btn-sm">← Dashboard</a>
      </div>

      @if (saved()) {
        <div style="background:#d4edda;color:#155724;padding:12px 16px;border-radius:8px;margin-bottom:16px;font-size:14px">
          ✓ Perfil guardado correctamente
        </div>
      }

      <div class="card">
        <div class="form-group">
          <label>Nombre del negocio *</label>
          <input [(ngModel)]="form.name" placeholder="Ej: Salón Valentina" />
        </div>

        <div class="form-group">
          <label>Categoría</label>
          <select [(ngModel)]="form.category">
            <option value="salon">Salón de belleza</option>
            <option value="barberia">Barbería</option>
            <option value="spa">Spa</option>
            <option value="peluqueria">Peluquería</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div class="form-group">
          <label>Descripción</label>
          <textarea [(ngModel)]="form.description" rows="3"
            placeholder="Describí tu negocio en pocas palabras"
            style="resize:vertical"></textarea>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label>Teléfono / WhatsApp</label>
            <input [(ngModel)]="form.phone" placeholder="57300..." />
          </div>
          <div class="form-group">
            <label>Ciudad</label>
            <input [(ngModel)]="form.city" placeholder="Bogotá" />
          </div>
        </div>

        <div class="form-group">
          <label>Dirección</label>
          <input [(ngModel)]="form.address" placeholder="Calle 123 # 45-67" />
        </div>

        <div class="form-group">
          <label>URL del logo</label>
          <input [(ngModel)]="form.logoUrl" placeholder="https://..." />
          @if (form.logoUrl) {
            <img [src]="form.logoUrl" alt="Logo" style="margin-top:8px;width:80px;height:80px;object-fit:cover;border-radius:10px;border:1px solid #eee" />
          }
        </div>

        <div class="form-group">
          <label>Instagram</label>
          <input [(ngModel)]="form.instagram" placeholder="@tu_negocio" />
        </div>

        <div style="display:flex;gap:10px;margin-top:8px">
          <button class="btn btn-primary" style="flex:1" (click)="save()" [disabled]="!form.name">
            Guardar cambios
          </button>
          <button class="btn btn-secondary" (click)="reset()">Descartar</button>
        </div>
      </div>
    </div>
  `,
})
export class CompanyProfileComponent {
  saved = signal(false);

  form = {
    name: 'Barbería El Padrino',
    category: 'barberia',
    description: 'Cortes clásicos y arreglo de barba para caballero.',
    phone: '573009876543',
    city: 'Bogotá',
    address: 'Cra 7 # 45-12',
    logoUrl: '',
    instagram: '@elpadrino_barber',
  };

  private original = { ...this.form };

  save() {
    this.original = { ...this.form };
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 3000);
  }

  reset() {
    this.form = { ...this.original };
    this.saved.set(false);
  }
}
