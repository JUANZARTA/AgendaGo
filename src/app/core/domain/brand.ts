/**
 * Marca. PURO.
 * (Archivo aparte, y no en app-config.ts, para que legal.ts pueda usarlo sin import circular.)
 */

/** Titular del comercio en Wompi: el nombre que ve la empresa al pagar y en su extracto/Nequi. */
export const BRAND_OWNER = 'Golden Panda';

/**
 * WhatsApp de soporte HISTÓRICO (estaba fijo en el código antes de config/app.support).
 * Sólo FALLBACK: se usa si el admin todavía no configuró un número en Configuración → Soporte.
 * No agregar usos nuevos: el contacto vigente sale siempre de config/app.
 */
export const LEGACY_SUPPORT_WHATSAPP = '573128622945';
