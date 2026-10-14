export interface Payment {
  plan: string;
  amount: number;
  status: 'approved' | 'pending' | 'failed';
  createdAt: any;
  periodEnd: any;
}

export interface SubViewModel {
  status: 'trial' | 'active' | 'expired' | 'disabled' | 'free';
  plan: string;
  trialEnd: string;
  daysLeft: number;
  trialUsed: boolean;
}
