@echo off
chcp 65001 >nul
echo Excellence Issuer Server - PM2 Deploy Script
echo ============================================
echo.

set WORK_DIR=D:\excellence.wh\projects\issuer\server
set PM2_NAME=excellence-server

cd /d %WORK_DIR%

REM Check if PM2 is installed
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] PM2 not found, installing globally...
    npm install -g pm2
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install PM2
        exit /b 1
    )
)

REM Check if we should pull latest code
if "%1"=="--pull" (
    echo [STEP 1/4] Pulling latest code from git...
    git pull
    if %ERRORLEVEL% NEQ 0 (
        echo [WARNING] Git pull failed, continuing with local code...
    )
) else (
    echo [STEP 1/4] Skipping git pull (use --pull to update code)
)

echo.
echo [STEP 2/4] Installing dependencies...
npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm install failed
    exit /b 1
)

echo.
echo [STEP 3/4] Building project...
npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed
    exit /b 1
)

echo.
echo [STEP 4/4] Starting/Restarting PM2 service...

REM Check if PM2 process exists
pm2 describe %PM2_NAME% >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Restarting existing PM2 process: %PM2_NAME%
    pm2 restart %PM2_NAME%
) else (
    echo [INFO] Starting new PM2 process: %PM2_NAME%
    pm2 start dist/server.js --name %PM2_NAME%
)

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to start PM2 service
    exit /b 1
)

echo.
echo ============================================
echo [SUCCESS] Deploy completed!
echo Service: %PM2_NAME%
echo URL: http://localhost:3001
echo Docs: http://localhost:3001/docs
echo.
echo PM2 Commands:
echo   pm2 logs %PM2_NAME%     - View logs
echo   pm2 monit               - Monitor
echo   pm2 restart %PM2_NAME%  - Restart
echo   pm2 stop %PM2_NAME%     - Stop
echo ============================================
