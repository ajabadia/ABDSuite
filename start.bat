@echo off
SET PORT=4100
echo.
echo ==========================================
echo    ABDFN UNIFIED SUITE - INICIO LOCAL
echo ==========================================
echo.

IF NOT EXIST node_modules (
    echo [1/3] Instalando dependencias necesarias...
    call npm install
) ELSE (
    echo [1/3] Dependencias ya instaladas.
)

echo [2/3] Iniciando servidor en puerto %PORT%...
start /b npm run dev -- -p %PORT%

echo [3/3] Abriendo navegador en http://localhost:%PORT%...
timeout /t 5 /nobreak > nul
start http://localhost:%PORT%

echo.
echo Herramienta lista y corriendo en segundo plano.
echo Presiona Ctrl+C en esta ventana para detener el servidor.
echo.
pause
