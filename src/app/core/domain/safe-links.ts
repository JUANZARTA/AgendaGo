/**
 * Links armados con datos de usuario (notificaciones, perfil de la empresa, config/app). PURO.
 * Angular ya neutraliza `javascript:` en [href], pero esto además evita redirecciones a sitios
 * ajenos (phishing) y navegar a rutas raras desde una notificación que pudo escribir otro usuario.
 */
import { wompiPaymentLinkId } from './app-config';

/** Ruta interna segura para router.navigateByUrl ("/algo"), o null. Rechaza "//host", "/\host" y esquemas. */
export function safeInternalPath(link: string | null | undefined): string | null {
  const l = (link ?? '').trim();
  if (!l.startsWith('/') || l.startsWith('//') || l.includes('\\')) return null;
  // Sin caracteres de control (ej. "/\tevil" o saltos de línea)
  if (/[\u0000-\u001f\u007f]/.test(l)) return null;
  return l;
}

/**
 * ¿Es un link de pago de Wompi? (https://checkout.wompi.co/l/<id>; nunca otro host).
 * Formato: WOMPI_PAYMENT_LINK_RE (el mismo que validan las reglas al guardar config/app).
 */
export function isWompiCheckoutUrl(url: string | null | undefined): boolean {
  const u = (url ?? '').trim();
  if (!wompiPaymentLinkId(u)) return false;
  try {
    const p = new URL(u);
    return p.protocol === 'https:' && p.hostname === 'checkout.wompi.co' && !p.username && !p.password && !p.port;
  } catch {
    return false;
  }
}

/**
 * Perfil de Instagram a partir de lo que cargó la empresa (@usuario, usuario, o URL de instagram.com).
 * Cualquier otra URL se descarta (no se convierte en un link a un sitio arbitrario).
 */
export function instagramUrl(raw: string | null | undefined): string | null {
  const v = (raw ?? '').trim();
  if (!v) return null;
  const m = /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]{1,30})\/?(?:[?#].*)?$/i.exec(v);
  const user = m ? m[1] : v.replace(/^@/, '');
  return /^[A-Za-z0-9._]{1,30}$/.test(user) ? `https://instagram.com/${user}` : null;
}
