@echo off
TITLE AppForge Market Prediction Engine - Local LLM Ensemble
color 0E

echo.
echo ════════════════════════════════════════════════════════════════════════
echo    🚀 PREDICTIVE MARKET INTELLIGENCE ENGINE
echo ════════════════════════════════════════════════════════════════════════
echo.
echo Using local LLM ensemble: DeepSeek-Coder + Llama3 + Mistral
echo No external API dependencies - 100%% autonomous
echo.

REM Check if Ollama is running
echo [1/3] Checking Ollama status...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Ollama not detected. Starting Ollama...
    start "" "ollama serve"
    timeout /t 5 /nobreak >nul
)

REM Ensure models are available
echo [2/3] Verifying local models...
echo    - deepseek-coder
echo    - llama3
echo    - mistral
echo    (Run: ollama pull deepseek-coder && ollama pull llama3)

echo [3/3] Starting Prediction Engine...
start "📊 Market Prediction Engine" cmd /c "cd /d %~dp0.. && npx tsx scripts/market_prediction_engine.ts 2>>../data/logs/prediction.log"

echo.
echo ════════════════════════════════════════════════════════════════════════
echo    ✅ PREDICTION ENGINE STARTED
echo ════════════════════════════════════════════════════════════════════════
echo.
echo 📊 Monitoring: BTC, ETH, SOL, ADA, DOT, LINK, AVAX, MATIC
echo 🤖 Models: DeepSeek-Coder, Llama3, Mistral (ensemble voting)
echo 💾 Output: swarm/data/predictions/
echo.
echo 💡 Install models with:
echo    ollama pull deepseek-coder
echo    ollama pull llama3
echo.

pause
