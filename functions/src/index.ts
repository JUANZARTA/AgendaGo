import { initializeApp } from 'firebase-admin/app';
initializeApp();

export { onUserCreated, setCompanyRole } from './auth/on-user-created';
export { onAppointmentCreated } from './notifications/on-appointment-created';
export { onAppointmentCancelled } from './notifications/on-appointment-cancelled';
export { checkExpiredSubscriptions } from './subscriptions/check-expired';
export { sendSubscriptionReminder } from './subscriptions/send-reminder';
export { validatePayment } from './payments/validate-payment';
