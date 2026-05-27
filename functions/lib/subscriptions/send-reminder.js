"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSubscriptionReminder = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const firestore_1 = require("firebase-admin/firestore");
const messaging_1 = require("firebase-admin/messaging");
exports.sendSubscriptionReminder = functions.scheduler.onSchedule({ schedule: 'every day 09:00', timeZone: 'America/Bogota' }, async () => {
    var _a, _b;
    const db = (0, firestore_1.getFirestore)();
    const in5 = new Date(Date.now() + 5 * 86400000);
    const in6 = new Date(Date.now() + 6 * 86400000);
    const ts5 = firestore_1.Timestamp.fromDate(in5);
    const ts6 = firestore_1.Timestamp.fromDate(in6);
    const [activeSubs, trialSubs] = await Promise.all([
        db.collection('subscriptions')
            .where('status', '==', 'active')
            .where('currentPeriodEnd', '>=', ts5)
            .where('currentPeriodEnd', '<=', ts6)
            .get(),
        db.collection('subscriptions')
            .where('status', '==', 'trial')
            .where('trialEndDate', '>=', ts5)
            .where('trialEndDate', '<=', ts6)
            .get(),
    ]);
    const messaging = (0, messaging_1.getMessaging)();
    for (const snap of [...activeSubs.docs, ...trialSubs.docs]) {
        const companyDoc = await db.collection('companies').doc(snap.id).get();
        const ownerId = (_a = companyDoc.data()) === null || _a === void 0 ? void 0 : _a['ownerId'];
        if (!ownerId)
            continue;
        const ownerDoc = await db.collection('users').doc(ownerId).get();
        const token = (_b = ownerDoc.data()) === null || _b === void 0 ? void 0 : _b['fcmToken'];
        if (!token)
            continue;
        try {
            await messaging.send({
                token,
                notification: {
                    title: 'Tu suscripción vence en 5 días',
                    body: 'Renovà tu plan para mantener tu agenda activa.',
                },
                webpush: { fcmOptions: { link: '/empresa/facturacion' } },
            });
        }
        catch (_c) { }
    }
});
//# sourceMappingURL=send-reminder.js.map