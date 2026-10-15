import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { MessageService } from '../../../core/services/message.service';
import { Company, CompanyService } from '../../../core/services/company.service';
import { ReviewService, RatingSummary } from '../../../core/services/review.service';
import { FavoritesService } from '../../../core/services/favorites.service';
import { categoryMeta } from '../../../core/domain/categories';
import { companyLogo } from '../../../core/domain/company-logo';
import {
  AptInteraction, MsgInteraction, RecentEntry, buildRecents, recentLabel,
} from '../../../core/domain/my-businesses';
import { FavoriteHeartComponent } from '../../../shared/components/favorite-heart.component';

interface BizCard {
  company: Company;
  /** Texto de la última interacción (sólo Recientes). */
  note?: string;
}

/**
 * /cliente/negocios — "Mis negocios": favoritos (❤️) + recientes (citas y conversaciones
 * con negocios que no están en favoritos). Los negocios se leen por id de companies/{id};
 * si no es público o no existe se omite. Inactivo: se muestra atenuado ("No recibe reservas").
 */
@Component({
  selector: 'app-my-businesses',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet, FavoriteHeartComponent],
  template: `
    <!-- Hero -->
    <div class="hero" style="margin-bottom:0;padding:32px 20px 28px">
      <div style="position:relative;z-index:1;max-width:760px;margin:0 auto">
        <h1 style="font-size:1.6rem;font-weight:800;margin-bottom:4px;color:white">Mis negocios</h1>
        <p style="font-size:0.95rem;opacity:.85;color:white;margin:0">Tus favoritos y los negocios con los que interactuaste</p>
      </div>
    </div>

    <div class="mb-body">
      <div class="mb-inner">

        <!-- ── Favoritos ── -->
        <section class="mb-section">
          <h2 class="mb-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            Favoritos
            @if (favoriteCards().length) { <span class="mb-count">{{ favoriteCards().length }}</span> }
          </h2>

          @if (!favs.loaded() || favsPending()) {
            <div class="mb-loading"><div class="spinner"></div></div>
          } @else if (favoriteCards().length === 0) {
            <div class="mb-empty">
              <p>Todavía no tienes favoritos. Toca el ❤️ en un negocio para guardarlo aquí.</p>
              <a routerLink="/" class="btn btn-primary btn-sm">Buscar negocios</a>
            </div>
          } @else {
            <div class="mb-grid">
              @for (card of favoriteCards(); track card.company.id) {
                <ng-container *ngTemplateOutlet="bizCard; context: { $implicit: card }" />
              }
            </div>
          }
        </section>

        <!-- ── Recientes ── -->
        <section class="mb-section">
          <h2 class="mb-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Recientes
          </h2>

          @if (loadingActivity() || recentsPending()) {
            <div class="mb-loading"><div class="spinner"></div></div>
          } @else if (activityError()) {
            <div class="mb-empty"><p>No pudimos cargar tu actividad. Verifica tu conexión.</p></div>
          } @else if (recentCards().length === 0) {
            <div class="mb-empty">
              <p>Aquí vas a ver los negocios donde reservaste o con los que conversaste.</p>
            </div>
          } @else {
            <div class="mb-grid">
              @for (card of recentCards(); track card.company.id) {
                <ng-container *ngTemplateOutlet="bizCard; context: { $implicit: card }" />
              }
            </div>
          }
        </section>

      </div>
    </div>

    <ng-template #bizCard let-card>
      <article class="biz" [class.biz--off]="!card.company.isActive">
        <div class="biz-top">
          <div class="biz-logo" [style.background]="card.company.logoUrl ? 'transparent' : color(card.company) + '22'"
               [style.color]="color(card.company)">
            @if (card.company.logoUrl) {
              <img [src]="card.company.logoUrl" alt="" />
            } @else {
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path [attr.d]="logoIcon(card.company)"/></svg>
            }
          </div>
          <div class="biz-info">
            <h3 class="biz-name">{{ card.company.name }}</h3>
            <p class="biz-meta">
              <span [style.color]="color(card.company)">{{ meta(card.company.category).label }}</span>
              @if (card.company.city) { <span> · {{ card.company.city }}</span> }
            </p>
            @if (rating(card.company.id); as r) {
              <p class="biz-rating">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <strong>{{ r.average }}</strong> <span>({{ r.count }})</span>
              </p>
            }
          </div>
          <app-favorite-heart [companyId]="card.company.id!" [size]="36" />
        </div>

        @if (!card.company.isActive) {
          <span class="badge badge-gray biz-off-badge">No recibe reservas</span>
        }
        @if (card.note) { <p class="biz-note">{{ card.note }}</p> }

        <a [routerLink]="['/negocio', card.company.id]" class="btn btn-sm biz-cta"
           [class.btn-primary]="card.company.isActive" [class.btn-outline]="!card.company.isActive">
          {{ card.company.isActive ? 'Reservar' : 'Ver contacto' }}
        </a>
      </article>
    </ng-template>
  `,
  styles: [`
    :host { display: block; }
    .mb-body {
      background: #f0f7ff;
      min-height: calc(100vh - 64px - 88px);
      padding: 24px 16px 40px;
    }
    .mb-inner { max-width: 760px; margin: 0 auto; min-width: 0; }
    .mb-section { margin-bottom: 28px; min-width: 0; }
    .mb-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 1.05rem; font-weight: 800; color: #1a1a2e; margin: 0 0 12px;
    }
    .mb-count {
      font-size: 12px; font-weight: 800; color: var(--purple); background: #ede9fe;
      border-radius: 20px; padding: 1px 8px;
    }
    .mb-loading { display: flex; justify-content: center; padding: 28px; }
    .mb-empty {
      background: white; border-radius: 16px; padding: 28px 20px; text-align: center;
      color: #6b7280; font-size: 14px; line-height: 1.55;
      display: flex; flex-direction: column; align-items: center; gap: 14px;
      box-shadow: 0 2px 12px rgba(124,58,237,.06);
    }
    .mb-empty p { margin: 0; max-width: 360px; }

    .mb-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
    @media (min-width: 640px) { .mb-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

    .biz {
      min-width: 0; background: white; border-radius: 16px; padding: 14px;
      box-shadow: 0 2px 12px rgba(124,58,237,.07);
      display: flex; flex-direction: column; gap: 10px;
    }
    .biz--off .biz-top, .biz--off .biz-note { opacity: .55; }
    .biz-top { display: flex; align-items: flex-start; gap: 12px; min-width: 0; }
    .biz-logo {
      width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
    }
    .biz-logo img { width: 100%; height: 100%; object-fit: cover; }
    .biz-info { flex: 1; min-width: 0; }
    .biz-name {
      font-size: 15px; font-weight: 800; color: #1a1a2e; margin: 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .biz-meta {
      font-size: 12px; font-weight: 600; color: #888; margin: 2px 0 0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .biz-rating { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #374151; margin: 4px 0 0; }
    .biz-rating span { color: #aaa; }
    .biz-off-badge { align-self: flex-start; }
    .biz-note { font-size: 12.5px; color: #6b7280; margin: 0; }
    .biz-cta { text-align: center; justify-content: center; }

    .spinner {
      width: 28px; height: 28px;
      border: 3px solid #ede9fe; border-top-color: var(--purple); border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class MyBusinessesComponent {
  private auth       = inject(AuthService);
  private aptSvc     = inject(AppointmentService);
  private msgSvc     = inject(MessageService);
  private companySvc = inject(CompanyService);
  private reviewSvc  = inject(ReviewService);
  readonly favs      = inject(FavoritesService);

  private aptActivity = signal<AptInteraction[]>([]);
  private msgActivity = signal<MsgInteraction[]>([]);
  loadingActivity     = signal(true);
  activityError       = signal(false);

  /** companyId -> negocio (null = no existe / no es público / error de lectura). */
  private companies = signal<ReadonlyMap<string, Company | null>>(new Map());
  private ratings   = signal<ReadonlyMap<string, RatingSummary>>(new Map());
  private requested = new Set<string>();

  /** Recientes (ids) sin los favoritos: si se quita un favorito con actividad, vuelve acá. */
  private recentEntries = computed<RecentEntry[]>(() =>
    buildRecents(this.aptActivity(), this.msgActivity(), this.favs.idSet())
  );

  /** Favoritos, el último agregado primero. */
  favoriteCards = computed<BizCard[]>(() => {
    const map = this.companies();
    return [...this.favs.ids()].reverse()
      .map(id => map.get(id))
      .filter((c): c is Company => !!c)
      .map(company => ({ company }));
  });

  recentCards = computed<BizCard[]>(() => {
    const map = this.companies();
    const now = new Date();
    return this.recentEntries()
      .map(e => ({ e, company: map.get(e.companyId) }))
      .filter((x): x is { e: RecentEntry; company: Company } => !!x.company)
      .map(({ e, company }) => ({ company, note: recentLabel(e, now) }));
  });

  /** Hay ids todavía sin resolver (evita el "vacío" mientras se leen los negocios). */
  favsPending    = computed(() => this.favs.ids().some(id => !this.companies().has(id)));
  recentsPending = computed(() => this.recentEntries().some(e => !this.companies().has(e.companyId)));

  constructor() {
    this.loadActivity();

    // Lee por id los negocios que hagan falta (favoritos + recientes), una sola vez cada uno
    effect(() => {
      const ids = [...this.favs.ids(), ...this.recentEntries().map(e => e.companyId)];
      untracked(() => ids.filter(id => !this.requested.has(id)).forEach(id => this.fetchCompany(id)));
    });
  }

  meta(cat: string) { return categoryMeta(cat); }
  color(c: Company): string { return companyLogo(c).color; }
  /** Ícono elegido por el negocio (o el del rubro si no eligió nada). */
  logoIcon(c: Company): string { return companyLogo(c).iconPath; }
  rating(id: string | undefined): RatingSummary | null {
    const r = id ? this.ratings().get(id) : undefined;
    return r && r.count > 0 ? r : null;
  }

  private async loadActivity() {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) { this.loadingActivity.set(false); return; }
    try {
      // Misma consulta que "Mis citas" (clientId == uid) y que /cliente/mensajes
      const [apts, msgs] = await Promise.all([
        this.aptSvc.getByClient(uid),
        firstValueFrom(this.msgSvc.watchByClient(uid)),
      ]);
      this.aptActivity.set(apts.map(a => ({
        companyId: a.companyId, date: a.date, startTime: a.startTime, hiddenByClient: a.hiddenByClient,
      })));
      this.msgActivity.set(msgs.map(m => ({
        companyId: m.companyId,
        at: typeof m.createdAt?.toMillis === 'function' ? m.createdAt.toMillis() : null,
      })));
    } catch (err) {
      console.error('[MyBusinesses] activity error', err);
      this.activityError.set(true);
    } finally {
      this.loadingActivity.set(false);
    }
  }

  private async fetchCompany(id: string) {
    this.requested.add(id);
    let company: Company | null = null;
    try {
      company = await this.companySvc.getCompany(id);
    } catch {
      company = null; // no público (reglas) o error: se omite sin romper
    }
    this.companies.update(m => new Map(m).set(id, company));
    if (company) {
      this.reviewSvc.getRatingSummary(id)
        .then(r => this.ratings.update(m => new Map(m).set(id, r)))
        .catch(() => { /* sin rating: se muestra igual */ });
    }
  }
}
