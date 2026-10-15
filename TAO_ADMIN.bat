@echo off
chcp 65001 >nul
title Tao Tai Khoan Admin - Furniture Shop
color 0b

set "CURRENT_DIR=%~dp0"
if exist "%CURRENT_DIR%furniture-shop\backend" (
    set "BACKEND_DIR=%CURRENT_DIR%furniture-shop\backend"
) else if exist "%CURRENT_DIR%backend" (
    set "BACKEND_DIR=%CURRENT_DIR%backend"
) else (
    echo [LOI] Khong tim thay thu muc backend!
    pause
    exit /b 1
)

echo ======================================================================
echo                TAO / CAP NHAT TAI KHOAN ADMIN MAC DINH
echo ======================================================================
echo.
echo [*] Hay dam bao MySQL (XAMPP / Laragon) dang duoc BAT truoc khi chay!
echo.
echo Thong tin tai khoan mac dinh:
echo   - Email:     admin@noithat.com
echo   - Mat khau:  Admin@123
echo.
echo Dang tien hanh khoi tao...
echo.

cd /d "%BACKEND_DIR%"
go run ./cmd/seed-admin

echo.
echo ======================================================================
pause
