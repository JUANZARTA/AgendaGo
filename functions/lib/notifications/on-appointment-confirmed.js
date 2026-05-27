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
exports.onAppointmentStatusChanged = void 0;
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
exports.onAppointmentStatusChanged = functions.firestore.onDocumentUpdated('appointments/{id}', async (event) => {
    var _a, _b, _c, _d, _e, _f;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!before || !after)
        return;
    if (before['status'] === after['status'])
        return;
    const db = (0, firestore_1.getFirestore)();
    if (after['status'] === 'scheduled' && after['clientId']) {
        const clientDoc = await db.collection('users').doc(after['clientId']).get();
        const token = (_c = clientDoc.data()) === null || _c === void 0 ? void 0 : _c['fcmToken'];
        if (token) {
            await sendFcm(token, 'Cita confirmada ✓', `Tu cita en ${after['companyName']} el ${after['date']} a las ${after['startTime']} fue confirmada.`, '/cliente/citas');
        }
    }
    if (after['status'] === 'cancelled') {
        const cancelledBy = after['cancelledBy'];
        if (cancelledBy === 'client') {
            const companyDoc = await db.collection('companies').doc(after['companyId']).get();
            const ownerId = (_d = companyDoc.data()) === null || _d === void 0 ? void 0 : _d['ownerId'];
            if (ownerId) {
                const ownerDoc = await db.collection('users').doc(ownerId).get();
                const token = (_e = ownerDoc.data()) === null || _e === void 0 ? void 0 : _e['fcmToken'];
                if (token) {
                    await sendFcm(token, 'Cita cancelada', `${after['clientName']} canceló su cita del ${after['date']} a las ${after['startTime']}.`, '/empresa/dashboard');
                }
            }
        }
        if (cancelledBy === 'company' && after['clientId']) {
            const clientDoc = await db.collection('users').doc(after['clientId']).get();
            const token = (_f = clientDoc.data()) === null || _f === void 0 ? void 0 : _f['fcmToken'];
            if (token) {
                await sendFcm(token, 'Cita cancelada', `Tu cita en ${after['companyName']} del ${after['date']} fue cancelada.`, '/cliente/citas');
            }
        }
    }
});
//# sourceMappingURL=on-appointment-confirmed.js.map