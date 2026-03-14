@echo off
setlocal enabledelayedexpansion

set "SERVICE_NAME=IssuerServer"
set "DISPLAY_NAME=Excellence Issuer Server"
set "PROJECT_DIR=%~dp0"
set "PUBLISH_DIR=%PROJECT_DIR%publish"

echo ========================================
echo   Excellence Issuer Server 部署脚本
echo ========================================
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [错误] 请以管理员身份运行此脚本
    pause
    exit /b 1
)

:: 停止并删除现有服务
echo [1/4] 停止并删除现有服务...
sc stop %SERVICE_NAME% >nul 2>&1
sc delete %SERVICE_NAME% >nul 2>&1
echo      已删除现有服务

:: 清理并发布项目
echo [2/4] 清理并发布项目...
if exist "%PUBLISH_DIR%" rmdir /s /q "%PUBLISH_DIR%"
dotnet publish "%PROJECT_DIR%IssuerServer.csproj" -c Release -o "%PUBLISH_DIR%" --self-contained false
if %errorLevel% neq 0 (
    echo [错误] 发布失败
    pause
    exit /b 1
)
echo      发布成功

:: 创建 Windows Service
echo [3/4] 创建 Windows Service...
sc create %SERVICE_NAME% binPath= "%PUBLISH_DIR%\IssuerServer.exe" DisplayName= "%DISPLAY_NAME%" start= auto
if %errorLevel% neq 0 (
    echo [错误] 创建服务失败
    pause
    exit /b 1
)
echo      服务创建成功

:: 设置服务描述
sc description %SERVICE_NAME% "提供 Hg 版本控制、Redmine 项目管理、MiMo LLM 集成的 REST API 服务"
if %errorLevel% neq 0 (
    echo [警告] 设置描述失败
)

:: 启动服务
echo [4/4] 启动服务...
sc start %SERVICE_NAME%
if %errorLevel% neq 0 (
    echo [错误] 启动服务失败
    pause
    exit /b 1
)
echo      服务启动成功

echo.
echo ========================================
echo   部署完成！
echo ========================================
echo.
echo 服务名称: %SERVICE_NAME%
echo 显示名称: %DISPLAY_NAME%
echo 监听端口: 3001
echo.
echo 常用命令:
echo   启动服务: sc start %SERVICE_NAME%
echo   停止服务: sc stop %SERVICE_NAME%
echo   重启服务: sc restart %SERVICE_NAME%
echo   查看状态: sc query %SERVICE_NAME%
echo   查看日志: eventvwr.msc
echo.
pause
