@echo off
cd /d "%~dp0"
echo.
echo ============================================
echo  Fix VPS Network / IP Blocking
echo ============================================
echo.
python fix_network_blocking.py
echo.
pause
