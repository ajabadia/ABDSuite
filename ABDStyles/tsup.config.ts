import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/api/theme.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: true,
  treeshake: true,
  sourcemap: true,
  minify: false,
  external: ['@ajabadia/satellite-sdk', 'mongoose'],
});
