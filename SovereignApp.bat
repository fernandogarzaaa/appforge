@echo off
setlocal
cd /d "%~dp0"

echo ════════════════════════════════════════════════════════════════════════════════
echo    🛡️ SOVEREIGN AI - NATIVE APP INTEGRATION ORCHESTRATOR
echo ════════════════════════════════════════════════════════════════════════════════
echo.

:: ═══════════════════════════════════════════════════════════════════════════════════
:: PHASE 1: QUANTUM ENGINE v2 (Direct Import) - Priority 1
:: ═══════════════════════════════════════════════════════════════════════════════════
echo 🌌 [Phase 1] Initializing Quantum Engine v2...
start /b cmd /c "npx tsx swarm/core/quantum_engine_launcher.ts"
timeout /t 2 /nobreak >nul
echo ✅ [Phase 1] Quantum Engine v2 ready (direct import mode)

:: ═══════════════════════════════════════════════════════════════════════════════════
:: PHASE 2: ORACLE ENHANCED (Lazy Load) - Priority 2
:: ═══════════════════════════════════════════════════════════════════════════════════
echo 🌟 [Phase 2] Oracle Enhanced ready (lazy load mode)
:: Oracle is lazy-loaded on first consultation
:: Usage: import { oracleService, consult } from './swarm/core/oracle_api_service.js'

:: ═══════════════════════════════════════════════════════════════════════════════════
:: PHASE 3: MULTI-SWARM COORDINATOR (Direct Import) - Priority 3
:: ═══════════════════════════════════════════════════════════════════════════════════
echo 🐝 [Phase 3] Initializing Multi-Swarm Coordinator...
start /b cmd /c "npx tsx swarm/core/swarm_coordinator_launcher.ts"
timeout /t 2 /nobreak >nul
echo ✅ [Phase 3] Multi-Swarm Coordinator ready (event-driven mode)

echo.
echo ════════════════════════════════════════════════════════════════════════════════════════
echo    🛡️  NATIVE INTEGRATION COMPLETE
echo ════════════════════════════════════════════════════════════════════════════════════════
echo    🌌 Quantum Engine v2:     Direct Import (Lowest Latency)
echo    🌟 Oracle Enhanced:       Lazy Load (On-Demand)
echo    🐝 Multi-Swarm Coordinator: Event-Driven (Direct Import)
echo    🛰️ Swarm Telemetry:       Port 3001 (Native App Connection)
echo ════════════════════════════════════════════════════════════════════════════════════════
echo.

:: 1. Check/Boot Swarm Telemetry Server (Port 3001)
netstat -ano | findstr :3001 >nul
if %errorlevel% neq 0 (
    echo 🛰️ [Sovereign] Port 3001 Offline. Booting Swarm Telemetry...
    start /b cmd /c "npx tsx scripts/swarm_telemetry_server.ts"
    timeout /t 3 /nobreak >nul
) else (
    echo ✅ [Sovereign] Swarm Telemetry Detected.
)

:: 2. Check/Boot Dedicated UI Engine (Port 5174)
netstat -ano | findstr :5174 >nul
if %errorlevel% neq 0 (
    echo 🚀 [Sovereign] Booting Standalone UI Engine...
    cd sovereign-ui
    start /b cmd /c "npm run dev"
    cd ..
    timeout /t 5 /nobreak >nul
) else (
    echo ✅ [Sovereign] UI Engine Detected.
)

echo 🕹️ [Sovereign] Launching Native Shell...
start /b cmd /c "npm run app:desktop"

echo.
echo 💡 [Sovereign] App running in background. You can close this window.
timeout /t 3 /nobreak >nul
exit
