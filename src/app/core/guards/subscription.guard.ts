import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SubscriptionService } from '../services/subscription.service';
import { CompanyStore } from '../services/company-store.service';

export const subscriptionGuard: CanActivateFn = async () => {
  const subService = inject(SubscriptionService);
  const companyStore = inject(CompanyStore);
  const router = inject(Router);

  let companyId = companyStore.companyId();
  if (!companyId) {
    await new Promise<void>((resolve) => {
      let attempts = 0;
      const interval = setInterval(() => {
        companyId = companyStore.companyId();
        attempts++;
        if (companyId || attempts >= 60) { clearInterval(interval); resolve(); }
      }, 50);
    });
  }

  if (!companyId) return true;

  try {
    const sub = await subService.getStatus(companyId);
    if (sub && (sub.status === 'expired' || sub.status === 'disabled')) {
      router.navigate(['/empresa/facturacion']);
      return false;
    }
  } catch {
    // Red/Firestore error — permitir acceso para no bloquear al usuario
  }
  return true;
};
