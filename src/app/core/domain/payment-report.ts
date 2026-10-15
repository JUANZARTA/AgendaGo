/**
 * Reporte de pago de la empresa ("pagué con la transacción X"). PURO: el mensaje que ve la empresa,
 * igual en los dos puntos de reporte (página de gracias de Wompi y "¿Pagaste y no se activó?").
 */
import { formatCop } from './plans';

/**
 * - 'created': quedó guardado;
 * - 'already-reported': ya lo había reportado ESTA empresa;
 * - 'taken': lo reportó OTRA empresa (posible error de tipeo o front-running: lo resuelve el admin).
 * Un error de red NO es un resultado: se relanza y la UI pide reintentar.
 */
export type ReportResult = 'created' | 'already-reported' | 'taken';

export interface ReportMessage { ok: boolean; text: string }

/**
 * Criterio único: un monto que no corresponde a ningún plan se reporta IGUAL (la plata ya se cobró),
 * sin `plan`, y el admin lo revisa a mano (devolución / ajuste / registro manual).
 */
export function reportMessage(r: ReportResult, matchesPlan: boolean, amount: number): ReportMessage {
  if (r === 'taken') {
    return { ok: false, text: 'Esa transacción ya fue avisada desde otra cuenta. Revisa el número; si es tuya, escríbenos con el comprobante de Wompi.' };
  }
  if (r === 'already-reported') return { ok: true, text: 'Ese pago ya estaba avisado. Lo estamos verificando.' };
  return matchesPlan
    ? { ok: true, text: '¡Listo! Recibimos tu aviso. Lo verificamos y tu plan se activa en breve.' }
    : { ok: true, text: `Recibimos tu aviso. Ojo: el pago es por ${formatCop(amount)}, que no corresponde a ningún plan; lo revisamos a mano y te contactamos.` };
}

/** Texto cuando el reporte NO se pudo guardar (red / Firestore caído). */
export const REPORT_FAILED_TEXT = 'No se pudo enviar el aviso (¿sin conexión?). Reintenta en unos minutos.';
