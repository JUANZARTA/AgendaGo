import { defineConfig } from 'vitest/config';

/**
 * Tests de lógica PURA (core/domain, core/utils): corren en Node, sin Angular ni navegador.
 * `ng test` no encuentra los specs porque la ruta del proyecto tiene un ")" ("8) Programacion")
 * que rompe el glob absoluto del builder; acá los patrones son relativos a la raíz.
 */
export default defineConfig({
  test: {
    include: ['src/app/core/domain/**/*.spec.ts', 'src/app/core/utils/**/*.spec.ts'],
    environment: 'node',
    globals: true,
  },
});
