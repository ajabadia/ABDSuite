# check-vercel-deployments.ps1
# Script de utilidad para verificar el estado de los ultimos despliegues de la suite en Vercel.

$ErrorActionPreference = "Continue"

$Projects = @(
  "abd-landing",
  "abd-analytics",
  "abd-logs",
  "abd-quiz",
  "abd-auth",
  "abd-tenant-gobernance",
  "abd-files"
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   MONITOREO DE DESPLIEGUES EN VERCEL (ULTIMO DEPLOY)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

foreach ($Project in $Projects) {
  Write-Host "Proyecto: [$Project]..." -ForegroundColor Yellow -NoNewline
  
  # 1. Obtener la lista de despliegues
  $listOutput = vercel list $Project 2>&1
  $url = $null
  
  foreach ($line in $listOutput) {
    if ($line -match "(https://[a-zA-Z0-9.-]*$Project[a-zA-Z0-9.-]*\.vercel\.app)") {
      $url = $Matches[1]
      break
    }
  }
  
  if (-not $url) {
    Write-Host "`rProyecto: [$Project] - [WARN] No se encontro ninguna URL de despliegue." -ForegroundColor Red
    continue
  }
  
  # 2. Inspeccionar el despliegue en formato JSON
  $inspectJsonRaw = vercel inspect $url --json 2>&1
  
  # Filtrar lineas no deseadas antes del JSON (como "Fetching deployment...")
  $jsonLines = @()
  $startJson = $false
  foreach ($line in $inspectJsonRaw) {
    if ($line -match "^\s*\{") { $startJson = $true }
    if ($startJson) { $jsonLines += $line }
  }
  
  $jsonStr = $jsonLines -join [char]10
  
  try {
    $inspect = ConvertFrom-Json $jsonStr
  } catch {
    Write-Host "`rProyecto: [$Project] - [ERROR] Fallo al parsear JSON de inspeccion." -ForegroundColor Red
    Write-Host "   URL: $url" -ForegroundColor DarkGray
    continue
  }
  
  # 3. Procesar datos del despliegue
  $state = $inspect.readyState
  $createdTime = [DateTimeOffset]::FromUnixTimeMilliseconds($inspect.createdAt).LocalDateTime.ToString("yyyy-MM-dd HH:mm:ss")
  
  # Color del estado
  $color = "Green"
  if ($state -eq "ERROR") { $color = "Red" }
  elseif ($state -eq "BUILDING") { $color = "Yellow" }
  
  Write-Host "`rProyecto: [$Project]" -ForegroundColor Cyan
  Write-Host "  |-- Estado:    [$state]" -ForegroundColor $color
  Write-Host "  |-- Creado:    $createdTime" -ForegroundColor Gray
  Write-Host "  |-- URL:       $url" -ForegroundColor Blue
  
  # 4. Si hay error, extraer el log de compilacion
  if ($state -eq "ERROR") {
    Write-Host "  |-- Detalles del Error de Compilacion:" -ForegroundColor Red
    
    $logsOutput = vercel inspect $url --logs 2>&1
    $errorLines = @()
    
    # Filtrar logs de utilidad
    foreach ($logLine in $logsOutput) {
      if ($logLine -match "ERR_" -or $logLine -match "Error:" -or $logLine -match "failed" -or $logLine -match "exited with") {
        $cleanLine = $logLine -replace '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\s*', ''
        $errorLines += "         * $cleanLine"
      }
    }
    
    # Si no se capturaron lineas de error especificas, mostrar las ultimas 10 lineas utiles
    if ($errorLines.Count -eq 0) {
      $cleanLogs = @()
      foreach ($logLine in $logsOutput) {
        if ($logLine -notmatch "node.exe" -and $logLine -notmatch "En C:\\" -and $logLine -notmatch "\+\s*&" -and $logLine -notmatch "CategoryInfo") {
          $cleanLogs += $logLine -replace '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\s*', ''
        }
      }
      $startIndex = [Math]::Max(0, $cleanLogs.Count - 10)
      for ($i = $startIndex; $i -lt $cleanLogs.Count; $i++) {
        $errorLines += "         * $($cleanLogs[$i])"
      }
    }
    
    # Imprimir errores
    foreach ($err in $errorLines) {
      Write-Host $err -ForegroundColor DarkRed
    }
  }
  
  Write-Host ""
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Fin del reporte." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
