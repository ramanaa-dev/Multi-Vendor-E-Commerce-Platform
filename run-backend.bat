@echo off
setlocal
cd /d "%~dp0"

if exist "backend\.venv\Scripts\python.exe" (
    echo Starting backend with virtual environment...
    backend\.venv\Scripts\python.exe backend_main.py
) else (
    echo backend\.venv not found. Using system Python...
    python backend_main.py
)

endlocal
