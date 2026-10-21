@echo off
setlocal
chcp 65001 >nul
title Mini Forum - Remote VM Control Center

cd /d "%~dp0"

:: Auto-detect Git Bash path
set "BASH_PATH="
if exist "C:\Program Files\Git\bin\bash.exe" set "BASH_PATH=C:\Program Files\Git\bin\bash.exe"
if "%BASH_PATH%"=="" if exist "C:\Program Files\Git\usr\bin\bash.exe" set "BASH_PATH=C:\Program Files\Git\usr\bin\bash.exe"
if "%BASH_PATH%"=="" if exist "%SystemDrive%\Program Files\Git\bin\bash.exe" set "BASH_PATH=%SystemDrive%\Program Files\Git\bin\bash.exe"
if "%BASH_PATH%"=="" set "BASH_PATH=bash.exe"

:: If argument passed directly (e.g. "vm 1", "vm 2", "vm ssh")
if "%1"=="1" goto op_deploy
if "%1"=="deploy" goto op_deploy
if "%1"=="2" goto op_status
if "%1"=="status" goto op_status
if "%1"=="3" goto op_logs_backend
if "%1"=="4" goto op_logs_vibe
if "%1"=="logs" goto op_logs_backend
if "%1"=="5" goto op_backup
if "%1"=="backup" goto op_backup
if "%1"=="6" goto op_restore
if "%1"=="restore" goto op_restore
if "%1"=="7" goto op_ssh
if "%1"=="ssh" goto op_ssh
if "%1"=="8" goto op_bootstrap
if "%1"=="bootstrap" goto op_bootstrap
if "%1"=="9" goto op_reset
if "%1"=="reset" goto op_reset
if /i "%1"=="m" goto op_deploy_micro
if /i "%1"=="micro" goto op_deploy_micro
if /i "%1"=="deploy-micro" goto op_deploy_micro
if /i "%1"=="s" goto op_setup_micro
if /i "%1"=="setup-micro" goto op_setup_micro

:menu
cls
echo =====================================================================
echo                 MINI FORUM - REMOTE VM CONTROL CENTER
echo                 Server: ubuntu@134.185.83.12 (OCI)
echo =====================================================================
echo.
echo   [1] Deploy / Update Code       - Sync code, build va reload (Standard)
echo   [2] Check System Status        - Kiem tra CPU, RAM, Swap, Disk, Docker
echo   [3] View Backend Logs          - Theo doi live logs Backend API
echo   [4] View Vibe-Content Logs     - Theo doi live logs AI Bot va Cron
echo   [5] Backup Database to Local   - pg_dump tren VM va keo ve backups/
echo   [6] Restore Database to VM     - Nap ban dump local len PostgreSQL VM
echo   [7] Quick SSH Console          - Mo truc tiep terminal SSH vao VM
echo   [8] Master Bootstrap           - Chay tron ven tu Zero den Production
echo   [9] Clean / Reset VM Docker    - Don dep cache, prune docker
echo.
echo   --- Cấu hình VM Cấu Hình Thấp (1GB RAM - VM.Standard.E2.1.Micro) ---
echo   [M] Deploy Micro VM (1GB RAM)  - Build tuần tự + docker-compose.micro.yml
echo   [S] Setup Micro VM             - Tạo 4GB Swap + tối ưu sysctl cho 1GB RAM
echo.
echo   [0] Exit                       - Thoat
echo =====================================================================
choice /C 123456789MS0 /N /M "  Nhap phim [0-9 / M / S]: "

if errorlevel 12 goto op_exit
if errorlevel 11 goto op_setup_micro
if errorlevel 10 goto op_deploy_micro
if errorlevel 9 goto op_reset
if errorlevel 8 goto op_bootstrap
if errorlevel 7 goto op_ssh
if errorlevel 6 goto op_restore
if errorlevel 5 goto op_backup
if errorlevel 4 goto op_logs_vibe
if errorlevel 3 goto op_logs_backend
if errorlevel 2 goto op_status
if errorlevel 1 goto op_deploy
goto menu

:op_deploy
cls
echo [INFO] Dang dong bo code va deploy len VM...
echo.
"%BASH_PATH%" scripts/remote-vm/deploy.sh
echo.
pause
goto menu

:op_status
cls
echo [INFO] Dang kiem tra suc khoe va tai nguyen VM...
echo.
"%BASH_PATH%" scripts/remote-vm/status.sh
echo.
pause
goto menu

:op_logs_backend
cls
echo [INFO] Dang theo doi log Backend API (Nhan Ctrl+C de thoat)...
echo.
"%BASH_PATH%" scripts/remote-vm/logs.sh backend -f
echo.
pause
goto menu

:op_logs_vibe
cls
echo [INFO] Dang theo doi log Vibe-Content AI (Nhan Ctrl+C de thoat)...
echo.
"%BASH_PATH%" scripts/remote-vm/logs.sh vibe-content -f
echo.
pause
goto menu

:op_backup
cls
echo [INFO] Dang kich hoat pg_dump tren VM va tai file ve may...
echo.
"%BASH_PATH%" scripts/remote-vm/backup_db.sh
echo.
pause
goto menu

:op_restore
cls
echo [INFO] Dang tai file dump len VM va khoi phuc vao PostgreSQL...
echo.
"%BASH_PATH%" scripts/remote-vm/restore_db.sh
echo.
pause
goto menu

:op_ssh
cls
echo [INFO] Dang ket noi SSH vao may chu VM...
echo.
"%BASH_PATH%" scripts/remote-vm/ssh.sh
echo.
pause
goto menu

:op_bootstrap
cls
echo =====================================================================
echo  CANH BAO: Master Bootstrap se cai dat he thong tu dau
echo =====================================================================
choice /C YN /N /M "  Ban co chac chan muon chay? (Y/N): "
if errorlevel 2 goto menu
echo.
"%BASH_PATH%" scripts/remote-vm/bootstrap_all.sh
echo.
pause
goto menu

:op_reset
cls
echo [INFO] Reset / Don dep Docker cache...
echo.
"%BASH_PATH%" scripts/remote-vm/reset_vm.sh
echo.
:op_deploy_micro
cls
echo [INFO] Dang deploy voi cau hinh Micro VM (1GB RAM)...
echo.
"%BASH_PATH%" scripts/remote-vm/deploy_micro.sh
echo.
pause
goto menu

:op_setup_micro
cls
echo =====================================================================
echo  SETUP MICRO VM (1GB RAM): Tao 4GB Swap + Toi uu Linux Kernel
echo =====================================================================
echo.
"%BASH_PATH%" scripts/remote-vm/setup_micro_vm.sh
echo.
pause
goto menu

:op_exit
echo.
echo Tam biet
exit /b 0
