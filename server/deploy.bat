@echo off
cd /d "%~dp0scripts"
powershell -ExecutionPolicy Bypass -File Deploy.ps1 %*
