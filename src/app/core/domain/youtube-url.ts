/**
 * Link del video tutorial (config/app.tutorialUrl). PURO.
 * Sólo YouTube: watch?v=<id>, youtu.be/<id> o shorts/<id> (con o sin www), id [A-Za-z0-9_-]{6,20}.
 * Se admiten parámetros extra (&t=, ?si=) pero no fragmento (#) ni espacios.
 */

/** Largo máximo del link (debe coincidir con firestore.rules). */
export const TUTORIAL_URL_MAX = 300;

/**
 * ÚNICA definición del link válido. Es la MISMA expresión que validTutorialUrl() en
 * firestore.rules: si cambia una, cambiar la otra (y sus tests).
 */
export const YOUTUBE_URL_RE = new RegExp(
  '^https://(' +
    '(www[.])?youtube[.]com/watch[?]([^ #]*&)?v=[A-Za-z0-9_-]{6,20}(&[^ #]*)?' +
    '|youtu[.]be/[A-Za-z0-9_-]{6,20}([?][^ #]*)?' +
    '|(www[.])?youtube[.]com/shorts/[A-Za-z0-9_-]{6,20}([?][^ #]*)?' +
  ')$',
);

/** Link normalizado (sin espacios alrededor) o null si está vacío o no es un link de YouTube válido. */
export function normalizeYoutubeUrl(url: string | null | undefined): string | null {
  const u = (url ?? '').trim();
  return u.length <= TUTORIAL_URL_MAX && YOUTUBE_URL_RE.test(u) ? u : null;
}

/** true si es un link de YouTube válido. Vacío = false (el que valida decide si vacío es aceptable). */
export function youtubeUrlValid(url: string | null | undefined): boolean {
  return normalizeYoutubeUrl(url) !== null;
}
