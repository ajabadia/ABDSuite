$ErrorActionPreference = 'Stop'
$serverProcess = $null

$PORT = 3900

Write-Host "=== Run E2E Tests for ABD___BASE ===" -ForegroundColor Cyan

try {
  Write-Host "Starting dev server on port $PORT..." -ForegroundColor Yellow
  $serverProcess = Start-Process -FilePath "pnpm" -ArgumentList "next dev -p $PORT --webpack" -NoNewWindow -PassThru

  $ready = $false
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 2
    try {
      $response = Invoke-WebRequest -Uri "http://localhost:$PORT" -TimeoutSec 2 -UseBasicParsing
      if ($response.StatusCode -ge 200 -and $response.StatusCode -le 499) {
        $ready = $true
        break
      }
    } catch {
      # server not ready yet
    }
  }

  if (-not $ready) {
    throw "Dev server did not start within 60 seconds on port $PORT"
  }
  Write-Host "Dev server is ready." -ForegroundColor Green

  Write-Host "Running Playwright tests..." -ForegroundColor Yellow
  $testExit = 0
  & pnpm exec playwright test --reporter=list --retries 0 --workers 1
  $testExit = $LASTEXITCODE

  if ($testExit -ne 0) {
    Write-Host "Some tests failed." -ForegroundColor Red
  } else {
    Write-Host "All tests passed." -ForegroundColor Green
  }
  exit $testExit
} finally {
  if ($serverProcess -and -not $serverProcess.HasExited) {
    $serverProcess.Kill()
    Write-Host "Dev server stopped." -ForegroundColor Gray
  }
}
