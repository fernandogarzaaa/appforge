@echo off
TITLE Iron Brain Neural Bridge (Port 8000)
echo.
echo ===============================================================================
echo   IRON BRAIN NEURAL BRIDGE ACTIVATION
echo ===============================================================================
echo.

:: Robust Root Detection
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"
cd ..\..
set "PROJECT_ROOT=%CD%"
cd /d "%PROJECT_ROOT%"

echo 🔩 Activating Neural Environment...
call C:\Users\ferna\miniconda3\condabin\conda.bat activate appforge-train

echo.
echo 🧠 Loading Hitchhiker Adapter...
set PYTHONUTF8=1
python "%PROJECT_ROOT%\swarm\core\inference_server.py"

echo.
echo ⚠️ Neural Bridge Disconnected.
pause
