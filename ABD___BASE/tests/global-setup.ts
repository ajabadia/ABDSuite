import { execSync } from 'child_process';

async function globalSetup(): Promise<void> {
  console.log(`[global-setup] ABD___BASE — Generic scaffold template`);

  // 1. Node version check
  const nodeMajor = parseInt(process.version.slice(1).split('.')[0], 10);
  if (nodeMajor < 18) {
    throw new Error(`Node >= 18 required (got ${process.version})`);
  }
  console.log(`  ✓ Node ${process.version}`);

  // 2. node_modules check
  try {
    execSync('node -e "require(\"next\")"', { stdio: 'pipe' });
    console.log(`  ✓ Dependencies installed`);
  } catch {
    throw new Error('node_modules missing or corrupt. Run `pnpm install`.');
  }

  console.log('[global-setup] Minimal checks passed.\n');
}

export default globalSetup;
