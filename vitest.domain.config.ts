import { defineConfig } from 'vitest/config';

/**
 * Tests de lógica PURA (core/domain, core/utils): corren en Node, sin Angular ni navegador.
 * Patrones relativos a la raíz (el ")" de "8) Programacion" rompe los globs absolutos).
 * `ng test` también corre estos specs: lo arregla vitest-base.config.ts escapando esas rutas.
 */
export default defineConfig({
  test: {
    include: ['src/app/core/domain/**/*.spec.ts', 'src/app/core/utils/**/*.spec.ts'],
    environment: 'node',
    globals: true,
  },
});
