import { Injector, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, firstValueFrom, timeout } from 'rxjs';
import { SubscriptionService } from '../services/subscription.service';
import { CompanyStore } from '../services/company-store.service';
import { AppConfigService } from '../services/app-config.service';
import { canUseApp, subscriptionTimeline } from '../domain/subscription-timeline';

export const subscriptionGuard: CanActivateFn = async () => {
  // Capturar dependencias en el contexto de inyección, antes de cualquier await
  const subService = inject(SubscriptionService);
  const companyStore = inject(CompanyStore);
  const router = inject(Router);
  const appConfig = inject(AppConfigService);
  const injector = inject(Injector);

  let companyId = companyStore.companyId();
  if (!companyId && companyStore.loading()) {
    try {
      // Esperar a que el store termine de cargar (máx. 3s para no colgar la navegación)
      await firstValueFrom(
        toObservable(companyStore.loading, { injector }).pipe(
          filter(loading => !loading),
          timeout({ first: 3000 }),
        ),
      );
    } catch {
      console.warn('[subscriptionGuard] Timeout esperando CompanyStore');
    }
    companyId = companyStore.companyId();
  }

  if (!companyId) return true;

  try {
    let [sub] = await Promise.all([subService.getStatus(companyId), appConfig.ready()]);
    // Sin doc: antes de bloquear se confirma contra el servidor (no una caché vieja / un snapshot que
    // todavía no llegó justo después del alta). La empresa y su suscripción se crean en la misma
    // transacción, así que una empresa recién creada SIEMPRE la tiene.
    if (!sub) sub = await subService.getStatus(companyId, true);
    // Sin suscripción (requiere pago), vencida, deshabilitada o pasada la gracia (aunque el admin aún no la marcó)
    if (!canUseApp(subscriptionTimeline(sub, new Date(), appConfig.timeline()))) {
      router.navigate(['/empresa/facturacion']);
      return false;
    }
  } catch (err) {
    // Red/Firestore error — permitir acceso para no bloquear al usuario
    console.warn('[subscriptionGuard] Error consultando suscripción, se permite el acceso:', err);
  }
  return true;
};
