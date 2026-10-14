/**
 * Prueba gratis UNA vez por persona: además de trials/{uid} se marca trialEmails/{correo normalizado},
 * así borrar la cuenta y registrarse de nuevo con el mismo correo (uid nuevo) no da otro trial. PURO.
 *
 * Normalización (IDÉNTICA a normTrialEmail() en firestore.rules; si cambia una, cambiar la otra y sus tests):
 *  - todo en minúsculas;
 *  - se quita desde el primer '+' de la parte local (alias "juan+promo@…");
 *  - gmail.com / googlemail.com: además se quitan los puntos de la parte local y el dominio pasa a gmail.com
 *    (Gmail ignora los puntos: j.u.a.n@gmail.com = juan@gmail.com).
 * Devuelve null si no hay correo o no se puede usar como id de documento (sin '@' único, o con '/').
 */
export const GMAIL_DOMAINS = ['gmail.com', 'googlemail.com'];

export function normalizeTrialEmail(email: string | null | undefined): string | null {
  const e = (email ?? '').trim().toLowerCase();
  const parts = e.split('@');
  if (parts.length !== 2 || !parts[1]) return null;
  let [local, domain] = parts;
  local = local.split('+')[0];
  if (GMAIL_DOMAINS.includes(domain)) {
    local = local.replace(/\./g, '');
    domain = 'gmail.com';
  }
  const id = `${local}@${domain}`;
  // Un id de documento no puede tener '/' (ni ser '.' / '..'); límite holgado de tamaño
  if (id.includes('/') || id.length > 300) return null;
  return id;
}
