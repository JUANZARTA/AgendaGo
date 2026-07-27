import * as functions from 'firebase-functions/v2';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const TRIAL_MONTHS = 2;

export const onCompanyCreated = functions.firestore.onDocumentCreated('companies/{id}', async (event) => {
  const companyId = event.params.id;
  const db = getFirestore();

  const now = Timestamp.now();
  const trialEnd = now.toDate();
  trialEnd.setMonth(trialEnd.getMonth() + TRIAL_MONTHS);

  await db.collection('subscriptions').doc(companyId).set({
    companyId,
    status: 'trial',
    trialStartDate: now,
    trialEndDate: Timestamp.fromDate(trialEnd),
  });
});
