@echo off
cd /d "%~dp0scripts"
powershell -ExecutionPolicy Bypass -File Status.ps1
pause
