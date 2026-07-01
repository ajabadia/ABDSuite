@echo off
echo ===================================================
echo 🚀 Iniciando ABDSuite (Entorno de Desarrollo Local)
echo ===================================================
echo.
echo Sincronizando variables de entorno...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\sync-env.ps1"
echo.
echo Limpiando puertos en uso (5000, 5001, 5002, 5003, 5004, 5005, 5020)...
for %%P in (5000 5001 5002 5003 5004 5005 5020) do (
    for /f "tokens=5" %%a in ('netstat -a -n -o ^| findstr :%%P ^| findstr LISTENING') do (
        echo [OK] Matando proceso fantasma PID %%a en el puerto %%P...
        taskkill /F /PID %%a >nul 2>&1
    )
)
echo.

echo Instalando dependencias del workspace...
call pnpm install
echo.

echo Compilando librerias compartidas...
echo [1/4] Compilando @ajabadia/styles...
pushd ABDStyles
call pnpm build
if errorlevel 1 exit /b 1
popd

echo [2/4] Compilando @ajabadia/i18n...
pushd ABDi18n
call pnpm build
if errorlevel 1 exit /b 1
popd

echo [3/4] Compilando @ajabadia/ecosystem-widgets...
pushd ABDEcosystemWidgets
call pnpm build
if errorlevel 1 exit /b 1
popd

echo [4/4] Compilando @ajabadia/satellite-sdk...
pushd ABDSatelliteSDK
call pnpm build
if errorlevel 1 exit /b 1
popd
echo.

echo Limpiando caché de compilación (.next) para evitar errores de rutas...
for %%D in (ABDAuth ABDtenantGobernance ABDQuiz ABDLogs ABDAnalytics ABDLanding ABDFiles) do (
    if exist "%%D\.next" (
        echo [OK] Limpiando %%D\.next...
        rmdir /s /q "%%D\.next"
    )
)
echo.

echo [1/7] Iniciando ABDAuth (Puerto 5001)...
start "ABDAuth (5001)" cmd /k "cd ABDAuth & pnpm run dev"

echo [2/7] Iniciando ABDtenantGobernance (Puerto 5002)...
start "ABDtenantGobernance (5002)" cmd /k "cd ABDtenantGobernance & pnpm run dev"

echo [3/7] Iniciando ABDQuiz (Puerto 5020)...
start "ABDQuiz (5020)" cmd /k "cd ABDQuiz & pnpm run dev"

echo [4/7] Iniciando ABDLogs (Puerto 5003)...
start "ABDLogs (5003)" cmd /k "cd ABDLogs & pnpm run dev"

echo [5/7] Iniciando ABDAnalytics (Puerto 5004)...
start "ABDAnalytics (5004)" cmd /k "cd ABDAnalytics & pnpm run dev"

echo [6/7] Iniciando ABDLanding (Puerto 5000)...
start "ABDLanding (5000)" cmd /k "cd ABDLanding & pnpm run dev"

echo [7/7] Iniciando ABDFiles (Puerto 5005)...
start "ABDFiles (5005)" cmd /k "cd ABDFiles & pnpm run dev"

echo.
echo ===================================================
echo Todos los satelites han sido lanzados.
echo Puedes cerrar esta ventana.
echo ===================================================
