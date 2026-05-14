import * as functions from 'firebase-functions/v2';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const onUserCreated = functions.auth.beforeUserCreated(async (event) => {
  // El rol se setea cuando el usuario completa el registro en el frontend
  // Esta función solo crea el documento base en Firestore
  const uid = event.data.uid;
  const db = getFirestore();
  await db.collection('users').doc(uid).set({
    uid,
    email: event.data.email ?? '',
    displayName: event.data.displayName ?? '',
    role: 'client',
    isActive: true,
    createdAt: FieldValue.serverTimestamp(),
  });
});

export const setCompanyRole = functions.https.onCall(async (request) => {
  if (!request.auth) throw new functions.https.HttpsError('unauthenticated', 'Sin sesión');
  await getAuth().setCustomUserClaims(request.auth.uid, { role: 'company' });
  return { success: true };
});
