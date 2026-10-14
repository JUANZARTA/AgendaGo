/** Formatea un Timestamp de Firestore (o fecha) como "5 ene 2026". */
export function formatTimestamp(ts: any): string {
  if (!ts) return '—';
  const date: Date = ts?.toDate ? ts.toDate() : new Date(ts);
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}
