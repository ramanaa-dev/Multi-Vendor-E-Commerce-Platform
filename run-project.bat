@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

set "BACKEND_PY=%ROOT%\backend\.venv\Scripts\python.exe"
set "BACKEND_ENV=%ROOT%\backend\.env"
set "FRONTEND_ENV=%ROOT%\frontend\.env"
set "BACKEND_URL=http://localhost:5000/api/health"
set "FRONTEND_URL=http://localhost:5173/login"

where python >nul 2>&1
if errorlevel 1 (
    echo Python was not found in PATH. Install Python and run this file again.
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo npm was not found in PATH. Install Node.js and run this file again.
    exit /b 1
)

echo [1/6] Ensuring backend virtual environment...
if not exist "%BACKEND_PY%" (
    python -m venv "%ROOT%\backend\.venv"
    if errorlevel 1 goto :fail
) else (
    echo Backend virtual environment already exists.
)

echo [2/6] Ensuring environment files...
if not exist "%BACKEND_ENV%" copy "%ROOT%\backend\.env.example" "%BACKEND_ENV%" >nul
if not exist "%FRONTEND_ENV%" copy "%ROOT%\frontend\.env.example" "%FRONTEND_ENV%" >nul
echo Environment files ready.

echo [3/6] Ensuring backend dependencies...
"%BACKEND_PY%" -c "import flask, flask_sqlalchemy, flask_jwt_extended, flask_cors, flask_bcrypt, dotenv, pymysql, cryptography" >nul 2>&1
if errorlevel 1 (
    call "%BACKEND_PY%" -m pip install --upgrade pip
    if errorlevel 1 goto :fail
    call "%BACKEND_PY%" -m pip install -r "%ROOT%\backend\requirements.txt"
    if errorlevel 1 goto :fail
) else (
    echo Backend dependencies already installed.
)

echo [4/6] Ensuring frontend dependencies...
if not exist "%ROOT%\frontend\node_modules" (
    pushd "%ROOT%\frontend"
    call npm install
    if errorlevel 1 (
        popd
        goto :fail
    )
    popd
) else (
    echo Frontend dependencies already installed.
)

echo [5/6] Ensuring demo login accounts...
set "USER_COUNT="
set "COUNT_FILE=%TEMP%\demo1_usercount.txt"
set "COUNT_SCRIPT=%TEMP%\demo1_usercount.py"
if exist "%COUNT_FILE%" del "%COUNT_FILE%" >nul 2>&1
if exist "%COUNT_SCRIPT%" del "%COUNT_SCRIPT%" >nul 2>&1
>"%COUNT_SCRIPT%" echo import os, sys
>>"%COUNT_SCRIPT%" echo sys.path.insert^(0, os.getcwd^(^)^)
>>"%COUNT_SCRIPT%" echo from app import create_app
>>"%COUNT_SCRIPT%" echo from models import User
>>"%COUNT_SCRIPT%" echo app = create_app^(^)
>>"%COUNT_SCRIPT%" echo with app.app_context^(^):
>>"%COUNT_SCRIPT%" echo     print^(User.query.count^(^)^)
pushd "%ROOT%\backend"
"%BACKEND_PY%" "%COUNT_SCRIPT%" > "%COUNT_FILE%" 2>nul
if not errorlevel 1 (
    if exist "%COUNT_FILE%" (
        set /p USER_COUNT=<"%COUNT_FILE%"
    )
)
popd
if exist "%COUNT_FILE%" del "%COUNT_FILE%" >nul 2>&1
if exist "%COUNT_SCRIPT%" del "%COUNT_SCRIPT%" >nul 2>&1

echo !USER_COUNT! | findstr /r "^[0-9][0-9]*$" >nul
if errorlevel 1 set "USER_COUNT=0"

if "!USER_COUNT!"=="0" (
    echo Local database is empty. Seeding demo users and sample data...
    pushd "%ROOT%\backend"
    call "%BACKEND_PY%" seed.py
    if errorlevel 1 (
        popd
        goto :fail
    )
    popd
) else (
    echo Found !USER_COUNT! users. Skipping seed.
)

echo [6/6] Restarting project services...
echo Closing any existing project windows...
powershell -NoProfile -Command "$ports = Get-NetTCPConnection -LocalPort 5000,5173 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; foreach ($procId in $ports) { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue }; Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'cmd.exe' -and $_.CommandLine -and (($_.CommandLine -match 'backend_main\\.py') -or ($_.CommandLine -match 'backend\\\\app.py') -or ($_.CommandLine -match 'npm run dev')) } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
if errorlevel 1 goto :fail

echo Starting Backend API...
start "Backend API" /D "%ROOT%" cmd /k "backend\.venv\Scripts\python.exe backend_main.py"
if errorlevel 1 goto :fail

echo Starting Frontend UI...
start "Frontend UI" /D "%ROOT%\frontend" cmd /k "npm run dev"
if errorlevel 1 goto :fail

echo Waiting for the backend to become ready...
powershell -NoProfile -Command "$deadline=(Get-Date).AddSeconds(45); do { try { $response = Invoke-WebRequest -UseBasicParsing '%BACKEND_URL%' -TimeoutSec 3; if ($response.StatusCode -eq 200) { exit 0 } } catch { } Start-Sleep -Milliseconds 750 } while ((Get-Date) -lt $deadline); exit 1"
if errorlevel 1 (
    echo The backend did not respond within 45 seconds. Check the opened terminal window.
) else (
    echo Backend is ready.
)

echo Waiting for the frontend to become ready...
powershell -NoProfile -Command "$deadline=(Get-Date).AddSeconds(60); do { try { $response = Invoke-WebRequest -UseBasicParsing '%FRONTEND_URL%' -TimeoutSec 3; if ($response.StatusCode -eq 200) { exit 0 } } catch { } Start-Sleep -Milliseconds 750 } while ((Get-Date) -lt $deadline); exit 1"
if errorlevel 1 (
    echo The frontend did not respond within 60 seconds. Check the opened terminal windows.
) else (
    start "" "%FRONTEND_URL%"
)

echo.
echo App URL: %FRONTEND_URL%
echo Admin: admin@example.com / Admin@123
echo Seller: seller1@example.com / Seller@123
echo Customer: alice@example.com / Customer@123
echo Seller pending approval: seller2@example.com / Seller@123
echo.
echo Keep the backend and frontend windows open while using the project.
exit /b 0

:fail
echo.
echo Startup failed. Fix the error above and run run-project.bat again.
exit /b 1
