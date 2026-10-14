import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Firestore, arrayRemove, arrayUnion, doc, onSnapshot, updateDoc } from '@angular/fire/firestore';
import { AuthService } from './auth.service';

/** Tope de favoritos (validado también en firestore.rules). */
export const MAX_FAVORITES = 100;

/**
 * Negocios favoritos del cliente ("Mis negocios").
 * Persisten en users/{uid}.favoriteCompanyIds (array). Las reglas sólo aceptan agregar
 * UN id al final (arrayUnion) o quitar (arrayRemove), por eso no se reescribe la lista entera.
 * Singleton: lo comparten la búsqueda, la página del negocio y /cliente/negocios.
 */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private firestore = inject(Firestore);
  private auth      = inject(AuthService);

  private unsub: (() => void) | null = null;
  /** Lo último que confirmó Firestore (para revertir el optimistic UI si falla). */
  private serverIds = signal<string[]>([]);
  private _ids      = signal<string[]>([]);
  private _loaded   = signal(false);

  /** Ids favoritos, en orden de agregado (el más nuevo al final). */
  readonly ids    = this._ids.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly idSet  = computed(() => new Set(this._ids()));
  /** Sólo un cliente logueado puede guardar favoritos. */
  readonly canUse = computed(() => this.auth.isLoggedIn() && this.auth.role() === 'client');

  constructor() {
    effect(() => {
      const uid = this.auth.currentUser()?.uid;
      const isClient = this.canUse();
      this.stop();
      if (!uid || !isClient) return;
      this.unsub = onSnapshot(
        doc(this.firestore, 'users', uid),
        snap => {
          const raw = snap.data()?.['favoriteCompanyIds'];
          const list = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : [];
          this.serverIds.set(list);
          this._ids.set(list);
          this._loaded.set(true);
        },
        err => { console.error('[Favorites] snapshot error', err); this._loaded.set(true); },
      );
    });
  }

  isFavorite(companyId: string | null | undefined): boolean {
    return !!companyId && this.idSet().has(companyId);
  }

  /**
   * Marca/desmarca con optimistic UI. Devuelve false si no se pudo
   * (sin sesión de cliente, tope alcanzado o error de red/reglas: se revierte).
   */
  async toggle(companyId: string): Promise<boolean> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid || !this.canUse() || !companyId) return false;
    const adding = !this.isFavorite(companyId);
    if (adding && this._ids().length >= MAX_FAVORITES) return false;

    this._ids.update(list => adding ? [...list, companyId] : list.filter(id => id !== companyId));
    try {
      await updateDoc(doc(this.firestore, 'users', uid), {
        favoriteCompanyIds: adding ? arrayUnion(companyId) : arrayRemove(companyId),
      });
      return true;
    } catch (err) {
      console.error('[Favorites] toggle error', err);
      this._ids.set(this.serverIds());
      return false;
    }
  }

  private stop(): void {
    this.unsub?.();
    this.unsub = null;
    this.serverIds.set([]);
    this._ids.set([]);
    this._loaded.set(false);
  }
}
