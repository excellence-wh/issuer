param(
    [switch]$SkipBuild,
    [switch]$SkipConfirm
)

$ErrorActionPreference = "Stop"

$ServiceName = "Excellence.WH.Issuer.Server"
$DeployPath = "D:\applications\IssuerServer"
$BackupPath = "D:\applications\IssuerServer\backup"
$SourcePath = "$PSScriptRoot\..\bin\Release\net10.0\win-x64"
$PublishPath = "$PSScriptRoot\..\bin\Release\net10.0\publish"
$ProjectPath = "$PSScriptRoot\.."

function Write-Step($message) {
    Write-Host ""
    Write-Host "=== $message ===" -ForegroundColor Cyan
}

function Write-Success($message) {
    Write-Host "[OK] $message" -ForegroundColor Green
}

function Write-Fail($message) {
    Write-Host "[FAIL] $message" -ForegroundColor Red
}

function Stop-ServiceSafe {
    Write-Step "Stopping Windows Service..."
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($service -and $service.Status -eq "Running") {
        Stop-Service -Name $ServiceName -Force
        Start-Sleep -Seconds 2
        $service = Get-Service -Name $ServiceName
        if ($service.Status -eq "Stopped") {
            Write-Success "Service stopped"
        } else {
            Write-Fail "Service still running (Status: $($service.Status))"
            exit 1
        }
    } else {
        Write-Success "Service is not running"
    }
}

function Start-ServiceSafe {
    Write-Step "Starting Windows Service..."
    Start-Service -Name $ServiceName
    Start-Sleep -Seconds 3
    $service = Get-Service -Name $ServiceName
    if ($service.Status -eq "Running") {
        Write-Success "Service started"
    } else {
        Write-Fail "Service failed to start (Status: $($service.Status))"
        exit 1
    }
}

function Backup-OldVersion {
    Write-Step "Backing up old version..."
    if (Test-Path $DeployPath) {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupDir = "$BackupPath\$timestamp"
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        Copy-Item -Path "$DeployPath\*" -Destination $backupDir -Recurse -Exclude "logs","backup"
        Write-Success "Backup created: $backupDir"
    }
}

function Publish-Application {
    Write-Step "Publishing application..."
    Push-Location $ProjectPath
    try {
        dotnet publish -c Release -r win-x64 --self-contained true -o $PublishPath
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Publish failed"
            exit 1
        }
        Write-Success "Application published"
    } finally {
        Pop-Location
    }
}

function Deploy-NewVersion {
    Write-Step "Deploying new version..."
    Copy-Item -Path "$PublishPath\*" -Destination $DeployPath -Recurse -Force
    Write-Success "New version deployed"
}

function Show-ServiceStatus {
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($service) {
        Write-Host ""
        Write-Host "Service Status: $($service.Status)" -ForegroundColor $(if ($service.Status -eq "Running") { "Green" } else { "Yellow" })
    }
}

# Main flow
Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  IssuerServer Deployment Script" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "Deploy Path: $DeployPath"
Write-Host "Service Name: $ServiceName"
Write-Host ""

if (-not $SkipConfirm) {
    $confirm = Read-Host "Continue with deployment? (y/n)"
    if ($confirm -ne "y") {
        Write-Host "Deployment cancelled." -ForegroundColor Yellow
        exit 0
    }
}

try {
    Stop-ServiceSafe
    Backup-OldVersion
    
    if (-not $SkipBuild) {
        Publish-Application
    }
    
    Deploy-NewVersion
    Start-ServiceSafe
    Show-ServiceStatus
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Deployment completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} catch {
    Write-Fail "Deployment failed: $_"
    exit 1
}
