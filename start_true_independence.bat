@echo off
TITLE AppForge Antigravity - True AI Independence Mode
color 0E

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║    🧠 ANTIGRAVITY SWARM - TRUE AI INDEPENDENCE MODE         ║
echo ╔═══════════════════════════════════════════════════════════════╝
echo.
echo 🔒 Mode: 100% Local Inference (No External APIs)
echo 🦙 Ollama: http://localhost:11434
echo 📦 Models: llama3, deepseek-coder, phi3, nomic-embed-text
echo.

REM Check if Ollama is running
echo [1/2] Checking Ollama...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Ollama is ONLINE
) else (
    echo    ⚠️  Ollama not detected!
    echo    💡 Start Ollama first: ollama serve
    echo    💡 Then run: npx tsx start_true_independence.ts
    echo.
    pause
    exit /b 1
)

echo.
echo [2/2] Starting Sovereign AI with True Independence...
echo.
echo ═════════════════════════════════════════════════════════════
echo    🚀 PRODUCTION COMMAND:
echo    npx tsx swarm/core/loop.ts --independence
echo ═════════════════════════════════════════════════════════════
echo.

REM Run in current terminal
npx tsx swarm/core/loop.ts --independence

echo.
echo 🛑 Swarm stopped.
pause
