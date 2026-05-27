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
exports.onAppointmentCreated = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const firestore_1 = require("firebase-admin/firestore");
const messaging_1 = require("firebase-admin/messaging");
async function sendFcm(token, title, body, link) {
    try {
        await (0, messaging_1.getMessaging)().send({
            token,
            notification: { title, body },
            webpush: link ? { fcmOptions: { link } } : undefined,
        });
    }
    catch (_a) { }
}
exports.onAppointmentCreated = functions.firestore.onDocumentCreated('appointments/{id}', async (event) => {
    var _a, _b, _c, _d;
    const appt = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!appt)
        return;
    const db = (0, firestore_1.getFirestore)();
    const companyDoc = await db.collection('companies').doc(appt['companyId']).get();
    const ownerId = (_b = companyDoc.data()) === null || _b === void 0 ? void 0 : _b['ownerId'];
    if (!ownerId)
        return;
    const ownerDoc = await db.collection('users').doc(ownerId).get();
    const ownerToken = (_c = ownerDoc.data()) === null || _c === void 0 ? void 0 : _c['fcmToken'];
    if (ownerToken) {
        await sendFcm(ownerToken, 'Nueva cita agendada', `${appt['clientName']} — ${appt['serviceName']} — ${appt['date']} ${appt['startTime']}`, '/empresa/dashboard');
    }
    if (appt['clientId']) {
        const clientDoc = await db.collection('users').doc(appt['clientId']).get();
        const clientToken = (_d = clientDoc.data()) === null || _d === void 0 ? void 0 : _d['fcmToken'];
        if (clientToken) {
            await sendFcm(clientToken, 'Cita recibida', `Tu cita en ${appt['companyName']} el ${appt['date']} a las ${appt['startTime']}`, '/cliente/citas');
        }
    }
});
//# sourceMappingURL=on-appointment-created.js.map