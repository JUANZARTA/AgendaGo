import { Injectable, computed, signal } from '@angular/core';

/**
 * Instalación de la PWA. Chrome/Edge disparan `beforeinstallprompt` UNA vez por carga: se guarda acá
 * para que lo usen tanto el aviso automático (app.html) como el botón fijo "Instalar app".
 * iOS no tiene prompt: sólo se pueden mostrar instrucciones (Compartir → Agregar a inicio).
 */
@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private deferredPrompt: any = null;

  /** El navegador ofreció instalar (hay prompt guardado). */
  readonly canPrompt = signal(false);
  /** Ya corre instalada (pantalla de inicio / app de escritorio). */
  readonly installed = signal(false);
  readonly isIos = signal(false);

  /** Mostrar el botón: no instalada. (Sin prompt ni iOS se muestran instrucciones manuales.) */
  readonly available = computed(() => !this.installed());

  constructor() {
    if (typeof window === 'undefined') return;
    this.installed.set(
      window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true,
    );
    this.isIos.set(
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    );
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.canPrompt.set(true);
    });
    window.addEventListener('appinstalled', () => {
      this.installed.set(true);
      this.canPrompt.set(false);
      this.deferredPrompt = null;
    });
  }

  /** Abre el diálogo nativo de instalación. Devuelve true si el usuario aceptó. */
  async prompt(): Promise<boolean> {
    if (!this.deferredPrompt) return false;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    // El evento sólo sirve una vez
    this.deferredPrompt = null;
    this.canPrompt.set(false);
    if (outcome === 'accepted') this.installed.set(true);
    return outcome === 'accepted';
  }
}
