/**
 * Tripwire de seguridad: el build de producción nunca puede salir con flags de desarrollo
 * ni apuntando al sandbox de Wompi.
 */
import { environment as prod } from '../../../environments/environment.prod';
import { environment as dev } from '../../../environments/environment';
import { canRegisterPayments, wompiEnvFromApiUrl, wompiEnvFromKey } from './payment-origin';

describe('environment.prod.ts', () => {
  it('sin bypass de auth ni emuladores', () => {
    expect(prod.production).toBe(true);
    expect(prod.bypassAuth).toBe(false);
    expect(prod.useEmulators).toBe(false);
  });

  it('Wompi REAL: API y llave de producción', () => {
    expect(wompiEnvFromApiUrl(prod.wompi.apiUrl)).toBe('production');
    expect(wompiEnvFromKey(prod.wompiPublicKey)).toBe('production');
  });

  it('ninguna llave privada/de integridad en el bundle', () => {
    const all = JSON.stringify({ prod, dev });
    expect(all).not.toMatch(/prv_(prod|test)_|prod_integrity_|test_integrity_|prod_events_|test_events_/);
  });
});

describe('environment.ts (ng serve)', () => {
  it('sandbox: no puede registrar pagos contra la base real', () => {
    expect(dev.bypassAuth).toBe(false);
    expect(wompiEnvFromApiUrl(dev.wompi.apiUrl)).toBe('sandbox');
    if (!dev.useEmulators) expect(canRegisterPayments(dev)).toBe(false);
  });
});
