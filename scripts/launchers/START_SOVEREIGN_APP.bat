@echo off
TITLE AppForge Sovereign App - All-in-One Launcher
color 0A

echo.
echo ════════════════════════════════════════════════════════════════════════
echo    🚀 SOVEREIGN APP - ALL-IN-ONE LAUNCHER
echo ════════════════════════════════════════════════════════════════════════
echo.
echo Primary Directive: Make money in reality no simulation 💰
echo Objective: Superior intelligence ⚡
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: 🧠 NEURAL INDEPENDENCE
set "TRUE_AI_INDEPENDENCE=true"
set "SWARM_REALITY_MODE=true"

echo [1/2] Orchestrating Swarm Ecosystem via PM2...
cmd /c "cd /d %~dp0.. && npx pm2 start ecosystem.config.cjs"
if %errorlevel% neq 0 (
    echo ❌ ERROR: Failed to start PM2 services!
    pause
    exit /b 1
)

echo.
echo [2/2] Launching Sovereign Control Interface...
timeout /t 5 /nobreak >nul
start "" "http://localhost:5174"

echo.
echo ════════════════════════════════════════════════════════════════════════
echo    ✅ SOVEREIGN APP STARTED SUCCESSFULLY
echo ════════════════════════════════════════════════════════════════════════
echo.
echo 📊 Dashboard: http://localhost:5174
echo 🛰️ Telemetry:  localhost:3001 (WebSocket)
echo 🐝 Swarms:     Running in background
echo.
echo ════════════════════════════════════════════════════════════════════════
echo Active Swarms:
echo    • CryptoSwarm      • RevenueHunter    • FreelanceSwarm
echo    • TrendAnalyzer    • ArbitrageHunter • YieldOptimizer
echo    • MarketAnalyzer   • SalesBot        • ReferralManager
echo    • SolanaDeFiSwarm  • GodSwarm
echo ════════════════════════════════════════════════════════════════════════
echo.
echo 💡 Tip: Keep this window open. Close terminals to stop services.
echo.

pause
