/** Fila de la tabla de facturación del admin (suscripción + datos de la empresa). */
export interface AdminSub {
  companyId: string;
  companyName: string;
  ownerEmail: string;
  status: string;
  trialEndLabel: string;
  periodEndLabel: string;
  lastPaymentLabel: string;
  periodEndMs: number | null;
}

export const STATUS_LABEL: Record<string, string> = {
  trial: 'Trial', active: 'Activa', expired: 'Vencida', disabled: 'Deshabilitada', free: 'Gratuita',
};
export const STATUS_CLASS: Record<string, string> = {
  trial: 'badge-blue', active: 'badge-green', expired: 'badge-red', disabled: 'badge-red', free: 'badge-purple',
};
