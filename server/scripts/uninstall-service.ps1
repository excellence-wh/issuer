# Windows Service Uninstallation Script for Excellence Issuer Server
# Run as Administrator

$ServiceName = "ExcellenceIssuerServer"
$WorkingDir = "D:\excellence.wh\projects\issuer\server"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Excellence Issuer Server - Service Uninstaller"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] Please run this script as Administrator!" -ForegroundColor Red
    exit 1
}

# Check if service exists
$service = Get-Service $ServiceName -ErrorAction SilentlyContinue
if (-not $service) {
    Write-Host "[INFO] Service '$ServiceName' not found." -ForegroundColor Yellow
    exit 0
}

# Stop service
Write-Host "[1/2] Stopping service..." -ForegroundColor Yellow
if ($service.Status -eq "Running") {
    Stop-Service $ServiceName -Force
    Write-Host "  Service stopped" -ForegroundColor Green
} else {
    Write-Host "  Service not running" -ForegroundColor Yellow
}

Start-Sleep -Seconds 2

# Remove service
Write-Host "[2/2] Removing service..." -ForegroundColor Yellow
$nssmPath = "$env:ProgramFiles\nssm\nssm.exe"
if (Test-Path $nssmPath) {
    & $nssmPath remove $ServiceName confirm
    Write-Host "  Service removed" -ForegroundColor Green
} else {
    Write-Host "[WARNING] NSSM not found, trying sc delete..." -ForegroundColor Yellow
    sc.exe delete $ServiceName
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Service uninstalled successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Log files in '$WorkingDir\logs' were not deleted."
Write-Host "      You can delete them manually if needed."
