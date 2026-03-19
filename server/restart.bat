@echo off
cd /d "%~dp0scripts"
powershell -ExecutionPolicy Bypass -File Restart-Service.ps1
pause
