@echo off
setlocal
cd /d "%~dp0"

echo [1/4] Preparing backend virtual environment...
if not exist "backend\.venv\Scripts\python.exe" (
    python -m venv backend\.venv
)

call backend\.venv\Scripts\activate.bat

echo [2/4] Installing backend dependencies...
python -m pip install --upgrade pip
pip install -r backend\requirements.txt

echo [3/4] Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo [4/4] Creating .env files (if missing)...
if not exist "backend\.env" copy "backend\.env.example" "backend\.env" >nul
if not exist "frontend\.env" copy "frontend\.env.example" "frontend\.env" >nul

echo.
echo Setup complete.
echo Next: run-project.bat
endlocal
