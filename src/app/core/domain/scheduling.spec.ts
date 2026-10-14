import { hasCapacity, rangesOverlap, toMin, toTime } from './scheduling';

describe('scheduling', () => {
  it('convierte horas y minutos', () => {
    expect(toMin('00:00')).toBe(0);
    expect(toMin('09:30')).toBe(570);
    expect(toTime(570)).toBe('09:30');
    expect(toTime(toMin('23:45'))).toBe('23:45');
  });

  it('rangos que sólo se tocan no se solapan', () => {
    expect(rangesOverlap(540, 570, 570, 600)).toBe(false);
    expect(rangesOverlap(540, 571, 570, 600)).toBe(true);
    expect(rangesOverlap(540, 600, 550, 560)).toBe(true);
  });

  describe('hasCapacity', () => {
    const apt = (start: string, end: string, staffId: string | null = null) => ({ startTime: start, endTime: end, staffId });

    it('sin citas hay cupo', () => {
      expect(hasCapacity([], 540, 570, null, 1)).toBe(true);
    });

    it('capacidad 1: una cita solapada agota el cupo', () => {
      expect(hasCapacity([apt('09:00', '09:30')], 540, 570, null, 1)).toBe(false);
    });

    it('capacidad 2: queda un lugar con una cita de otro profesional', () => {
      expect(hasCapacity([apt('09:00', '09:15', 'luisa')], 540, 555, 'arturo', 2)).toBe(true);
    });

    it('el mismo profesional no puede tener dos citas solapadas aunque haya cupo', () => {
      expect(hasCapacity([apt('09:00', '09:15', 'luisa')], 540, 555, 'luisa', 2)).toBe(false);
    });

    it('las citas "cualquiera" (sin staffId) también consumen cupo', () => {
      expect(hasCapacity([apt('09:00', '09:30'), apt('09:00', '09:30')], 540, 570, 'arturo', 2)).toBe(false);
    });

    it('capacidad 0 o inválida se trata como 1', () => {
      expect(hasCapacity([], 540, 570, null, 0)).toBe(true);
      expect(hasCapacity([apt('09:00', '09:30')], 540, 570, null, 0)).toBe(false);
    });
  });
});
