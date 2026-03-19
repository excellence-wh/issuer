$ServiceName = "Excellence.WH.Issuer.Server"
$DeployPath = "D:\applications\IssuerServer"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IssuerServer Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "Service Name:  $ServiceName"
    Write-Host "Status:        $($service.Status)" -ForegroundColor $(if ($service.Status -eq "Running") { "Green" } else { "Yellow" })
    Write-Host "Start Type:    $($service.StartType)"
} else {
    Write-Host "Service not found: $ServiceName" -ForegroundColor Red
}

Write-Host ""
Write-Host "Deploy Path: $DeployPath"
if (Test-Path $DeployPath) {
    $exe = Join-Path $DeployPath "IssuerServer.exe"
    if (Test-Path $exe) {
        $version = [System.Diagnostics.FileVersionInfo]::GetVersionInfo($exe).FileVersion
        Write-Host "Deploy Version: $version"
    }
    
    $logPath = Join-Path $DeployPath "logs"
    if (Test-Path $logPath) {
        $latestLog = Get-ChildItem $logPath -Filter "*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if ($latestLog) {
            Write-Host "Latest Log:    $($latestLog.Name) ($($latestLog.LastWriteTime))"
        }
    }
}

Write-Host ""
