# kill_dev_server.ps1
# Kills any running Vite/Node dev server processes on the default ports (5173, 3000)

Write-Host "[INFO] Buscando procesos del servidor de desarrollo..." -ForegroundColor Cyan

$ports = @(5173, 3000, 4173)
$killed = $false

foreach ($port in $ports) {
    $connections = netstat -ano | Select-String ":$port " | Select-String "LISTENING"
    foreach ($conn in $connections) {
        $parts = $conn.ToString().Trim() -split '\s+'
        $processId = $parts[-1]
        if ($processId -match '^\d+$' -and $processId -ne '0') {
            try {
                $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "  Terminando proceso: $($proc.ProcessName) (PID: $processId) en puerto $port" -ForegroundColor Yellow
                    Stop-Process -Id $processId -Force
                    $killed = $true
                }
            } catch {
                Write-Host "  No se pudo terminar PID $processId : $_" -ForegroundColor Red
            }
        }
    }
}

if (-not $killed) {
    Write-Host "  No se encontraron procesos activos en los puertos $($ports -join ', ')" -ForegroundColor Green
} else {
    Write-Host "[OK] Servidor detenido correctamente." -ForegroundColor Green
}
