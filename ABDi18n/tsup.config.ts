import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    routing: 'src/routing.ts',
    navigation: 'src/navigation.ts',
    request: 'src/request.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  minify: false,
  sourcemap: true,
  splitting: false,
  tsconfig: './tsconfig.json',
  external: ['next-intl'],
});
