"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePayment = exports.sendSubscriptionReminder = exports.checkExpiredSubscriptions = exports.sendAppointmentReminders = exports.onAppointmentStatusChanged = exports.onAppointmentCreated = void 0;
const app_1 = require("firebase-admin/app");
(0, app_1.initializeApp)();
var on_appointment_created_1 = require("./notifications/on-appointment-created");
Object.defineProperty(exports, "onAppointmentCreated", { enumerable: true, get: function () { return on_appointment_created_1.onAppointmentCreated; } });
var on_appointment_confirmed_1 = require("./notifications/on-appointment-confirmed");
Object.defineProperty(exports, "onAppointmentStatusChanged", { enumerable: true, get: function () { return on_appointment_confirmed_1.onAppointmentStatusChanged; } });
var send_appointment_reminders_1 = require("./notifications/send-appointment-reminders");
Object.defineProperty(exports, "sendAppointmentReminders", { enumerable: true, get: function () { return send_appointment_reminders_1.sendAppointmentReminders; } });
var check_expired_1 = require("./subscriptions/check-expired");
Object.defineProperty(exports, "checkExpiredSubscriptions", { enumerable: true, get: function () { return check_expired_1.checkExpiredSubscriptions; } });
var send_reminder_1 = require("./subscriptions/send-reminder");
Object.defineProperty(exports, "sendSubscriptionReminder", { enumerable: true, get: function () { return send_reminder_1.sendSubscriptionReminder; } });
var validate_payment_1 = require("./payments/validate-payment");
Object.defineProperty(exports, "validatePayment", { enumerable: true, get: function () { return validate_payment_1.validatePayment; } });
//# sourceMappingURL=index.js.map