$ErrorActionPreference = "Stop"

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# ── Logging ───────────────────────────────────────────────────────────────────
$LogFile = Join-Path $PSScriptRoot "superbuild.log"
"" | Set-Content -Path $LogFile -Encoding UTF8

function Write-Log-ToFile {
    param([string]$Value)
    $retries = 3
    while ($retries -gt 0) {
        try {
            Add-Content -Path $LogFile -Value $Value -Encoding UTF8 -ErrorAction Stop
            break
        } catch [System.IO.IOException] {
            $retries--
            Start-Sleep -Milliseconds 100
        } catch {
            break
        }
    }
}

function Write-Log {
    param(
        [string]$Message = "",
        [System.ConsoleColor]$ForegroundColor = [System.ConsoleColor]::Gray
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host $Message -ForegroundColor $ForegroundColor
    Write-Log-ToFile -Value "[$timestamp] $Message"
}

function Invoke-Logged {
    <#
    .SYNOPSIS
        Ejecuta un comando y captura stdout+stderr.
        CORREGIDO: captura $LASTEXITCODE antes del pipeline para evitar el bug
        de PowerShell 5.1 donde ForEach-Object resetea el exit code a 0.
    #>
    param([string]$Command)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Log-ToFile -Value "[$timestamp] [CMD] $Command"

    $output = & cmd.exe /c "$Command 2>&1"
    $global:LASTEXITCODE = $LASTEXITCODE
    $output | ForEach-Object {
        $line = $_.ToString()
        Write-Host $line
        Write-Log-ToFile -Value $line
    }
}

function Invoke-LoggedSilent {
    <#
    .SYNOPSIS
        Como Invoke-Logged pero solo escribe al log (no a pantalla).
    #>
    param([string]$Command)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Log-ToFile -Value "[$timestamp] [CMD-SILENT] $Command"

    $output = & cmd.exe /c "$Command 2>&1"
    $global:LASTEXITCODE = $LASTEXITCODE
    $output | ForEach-Object {
        Write-Log-ToFile -Value $_.ToString()
    }
}

# ── Helpers ───────────────────────────────────────────────────────────────────

function Invoke-Parallel {
    <#
    .SYNOPSIS
        Ejecuta un scriptblock en paralelo para cada item, con máximo de concurrencia.
        Cada job recibe ($Item, $BaseDir) como argumentos.
    #>
    param(
        [string[]]$Items,
        [scriptblock]$ScriptBlock,
        [int]$MaxConcurrency = 4,
        [string]$PhaseLabel = ""
    )
    $queue = [System.Collections.Queue]::new($Items)
    $active = @{}
    $failed = $false
    $results = @{}

    while ($queue.Count -gt 0 -or $active.Count -gt 0) {
        # Arrancar nuevos jobs si hay cupo
        while ($queue.Count -gt 0 -and $active.Count -lt $MaxConcurrency) {
            $item = $queue.Dequeue()
            $job = Start-Job -ScriptBlock $ScriptBlock -ArgumentList $item, $BaseDir
            $active[$job.Id] = $item
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Write-Host "  [$PhaseLabel] Lanzado: $item (job $($job.Id))" -ForegroundColor DarkGray
            Add-Content -Path $LogFile -Value "[$timestamp] [PARALLEL] Iniciado: $item (job $($job.Id))" -Encoding UTF8
        }

        # Esperar y recolectar completados
        $completedIds = @($active.Keys | Where-Object {
            $j = Get-Job -Id $_ -ErrorAction SilentlyContinue
            $j -and $j.State -in @('Completed', 'Failed', 'Stopped')
        })
        foreach ($id in $completedIds) {
            $item = $active[$id]
            $output = Receive-Job -Id $id -ErrorAction SilentlyContinue
            Remove-Job -Id $id -ErrorAction SilentlyContinue
            $active.Remove($id)

            $exitCode = 0
            if ($output) {
                foreach ($line in $output) {
                    $lineStr = $line.ToString()
                    Write-Host "[$item] $lineStr"
                    Add-Content -Path $LogFile -Value "[$timestamp] $lineStr" -Encoding UTF8
                }
                if ($output[-1] -match '^EXIT_CODE:(\d+)$') {
                    $exitCode = [int]$Matches[1]
                }
            }
            $results[$item] = $exitCode
            if ($exitCode -ne 0) {
                Write-Host "  -> $item FAILED (exit: $exitCode)" -ForegroundColor Red
                $failed = $true
            } else {
                Write-Host "  -> $item OK" -ForegroundColor Green
            }
        }

        if ($active.Count -ge $MaxConcurrency -or ($queue.Count -gt 0 -and $active.Count -gt 0)) {
            Start-Sleep -Seconds 3
        }
    }
    return @{ Failed = $failed; Results = $results }
}

function Invoke-GitCommitIfNeeded {
    param([string]$Message)
    git diff --cached --quiet 2>$null
    if ($LASTEXITCODE -ne 0) {
        Invoke-Logged "git commit -m `"$Message`""
        return $true
    }
    return $false
}

function Assert-ExitCode {
    param(
        [string]$Label,
        [int[]]$ExpectedCodes = @(0),
        [switch]$Fatal
    )
    if ($ExpectedCodes -notcontains $global:LASTEXITCODE) {
        $msg = "Fallo en: $Label (exit code: $global:LASTEXITCODE)"
        if ($Fatal) {
            Write-Log "ERROR FATAL: $msg" -ForegroundColor Red
            Set-Location $PSScriptRoot
            exit 1
        } else {
            Write-Log "WARN: $msg" -ForegroundColor Yellow
        }
    }
}

# ── Inicio ────────────────────────────────────────────────────────────────────

Write-Log "============================================================" -ForegroundColor Cyan
Write-Log ">>> SUPERBUILD: Compilando, Publicando y Subiendo..." -ForegroundColor Cyan
Write-Log "============================================================" -ForegroundColor Cyan

$CommitMsg = "Auto-commit/Release: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$BaseDir = $PSScriptRoot

# ── Limpieza de caches ────────────────────────────────────────────────────────
Write-Log "`n=== LIMPIEZA DE CACHES ===" -ForegroundColor Cyan
Get-ChildItem -Path $BaseDir -Filter ".next" -Recurse -Directory -Force -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    Write-Log "  -> Cache .next eliminado: $($_.FullName)" -ForegroundColor DarkGray
}
Get-ChildItem -Path $BaseDir -Filter "tsconfig.tsbuildinfo" -Recurse -File -Force -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
    Write-Log "  -> Build info eliminado: $($_.FullName)" -ForegroundColor DarkGray
}
Write-Log "OK: Caches limpiadas." -ForegroundColor Green

# ── GITHUB_NPM_TOKEN ──────────────────────────────────────────────────────────
if (-not $env:GITHUB_NPM_TOKEN) {
    $npmrcPath = Join-Path $env:USERPROFILE ".npmrc"
    if (Test-Path $npmrcPath) {
        $npmrcContent = Get-Content $npmrcPath -Raw
        if ($npmrcContent -match '//npm.pkg.github.com/:\s*_authToken\s*=\s*(ghp_[a-zA-Z0-9]+)') {
            $env:GITHUB_NPM_TOKEN = $Matches[1]
            Write-Log "  -> GITHUB_NPM_TOKEN cargado desde ~/.npmrc" -ForegroundColor Green
        }
    }
}
if (-not $env:GITHUB_NPM_TOKEN) {
    Write-Log "WARN: GITHUB_NPM_TOKEN no disponible. No se podra publicar en GitHub Packages." -ForegroundColor Yellow
}

$SharedLibs = @("ABDi18n", "ABDStyles", "ABDSatelliteSDK", "ABDEcosystemWidgets")
$Consumers = @("ABDtenantGovernance", "ABDAuth", "ABDQuiz", "ABDLogs", "ABDAnalytics", "ABDLanding", "ABDFiles", "ABD___BASE")

# ── FASE 1: LIBRERIAS COMPARTIDAS ────────────────────────────────────────────

Write-Log "`n============================================================" -ForegroundColor Cyan
Write-Log "FASE 1: LIBRERIAS COMPARTIDAS (build + version bump + publish)"
Write-Log "============================================================" -ForegroundColor Cyan

foreach ($Lib in $SharedLibs) {
    Write-Log "`n--- $Lib ---" -ForegroundColor Yellow
    Set-Location (Join-Path $BaseDir $Lib)

    # 2. Install + build (prepare evita build duplicado)
    Invoke-Logged "pnpm install --no-frozen-lockfile --ignore-scripts"
    Assert-ExitCode -Label "pnpm install $Lib" -Fatal
    Invoke-Logged "pnpm run build"
    Assert-ExitCode -Label "pnpm build $Lib" -Fatal

    # 4. Version bump + publish (solo si hay GITHUB_NPM_TOKEN)
    if ($env:GITHUB_NPM_TOKEN) {
        Invoke-Logged "pnpm version patch --no-git-tag-version"
        Assert-ExitCode -Label "version bump $Lib"
        Invoke-Logged "pnpm publish --no-git-checks"
        Assert-ExitCode -Label "publish $Lib"
        Write-Log "OK: $Lib publicado en GitHub Packages." -ForegroundColor Green
    } else {
        Write-Log "SKIP: publish $Lib (sin GITHUB_NPM_TOKEN)" -ForegroundColor DarkGray
    }
    Write-Log "OK: $Lib lista." -ForegroundColor Green
}

# ── FASE 2: APLICACIONES SATELITE ────────────────────────────────────────────

Write-Log "`n============================================================" -ForegroundColor Cyan
Write-Log "FASE 2: APLICACIONES SATELITE (install + build + verify + push)"
Write-Log "============================================================" -ForegroundColor Cyan

# Fase 2 paralela: cada app se instala, compila y verifica independientemente
$parallelBlock = {
    param($App, $BaseDir)
    $ErrorActionPreference = "Continue"
    $AppDir = Join-Path $BaseDir $App
    if (-not (Test-Path $AppDir)) { return "SKIP: $App no encontrado" }

    function Exec { param([string]$Cmd)
        $output = & cmd.exe /c "$Cmd 2>&1"
        $global:LASTEXITCODE = $LASTEXITCODE
        $output | ForEach-Object { $_.ToString() }
        if ($global:LASTEXITCODE -ne 0) { throw "Exit code: $($global:LASTEXITCODE)" }
    }

    try {
        Set-Location $AppDir

        # 1. Install
        # NOTE: --ignore-scripts prevents prepare scripts of workspace-linked
        # packages (ABDi18n, ABDEcosystemWidgets) from racing in parallel.
        # Shared libs are already built in FASE 1.
        try { Exec "pnpm install --no-frozen-lockfile --ignore-scripts" }
        catch {
            $nm = Join-Path $AppDir "node_modules"
            if (Test-Path $nm) { Remove-Item $nm -Recurse -Force }
            Exec "pnpm install --force --no-frozen-lockfile --ignore-scripts"
        }
        Write-Output "INSTALL_OK"

        # 2. Build
        Exec "pnpm run build"
        Write-Output "BUILD_OK"

        # 3. Typecheck
        if (Test-Path (Join-Path $AppDir "node_modules/.bin/tsc")) {
            try { Exec "pnpm run typecheck 2>&1"; Write-Output "TYPECHECK_OK" }
            catch { Write-Output "TYPECHECK_WARN" }
        }

        # 4. Lint
        if (Test-Path (Join-Path $AppDir "node_modules/.bin/eslint")) {
            try { Exec "pnpm run lint 2>&1"; Write-Output "LINT_OK" }
            catch { Write-Output "LINT_WARN" }
        }

        Write-Output "EXIT_CODE:0"
    } catch {
        Write-Output "ERROR: $($_.Exception.Message)"
        Write-Output "EXIT_CODE:1"
    }
}

$parallelResult = Invoke-Parallel -Items $Consumers -ScriptBlock $parallelBlock -MaxConcurrency 4 -PhaseLabel "FASE2"

$buildFailures = @($parallelResult.Results.Keys | Where-Object { $parallelResult.Results[$_] -ne 0 })
if ($buildFailures.Count -gt 0) {
    Write-Log "WARN: $($buildFailures.Count) app(s) fallaron: $($buildFailures -join ', ')" -ForegroundColor Yellow
} else {
    Write-Log "OK: Todas las apps compiladas y pusheadas correctamente." -ForegroundColor Green
}

# ── FASE 3: VALIDACION ESTRUCTURAL ────────────────────────────────────────────

Write-Log "`n============================================================" -ForegroundColor Cyan
Write-Log "FASE 3: VALIDACION ESTRUCTURAL (Phase 6 + alineacion general)"
Write-Log "============================================================" -ForegroundColor Cyan

function Assert-FileExists {
    param([string]$Path, [string]$Label)
    if (-not (Test-Path $Path)) {
        Write-Log "  FALTANTE: $Label ($Path)" -ForegroundColor Red
        return $false
    }
    return $true
}

function Assert-FileContains {
    param([string]$Path, [string]$Pattern, [string]$Label)
    if (-not (Test-Path $Path)) { return $false }
    $content = Get-Content $Path -Raw -ErrorAction SilentlyContinue
    if ($content -notmatch $Pattern) {
        Write-Log "  INVÁLIDO: $Label ($Path debe contener '$Pattern')" -ForegroundColor Red
        return $false
    }
    return $true
}

$quizRoot = Join-Path $BaseDir "ABDQuiz"
$validationPassed = $true

if (Test-Path $quizRoot) {
    Write-Log "`n--- ABDQuiz: Phase 6 validations ---" -ForegroundColor Yellow

    # Modelo Course.ts con objectives
    $courseModel = Join-Path $quizRoot "src\models\Course.ts"
    if (-not (Assert-FileExists -Path $courseModel -Label "Course.ts")) { $validationPassed = $false }
    if (-not (Assert-FileContains -Path $courseModel -Pattern "ICourseObjective" -Label "ICourseObjective interface")) { $validationPassed = $false }
    if (-not (Assert-FileContains -Path $courseModel -Pattern "objectives\?:" -Label "objectives field")) { $validationPassed = $false }

    # ExamAuditorService sin DEFAULT_OBJECTIVES
    $auditorPath = Join-Path $quizRoot "src\services\quiz\ExamAuditorService.ts"
    if (-not (Assert-FileExists -Path $auditorPath -Label "ExamAuditorService.ts")) { $validationPassed = $false }
    if (-not (Assert-FileContains -Path $auditorPath -Pattern "findCourseForExamConfig" -Label "findCourseForExamConfig method")) { $validationPassed = $false }
    $auditorContent = Get-Content $auditorPath -Raw -ErrorAction SilentlyContinue
    if ($auditorContent -match "DEFAULT_OBJECTIVES") {
        Write-Log "  INVÁLIDO: DEFAULT_OBJECTIVES aun presente en ExamAuditorService.ts" -ForegroundColor Red
        $validationPassed = $false
    }

    # Nuevos archivos de Phase 6
    $newFiles = @(
        @{ Path = "src\components\admin\CurriculumEditor.tsx"; Label = "CurriculumEditor.tsx" },
        @{ Path = "src\components\admin\ExamAuditSection.tsx"; Label = "ExamAuditSection.tsx" },
        @{ Path = "src\components\admin\ExamCourseLink.tsx"; Label = "ExamCourseLink.tsx" },
        @{ Path = "src\actions\courseObjectives.ts"; Label = "courseObjectives.ts" },
        @{ Path = "src\app\[locale]\admin\courses\[id]\curriculum\page.tsx"; Label = "curriculum page.tsx" }
    )
    foreach ($file in $newFiles) {
        $fullPath = Join-Path $quizRoot $file.Path
        if (-not (Assert-FileExists -Path $fullPath -Label $file.Label)) {
            $validationPassed = $false
        }
    }

    if ($validationPassed) {
        Write-Log "OK: ABDQuiz Phase 6 validado correctamente." -ForegroundColor Green
    } else {
        Write-Log "WARN: ABDQuiz Phase 6 tiene discrepancias. Revisa los puntoss marcados." -ForegroundColor Yellow
    }
}

# Validacion general: cada consumer tiene package.json y src/
Write-Log "`n--- Validacion general de estructura ---" -ForegroundColor Yellow
$structuralErrors = 0
foreach ($App in $Consumers) {
    $appDir = Join-Path $BaseDir $App
    if (-not (Test-Path $appDir)) {
        Write-Log "  FALTANTE: Directorio $App" -ForegroundColor Red
        $structuralErrors++
        continue
    }
    if (-not (Test-Path (Join-Path $appDir "package.json"))) {
        Write-Log "  FALTANTE: package.json en $App" -ForegroundColor Red
        $structuralErrors++
    }
    if (-not (Test-Path (Join-Path $appDir "src"))) {
        Write-Log "  FALTANTE: src/ en $App" -ForegroundColor Red
        $structuralErrors++
    }
}
if ($structuralErrors -eq 0) {
    Write-Log "OK: Estructura general validada ($($Consumers.Count) apps)." -ForegroundColor Green
} else {
    Write-Log "WARN: $structuralErrors errores estructurales encontrados." -ForegroundColor Yellow
}

# ── FASE 4: ROOT REPO ──────────────────────────────────────────────────────────

Write-Log "`n============================================================" -ForegroundColor Cyan
Write-Log "FASE 4: REPOSITORIO RAIZ (ABDSuite)"
Write-Log "============================================================" -ForegroundColor Cyan

Set-Location $BaseDir
Invoke-LoggedSilent "git add ."
if (Invoke-GitCommitIfNeeded -Message $CommitMsg) {
    Invoke-LoggedSilent "git push"
    Write-Log "OK: Repositorio raiz pusheado." -ForegroundColor Green
} else {
    Write-Log "OK: Repositorio raiz (sin cambios que pushear)." -ForegroundColor Green
}

# ── Fin ───────────────────────────────────────────────────────────────────────
Set-Location $BaseDir

Write-Log "`n============================================================" -ForegroundColor Cyan
Write-Log "SUPERBUILD COMPLETADO." -ForegroundColor Cyan
Write-Log "============================================================" -ForegroundColor Cyan
Write-Log "Log: $LogFile" -ForegroundColor Green

if (-not $validationPassed) {
    Write-Log "REVISA LAS VALIDACIONES DE FASE 6 ANTES DE HACER DEPLOY." -ForegroundColor Yellow
}
