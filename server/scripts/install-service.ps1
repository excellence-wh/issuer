# Windows Service Installation Script for Excellence Issuer Server
# Run as Administrator

$ServiceName = "ExcellenceIssuerServer"
$DisplayName = "Excellence Issuer Server"
$Description = "Mercurial API server for browser extension"
$WorkingDir = "D:\excellence.wh\projects\issuer\server"
$AppPath = "$WorkingDir\node_modules\bun\bin\bun.exe"
$ScriptPath = "$WorkingDir\src\index.ts"
$Port = 3001
$StartupType = "Automatic"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Excellence Issuer Server - Service Installer"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] Please run this script as Administrator!" -ForegroundColor Red
    Write-Host "Right-click -> Run with PowerShell as Administrator" -ForegroundColor Yellow
    exit 1
}

# Check if bun is installed
Write-Host "[1/5] Checking Bun installation..." -ForegroundColor Yellow
if (-not (Test-Path $AppPath)) {
    Write-Host "[ERROR] Bun not found at: $AppPath" -ForegroundColor Red
    Write-Host "Please run: cd $WorkingDir && pnpm install" -ForegroundColor Yellow
    exit 1
}
Write-Host "  Bun found: $AppPath" -ForegroundColor Green

# Check if script exists
if (-not (Test-Path $ScriptPath)) {
    Write-Host "[ERROR] Script not found at: $ScriptPath" -ForegroundColor Red
    exit 1
}
Write-Host "  Script found: $ScriptPath" -ForegroundColor Green

# Install NSSM if not present
Write-Host "[2/5] Checking NSSM installation..." -ForegroundColor Yellow
$nssmPath = "$env:ProgramFiles\nssm\nssm.exe"
if (-not (Test-Path $nssmPath)) {
    Write-Host "  NSSM not found. Installing via chocolatey..." -ForegroundColor Yellow

    # Check if chocolatey is installed
    $choco = Get-Command choco -ErrorAction SilentlyContinue
    if (-not $choco) {
        Write-Host "  Installing chocolatey..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    }

    choco install nssm -y
    Start-Sleep -Seconds 5
}

if (Test-Path $nssmPath) {
    Write-Host "  NSSM found: $nssmPath" -ForegroundColor Green
} else {
    Write-Host "[ERROR] NSSM installation failed. Please install manually:" -ForegroundColor Red
    Write-Host "  choco install nssm" -ForegroundColor Yellow
    exit 1
}

# Stop existing service if running
Write-Host "[3/5] Stopping existing service (if any)..." -ForegroundColor Yellow
$service = Get-Service $ServiceName -ErrorAction SilentlyContinue
if ($service) {
    if ($service.Status -eq "Running") {
        Stop-Service $ServiceName -Force
        Start-Sleep -Seconds 2
        Write-Host "  Stopped existing service" -ForegroundColor Yellow
    }
}

# Remove existing service
Write-Host "[4/5] Removing existing service..." -ForegroundColor Yellow
$existing = Get-Service $ServiceName -ErrorAction SilentlyContinue
if ($existing) {
    & $nssmPath remove $ServiceName confirm
    Write-Host "  Removed existing service" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}

# Create new service
Write-Host "[5/5] Creating Windows service..." -ForegroundColor Yellow

& $nssmPath install $ServiceName $AppPath
& $nssmPath set $ServiceName AppParameters "run --port $Port $ScriptPath"
& $nssmPath set $ServiceName AppDirectory $WorkingDir
& $nssmPath set $ServiceName DisplayName $DisplayName
& $nssmPath set $ServiceName Description $Description
& $nssmPath set $ServiceName Start $StartupType
& $nssmPath set $ServiceName AppStdout "$WorkingDir\logs\service.log"
& $nssmPath set $ServiceName AppStderr "$WorkingDir\logs\error.log"
& $nssmPath set $ServiceName AppStdoutCreationDisposition 4
& $nssmPath set $ServiceName AppStderrCreationDisposition 4
& $nssmPath set $ServiceName AppRotateFiles 1
& $nssmPath set $ServiceName AppRotateOnline 1
& $nssmPath set $ServiceName AppRotateBytes 1048576

# Create logs directory
if (-not (Test-Path "$WorkingDir\logs")) {
    New-Item -ItemType Directory -Path "$WorkingDir\logs" -Force | Out-Null
}

# Set service to restart on failure
& $nssmPath set $ServiceName AppRestartDelay 5000

Write-Host "" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Service installed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service Name: $ServiceName"
Write-Host "Port: $Port"
Write-Host "Working Dir: $WorkingDir"
Write-Host ""
Write-Host "Commands:"
Write-Host "  Start service:  Start-Service $ServiceName"
Write-Host "  Stop service:   Stop-Service $ServiceName"
Write-Host "  View logs:      Get-Content ""$WorkingDir\logs\service.log"" -Wait"
Write-Host "  Check status:   Get-Service $ServiceName"
Write-Host ""

# Start the service
Write-Host "Starting service..." -ForegroundColor Yellow
Start-Service $ServiceName
Start-Sleep -Seconds 3

$status = Get-Service $ServiceName
if ($status.Status -eq "Running") {
    Write-Host "[SUCCESS] Service is running!" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Service status: $($status.Status)" -ForegroundColor Yellow
    Write-Host "Check logs for errors: Get-Content ""$WorkingDir\logs\*.log""" -ForegroundColor Yellow
}
