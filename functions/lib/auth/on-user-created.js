"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCompanyRole = exports.onUserCreated = void 0;
const identity_1 = require("firebase-functions/v2/identity");
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
exports.onUserCreated = (0, identity_1.beforeUserCreated)(async (event) => {
    var _a, _b;
    const user = event.data;
    if (!user)
        return;
    const db = (0, firestore_1.getFirestore)();
    await db.collection('users').doc(user.uid).set({
        uid: user.uid,
        email: (_a = user.email) !== null && _a !== void 0 ? _a : '',
        displayName: (_b = user.displayName) !== null && _b !== void 0 ? _b : '',
        role: 'client',
        isActive: true,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
});
exports.setCompanyRole = (0, https_1.onCall)(async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Sin sesión');
    await (0, auth_1.getAuth)().setCustomUserClaims(request.auth.uid, { role: 'company' });
    return { success: true };
});
//# sourceMappingURL=on-user-created.js.map