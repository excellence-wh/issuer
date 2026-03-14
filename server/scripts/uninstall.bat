@echo off
setlocal enabledelayedexpansion

set "SERVICE_NAME=IssuerServer"

echo ========================================
echo   Excellence Issuer Server 卸载脚本
echo ========================================
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [错误] 请以管理员身份运行此脚本
    pause
    exit /b 1
)

:: 停止服务
echo [1/2] 停止服务...
sc stop %SERVICE_NAME% >nul 2>&1
echo      服务已停止

:: 删除服务
echo [2/2] 删除服务...
sc delete %SERVICE_NAME% >nul 2>&1
echo      服务已删除

echo.
echo ========================================
echo   卸载完成！
echo ========================================
echo.
pause
