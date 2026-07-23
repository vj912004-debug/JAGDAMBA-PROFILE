@echo off
cd /d "%~dp0"
echo.
echo ============================================
echo  Restore jagdambaprofile.tech (VPS offline)
echo ============================================
echo.
echo FIRST: In Hostinger hPanel:
echo   1. Reboot VPS 187.127.160.28
echo   2. Firewall: open TCP 22, 80, 443
echo.
echo This script waits for SSH then fixes everything.
echo.
python restore_vps_live.py --build
echo.
pause
