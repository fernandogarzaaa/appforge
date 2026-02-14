@echo off
TITLE Sovereign AI Core - Unified Orchestrator
color 0B

echo.
echo ════════════════════════════════════════════════════════════════════════════════
echo    🛡️  SOVEREIGN AI - UNIFIED ECOSYSTEM ORCHESTRATOR
echo ════════════════════════════════════════════════════════════════════════════════
echo.

cd /d "%~dp0..\.."

:: ══════════════════════════════════════════════════════════════════════════════════
:: PHASE 1: COGNITIVE CORE (Background Services)
:: ══════════════════════════════════════════════════════════════════════════════════
echo 🌌 [Phase 1/5] Initializing Quantum Engine v2...
start "🌌 Quantum Engine" /b cmd /c "npx tsx swarm/core/quantum_engine_launcher.ts >> data/logs/quantum_core.log 2>&1"
timeout /t 2 /nobreak >nul

echo 🐝 [Phase 2/5] Initializing Multi-Swarm Coordinator...
start "🐝 Swarm Coordinator" /b cmd /c "npx tsx swarm/core/swarm_coordinator_launcher.ts >> data/logs/coordinator.log 2>&1"
timeout /t 2 /nobreak >nul

echo 🚜 [Phase 3/5] Starting Real Swarm Executor...
start "🚜 Swarm Executor" /b cmd /c "npx tsx scripts/real_swarm_executor.ts >> data/logs/executor.log 2>&1"
timeout /t 2 /nobreak >nul

echo 🛡️ [Phase 3.5/5] Starting Sovereign Kernel (Rust Oracle)...
start "🛡️ Rust Oracle" /b cmd /c "cd swarm/core/quantum_bridge && cargo run --bin quantum_bridge >> ..\..\..\data\logs\rust_oracle.log 2>&1"
timeout /t 5 /nobreak >nul

:: ══════════════════════════════════════════════════════════════════════════════════
:: PHASE 2: TELEMETRY & UI (Ecosystem Bridge)
:: ══════════════════════════════════════════════════════════════════════════════════
echo 🛰️ [Phase 4/5] Starting Swarm Telemetry Server...
start "🛰️ Telemetry Server" /b cmd /c "npx tsx scripts/swarm_telemetry_server.ts >> data/logs/telemetry.log 2>&1"
timeout /t 5 /nobreak >nul

echo 🌐 [Phase 5/5] Initializing UI Engine...
cd sovereign-ui
start "🌐 Sovereign UI" /b cmd /c "npm run dev >> ..\data\logs\sovereign-ui.log 2>&1"
cd ..
timeout /t 5 /nobreak >nul

:: ══════════════════════════════════════════════════════════════════════════════════
:: PHASE 3: NATIVE SHELL (User Interface)
:: ══════════════════════════════════════════════════════════════════════════════════
echo.
echo 🕹️ Launching Sovereign Native Shell...
echo.
echo ════════════════════════════════════════════════════════════════════════════════
echo    ✅ ECOSYSTEM SYNCHRONIZED
echo ════════════════════════════════════════════════════════════════════════════════
echo.

start "" npm run app:desktop

echo 💡 System is running in background. Terminate node processes to shutdown.
timeout /t 5 /nobreak >nul
exit
