@echo off
chcp 65001 >nul
title Tu Dong Sua Loi MySQL Trong XAMPP
color 0e

echo ======================================================================
echo             CONG CU TU DONG SUA LOI MYSQL TRONG XAMPP
echo ======================================================================
echo.
echo [*] Dang kiem tra thu muc XAMPP...

set "XAMPP_DIR=C:\xampp"
if not exist "%XAMPP_DIR%\mysql\data" (
    echo [LOI] Khong tim thay thu muc C:\xampp\mysql\data!
    echo Neu ban cai XAMPP o o dia khac (vi du D:\xampp), hay bao lai.
    pause
    exit /b 1
)

echo [*] Tim thay thu muc XAMPP tai: %XAMPP_DIR%
echo.
echo 1. Dang dung cac tien trinh MySQL bi treo (neu co)...
taskkill /F /IM mysqld.exe >nul 2>&1

echo 2. Dang don dep cac file gay crash MySQL (mysql.pid, ib_logfile0, ib_logfile1)...
if exist "%XAMPP_DIR%\mysql\data\mysql.pid" (
    del /f /q "%XAMPP_DIR%\mysql\data\mysql.pid" >nul 2>&1
    echo    - Da xoa mysql.pid
)

if exist "%XAMPP_DIR%\mysql\data\ib_logfile0" (
    del /f /q "%XAMPP_DIR%\mysql\data\ib_logfile0" >nul 2>&1
    echo    - Da xoa ib_logfile0
)

if exist "%XAMPP_DIR%\mysql\data\ib_logfile1" (
    del /f /q "%XAMPP_DIR%\mysql\data\ib_logfile1" >nul 2>&1
    echo    - Da xoa ib_logfile1
)

if exist "%XAMPP_DIR%\mysql\data\ibtmp1" (
    del /f /q "%XAMPP_DIR%\mysql\data\ibtmp1" >nul 2>&1
    echo    - Da xoa ibtmp1
)

echo 3. Dang tat che do innodb_force_recovery trong my.ini...
powershell -Command "if (Test-Path '%XAMPP_DIR%\mysql\bin\my.ini') { (Get-Content -Path '%XAMPP_DIR%\mysql\bin\my.ini') -replace '^(\s*innodb_force_recovery\s*=.*)', '# $1' | Set-Content -Path '%XAMPP_DIR%\mysql\bin\my.ini' }" >nul 2>&1
echo    - Da cau hinh lai my.ini

echo.
echo ======================================================================
echo  DA SUA XONG LOI XAMPP MYSQL!
echo ======================================================================
echo.
echo  Cac buoc tiep theo:
echo   1. Mo bang dieu khien XAMPP Control Panel.
echo   2. Nhan nut [Start] tai dong MySQL (chu MySQL se hien mau xanh la cay).
echo   3. Nhap dup chuot vao file CHAY_NGAY.bat de chay toan bo he thong!
echo.
pause
