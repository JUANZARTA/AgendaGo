import { initializeApp } from 'firebase-admin/app';
initializeApp();

export { onAppointmentCreated } from './notifications/on-appointment-created';
export { onAppointmentStatusChanged } from './notifications/on-appointment-confirmed';
export { sendAppointmentReminders } from './notifications/send-appointment-reminders';
export { checkExpiredSubscriptions } from './subscriptions/check-expired';
export { sendSubscriptionReminder } from './subscriptions/send-reminder';
export { validatePayment } from './payments/validate-payment';
