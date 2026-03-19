$ErrorActionPreference = "Stop"

$ServiceName = "Excellence.WH.Issuer.Server"

Write-Host ""
Write-Host "Restarting $ServiceName..." -ForegroundColor Cyan
Write-Host ""

try {
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if (-not $service) {
        Write-Host "[FAIL] Service not found: $ServiceName" -ForegroundColor Red
        exit 1
    }
    
    if ($service.Status -eq "Running") {
        Write-Host "Stopping service..." -ForegroundColor Yellow
        Stop-Service -Name $ServiceName -Force
        Start-Sleep -Seconds 2
    }
    
    Write-Host "Starting service..." -ForegroundColor Yellow
    Start-Service -Name $ServiceName
    Start-Sleep -Seconds 3
    
    $service = Get-Service -Name $ServiceName
    if ($service.Status -eq "Running") {
        Write-Host ""
        Write-Host "[OK] Service restarted successfully" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Service status: $($service.Status)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[FAIL] $_" -ForegroundColor Red
    exit 1
}
