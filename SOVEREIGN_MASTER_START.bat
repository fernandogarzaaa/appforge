@echo off
TITLE 🦁🐍🐐 SOVEREIGN AI — MASTER CONTROL SWITCH
color 0E

:: ============================================================================
:: 🛠️  ROBUST ROOT DETECTION & PATH ENHANCEMENT
:: ============================================================================
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"
set "PROJECT_ROOT=%CD%"

:: Enhancing PATH for DLL stability (Rustup + MSVC + MinGW/MSYS2)
set "MSVC_PATH=C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.42.34433\bin\Hostx64\x64"
set "RUSTUP_PATH=%USERPROFILE%\.cargo\bin"
set "PATH=%RUSTUP_PATH%;%MSVC_PATH%;%PATH%;C:\msys64\mingw64\bin;C:\msys64\usr\bin"

:: 🧠 NEURAL INDEPENDENCE (Phase 83)
set "TRUE_AI_INDEPENDENCE=true"
set "SWARM_REALITY_MODE=true"

echo.
echo ════════════════════════════════════════════════════════════════════════════════
echo    🛡️  SOVEREIGN AI - TOTAL ECOSYSTEM ACTIVATION
echo ════════════════════════════════════════════════════════════════════════════════
echo.
echo Path: %PROJECT_ROOT%
echo.

:: ============================================================================
:: 🚀 PHASE 1: COGNITIVE ENGINE (IRON BRAIN)
:: ============================================================================
echo 🧠 [Step 1/3] Launching Iron Brain (Local Inference)...
start "🧠 Iron Brain" /d "%PROJECT_ROOT%\scripts\launchers" launch_iron_brain.bat
timeout /t 5 /nobreak >nul

:: ============================================================================
:: 🚀 PHASE 2: SOVEREIGN CORE (SWARM + UI)
:: ============================================================================
echo 🌌 [Step 2/3] Launching Sovereign Core (Dashboard + Swarm Loop)...
start "🌌 Sovereign Core" /d "%PROJECT_ROOT%\scripts\launchers" LAUNCH_SOVEREIGN_CORE.bat
timeout /t 5 /nobreak >nul

:: ============================================================================
:: 🚀 PHASE 3: CHIMERA UPLINK (CLOUD TUNNEL)
:: ============================================================================
echo 📡 [Step 3/3] Launching Chimera Uplink (Global Sync)...
start "📡 Chimera Uplink" /d "%PROJECT_ROOT%" LAUNCH_CHIMERA_UPLINK.bat

echo.
echo ════════════════════════════════════════════════════════════════════════════════
echo    ✅ ALL SYSTEMS ENGAGED
echo ════════════════════════════════════════════════════════════════════════════════
echo.
echo 💡 Monitor the secondary windows for logs.
echo 💡 Close individual windows to stop services.
echo.
pause
