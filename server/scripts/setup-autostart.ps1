# Setup PM2 Auto-start on Windows Boot
# Run as Administrator in PowerShell

$serviceName = "ExcellenceIssuerServerPM2"
$workingDir = "D:\excellence.wh\projects\issuer\server"
$scriptPath = "$workingDir\pm2-startup.bat"

# Check if running as Administrator
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "Please run this script as Administrator"
    exit 1
}

# Create startup batch file
$batchContent = @"
@echo off
cd /d $workingDir
pm2 resurrect
"@

$batchContent | Out-File -FilePath $scriptPath -Encoding ASCII

# Create scheduled task to run at startup
$action = New-ScheduledTaskAction -Execute $scriptPath -WorkingDirectory $workingDir
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Check if task already exists
taskschd.msc /query /tn $serviceName 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Task already exists, updating..."
    Unregister-ScheduledTask -TaskName $serviceName -Confirm:$false
}

# Register the task
Register-ScheduledTask -TaskName $serviceName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force

Write-Host ""
Write-Host "=========================================="
Write-Host "PM2 Auto-start configured successfully!"
Write-Host "=========================================="
Write-Host ""
Write-Host "Task Name: $serviceName"
Write-Host "Startup Script: $scriptPath"
Write-Host ""
Write-Host "To test:"
Write-Host "  1. Run: pm2 save"
Write-Host "  2. Reboot computer"
Write-Host "  3. Check: pm2 list"
Write-Host ""
Write-Host "To disable auto-start:"
Write-Host "  Unregister-ScheduledTask -TaskName '$serviceName' -Confirm:`$false"
Write-Host "=========================================="
