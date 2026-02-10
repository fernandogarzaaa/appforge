@echo off
TITLE AppForge Sovereign Swarm - Singularity v2
echo 🌌 Initializing Sovereign Intelligence Gateway...
echo 🛡️ Cognitive Stability Shield: ACTIVE
echo --------------------------------------------------

:: Check if Ollama is installed and start serving
where ollama >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo 🧠 Starting Ollama Local Inference Engine...
    :: Start Ollama serve in the background
    start /B ollama serve
    echo ⏳ Waiting for Ollama to initialize (5s)...
    timeout /t 5 /nobreak >nul
) else (
    echo ⚠️ Ollama not detected. Swarm will fallback to cloud providers (OpenAI/Anthropic).
)

:: Navigate to the swarm directory
cd /d "%~dp0swarm"

:: Check for node_modules
if not exist node_modules (
    echo 📦 Installing dependencies...
    call npm install
)

:: Run the swarm loop
echo 🚀 Launching Swarm Loop...
call npm start

echo --------------------------------------------------
echo ⚠️ Swarm process exited.
pause
