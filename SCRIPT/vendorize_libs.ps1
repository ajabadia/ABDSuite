# ABDFN Suite - Vendorization Script (Era 5 Industrial)
# Purpose: Downloads required libraries to /public/vendor for 100% offline-first operations.

$VendorDir = Join-Path $PSScriptRoot "..\public\vendor"
if (-not (Test-Path $VendorDir)) {
    New-Item -ItemType Directory -Path $VendorDir | Out-Null
    Write-Host "[INFO] Creada carpeta de vendor: $VendorDir" -ForegroundColor Cyan
}

$Libraries = @(
    @{ url = "https://unpkg.com/docx-preview@0.3.2/dist/docx-preview.js"; name = "docx-preview.js" },
    @{ url = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"; name = "html2canvas.min.js" },
    @{ url = "https://unpkg.com/jszip@3.10.1/dist/jszip.min.js"; name = "jszip.min.js" },
    @{ url = "https://unpkg.com/handlebars@4.7.7/dist/handlebars.min.js"; name = "handlebars.min.js" },
    @{ url = "https://unpkg.com/docxtemplater@3.37.2/build/docxtemplater.js"; name = "docxtemplater.js" },
    @{ url = "https://unpkg.com/pizzip@3.1.4/dist/pizzip.min.js"; name = "pizzip.min.js" }
)

Write-Host "[START] Iniciando descarga masiva de activos industriales..." -ForegroundColor Yellow

foreach ($lib in $Libraries) {
    $targetPath = Join-Path $VendorDir $lib.name
    Write-Host " -> Descargando $($lib.name)..." -NoNewline
    try {
        Invoke-WebRequest -Uri $lib.url -OutFile $targetPath -UseBasicParsing
        Write-Host " [OK]" -ForegroundColor Green
    } catch {
        Write-Host " [FAIL]" -ForegroundColor Red
        Write-Error "Error descargando $($lib.url): $_"
    }
}

Write-Host "[DONE] Vendorization completada. El sistema ya es offline-first." -ForegroundColor Green
