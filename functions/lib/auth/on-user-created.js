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
exports.setCompanyRole = exports.onUserCreated = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
exports.onUserCreated = functions.auth.beforeUserCreated(async (event) => {
    var _a, _b;
    // El rol se setea cuando el usuario completa el registro en el frontend
    // Esta función solo crea el documento base en Firestore
    const uid = event.data.uid;
    const db = (0, firestore_1.getFirestore)();
    await db.collection('users').doc(uid).set({
        uid,
        email: (_a = event.data.email) !== null && _a !== void 0 ? _a : '',
        displayName: (_b = event.data.displayName) !== null && _b !== void 0 ? _b : '',
        role: 'client',
        isActive: true,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
});
exports.setCompanyRole = functions.https.onCall(async (request) => {
    if (!request.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Sin sesión');
    await (0, auth_1.getAuth)().setCustomUserClaims(request.auth.uid, { role: 'company' });
    return { success: true };
});
//# sourceMappingURL=on-user-created.js.map