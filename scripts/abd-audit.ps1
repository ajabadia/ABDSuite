# ABD Suite - ROOT AUDIT DELEGATOR
# Runs the global audit orchestrator.
$AuditScript = Join-Path $PSScriptRoot "audit-all.mjs"

if (Test-Path $AuditScript) {
    node $AuditScript
    exit $LASTEXITCODE
} else {
    Write-Host "`nError: Global audit script not found at $AuditScript." -ForegroundColor Red
    exit 1
}
