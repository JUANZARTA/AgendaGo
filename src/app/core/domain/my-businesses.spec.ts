import { aptMillis, buildRecents, recentLabel, relativeDays, shortDate } from './my-businesses';

const NOW = new Date(2026, 9, 14, 12, 0); // 14 oct 2026 12:00 local
const at = (y: number, mo: number, d: number, h = 12) => new Date(y, mo - 1, d, h).getTime();

describe('my-businesses: buildRecents', () => {
  it('un registro por negocio con la interacción más reciente, ordenado desc', () => {
    const r = buildRecents(
      [
        { companyId: 'a', date: '2026-09-01', startTime: '10:00' },
        { companyId: 'a', date: '2026-10-01', startTime: '10:00' },
        { companyId: 'b', date: '2026-08-01' },
      ],
      [
        { companyId: 'b', at: at(2026, 10, 10) },
        { companyId: 'c', at: at(2026, 7, 1) },
      ],
      new Set(),
    );
    expect(r.map(e => e.companyId)).toEqual(['b', 'a', 'c']);
    expect(r[0].kind).toBe('message');
    expect(r[1]).toMatchObject({ kind: 'appointment', date: '2026-10-01' });
  });

  it('excluye favoritos, citas ocultas y fechas inválidas', () => {
    const r = buildRecents(
      [
        { companyId: 'fav', date: '2026-10-01' },
        { companyId: 'hid', date: '2026-10-01', hiddenByClient: true },
        { companyId: 'bad', date: '01/10/2026' },
        { companyId: '', date: '2026-10-01' },
      ],
      [],
      new Set(['fav']),
    );
    expect(r).toEqual([]);
  });

  it('respeta el máximo', () => {
    const apts = Array.from({ length: 30 }, (_, i) => ({ companyId: 'c' + i, date: `2026-01-${String((i % 28) + 1).padStart(2, '0')}` }));
    expect(buildRecents(apts, [], new Set(), 20)).toHaveLength(20);
  });

  it('mensaje sin timestamp del servidor cuenta como reciente', () => {
    const r = buildRecents([{ companyId: 'a', date: '2020-01-01' }], [{ companyId: 'b', at: null }], new Set());
    expect(r[0].companyId).toBe('b');
  });
});

describe('my-businesses: textos', () => {
  it('aptMillis usa hora local y tolera hora inválida', () => {
    expect(aptMillis('2026-10-14', '09:30')).toBe(new Date(2026, 9, 14, 9, 30).getTime());
    expect(aptMillis('2026-10-14', 'xx')).toBe(new Date(2026, 9, 14).getTime());
    expect(aptMillis('nope')).toBeNaN();
  });

  it('shortDate agrega el año sólo si no es el actual', () => {
    expect(shortDate('2026-10-12', NOW)).toBe('12 oct');
    expect(shortDate('2025-01-03', NOW)).toBe('3 ene 2025');
    expect(shortDate('mal', NOW)).toBe('');
  });

  it('relativeDays', () => {
    expect(relativeDays(at(2026, 10, 14, 8), NOW)).toBe('hoy');
    expect(relativeDays(at(2026, 10, 13, 23), NOW)).toBe('ayer');
    expect(relativeDays(at(2026, 10, 11), NOW)).toBe('hace 3 días');
    expect(relativeDays(at(2026, 10, 7), NOW)).toBe('hace 1 semana');
    expect(relativeDays(at(2026, 9, 20), NOW)).toBe('hace 3 semanas');
    expect(relativeDays(at(2026, 8, 1), NOW)).toBe('hace 2 meses');
    expect(relativeDays(at(2025, 1, 1), NOW)).toBe('hace más de un año');
  });

  it('recentLabel: última / próxima cita y conversación', () => {
    expect(recentLabel({ companyId: 'a', kind: 'appointment', date: '2026-10-12', at: aptMillis('2026-10-12', '10:00') }, NOW)).toBe('Última cita: 12 oct');
    expect(recentLabel({ companyId: 'a', kind: 'appointment', date: '2026-10-20', at: aptMillis('2026-10-20', '10:00') }, NOW)).toBe('Próxima cita: 20 oct');
    expect(recentLabel({ companyId: 'a', kind: 'message', at: at(2026, 10, 11) }, NOW)).toBe('Conversaste hace 3 días');
  });
});
