@echo off
TITLE Iron Brain Neural Bridge (Port 8000)
echo.
echo ===============================================================================
echo   IRON BRAIN NEURAL BRIDGE ACTIVATION
echo ===============================================================================
echo.
echo 🔩 Activating Neural Environment...
call C:\Users\ferna\miniconda3\condabin\conda.bat activate appforge-train

echo.
echo 🧠 Loading Hitchhiker Adapter...
set PYTHONUTF8=1
python swarm/core/inference_server.py

echo.
echo ⚠️ Neural Bridge Disconnected.
pause
