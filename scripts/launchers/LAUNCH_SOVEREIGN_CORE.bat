@echo off
TITLE Sovereign AI Core - Unified Orchestrator
color 0B

echo.
echo ════════════════════════════════════════════════════════════════════════════════
echo    🛡️  SOVEREIGN AI - UNIFIED ECOSYSTEM ORCHESTRATOR
echo ════════════════════════════════════════════════════════════════════════════════
echo.

:: Robust Root Detection
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"
cd ..\..
set "PROJECT_ROOT=%CD%"
cd /d "%PROJECT_ROOT%"

:: Enhancing PATH for DLL stability (Rustup + MSVC + MinGW/MSYS2)
set "MSVC_PATH=C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.42.34433\bin\Hostx64\x64"
set "RUSTUP_PATH=%USERPROFILE%\.cargo\bin"
set "PATH=%RUSTUP_PATH%;%MSVC_PATH%;%PATH%;C:\msys64\mingw64\bin;C:\msys64\usr\bin"

:: ══════════════════════════════════════════════════════════════════════════════════
:: PRE-FLIGHT: Environment & Dependencies
:: ══════════════════════════════════════════════════════════════════════════════════
echo 🛠️  [Pre-flight] Preparing environment...

:: Ensure log directory exists
if not exist data\logs mkdir data\logs

:: PORT CLEARANCE: Terminate any processes holding critical ports
echo 🧹 Clearing ports 3001 (Telemetry) and 5174 (UI)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5174 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul

:: PATH ENHANCEMENT: Attempt to find common Windows tool paths (Git, MSYS, etc.)
:: This helps resolve missing DLLs like libintl-8.dll if they are present in Git folders
set "GIT_BIN=C:\Program Files\Git\bin"
set "GIT_USR_BIN=C:\Program Files\Git\usr\bin"
if exist "%GIT_BIN%" set "PATH=%PATH%;%GIT_BIN%"
if exist "%GIT_USR_BIN%" set "PATH=%PATH%;%GIT_USR_BIN%"

:: ══════════════════════════════════════════════════════════════════════════════════
:: PHASE 1: COGNITIVE CORE (Background Services)
:: ══════════════════════════════════════════════════════════════════════════════════
echo 🌌 [Phase 1/6] Initializing Quantum Engine v2...
start "🌌 Quantum Engine" /b cmd /c "npx tsx swarm/core/quantum_engine_launcher.ts >> data/logs/quantum_core.log 2>&1"
timeout /t 2 /nobreak >nul

echo 🐝 [Phase 2/6] Initializing Multi-Swarm Coordinator...
start "🐝 Swarm Coordinator" /b cmd /c "npx tsx swarm/core/swarm_coordinator_launcher.ts >> data/logs/coordinator.log 2>&1"
timeout /t 2 /nobreak >nul

echo 🚜 [Phase 3/6] Starting Real Swarm Telemetry Executor (UI Data)...
start "🚜 Swarm Executor" /b cmd /c "npx tsx scripts/real_swarm_executor.ts >> data/logs/executor.log 2>&1"
timeout /t 2 /nobreak >nul

echo 🛡️ [Phase 3.5/6] Starting Sovereign Kernel (Rust Oracle)...
start "🛡️ Rust Oracle" /b cmd /c "cd swarm/core/quantum_bridge && cargo run --bin quantum_bridge >> ..\..\..\data\logs\rust_oracle.log 2>&1"
timeout /t 5 /nobreak >nul

echo 🌀 [Phase 4/6] Starting Autonomous Swarm Loop (Continuous Intelligence)...
start "🌀 Swarm Loop" /b cmd /c "npx tsx swarm/core/loop.ts >> data/logs/swarm_daemon.log 2>&1"
timeout /t 2 /nobreak >nul

:: ══════════════════════════════════════════════════════════════════════════════════
:: PHASE 2: TELEMETRY & UI (Ecosystem Bridge)
:: ══════════════════════════════════════════════════════════════════════════════════
echo 🛰️ [Phase 5/6] Starting Swarm Telemetry Server...
start "🛰️ Telemetry Server" /b cmd /c "npx tsx scripts/swarm_telemetry_server.ts >> data/logs/telemetry.log 2>&1"
timeout /t 5 /nobreak >nul

echo 🌐 [Phase 6/6] Initializing UI Engine...
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
