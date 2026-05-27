import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => async () => {
  if (environment.bypassAuth) return true;
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.waitForAuth();
  return allowedRoles.includes(auth.role()) ? true : router.createUrlTree(['/']);
};
