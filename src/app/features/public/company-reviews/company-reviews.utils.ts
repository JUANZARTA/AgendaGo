// Helpers puros de la página pública de reseñas.

export const STAR_RANGE = [1, 2, 3, 4, 5];

/** Promedio redondeado a 1 decimal (0 si no hay reseñas). */
export function averageRating(ratings: number[]): number {
  if (!ratings.length) return 0;
  return Math.round(ratings.reduce((s, r) => s + r, 0) / ratings.length * 10) / 10;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatAptDate(date: string | undefined): string {
  if (!date) return '';
  const [y, m, d] = date.split('-');
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${+d} ${months[+m - 1]}`;
}
