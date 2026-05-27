import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authGuard: CanActivateFn = async () => {
  if (environment.bypassAuth) return true;
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.waitForAuth();
  return auth.isLoggedIn() ? true : router.createUrlTree(['/auth/login']);
};
