import { TUTORIAL_URL_MAX, normalizeYoutubeUrl, youtubeUrlValid } from './youtube-url';

describe('youtube-url', () => {
  it('acepta los formatos de YouTube', () => {
    expect(youtubeUrlValid('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    expect(youtubeUrlValid('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    expect(youtubeUrlValid('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
    expect(youtubeUrlValid('https://www.youtube.com/shorts/abc_DEF-123')).toBe(true);
    expect(youtubeUrlValid('https://youtube.com/shorts/abc_DEF-123')).toBe(true);
  });

  it('acepta parámetros extra', () => {
    expect(youtubeUrlValid('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s')).toBe(true);
    expect(youtubeUrlValid('https://www.youtube.com/watch?list=PL123&v=dQw4w9WgXcQ')).toBe(true);
    expect(youtubeUrlValid('https://youtu.be/dQw4w9WgXcQ?si=abc123')).toBe(true);
    expect(youtubeUrlValid('https://www.youtube.com/shorts/abc_DEF-123?feature=share')).toBe(true);
  });

  it('rechaza otros dominios y esquemas', () => {
    expect(youtubeUrlValid('http://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false);
    expect(youtubeUrlValid('https://vimeo.com/123456789')).toBe(false);
    expect(youtubeUrlValid('https://evil.com/?https://youtu.be/dQw4w9WgXcQ')).toBe(false);
    expect(youtubeUrlValid('https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ')).toBe(false);
    expect(youtubeUrlValid('https://www.youtube.com@evil.com/watch?v=dQw4w9WgXcQ')).toBe(false);
    expect(youtubeUrlValid('javascript:alert(1)')).toBe(false);
  });

  it('rechaza ids inválidos o faltantes', () => {
    expect(youtubeUrlValid('https://www.youtube.com/watch?v=abc')).toBe(false);
    expect(youtubeUrlValid('https://www.youtube.com/watch?v=' + 'a'.repeat(21))).toBe(false);
    expect(youtubeUrlValid('https://www.youtube.com/watch')).toBe(false);
    expect(youtubeUrlValid('https://www.youtube.com/watch?v=dQw4w9W$cQ')).toBe(false);
    expect(youtubeUrlValid('https://youtu.be/')).toBe(false);
    expect(youtubeUrlValid('https://www.youtube.com/')).toBe(false);
  });

  it('rechaza fragmentos y espacios dentro del link', () => {
    expect(youtubeUrlValid('https://youtu.be/dQw4w9WgXcQ#x')).toBe(false);
    expect(youtubeUrlValid('https://youtu.be/dQw4w9WgXcQ?a=b c')).toBe(false);
  });

  it('vacío o nulo no es válido; normalize recorta espacios', () => {
    expect(youtubeUrlValid('')).toBe(false);
    expect(youtubeUrlValid(null)).toBe(false);
    expect(youtubeUrlValid(undefined)).toBe(false);
    expect(normalizeYoutubeUrl('  https://youtu.be/dQw4w9WgXcQ \n')).toBe('https://youtu.be/dQw4w9WgXcQ');
    expect(normalizeYoutubeUrl('nada')).toBeNull();
  });

  it('rechaza links de más de 300 caracteres', () => {
    const base = 'https://youtu.be/dQw4w9WgXcQ?x=';
    expect(youtubeUrlValid(base + 'a'.repeat(TUTORIAL_URL_MAX - base.length))).toBe(true);
    expect(youtubeUrlValid(base + 'a'.repeat(TUTORIAL_URL_MAX - base.length + 1))).toBe(false);
  });
});
