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
exports.validatePayment = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const firestore_1 = require("firebase-admin/firestore");
const crypto = __importStar(require("crypto"));
function verifyWompiSignature(payload, secret) {
    var _a, _b, _c;
    const { signature, timestamp } = payload;
    if (!(signature === null || signature === void 0 ? void 0 : signature.checksum) || !timestamp)
        return false;
    const props = (_a = signature.properties) !== null && _a !== void 0 ? _a : [];
    const transaction = (_c = (_b = payload.data) === null || _b === void 0 ? void 0 : _b.transaction) !== null && _c !== void 0 ? _c : {};
    const values = props.map((p) => {
        var _a;
        const keys = p.split('.');
        return (_a = keys.reduce((obj, k) => obj === null || obj === void 0 ? void 0 : obj[k], { transaction })) !== null && _a !== void 0 ? _a : '';
    });
    const integrityStr = [...values, timestamp, secret].join('');
    const expected = crypto.createHash('sha256').update(integrityStr).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature.checksum));
}
exports.validatePayment = functions.https.onRequest(async (req, res) => {
    var _a, _b, _c, _d;
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    const secret = (_a = process.env['WOMPI_WEBHOOK_SECRET']) !== null && _a !== void 0 ? _a : '';
    if (secret && !verifyWompiSignature(req.body, secret)) {
        res.status(401).json({ error: 'Firma inválida' });
        return;
    }
    const transaction = (_d = (_c = (_b = req.body) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.transaction) !== null && _d !== void 0 ? _d : {};
    const { reference, status: transactionStatus, amount_in_cents: amount, currency } = transaction;
    if (!reference || transactionStatus !== 'APPROVED') {
        res.status(200).json({ received: true });
        return;
    }
    const parts = String(reference).split('-');
    const plan = parts[0];
    const companyId = parts[1];
    if (!companyId) {
        res.status(400).json({ error: 'Referencia inválida' });
        return;
    }
    const db = (0, firestore_1.getFirestore)();
    const now = new Date();
    const days = plan === 'semestral' ? 180 : 30;
    const nextPeriod = new Date(now);
    nextPeriod.setDate(nextPeriod.getDate() + days);
    await db.collection('subscriptions').doc(companyId).set({
        companyId,
        status: 'active',
        lastPaymentDate: firestore_1.Timestamp.fromDate(now),
        currentPeriodStart: firestore_1.Timestamp.fromDate(now),
        currentPeriodEnd: firestore_1.Timestamp.fromDate(nextPeriod),
    }, { merge: true });
    await db.collection('companies').doc(companyId).update({ isActive: true });
    res.status(200).json({ success: true });
});
//# sourceMappingURL=validate-payment.js.map