@echo off
chcp 65001 >nul
title IMPORT DATABASE - FURNITURE SHOP
color 0b

echo ======================================================================
echo           CONG CU IMPORT DATABASE FURNITURE SHOP (MYSQL)
echo ======================================================================
echo.
echo [*] Luu y: Hay dam bao MySQL (XAMPP / Laragon) dang duoc BAT!
echo.

set "SQL_FILE=%~dp0furniture_shop.sql"
if not exist "%SQL_FILE%" (
    set "SQL_FILE=%~dp0database\furniture_shop.sql"
)
if not exist "%SQL_FILE%" (
    set "SQL_FILE=%~dp0..\furniture-shop\furniture_shop.sql"
)
if not exist "%SQL_FILE%" (
    set "SQL_FILE=%~dp0..\furniture_shop.sql"
)

if not exist "%SQL_FILE%" (
    echo [LOI] Khong tim thay file furniture_shop.sql!
    pause
    exit /b 1
)

:: Tim duong dan mysql.exe trong PATH hoac XAMPP / Laragon
set "MYSQL_EXE=mysql"
where mysql >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "MYSQL_EXE=mysql"
    goto FOUND_MYSQL
)

if exist "C:\xampp\mysql\bin\mysql.exe" (
    set "MYSQL_EXE=C:\xampp\mysql\bin\mysql.exe"
    goto FOUND_MYSQL
)

if exist "D:\xampp\mysql\bin\mysql.exe" (
    set "MYSQL_EXE=D:\xampp\mysql\bin\mysql.exe"
    goto FOUND_MYSQL
)

if exist "E:\xampp\mysql\bin\mysql.exe" (
    set "MYSQL_EXE=E:\xampp\mysql\bin\mysql.exe"
    goto FOUND_MYSQL
)

if exist "C:\laragon\bin\mysql\current\bin\mysql.exe" (
    set "MYSQL_EXE=C:\laragon\bin\mysql\current\bin\mysql.exe"
    goto FOUND_MYSQL
)

echo [LOI] Khong tim thay mysql.exe! Vui long bat XAMPP hoac them MySQL vao bien PATH.
pause
exit /b 1

:FOUND_MYSQL
echo [*] Tim thay mysql tai: %MYSQL_EXE%
echo [*] File du lieu: %SQL_FILE%
echo.
echo Dang tien hanh import co so du lieu 'furniture_shop'...
echo Vui long cho trong giay lat...
echo.

"%MYSQL_EXE%" -u root --default-character-set=utf8mb4 < "%SQL_FILE%"

if %ERRORLEVEL% equ 0 goto IMPORT_SUCCESS
goto IMPORT_FAILED

:IMPORT_SUCCESS
echo ======================================================================
echo  [THANH CONG] Da import thanh cong toan bo co so du lieu furniture_shop!
echo ======================================================================
echo.
echo  Du lieu da bao gom day du:
echo   - 8 Danh muc, Thuong hieu, 32 San pham kem hinh anh va bien the
echo   - Don hang, Gio hang, Ma giam gia, Danh gia, Banner
echo   - Tai khoan Admin mac dinh:
echo       + Email:    admin@noithat.com
echo       + Mat khau: Admin@123
echo.
pause
exit /b 0

:IMPORT_FAILED
echo.
echo ======================================================================
echo  [THAT BAI] Import gap loi! 
echo  Kiem tra:
echo   1. MySQL trong XAMPP/Laragon da nhan nut [Start] chua?
echo   2. Co dung mat khau root mac dinh (trong, khong mat khau) khong?
echo ======================================================================
echo.
pause
exit /b 1
