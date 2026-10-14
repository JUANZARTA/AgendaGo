import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

/** Panel de inicio de cada rol (a dónde se manda a alguien que entró a una zona que no es suya). */
export function homeForRole(router: Router, role: string, loggedIn: boolean): UrlTree {
  if (role === 'company')    return router.createUrlTree(['/empresa/dashboard']);
  if (role === 'superadmin') return router.createUrlTree(['/admin']);
  if (role === 'client' || !loggedIn) return router.createUrlTree(['/']);
  // Logueado pero sin rol (no se pudo leer el perfil): al login, que reintenta y redirige por rol
  return router.createUrlTree(['/auth/login']);
}

export const roleGuard = (allowedRoles: string[]): CanActivateFn => async () => {
  if (environment.bypassAuth) return true;
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.waitForAuth();
  if (allowedRoles.includes(auth.role())) return true;
  // Antes: siempre a '/' (la búsqueda de clientes), aunque fuera una empresa logueada
  return homeForRole(router, auth.role(), auth.isLoggedIn());
};

/**
 * Búsqueda pública ('/'): es la vista del cliente. Una empresa o el admin logueados van a su panel.
 * (La página de cada negocio y los legales siguen abiertos para todos.)
 */
export const clientHomeGuard: CanActivateFn = async () => {
  if (environment.bypassAuth) return true;
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.waitForAuth();
  const role = auth.role();
  return role === 'company' || role === 'superadmin' ? homeForRole(router, role, true) : true;
};
