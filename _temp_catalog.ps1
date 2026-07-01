$ErrorActionPreference = 'Stop'
$catalog = @{}
Get-Content "D:\desarrollos\ABDSuite\pnpm-workspace.yaml" | Select-Object -Skip 16 | Select-Object -First 36 | ForEach-Object {
    if ($_ -match "^\s+['""]?([\w@/-]+)['""]?:\s+(\S+)") {
        $catalog[$Matches[1]] = $Matches[2]
    }
}
Write-Host "Catalog entries: $($catalog.Count)"
$apps = @(
    "ABDAnalytics", "ABDAuth", "ABDLanding", "ABDLogs",
    "ABDQuiz", "ABDFiles", "ABDtenantGobernance", "ABD___BASE"
)
$totalReplaced = 0
foreach ($app in $apps) {
    $path = "D:\desarrollos\ABDSuite\$app\package.json"
    $json = Get-Content $path -Raw | ConvertFrom-Json
    $changed = $false
    foreach ($section in @('dependencies', 'devDependencies')) {
        if ($null -ne $json.$section) {
            $deps = $json.$section
            $newDeps = @{}
            foreach ($key in $deps.PSObject.Properties.Name) {
                $val = $deps.$key
                if ($catalog.ContainsKey($key) -and $val -ne 'catalog:') {
                    $newDeps[$key] = 'catalog:'
                    $totalReplaced++
                    $changed = $true
                } else {
                    $newDeps[$key] = $val
                }
            }
            $json.$section = $newDeps
        }
    }
    if ($changed) {
        $jsonStr = $json | ConvertTo-Json -Depth 10
        Set-Content -Path $path -Value $jsonStr -NoNewline
        Write-Host "Updated: $app" -ForegroundColor Green
    }
}
Write-Host "Total replacements: $totalReplaced" -ForegroundColor Cyan
