import { Injectable, computed, inject, signal } from '@angular/core';
import { Firestore, doc, onSnapshot, serverTimestamp, setDoc } from '@angular/fire/firestore';
import { environment } from '../../../environments/environment';
import {
  AppConfig, DEFAULT_APP_CONFIG, checkoutLink, mergeAppConfig, planCatalog, timelineOptions,
} from '../domain/app-config';
import { PlanKey } from '../domain/plans';

/**
 * Configuración global (doc config/app) en vivo. Mientras no llega el primer snapshot,
 * o si el doc no existe, `config()` devuelve los defaults (= valores históricos del código).
 * La edita el superadmin desde Configuración.
 */
@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private firestore = inject(Firestore);
  private readonly ref = doc(this.firestore, 'config', 'app');

  private readonly _config = signal<AppConfig>(DEFAULT_APP_CONFIG);
  readonly config = this._config.asReadonly();
  /** true cuando llegó el primer snapshot (o falló: se quedan los defaults). */
  readonly loaded = signal(false);

  /** Catálogo de planes con monto/días configurados (para planFromAmount, nextPeriodEnd…). */
  readonly plans = computed(() => planCatalog(this._config()));
  /** { warningDays, graceDays } para subscriptionTimeline / graceEndOf. */
  readonly timeline = computed(() => timelineOptions(this._config()));

  private resolveReady!: () => void;
  private readonly readyPromise = new Promise<void>(r => (this.resolveReady = r));

  constructor() {
    onSnapshot(
      this.ref,
      (snap) => {
        this._config.set(mergeAppConfig(snap.exists() ? snap.data() : null));
        this.markLoaded();
      },
      (err) => {
        console.error('[AppConfigService] Error leyendo config/app, se usan los defaults:', err);
        this.markLoaded();
      },
    );
  }

  /** Espera el primer snapshot (máx. `ms`); después sigue con lo que haya (defaults si no llegó). */
  ready(ms = 3000): Promise<void> {
    return Promise.race([this.readyPromise, new Promise<void>(r => setTimeout(r, ms))]);
  }

  /** Link de pago del plan: el real en producción, el de pruebas (sandbox) en `ng serve`. */
  checkoutLink(key: PlanKey): string {
    return checkoutLink(this._config(), key, environment.production);
  }

  /** (Solo superadmin) Guarda una o más secciones con merge (no pisa las demás). */
  async save(patch: Partial<AppConfig>): Promise<void> {
    await setDoc(this.ref, { ...patch, updatedAt: serverTimestamp() }, { merge: true });
  }

  private markLoaded(): void {
    if (this.loaded()) return;
    this.loaded.set(true);
    this.resolveReady();
  }
}
