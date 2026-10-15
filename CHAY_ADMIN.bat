@echo off
chcp 65001 >nul
title Furniture Shop - Admin Frontend (React Vite - Port 5173)
color 0e

set "CURRENT_DIR=%~dp0"
if exist "%CURRENT_DIR%furniture-shop\admin-frontend" (
    set "ADMIN_DIR=%CURRENT_DIR%furniture-shop\admin-frontend"
) else if exist "%CURRENT_DIR%admin-frontend" (
    set "ADMIN_DIR=%CURRENT_DIR%admin-frontend"
) else (
    echo [LOI] Khong tim thay thu muc admin-frontend!
    pause
    exit /b 1
)

echo ======================================================================
echo          KHOI DONG ADMIN FRONTEND (REACT VITE - PORT 5173)
echo ======================================================================
echo.
echo [*] Dang kiem tra va giai phong cong 5173 neu bi ket...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [*] Thu muc: %ADMIN_DIR%
echo.
echo [*] Chu y: Hay chac chan Backend API (port 8080) da duoc bat de dang nhap!
echo.
echo Dang khoi chay Vite dev server...
echo.

cd /d "%ADMIN_DIR%"

:: Tu dong mo trinh duyet sau 3 giay
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5173"

npm run dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ======================================================================
    echo [LOI] Admin Frontend gap su co hoac bi dung!
    echo ======================================================================
)

echo.
pause
