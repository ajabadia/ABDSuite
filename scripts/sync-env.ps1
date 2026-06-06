# 🛰️ ABDSuite — Environment Variables Sync Tool
# Merges .env.shared into each satellite app's .env.local without deleting unique variables.

$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RootDir = Split-Path -Parent $PSScriptRoot
$SharedEnvPath = Join-Path $RootDir ".env.shared"

if (-not (Test-Path $SharedEnvPath)) {
    Write-Host "[ERROR] .env.shared not found at $SharedEnvPath" -ForegroundColor Red
    exit 1
}

# 1. Parse .env.shared into a hashtable
$SharedVars = [ordered]@{}
Get-Content $SharedEnvPath | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line -match "^([^=]+)=(.*)$") {
        $key = $Matches[1].Trim()
        $val = $Matches[2].Trim()
        $SharedVars[$key] = $val
    }
}

# 2. Define target satellite app folders
$Satellites = @(
    "ABDAnalytics",
    "ABDAuth",
    "ABDFiles",
    "ABDLanding",
    "ABDLogs",
    "ABDQuiz",
    "ABDtenantGobernance",
    "ABD___BASE"
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🔄 Sincronizando Variables de Entorno..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

foreach ($Sat in $Satellites) {
    $SatDir = Join-Path $RootDir $Sat
    if (-not (Test-Path $SatDir)) {
        Write-Host "  [WARN] Carpeta no encontrada: $Sat" -ForegroundColor Yellow
        continue
    }

    $EnvLocalPath = Join-Path $SatDir ".env.local"
    
    if (Test-Path $EnvLocalPath) {
        Write-Host "  -> Actualizando $Sat/.env.local..." -ForegroundColor Gray
        
        $lines = Get-Content $EnvLocalPath
        $updatedLines = @()
        $updatedKeys = @{}
        
        foreach ($line in $lines) {
            $trimmed = $line.Trim()
            if ($trimmed -and -not $trimmed.StartsWith("#") -and $trimmed -match "^([^=]+)=(.*)$") {
                $key = $Matches[1].Trim()
                if ($SharedVars.Contains($key)) {
                    # Replace with shared value
                    $updatedLines += "$key=$($SharedVars[$key])"
                    $updatedKeys[$key] = $true
                } else {
                    # Keep original value
                    $updatedLines += $line
                }
            } else {
                # Keep comment or empty line
                $updatedLines += $line
            }
        }
        
        # Check for any new shared vars that weren't in the .env.local
        $hasAppendedHeader = $false
        foreach ($key in $SharedVars.Keys) {
            if (-not $updatedKeys.Contains($key)) {
                if (-not $hasAppendedHeader) {
                    $updatedLines += ""
                    $updatedLines += "# -- Sincronizado automaticamente desde .env.shared --"
                    $hasAppendedHeader = $true
                }
                $updatedLines += "$key=$($SharedVars[$key])"
            }
        }
        
        # Save back
        $updatedLines | Set-Content $EnvLocalPath -Encoding UTF8
    } else {
        Write-Host "  -> Creando nuevo $Sat/.env.local..." -ForegroundColor Green
        # Copy the shared file as base
        Copy-Item $SharedEnvPath -Destination $EnvLocalPath -Force
    }
}

Write-Host "OK: Sincronización de variables de entorno finalizada." -ForegroundColor Green
