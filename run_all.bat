@echo off
chcp 65001 >nul
title Khoi Dong Toan Bo He Thong - Furniture Shop
color 0b

:: Xac dinh duong dan thu muc
set "CURRENT_DIR=%~dp0"
if exist "%CURRENT_DIR%furniture-shop\backend" (
    set "BACKEND_DIR=%CURRENT_DIR%furniture-shop\backend"
    set "ADMIN_DIR=%CURRENT_DIR%furniture-shop\admin-frontend"
    set "STORE_DIR=%CURRENT_DIR%furniture-shop\storefront"
) else if exist "%CURRENT_DIR%backend" (
    set "BACKEND_DIR=%CURRENT_DIR%backend"
    set "ADMIN_DIR=%CURRENT_DIR%admin-frontend"
    set "STORE_DIR=%CURRENT_DIR%storefront"
) else (
    echo [LOI] Khong tim thay thu muc furniture-shop!
    pause
    exit /b 1
)

echo ======================================================================
echo          KHOI DONG TOAN BO HE THONG - FURNITURE SHOP
echo ======================================================================
echo.
echo [*] Luu y: Hay dam bao MySQL (XAMPP / Laragon) dang duoc BAT!
echo.
echo [*] Dang don dep va giai phong cac port 5173, 4321 neu bi ket...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4321 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo Dang khoi chay cac dich vu trong cac cua so rieng biet...
echo.

:: 1. Khoi dong Backend Go (Port 8080)
echo [1/3] Dang khoi dong Backend API (Port 8080)...
start "Backend API - Port 8080" cmd /k "chcp 65001 >nul && title Backend API - Port 8080 && color 0a && cd /d "%BACKEND_DIR%" && echo ======================================================== && echo           BACKEND API (PORT 8080) - DANG CHAY && echo ======================================================== && echo. && go run ./cmd/server"

:: Cho 2 giay de Backend ket noi DB
timeout /t 2 /nobreak >nul

:: 2. Khoi dong Admin Frontend (Port 5173)
echo [2/3] Dang khoi dong Admin Frontend (Port 5173)...
start "Admin Frontend - Port 5173" cmd /k "chcp 65001 >nul && title Admin Frontend - Port 5173 && color 0e && cd /d "%ADMIN_DIR%" && echo ======================================================== && echo        ADMIN FRONTEND (PORT 5173) - DANG CHAY && echo ======================================================== && echo. && npm run dev"

:: Cho 1 giay
timeout /t 1 /nobreak >nul

:: 3. Khoi dong Storefront (Port 4321)
echo [3/3] Dang khoi dong Storefront Website (Port 4321)...
start "Storefront Website - Port 4321" cmd /k "chcp 65001 >nul && title Storefront Website - Port 4321 && color 0b && cd /d "%STORE_DIR%" && echo ======================================================== && echo       STOREFRONT WEBSITE (PORT 4321) - DANG CHAY && echo ======================================================== && echo. && npm run dev"

echo.
echo ======================================================================
echo  HE THONG DA DUOC KHOI DONG THANH CONG!
echo.
echo  * Backend API:        http://localhost:8080
echo  * Admin Dashboard:    http://localhost:5173
echo  * Storefront Website:  http://localhost:4321
echo ======================================================================
echo.
echo  - Cac cua so terminal rieng da duoc mo de ban de theo doi log.
echo  - Dang tu dong mo trinh duyet sau 3 giay...
echo.
timeout /t 3 /nobreak >nul

start http://localhost:5173
start http://localhost:4321

echo.
echo Nhấn phím bất kỳ để đóng cửa sổ này (các dịch vụ vẫn tiếp tục chạy)...
pause >nul
