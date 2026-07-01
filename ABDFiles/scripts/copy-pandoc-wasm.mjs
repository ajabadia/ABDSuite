#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const dest = join(publicDir, 'pandoc.wasm');

if (existsSync(dest)) {
  console.log('pandoc.wasm already in public/, skipping copy');
  process.exit(0);
}

let src = '';

const pkgPath = join(root, 'node_modules', 'pandoc-wasm', 'src', 'pandoc.wasm');
if (existsSync(pkgPath)) {
  src = pkgPath;
} else {
  try {
    const req = createRequire(import.meta.url);
    const pkgEntry = req.resolve('pandoc-wasm');
    const pkgDir = dirname(pkgEntry);
    const wasmPath = join(pkgDir, 'pandoc.wasm');
    if (existsSync(wasmPath)) {
      src = wasmPath;
    }
  } catch {}
}

if (!src) {
  console.warn('pandoc.wasm not found in node_modules — will resolve at runtime');
  process.exit(0);
}

if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

copyFileSync(src, dest);
const stat = await import('fs').then(m => m.statSync(dest));
console.log(`Copied pandoc.wasm (${(stat.size / 1024 / 1024).toFixed(1)} MB) to public/`);
