@echo off
chcp 65001 >nul
title MENU KHOI DONG - FURNITURE SHOP
color 0f

set "CURRENT_DIR=%~dp0"
if exist "%CURRENT_DIR%furniture-shop\backend" (
    set "BACKEND_DIR=%CURRENT_DIR%furniture-shop\backend"
) else if exist "%CURRENT_DIR%backend" (
    set "BACKEND_DIR=%CURRENT_DIR%backend"
) else (
    set "BACKEND_DIR=%CURRENT_DIR%"
)

:MENU
cls
echo ======================================================================
echo                  BANG DIEU KHIEN FURNITURE SHOP
echo ======================================================================
echo.
echo   [1] Khoi dong TOAN BO (Backend + Admin + Storefront)  *Khuyen dung*
echo   [2] Chi chay Backend API (Golang - Port 8080)
echo   [3] Chi chay Admin Dashboard (React - Port 5173)
echo   [4] Chi chay Storefront Ban Hang (Astro - Port 4321)
echo   ------------------------------------------------------------------
echo   [5] Tao tai khoan Admin mac dinh (Seed Admin)
echo   [6] Bien dich Backend ra file exe (server.exe)
echo   [7] Tu dong sua loi MySQL XAMPP (Crash / Shutdown)
echo   [0] Thoat
echo.
echo ======================================================================
set /p choice="Nhap lua chon cua ban (0-7) roi nhan Enter: "

if "%choice%"=="1" goto RUN_ALL
if "%choice%"=="2" goto RUN_BACKEND
if "%choice%"=="3" goto RUN_ADMIN
if "%choice%"=="4" goto RUN_STOREFRONT
if "%choice%"=="5" goto SEED_ADMIN
if "%choice%"=="6" goto BUILD_BACKEND
if "%choice%"=="7" goto FIX_MYSQL
if "%choice%"=="0" exit /b
echo Lua chon khong hop le, vui long chon lai!
timeout /t 2 >nul
goto MENU

:RUN_ALL
call "%~dp0run_all.bat"
goto MENU

:RUN_BACKEND
call "%~dp0CHAY_BACKEND.bat"
goto MENU

:RUN_ADMIN
call "%~dp0CHAY_ADMIN.bat"
goto MENU

:RUN_STOREFRONT
call "%~dp0CHAY_STOREFRONT.bat"
goto MENU

:SEED_ADMIN
cls
echo Dang tao tai khoan Admin mac dinh...
cd /d "%BACKEND_DIR%"
go run ./cmd/seed-admin
echo.
pause
goto MENU

:BUILD_BACKEND
cls
echo Dang bien dich Backend thanh server.exe...
cd /d "%BACKEND_DIR%"
go build -o server.exe ./cmd/server
if %ERRORLEVEL% equ 0 (
    echo [THANH CONG] Da tao file server.exe trong thu muc backend!
) else (
    echo [THAT BAI] Loi bien dich backend.
)
echo.
pause
goto MENU

:FIX_MYSQL
call "%~dp0SUA_LOI_XAMPP_MYSQL.bat"
goto MENU
