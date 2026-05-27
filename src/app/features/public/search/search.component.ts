import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicNavComponent } from '../../../shared/components/public-nav.component';
import { Company, CompanyService } from '../../../core/services/company.service';
import { AuthService } from '../../../core/services/auth.service';

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
  const now   = new Date();
  const key   = DAY_KEYS[now.getDay()];
  const sched = c.schedule.find(d => d.key === key);
  if (!sched?.enabled || !sched.ranges?.length) return 0;
  const interval = c.slotInterval ?? 30;
  const nowMin   = now.getHours() * 60 + now.getMinutes();
  let count = 0;
  for (const range of sched.ranges) {
    const open  = toMin(range.open);
    const close = toMin(range.close);
    for (let cur = open; cur + interval <= close; cur += interval) {
      if (cur >= nowMin) count++;
    }
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

    @media (max-width: 768px) {
      h1 { font-size: clamp(1.5rem, 5vw, 2.4rem) !important; }
      :host { padding-bottom: 68px; }
      .client-sidebar { display: none !important; }
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
        <div style="display:flex;gap:12px;align-items:stretch;width:100%;max-width:700px">
          <div style="background:white;border-radius:14px;padding:6px;display:flex;gap:8px;flex:1;box-shadow:0 4px 24px rgba(0,0,0,.15)">
            <input [ngModel]="search()" (ngModelChange)="search.set($event)" placeholder="¿Qué negocio buscás?"
              style="flex:1;padding:10px 14px;border:none;outline:none;font-size:15px;border-radius:10px;color:#222;min-width:0" />
            <button class="btn btn-primary btn-sm" style="white-space:nowrap">Buscar</button>
          </div>
          @if (isAuthClient()) {
            <a routerLink="/cliente/citas" class="client-sidebar"
               style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
                      padding:10px 20px;background:rgba(255,255,255,.18);backdrop-filter:blur(8px);
                      border:1.5px solid rgba(255,255,255,.45);border-radius:14px;
                      text-decoration:none;flex-shrink:0;transition:background .2s;white-space:nowrap"
               onmouseover="this.style.background='rgba(255,255,255,.28)'"
               onmouseout="this.style.background='rgba(255,255,255,.18)'">
              <div style="width:36px;height:36px;border-radius:10px;background:white;
                          display:flex;align-items:center;justify-content:center;
                          box-shadow:0 4px 12px rgba(0,0,0,.12)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <span style="font-size:12px;font-weight:800;color:white">Mis citas</span>
            </a>
          }
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

      <!-- Filtro por ciudad -->
      @if (cities().length > 0) {
        <div style="margin-bottom:20px">
          <select [ngModel]="city()" (ngModelChange)="city.set($event)"
            style="padding:10px 14px;border:1.5px solid var(--form-border);border-radius:10px;
                   font-size:14px;font-family:inherit;color:var(--purple);font-weight:600;
                   background:white;cursor:pointer;outline:none;min-width:180px">
            <option value="">Todas las ciudades</option>
            @for (c of cities(); track c) {
              <option [value]="c">{{ c }}</option>
            }
          </select>
        </div>
      }

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

              <div style="display:flex;align-items:center;gap:6px;margin-bottom:16px">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span style="font-weight:700;font-size:13px">{{ company.rating }}</span>
                @if (company.reviewCount > 0) {
                  <span style="font-size:12px;color:#aaa">({{ company.reviewCount }})</span>
                } @else {
                  <span style="font-size:12px;color:#bbb">· Nuevo</span>
                }
                <a [routerLink]="['/negocio', company.id, 'resenas']"
                   style="margin-left:auto;display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:var(--purple);text-decoration:none;padding:3px 8px;border-radius:8px;background:#f5f0ff"
                   title="Ver reseñas">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  Reseñas
                </a>
              </div>

              <div style="display:flex;gap:8px">
                <a [routerLink]="['/negocio', company.id]" class="btn btn-primary btn-sm" style="flex:1">
                  Ver y agendar
                </a>
                @if (company.phone) {
                  <a [href]="'https://wa.me/' + company.phone" target="_blank"
                     class="btn btn-sm" style="background:#25d366;color:white;box-shadow:0 4px 12px rgba(37,211,102,.3);display:inline-flex;align-items:center;justify-content:center;min-width:40px;flex-shrink:0"
                     title="WhatsApp">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
                }
                @if (isAuthClient()) {
                  <a [routerLink]="['/cliente/mensajes']" [queryParams]="{companyId: company.id, companyName: company.name}"
                     class="btn btn-sm" style="background:var(--gradient);color:white;box-shadow:0 4px 12px rgba(var(--primary-rgb),.3);display:inline-flex;align-items:center;justify-content:center;min-width:40px;flex-shrink:0"
                     title="Enviar mensaje">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
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
            <button class="btn btn-outline btn-sm" style="margin-top:16px" (click)="search.set('');category.set('');city.set('')">Limpiar filtros</button>
          </div>
        }
      </div>
    </div>
  `,
})
export class SearchComponent implements OnInit {
  private companySvc = inject(CompanyService);
  readonly auth      = inject(AuthService);

  isAuthClient = computed(() => this.auth.isLoggedIn() && this.auth.role() === 'client');

  search     = signal('');
  category   = signal('');
  city       = signal('');
  categories = CATEGORIES;
  companies  = signal<DisplayCompany[]>([]);
  loading    = signal(true);

  cities = computed(() => {
    const all = this.companies()
      .map(c => c.city)
      .filter((c): c is string => !!c);
    return [...new Set(all)].sort();
  });

  filtered = computed(() => {
    const s   = this.search().toLowerCase();
    const cat = this.category();
    const cty = this.city();
    return this.companies().filter(c => {
      const matchName = c.name.toLowerCase().includes(s) || c.description.toLowerCase().includes(s);
      const matchCat  = cat ? c.category === cat : true;
      const matchCity = cty ? c.city === cty : true;
      return matchName && matchCat && matchCity;
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
