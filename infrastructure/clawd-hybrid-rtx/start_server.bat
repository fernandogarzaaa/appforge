@echo off
REM Clawd Hybrid RTX LLM Server Startup Script for Windows

echo ========================================
echo  Clawd Hybrid RTX LLM Server
echo ========================================
echo.

REM Change to script directory
cd /d "%~dp0"

REM Set Python path
set PYTHONPATH=%~dp0;%~dp0\src

echo Python path: %PYTHONPATH%
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found in PATH
    echo Please install Python 3.9+ and try again
    pause
    exit /b 1
)

echo Starting server on http://localhost:7860
echo Press Ctrl+C to stop
echo.

REM Start the server using the launcher
python start_server.py

REM If that fails, try alternative method
if errorlevel 1 (
    echo.
    echo Trying alternative startup method...
    python -c "import sys; sys.path.insert(0, '.'); sys.path.insert(0, './src'); import uvicorn; uvicorn.run('src.api_server:app', host='0.0.0.0', port=7860)"
)

pause
