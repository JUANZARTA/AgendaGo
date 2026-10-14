import { buildPaymentHistory } from './payment-history';

const ts = (iso: string) => ({ toDate: () => new Date(iso) });

describe('buildPaymentHistory', () => {
  const payment = {
    id: 'manual-111', plan: 'mensual', amount: 29_000, status: 'approved', source: 'manual',
    wompiRef: '111', createdAt: ts('2026-10-14T12:00:00Z'), paidAt: '2026-10-14T11:48:00Z',
    periodStart: ts('2026-10-14T12:00:00Z'), periodEnd: ts('2026-11-13T12:00:00Z'),
    payerName: 'Juan', paymentMethod: 'NEQUI',
  };

  it('pago confirmado: plan, valor, período y transacción', () => {
    const [row] = buildPaymentHistory([payment], []);
    expect(row).toMatchObject({
      kind: 'payment', planLabel: 'Mensual', amount: 29_000, status: 'approved',
      statusLabel: 'Aprobado', transactionId: '111', origin: 'Confirmado por admin', payerName: 'Juan',
    });
    expect(row.date?.toISOString()).toBe('2026-10-14T11:48:00.000Z');   // la fecha del pago, no la del registro
  });

  it('reporte pendiente aparece como "Por confirmar"', () => {
    const rows = buildPaymentHistory([], [{ id: '222', transactionId: '222', status: 'pending', createdAt: ts('2026-10-15T00:00:00Z') }]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: 'claim', status: 'to-confirm', statusLabel: 'Por confirmar', transactionId: '222' });
  });

  it('un reporte ya confirmado no se duplica con su pago', () => {
    const rows = buildPaymentHistory([payment], [
      { id: '111', transactionId: '111', status: 'registered' },
      { id: '111b', transactionId: '111', status: 'pending' },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe('payment');
  });

  it('ordena del más nuevo al más viejo', () => {
    const rows = buildPaymentHistory([payment], [{ id: '333', transactionId: '333', status: 'rejected', createdAt: ts('2026-12-01T00:00:00Z') }]);
    expect(rows.map(r => r.transactionId)).toEqual(['333', '111']);
    expect(rows[0].statusLabel).toBe('Descartado');
  });
});
