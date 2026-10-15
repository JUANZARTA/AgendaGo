import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FavoritesService, MAX_FAVORITES } from '../../core/services/favorites.service';

/**
 * Corazón de favoritos (outline / relleno rojo).
 * - Cliente logueado: marca/desmarca al toque (optimistic UI).
 * - Sin sesión: lleva al login (los favoritos son de la cuenta).
 * - Empresa / admin: no se muestra.
 */
@Component({
  selector: 'app-favorite-heart',
  standalone: true,
  styles: [`
    :host { display: inline-flex; flex-shrink: 0; }
    .fav-btn {
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: 50%; border: 1.5px solid #f1e4ec; background: white; cursor: pointer;
      color: #9ca3af; padding: 0; font-family: inherit;
      box-shadow: 0 2px 8px rgba(0,0,0,.06);
      transition: transform .15s, color .15s, border-color .15s;
    }
    .fav-btn:hover { color: #ef4444; border-color: #fecaca; }
    .fav-btn:active { transform: scale(.9); }
    .fav-btn--on { color: #ef4444; border-color: #fecaca; background: #fff5f5; }
    .fav-btn--pop svg { animation: fav-pop .3s ease; }
    @keyframes fav-pop { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
  `],
  template: `
    @if (visible()) {
      <button type="button" class="fav-btn" [class.fav-btn--on]="isFav()" [class.fav-btn--pop]="pop()"
              [style.width.px]="size()" [style.height.px]="size()"
              [attr.aria-pressed]="isFav()" [attr.aria-label]="label()" [title]="label()"
              (click)="onClick($event)">
        <svg [attr.width]="iconSize()" [attr.height]="iconSize()" viewBox="0 0 24 24"
             [attr.fill]="isFav() ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
    }
  `,
})
export class FavoriteHeartComponent {
  private auth   = inject(AuthService);
  private favs   = inject(FavoritesService);
  private router = inject(Router);

  companyId = input.required<string>();
  size      = input<number>(36);

  pop = signal(false);

  /** Visible para clientes y visitantes; nunca para empresas / superadmin. */
  visible  = computed(() => !this.auth.isLoggedIn() || this.auth.role() === 'client');
  isFav    = computed(() => this.favs.idSet().has(this.companyId()));
  iconSize = computed(() => Math.round(this.size() * 0.5));
  label    = computed(() => !this.auth.isLoggedIn()
    ? 'Inicia sesión para guardar favoritos'
    : this.isFav() ? 'Quitar de favoritos' : 'Guardar en favoritos');

  async onClick(ev: Event) {
    ev.preventDefault();
    ev.stopPropagation();
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    const adding = !this.isFav();
    if (adding) { this.pop.set(true); setTimeout(() => this.pop.set(false), 320); }
    const ok = await this.favs.toggle(this.companyId());
    if (!ok && adding && this.favs.ids().length >= MAX_FAVORITES) {
      alert(`Llegaste al máximo de ${MAX_FAVORITES} favoritos. Quita alguno para agregar otro.`);
    }
  }
}
