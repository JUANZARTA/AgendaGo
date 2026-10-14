import { defineConfig, type Plugin } from 'vitest/config';

/**
 * Config extra para `ng test` (builder @angular/build:unit-test con Vitest), referenciada desde
 * angular.json → test.options.runnerConfig.
 *
 * Por qué existe: el builder le pasa a Vitest los specs como rutas ABSOLUTAS en `test.include`.
 * Vitest las globea con tinyglobby, que interpreta el ")" de "8) Programacion" como sintaxis de
 * glob: toma "E:/Golden Panda" como base, recorre mal el disco y termina en
 * "No test files found, exiting with code 1". Escapando los caracteres especiales de glob en esas
 * rutas (son archivos concretos, no patrones) Vitest encuentra los specs sin mover la carpeta.
 */
const GLOB_SPECIAL = /[()[\]{}*?!+@]/g;

function escapeAbsoluteIncludes(): Plugin {
  return {
    name: 'agendaco:escape-absolute-test-includes',
    // Plugin de proyecto: el builder lo agrega a la config del proyecto, que trae test.include
    config(config) {
      const test = (config as { test?: { include?: string[] } }).test;
      if (!test?.include) return;
      test.include = test.include.map(p =>
        /^([a-zA-Z]:)?[\\/]/.test(p) ? p.replace(/\\/g, '/').replace(GLOB_SPECIAL, '\\$&') : p,
      );
    },
  };
}

export default defineConfig({
  plugins: [escapeAbsoluteIncludes()],
});
