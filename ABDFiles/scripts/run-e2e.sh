#!/usr/bin/env bash
#
# run-e2e.sh — Run ABDAnalytics E2E tests
#
# Este script arranca el servidor manualmente (evita webServer de Playwright,
# que tiene problemas con cmd.exe en Windows) y ejecuta los tests E2E.
#
# Flujo:
#   1. Limpia puerto 3700
#   2. Arranca ABDAnalytics (dev server en 3700)
#   3. Ejecuta los tests E2E de Playwright
#   4. Mata el servidor

set -e

cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
PARENT_DIR="$(cd .. && pwd)"

echo "=== Step 1: Cleanup port 3700 (ABDAnalytics) ==="
node "$PARENT_DIR/ABDLogs/scripts/cleanup-port.mjs" 3700 2>/dev/null || true

echo "=== Step 2: Start ABDAnalytics dev server (port 3700) ==="
node node_modules/next/dist/bin/next dev -p 3700 --webpack &>/tmp/abdanalitycs-server.log &
ANALYTICS_PID=$!
echo "ABDAnalytics PID: $ANALYTICS_PID"

cleanup() {
  echo ""
  echo "=== Cleanup: Stopping server ==="
  kill $ANALYTICS_PID 2>/dev/null || true
  echo "Server stopped."
}
trap cleanup EXIT INT TERM

echo "=== Step 3: Wait for ABDAnalytics to be ready ==="
for i in $(seq 1 60); do
  HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3700 2>/dev/null || echo "000")
  if echo "$HTTP_CODE" | grep -qE '2|3'; then
    echo "ANALYTICS_READY after ${i}s (HTTP $HTTP_CODE)"
    break
  fi
  if [ $i -eq 60 ]; then
    echo "ANALYTICS_TIMEOUT after 60s"
    tail -20 /tmp/abdanalitycs-server.log
    kill $ANALYTICS_PID 2>/dev/null
    exit 1
  fi
  sleep 2
done

echo "=== Step 4: Run Playwright E2E tests ==="
export ABDLOGS_SKIP_PORT_CLEANUP=true
timeout 600 node node_modules/@playwright/test/cli.js test --reporter=list --retries 0 --workers 1 2>&1
TEST_EXIT=$?

echo "=== Step 5: Cleanup server ==="
kill $ANALYTICS_PID 2>/dev/null || true

if [ $TEST_EXIT -eq 0 ]; then
  echo "=== ALL TESTS PASSED ==="
else
  echo "=== TESTS FAILED (exit: $TEST_EXIT) ==="
fi

exit $TEST_EXIT
