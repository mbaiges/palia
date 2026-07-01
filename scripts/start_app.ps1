# start_app.ps1
# Kills any existing dev server, installs dependencies if needed, then starts the app

param(
    [switch]$NoKill,
    [switch]$SkipInstall
)

$AppDir = Split-Path -Parent $PSScriptRoot

Write-Host "🚀 Palia - Iniciando servidor de desarrollo" -ForegroundColor Cyan
Write-Host "   Directorio: $AppDir" -ForegroundColor Gray
Write-Host ""

# Kill existing server unless -NoKill is specified
if (-not $NoKill) {
    Write-Host "⏹  Verificando procesos existentes..." -ForegroundColor Yellow
    & "$PSScriptRoot\kill_dev_server.ps1"
    Write-Host ""
}

# Install dependencies
if (-not $SkipInstall) {
    Write-Host "📦 Verificando dependencias (npm install)..." -ForegroundColor Yellow
    Set-Location $AppDir
    npm install --silent
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error en npm install" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencias listas." -ForegroundColor Green
    Write-Host ""
}

# Start dev server
Write-Host "▶  Iniciando servidor Vite en http://localhost:5173 ..." -ForegroundColor Cyan
Write-Host "   Presiona Ctrl+C para detener el servidor." -ForegroundColor Gray
Write-Host ""

Set-Location $AppDir
npm run dev
