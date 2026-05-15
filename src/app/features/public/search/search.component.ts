import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicNavComponent } from '../../../shared/components/public-nav.component';
import { Company, CompanyService } from '../../../core/services/company.service';

interface DisplayCompany {
  id: string;
  name: string;
  category: string;
  description: string;
  phone: string;
  city?: string;
  rating: number;
  reviewCount: number;
  slots: number;
  logoUrl?: string;
  logoColor: string;
}

const DAY_KEYS = ['dom','lun','mar','mie','jue','vie','sab'];

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function countTodaySlots(c: Company): number {
  if (!c.schedule?.length) return 0;
  const key   = DAY_KEYS[new Date().getDay()];
  const sched = c.schedule.find(d => d.key === key);
  if (!sched?.enabled || !sched.ranges?.length) return 0;
  const interval = c.slotInterval ?? 30;
  let count = 0;
  for (const range of sched.ranges) {
    const open  = toMin(range.open);
    const close = toMin(range.close);
    for (let cur = open; cur + interval <= close; cur += interval) count++;
  }
  return count;
}

function toDisplay(c: Company): DisplayCompany {
  return {
    id:          c.id!,
    name:        c.name,
    category:    c.category,
    description: c.description ?? '',
    phone:       c.phone ?? '',
    city:        c.city,
    rating:      c.averageRating ?? 5,
    reviewCount: c.reviewCount ?? 0,
    slots:       countTodaySlots(c),
    logoUrl:     c.logoUrl,
    logoColor:   c.logoColor ?? CATEGORY_META[c.category]?.color ?? '#7c3aed',
  };
}

const SVG_SCISSORS = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><line x1="18" y1="9" x2="18" y2="21"/><line x1="18" y1="3" x2="6" y2="15"/></svg>`;
const SVG_SCISSORS_SM = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><line x1="18" y1="9" x2="18" y2="21"/><line x1="18" y1="3" x2="6" y2="15"/></svg>`;
const SVG_SEARCH_SM = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
const SVG_SEARCH_LG = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
const SVG_MSG_SM = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;

const CATEGORY_META: Record<string, { label: string; svg: string; color: string }> = {
  salon:     { label: 'Salón de belleza', svg: SVG_SCISSORS, color: '#f43f5e' },
  barberia:  { label: 'Barbería',         svg: SVG_SCISSORS, color: '#7c3aed' },
  spa:       { label: 'Spa',              svg: SVG_SCISSORS, color: '#10b981' },
  peluqueria:{ label: 'Peluquería',       svg: SVG_SCISSORS, color: '#f59e0b' },
};

const CATEGORIES = [
  { value: '',          label: 'Todas',         svg: SVG_SCISSORS_SM },
  { value: 'salon',     label: 'Salones',        svg: SVG_SCISSORS_SM },
  { value: 'barberia',  label: 'Barberías',      svg: SVG_SCISSORS_SM },
  { value: 'spa',       label: 'Spas',           svg: SVG_SCISSORS_SM },
  { value: 'peluqueria',label: 'Peluquerías',    svg: SVG_SCISSORS_SM },
];

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PublicNavComponent],
  styles: [`
    :host { display: block; }

    @media (max-width: 640px) {
      h1 { font-size: clamp(1.5rem, 5vw, 2.4rem) !important; }
    }

    @media (max-width: 480px) {
      .page { padding-top: 0 !important; }
    }
  `],
  template: `
    <app-public-nav />

    <!-- Hero -->
    <div class="hero" style="margin-bottom:28px">
      <div style="position:relative;z-index:1;text-align:center;display:flex;flex-direction:column;align-items:center">
        <h1 style="font-size:clamp(1.6rem, 5vw, 2.4rem);font-weight:800;margin-bottom:10px;line-height:1.2">
          Tu cita en segundos
        </h1>
        <p style="font-size:1rem;opacity:.88;margin-bottom:28px;max-width:480px">
          Salones, barberías, spas y más. Sin llamadas, sin esperas.
        </p>

        <!-- Buscador en hero -->
        <div style="background:white;border-radius:14px;padding:6px;display:flex;gap:8px;width:100%;max-width:540px;box-shadow:0 4px 24px rgba(0,0,0,.15)">
          <input [ngModel]="search()" (ngModelChange)="search.set($event)" placeholder="¿Qué negocio buscás?"
            style="flex:1;padding:10px 14px;border:none;outline:none;font-size:15px;border-radius:10px;color:#222;min-width:0" />
          <button class="btn btn-primary btn-sm" style="white-space:nowrap">Buscar</button>
        </div>
      </div>
    </div>

    <div class="page" style="padding-top:0">
      <!-- Filtros por categoría -->
      <div style="display:flex;gap:10px;margin-bottom:24px;flex-wrap:wrap">
        @for (cat of categories; track cat.value) {
          <button (click)="category.set(cat.value)"
            class="btn btn-sm"
            [style.background]="category() === cat.value ? 'var(--gradient)' : 'white'"
            [style.color]="category() === cat.value ? 'white' : 'var(--purple)'"
            [style.boxShadow]="category() === cat.value ? '0 4px 14px rgba(var(--primary-rgb),.35)' : '0 2px 8px rgba(0,0,0,.06)'"
            style="border:1.5px solid var(--form-border);font-weight:700;display:inline-flex;align-items:center;gap:6px">
            <span style="display:inline-flex;align-items:center;flex-shrink:0" [innerHTML]="cat.svg"></span> {{ cat.label }}
          </button>
        }
      </div>

      <!-- Stats rápidos -->
      <div style="display:flex;gap:10px;margin-bottom:28px;flex-wrap:wrap">
        <div style="background:white;border-radius:12px;padding:12px 20px;box-shadow:0 2px 12px rgba(var(--primary-rgb),.08);flex:1;min-width:120px;text-align:center">
          <div style="font-size:1.6rem;font-weight:800;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent">{{ totalSlots() }}</div>
          <div style="font-size:12px;color:#888;margin-top:2px">turnos disponibles</div>
        </div>
        <div style="background:white;border-radius:12px;padding:12px 20px;box-shadow:0 2px 12px rgba(var(--primary-rgb),.08);flex:1;min-width:120px;text-align:center">
          <div style="font-size:1.6rem;font-weight:800;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent">{{ filtered().length }}</div>
          <div style="font-size:12px;color:#888;margin-top:2px">negocios encontrados</div>
        </div>
      </div>

      <!-- Grid de empresas -->
      <div class="grid-2">
        @for (company of filtered(); track company.id) {
          <div class="card" style="cursor:pointer;transition:all .2s;border-top:4px solid {{ meta(company.category).color }};padding:0;overflow:hidden">
            <!-- Header de la card -->
            <div [style.background]="meta(company.category).color + '15'" style="padding:18px 20px 14px">
              <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div style="width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0"
                     [style.background]="company.logoUrl ? 'transparent' : company.logoColor + '22'"
                     [style.color]="company.logoColor">
                  @if (company.logoUrl) {
                    <img [src]="company.logoUrl" alt="logo"
                         style="width:100%;height:100%;object-fit:cover;border-radius:14px" />
                  } @else {
                    <span [innerHTML]="meta(company.category).svg"></span>
                  }
                </div>
                <span class="badge" [class]="company.slots > 0 ? 'badge-green' : 'badge-red'">
                  {{ company.slots > 0 ? company.slots + ' turnos' : 'Sin turnos' }}
                </span>
              </div>
              <h3 style="margin-top:12px;font-size:1.05rem;font-weight:800">{{ company.name }}</h3>
              <p style="font-size:12px;font-weight:600;margin-top:2px" [style.color]="meta(company.category).color">
                {{ meta(company.category).label }}
              </p>
            </div>

            <!-- Body -->
            <div style="padding:14px 20px 18px">
              <p style="color:#666;font-size:13px;line-height:1.55;margin-bottom:14px">{{ company.description }}</p>

              <div style="display:flex;align-items:center;gap:6px;margin-bottom:14px">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span style="font-weight:700;font-size:13px">{{ company.rating }}</span>
                @if (company.reviewCount > 0) {
                  <span style="font-size:12px;color:#aaa">({{ company.reviewCount }})</span>
                } @else {
                  <span style="font-size:12px;color:#bbb">· Nuevo</span>
                }
              </div>

              <div style="display:flex;gap:8px">
                <a [routerLink]="['/negocio', company.id]" class="btn btn-primary btn-sm" style="flex:1">
                  Ver y agendar
                </a>
                @if (company.phone) {
                  <a [href]="'https://wa.me/' + company.phone" target="_blank"
                     class="btn btn-sm" style="background:#25d366;color:white;box-shadow:0 4px 12px rgba(37,211,102,.3);display:inline-flex;align-items:center;justify-content:center;min-width:40px;flex-shrink:0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </a>
                }
              </div>
            </div>
          </div>
        }

        @if (filtered().length === 0) {
          <div style="grid-column:1/-1;text-align:center;padding:56px;color:#aaa">
            <div style="display:flex;justify-content:center;margin-bottom:14px"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
            <p style="font-size:1.1rem;color:#888">No encontramos negocios con esos filtros.</p>
            <button class="btn btn-outline btn-sm" style="margin-top:16px" (click)="search.set('');category.set('')">Limpiar filtros</button>
          </div>
        }
      </div>
    </div>
  `,
})
export class SearchComponent implements OnInit {
  private companySvc = inject(CompanyService);

  search     = signal('');
  category   = signal('');
  categories = CATEGORIES;
  companies  = signal<DisplayCompany[]>([]);
  loading    = signal(true);

  filtered = computed(() => {
    const s   = this.search().toLowerCase();
    const cat = this.category();
    return this.companies().filter(c => {
      const matchName = c.name.toLowerCase().includes(s) || c.description.toLowerCase().includes(s);
      const matchCat  = cat ? c.category === cat : true;
      return matchName && matchCat;
    });
  });

  totalSlots = computed(() => this.filtered().reduce((sum, c) => sum + c.slots, 0));

  async ngOnInit() {
    try {
      const list = await this.companySvc.searchCompanies('');
      this.companies.set(list.map(toDisplay));
    } finally {
      this.loading.set(false);
    }
  }

  meta(cat: string) { return CATEGORY_META[cat] ?? { label: 'Negocio', svg: SVG_SCISSORS, color: '#7c3aed' }; }
}
