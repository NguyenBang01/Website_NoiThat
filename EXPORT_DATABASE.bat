@echo off
chcp 65001 >nul
title EXPORT / BACKUP DATABASE - FURNITURE SHOP
color 0a

echo ======================================================================
echo           CONG CU XUAT / BACKUP DATABASE FURNITURE SHOP (MYSQL)
echo ======================================================================
echo.
echo [*] Dang kiem tra ket noi MySQL...

set "DUMP_EXE=mysqldump"
where mysqldump >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "DUMP_EXE=mysqldump"
    goto FOUND_DUMP
)

if exist "C:\xampp\mysql\bin\mysqldump.exe" (
    set "DUMP_EXE=C:\xampp\mysql\bin\mysqldump.exe"
    goto FOUND_DUMP
)

if exist "D:\xampp\mysql\bin\mysqldump.exe" (
    set "DUMP_EXE=D:\xampp\mysql\bin\mysqldump.exe"
    goto FOUND_DUMP
)

if exist "E:\xampp\mysql\bin\mysqldump.exe" (
    set "DUMP_EXE=E:\xampp\mysql\bin\mysqldump.exe"
    goto FOUND_DUMP
)

if exist "C:\laragon\bin\mysql\current\bin\mysqldump.exe" (
    set "DUMP_EXE=C:\laragon\bin\mysql\current\bin\mysqldump.exe"
    goto FOUND_DUMP
)

echo [LOI] Khong tim thay mysqldump.exe! Vui long kiem tra XAMPP hoac them MySQL vao bien PATH.
pause
exit /b 1

:FOUND_DUMP
set "OUT_FILE=%~dp0furniture_shop.sql"
set "OUT_DIR_FILE=%~dp0database\furniture_shop.sql"

if not exist "%~dp0database" (
    mkdir "%~dp0database" >nul 2>&1
)

echo [*] Dang xuat database 'furniture_shop' ra file SQL voi chuan UTF-8 (utf8mb4)...
"%DUMP_EXE%" -u root --default-character-set=utf8mb4 --databases furniture_shop --add-drop-database --add-drop-table -r "%OUT_FILE%"

if %ERRORLEVEL% equ 0 goto EXPORT_SUCCESS
goto EXPORT_FAILED

:EXPORT_SUCCESS
copy /y "%OUT_FILE%" "%OUT_DIR_FILE%" >nul 2>&1
echo.
echo ======================================================================
echo  [THANH CONG] Da xuat du lieu ra:
echo   1. %OUT_FILE%
echo   2. %OUT_DIR_FILE%
echo ======================================================================
echo.
pause
exit /b 0

:EXPORT_FAILED
echo.
echo ======================================================================
echo  [THAT BAI] Khong the xuat database!
echo ======================================================================
echo.
pause
exit /b 1
