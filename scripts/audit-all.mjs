#!/usr/bin/env node

/**
 * audit-all.mjs — ERA 11 Global Audit Orchestrator
 *
 * Runs `full-audit` sequentially across all 8 ABD packages and
 * produces a consolidated pass/fail report at the end.
 *
 * Usage:  node scripts/audit-all.mjs
 *         pnpm run full-audit        (preferred)
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Satellite registry —──────────────────────────────────────────
const SATELLITES = [
  { name: 'ABDFiles',            dir: 'ABDFiles' },
  { name: 'ABDLogs',             dir: 'ABDLogs' },
  { name: 'ABDQuiz',             dir: 'ABDQuiz' },
  { name: 'ABDLanding',          dir: 'ABDLanding' },
  { name: 'ABDAnalytics',        dir: 'ABDAnalytics' },
  { name: 'ABDAuth',             dir: 'ABDAuth' },
  { name: 'ABDtenantGovernance', dir: 'ABDtenantGovernance' },
  { name: 'ABDSatelliteSDK',     dir: 'ABDSatelliteSDK' },
  { name: 'ABD___BASE',          dir: 'ABD___BASE' },
];

const PASS  = '✅';
const FAIL  = '❌';
const ERROR = '💥';

// ── Helpers —─────────────────────────────────────────────────────
function padRight(s, len) {
  return String(s).padEnd(len);
}

function formatDuration(ms) {
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}

function runAudit(satellite) {
  return new Promise((resolvePromise) => {
    const cwd = resolve(ROOT, satellite.dir);
    const cmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

    const child = spawn(cmd, ['run', 'full-audit'], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      process.stdout.write(chunk);
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      process.stderr.write(chunk);
    });

    child.on('close', (code) => {
      resolvePromise({ satellite, code, stdout, stderr });
    });

    child.on('error', (err) => {
      resolvePromise({ satellite, code: -1, error: err.message, stdout, stderr });
    });
  });
}

function detectStatus(stdout, stderr, code) {
  const combined = (stdout + stderr).toLowerCase();
  // Only accept explicit ERA 11 certification markers
  if (code === 0 && combined.includes('system certified')) {
    return PASS;
  }
  if (code !== 0) {
    return FAIL;
  }
  // Code 0 but no explicit certification marker — warn
  return '⚠️';
}

// ── Main —────────────────────────────────────────────────────────
async function main() {
  // ── Validate all satellite directories exist —─────────────────
  for (const sat of SATELLITES) {
    const cwd = resolve(ROOT, sat.dir);
    if (!existsSync(cwd)) {
      console.error(`✖  ${sat.name}: directory not found at ${cwd}`);
      process.exit(1);
    }
  }

  const startTime = Date.now();

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       🏆  ERA 11 — GLOBAL AUDIT ORCHESTRATOR          ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║   ${SATELLITES.length} satellites · sequential execution     ║`);
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  const results = [];

  for (const sat of SATELLITES) {
    console.log('');
    console.log(`━━━ ${sat.name} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log('');

    const satStart = Date.now();
    const result = await runAudit(sat);
    const elapsed = formatDuration(Date.now() - satStart);

    const status = result.code === -1
      ? ERROR
      : detectStatus(result.stdout, result.stderr, result.code);

    results.push({ ...sat, status, elapsed, code: result.code, error: result.error });
  }

  // ── Final Report —──────────────────────────────────────────────
  const totalElapsed = formatDuration(Date.now() - startTime);
  const passed  = results.filter((r) => r.status === PASS).length;
  const failed  = results.filter((r) => r.status === FAIL).length;
  const errored = results.filter((r) => r.status === ERROR).length;

  console.log('');
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           🏆  GLOBAL ERA 11 — FINAL REPORT             ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  ${padRight('Satélite', 22)} ${padRight('Resultado', 12)} ${padRight('Tiempo', 8)} ║`);
  console.log('╠══════════════════════════════════════════════════════════╣');

  for (const r of results) {
    const label = r.status === PASS ? 'CERTIFIED' : r.status === FAIL ? 'BREACHES' : r.error || 'ERROR';
    console.log(`║  ${padRight(r.name, 22)} ${r.status} ${padRight(label, 10)} ${padRight(r.elapsed, 8)} ║`);
  }

  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  ${padRight('TOTAL', 22)} ${padRight(`${passed}/${SATELLITES.length} passed`, 12)} ${padRight(totalElapsed, 8)} ║`);
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  // ── Summary line for CI —────────────────────────────────────────
  if (failed > 0 || errored > 0) {
    console.log(`⚠️  ${failed} satellite(s) failed, ${errored} errored. Check logs above.`);
    process.exit(1);
  }

  if (passed === SATELLITES.length) {
    console.log(`🎉  ALL ${SATELLITES.length} SATELLITES ERA 11 CERTIFIED — GLOBAL COMPLIANT`);
    process.exit(0);
  }

  // Partial pass (e.g. some with ⚠️)
  console.log(`⚠️  ${passed}/${SATELLITES.length} certified. Review warnings above.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error in audit orchestrator:', err);
  process.exit(1);
});
