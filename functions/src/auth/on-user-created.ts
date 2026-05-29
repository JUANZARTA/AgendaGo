import { beforeUserCreated } from 'firebase-functions/v2/identity';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const onUserCreated = beforeUserCreated(async (event) => {
  const user = event.data;
  if (!user) return;
  const db = getFirestore();
  await db.collection('users').doc(user.uid).set({
    uid:         user.uid,
    email:       user.email ?? '',
    displayName: user.displayName ?? '',
    role:        'client',
    isActive:    true,
    createdAt:   FieldValue.serverTimestamp(),
  });
});

export const setCompanyRole = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sin sesión');
  await getAuth().setCustomUserClaims(request.auth.uid, { role: 'company' });
  return { success: true };
});
