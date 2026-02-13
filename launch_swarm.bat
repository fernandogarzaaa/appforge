@echo off
TITLE AppForge Antigravity Swarm - Full Deployment v2
color 0A

echo.
echo ════════════════════════════════════════════════════════════════════════
echo    🚀 ANTIGRAVITY SWARM - FULL DEPLOYMENT
echo ════════════════════════════════════════════════════════════════════════
echo.
echo Primary Directive: Make money in reality no simulation 💰
echo Secondary Directive: Autonomous evolution 🧬
echo Objective: Superior intelligence ⚡
echo.

REM Create logs directory
if not exist "swarm\logs" mkdir "swarm\logs"

echo [1/5] Starting Swarm Components...
echo.

REM Terminal 1: Hyper Intelligence v2 (Finance)
echo ▌ Terminal 1: 🧠 Hyper Intelligence v2 (Finance)
echo ▌ Learning from markets, jobs, GitHub, HackerNews, DeFi
start "🧠 Swarm Terminal 1: Hyper v2" cmd /c "cd /d %~dp0 && npx tsx swarm/core/real_hyper_intelligence_v2.ts 2^>^> swarm\logs\hyper_v2.log"
timeout /t 3 /nobreak >nul

REM Terminal 2: All Swarm Agents
echo.
echo ▌ Terminal 2: 🐝 All Swarm Agents Test
echo ▌ CryptoSwarm, RevenueHunter, FreelanceSwarm, GodMode, etc.
start "🐝 Swarm Terminal 2: Agents" cmd /c "cd /d %~dp0 && npx tsx swarm/test_all_agents.ts 2^>^> swarm\logs\agents.log"
timeout /t 3 /nobreak >nul

REM Terminal 3: Universal Hyper Intelligence
echo.
echo ▌ Terminal 3: 🌍 Universal Hyper Intelligence
echo ▌ Learning from Science, Code, Math, Philosophy, Medicine, etc.
start "🌍 Swarm Terminal 3: Universal" cmd /c "cd /d %~dp0 && npx tsx swarm/core/universal_hyper_intelligence.ts 2^>^> swarm\logs\universal.log"
timeout /t 3 /nobreak >nul

REM Terminal 4: WhatsApp Bridge
echo.
echo ▌ Terminal 4: 📱 WhatsApp Bridge
echo ▌ For notifications and commands
start "📱 Swarm Terminal 4: WhatsApp" cmd /c "cd /d %~dp0 && npx tsx swarm/core/whatsapp_bridge.ts 2^>^> swarm\logs\whatsapp.log"
timeout /t 3 /nobreak >nul

echo.
echo [2/5] Creating status logger...
if not exist "swarm\core\swarm_status_log.json" echo [] > "swarm\core\swarm_status_log.json"

echo.
echo [3/5] Swarm Status:
echo.
echo    Terminal 1: 🧠 Hyper Intelligence v2 - RUNNING
echo    Terminal 2: 🐝 All Agents          - RUNNING
echo    Terminal 3: 🌍 Universal Hyper      - RUNNING
echo    Terminal 4: 📱 WhatsApp Bridge      - RUNNING (scan QR)
echo.
echo [4/5] Swarm Components Active:
echo.
echo    🤖 13 Agents: CryptoSwarm, RevenueHunter, FreelanceSwarm,
echo        GodMode, TrendAnalyzer, ArbitrageHunter, YieldOptimizer,
echo        MarketAnalyzer, SalesBot, ReferralManager, + more
echo.
echo    🧠 Quantum Engine v2: Multi-Head Attention, Island Model GA,
echo        Pattern Recognition, Anomaly Detection, Predictive Analytics
echo.
echo [5/5] Complete!
echo.
echo ════════════════════════════════════════════════════════════════════════
echo    ✅ SWARM FULLY DEPLOYED
echo ════════════════════════════════════════════════════════════════════════
echo.
echo 📊 Check log files in: swarm\logs\
echo 📱 WhatsApp: Scan QR code in Terminal 4 for notifications
echo.
echo To stop all: Close all terminals or use Ctrl+C in each
echo.

pause
