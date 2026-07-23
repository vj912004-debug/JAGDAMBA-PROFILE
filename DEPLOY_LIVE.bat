@echo off

setlocal

cd /d "%~dp0"



echo.

echo ============================================

echo  Jagdamba Live Deploy

echo ============================================

echo.



echo [1/3] Building production bundle...

call npm run build

if errorlevel 1 (

  echo Build failed.

  exit /b 1

)



echo.

echo [2/3] Deploying to VPS (archive upload + restart)...

python deploy_all.py

if errorlevel 1 (

  echo.

  echo Deploy failed. If SSH timed out:

  echo   - Run FIX_NETWORK.bat

  echo   - Or open Hostinger hPanel and allow ports 22, 80, 443

  echo   - Then run DEPLOY_LIVE.bat again

  exit /b 1

)



echo.

echo [3/3] Done. Site: https://jagdambaprofile.tech/

endlocal

