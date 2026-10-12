import * as functions from 'firebase-functions/v2';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const TRIAL_MONTHS = 2;

export const onCompanyCreated = functions.firestore.onDocumentCreated('companies/{id}', async (event) => {
  const companyId = event.params.id;
  const db = getFirestore();

  const now = Timestamp.now();
  const trialEnd = now.toDate();
  // setMonth desborda desde el día 31 (31-dic -> 3-mar): se ajusta al último día del mes destino
  const day = trialEnd.getDate();
  trialEnd.setDate(1);
  trialEnd.setMonth(trialEnd.getMonth() + TRIAL_MONTHS);
  const lastDay = new Date(trialEnd.getFullYear(), trialEnd.getMonth() + 1, 0).getDate();
  trialEnd.setDate(Math.min(day, lastDay));

  await db.collection('subscriptions').doc(companyId).set({
    companyId,
    status: 'trial',
    trialStartDate: now,
    trialEndDate: Timestamp.fromDate(trialEnd),
  });
});
