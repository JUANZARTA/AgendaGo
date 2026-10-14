import { PaymentDocLike } from '../../../core/domain/payment-history';

/** Doc de `payments` (lo escribe el admin al confirmar, o el webhook de Wompi). */
export type Payment = PaymentDocLike;

export interface SubViewModel {
  status: 'trial' | 'active' | 'expired' | 'disabled' | 'free';
  plan: string;
  trialEnd: string;
  daysLeft: number;
  trialUsed: boolean;
}
