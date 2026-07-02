#!/usr/bin/env bash
#
# run-all-e2e.sh — Run ALL E2E tests across the ABDSuite monorepo
#
# Ejecuta los tests E2E de Playwright para:
#   ABDQuiz      (puerto 3300)
#   ABDtenantGovernance (puerto 3500)
#   ABDLogs      (puerto 3600)
#   ABDAnalytics (puerto 3700)
#
# Requisitos:
#   - Bash (Git Bash en Windows)
#   - Node.js 18+
#   - pnpm dependencies instaladas en cada proyecto
#   - .env.local con AUTH_CLIENT_ID, AUTH_CLIENT_SECRET, AUTH_JWT_SECRET
#   - MongoDB Atlas reachable
#
# Uso:
#   bash scripts/run-all-e2e.sh

# Nota: NO usamos set -e porque el loop de tests debe continuar
# incluso si una suite falla. El manejo de errores es explícito.

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RESULT_FILE="/tmp/e2e-results-$$.txt"
SERVER_PIDS=""

# ── Colores ────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ── Config ─────────────────────────────────────────────────────────────
declare -A PORTS
PORTS[ABDQuiz]=3300
PORTS[ABDAuth]=3400
PORTS[ABDtenantGovernance]=3500
PORTS[ABDLogs]=3600
PORTS[ABDAnalytics]=3700

PROJECTS=(ABDQuiz ABDtenantGovernance ABDLogs ABDAnalytics)

# ABDAuth se arranca aparte como dependencia de infraestructura (login previo a tests)
# No se incluye en PROJECTS porque no corre tests propios dentro de este runner.
INFRA_PROJECTS=(ABDAuth)

# ── Trap ────────────────────────────────────────────────────────────────
cleanup_all() {
  echo ""
  echo -e "${YELLOW}=== Cleanup: Stopping all servers ===${NC}"
  for PID in $SERVER_PIDS; do
    kill "$PID" 2>/dev/null || true
  done
  echo "All servers stopped."
}
trap cleanup_all EXIT
# En interrupción (Ctrl+C), también limpiamos RESULT_FILE
# (en salida normal, cleanup_result_file lo hace después del summary)
trap 'cleanup_all; rm -f "$RESULT_FILE"' INT TERM

# ── Limpieza del RESULT_FILE solo después de leerlo ────
cleanup_result_file() {
  rm -f "$RESULT_FILE"
}

# ── Helpers ─────────────────────────────────────────────────────────────
print_banner() {
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "  ABDSuite — Monorepo E2E Test Run"
  echo "  $(date "+%Y-%m-%d %H:%M:%S")"
  echo "═══════════════════════════════════════════════════════"
  echo ""
}

cleanup_port() {
  local PORT=$1
  node "$PROJECT_ROOT/ABDLogs/scripts/cleanup-port.mjs" "$PORT" 2>/dev/null
}

wait_for_port() {
  local PORT=$1
  local LABEL=$2
  local MAX_WAIT=${3:-90}

  for i in $(seq 1 "$MAX_WAIT"); do
    HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT" 2>/dev/null || echo "000")
    if echo "$HTTP_CODE" | grep -qE '2[0-9]{2}|3[0-9]{2}'; then
      echo -e "  ${GREEN}✓${NC} $LABEL ready (HTTP $HTTP_CODE) after ${i}s"
      return 0
    fi
    sleep 2
  done

  echo -e "  ${RED}✗${NC} $LABEL TIMEOUT after ${MAX_WAIT}s"
  return 1
}

start_server() {
  local PROJECT=$1
  local PORT=$2
  local LOGFILE="/tmp/${PROJECT}-server.log"

  cd "$PROJECT_ROOT/$PROJECT"
  echo "  Starting $PROJECT on port $PORT..."
  node node_modules/next/dist/bin/next dev -p "$PORT" --webpack &>"$LOGFILE" &
  local PID=$!
  SERVER_PIDS="$SERVER_PIDS $PID"
  echo "    PID: $PID"
}

run_tests() {
  local PROJECT=$1
  local PORT=$2
  echo ""
  echo "───────────────────────────────────────────────────────"
  echo -e "${CYAN}▶ Running $PROJECT tests (port $PORT)${NC}"
  echo "───────────────────────────────────────────────────────"

  cd "$PROJECT_ROOT/$PROJECT"

  # Use the existing run-e2e.sh for ABDLogs (it has env var handling)
  if [ "$PROJECT" = "ABDLogs" ]; then
    # For ABDLogs, we still use the same pattern: skip cleanup in globalSetup
    export ABDLOGS_SKIP_PORT_CLEANUP=true
    timeout 300 node node_modules/@playwright/test/cli.js test \
      --reporter=list --retries 0 --workers 1 2>&1
    local EXIT_CODE=$?
    unset ABDLOGS_SKIP_PORT_CLEANUP
  else
    timeout 300 node node_modules/@playwright/test/cli.js test \
      --reporter=list --retries 0 --workers 1 2>&1
    local EXIT_CODE=$?
  fi

  cd "$PROJECT_ROOT"

  if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ $PROJECT: ALL PASSED${NC}"
    echo "$PROJECT:PASS" >> "$RESULT_FILE"
  else
    echo -e "${RED}❌ $PROJECT: FAILED (exit $EXIT_CODE)${NC}"
    echo "$PROJECT:FAIL" >> "$RESULT_FILE"
  fi

  return $EXIT_CODE
}

# ── Main ────────────────────────────────────────────────────────────────
print_banner

# ── Step 1: Kill any zombie processes on all ports ─────────────────────
echo -e "${YELLOW}[1/4] Cleaning up ports...${NC}"
for PORT in "${PORTS[@]}"; do
  cleanup_port "$PORT"
done
echo "  All ports cleaned."

# ── Step 2: Start all dev servers + infra dependencies ────────────
echo ""
echo -e "${YELLOW}[2/4] Starting dev servers + dependencies...${NC}"

# Start infra dependencies first (e.g., ABDAuth needed for Governance login)
for PROJECT in "${INFRA_PROJECTS[@]}"; do
  start_server "$PROJECT" "${PORTS[$PROJECT]}"
done

# Then start test projects
for PROJECT in "${PROJECTS[@]}"; do
  start_server "$PROJECT" "${PORTS[$PROJECT]}"
done

# ── Step 3: Wait for all servers to be ready ──────────────────────────
echo ""
echo -e "${YELLOW}[3/4] Waiting for servers to be ready...${NC}"
ALL_SERVERS_READY=true

# Wait for infra dependencies first
for PROJECT in "${INFRA_PROJECTS[@]}"; do
  if ! wait_for_port "${PORTS[$PROJECT]}" "$PROJECT" 120; then
    ALL_SERVERS_READY=false
  fi
done

# Then wait for test project servers
for PROJECT in "${PROJECTS[@]}"; do
  if ! wait_for_port "${PORTS[$PROJECT]}" "$PROJECT" 90; then
    ALL_SERVERS_READY=false
  fi
done

if [ "$ALL_SERVERS_READY" = false ]; then
  echo ""
  echo -e "${RED}❌ One or more servers failed to start. Aborting.${NC}"
  exit 1
fi

# ── Step 4: Run tests for all projects ────────────────────────────────
echo ""
echo -e "${YELLOW}[4/4] Running test suites...${NC}"

TOTAL_PASS=0
TOTAL_FAIL=0

for PROJECT in "${PROJECTS[@]}"; do
  if run_tests "$PROJECT" "${PORTS[$PROJECT]}"; then
    ((TOTAL_PASS++))
  else
    ((TOTAL_FAIL++))
  fi
done

# ── Summary ────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${CYAN}  E2E Test Run Summary${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""

while IFS= read -r LINE; do
  PROJ="${LINE%%:*}"
  STATUS="${LINE##*:}"
  if [ "$STATUS" = "PASS" ]; then
    echo -e "  ${GREEN}✅ $PROJ${NC}"
  else
    echo -e "  ${RED}❌ $PROJ${NC}"
  fi
done < "$RESULT_FILE"

echo ""
echo "  Total: $((TOTAL_PASS + TOTAL_FAIL)) suites"
echo -e "  ${GREEN}Passed: $TOTAL_PASS${NC}"
echo -e "  ${RED}Failed: $TOTAL_FAIL${NC}"
echo ""
echo "═══════════════════════════════════════════════════════"

cleanup_result_file

if [ "$TOTAL_FAIL" -gt 0 ]; then
  echo -e "${RED}❌ Some test suites FAILED.${NC}"
  exit 1
else
  echo -e "${GREEN}✅ ALL TEST SUITES PASSED.${NC}"
  exit 0
fi
