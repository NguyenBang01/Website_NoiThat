@echo off
chcp 65001 >nul
title Furniture Shop - Backend API (Port 8080)
color 0a

:: Xac dinh duong dan thu muc
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
echo              KHOI DONG BACKEND API (GOLANG - PORT 8080)
echo ======================================================================
echo.
echo [*] Kiem tra: Hay chac chan MySQL (XAMPP / Laragon / Docker) dang chay!
echo [*] Thu muc: %BACKEND_DIR%
echo.

cd /d "%BACKEND_DIR%"

echo Dang khoi dong Backend API...
echo Server se chay tai: http://localhost:8080
echo Nhan Ctrl + C de dung server.
echo ----------------------------------------------------------------------
echo.

go run ./cmd/server

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ======================================================================
    echo [LOI] Backend da dung lai hoac gap su co!
    echo Goi y khac phuc:
    echo  1. Kiem tra MySQL da duoc Bat chua (XAMPP -> Start MySQL).
    echo  2. Kiem tra database 'furniture_shop' da ton tai chua.
    echo  3. Kiem tra port 8080 co bi trung ung dung khac khong.
    echo ======================================================================
)

echo.
echo Nhan phim bat ky de thoat...
pause >nul
