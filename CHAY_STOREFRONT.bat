@echo off
chcp 65001 >nul
title Furniture Shop - Storefront (Astro - Port 4321)
color 0b

set "CURRENT_DIR=%~dp0"
if exist "%CURRENT_DIR%furniture-shop\storefront" (
    set "STORE_DIR=%CURRENT_DIR%furniture-shop\storefront"
) else if exist "%CURRENT_DIR%storefront" (
    set "STORE_DIR=%CURRENT_DIR%storefront"
) else (
    echo [LOI] Khong tim thay thu muc storefront!
    pause
    exit /b 1
)

echo ======================================================================
echo            KHOI DONG STOREFRONT (ASTRO WEB - PORT 4321)
echo ======================================================================
echo.
echo [*] Dang giai phong cong 4321 neu co tien trinh cu dang chay ngam...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4321 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [*] Thu muc: %STORE_DIR%
echo.

cd /d "%STORE_DIR%"

echo Dang chay Astro dev server...
echo Website se san sang tai: http://localhost:4321
echo Nhan Ctrl + C de dung server.
echo ----------------------------------------------------------------------
echo.

:: Tu dong mo trinh duyet sau 3 giay
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:4321"

npm run dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ======================================================================
    echo [LOI] Storefront gap su co hoac bi dung!
    echo ======================================================================
)

echo.
pause
