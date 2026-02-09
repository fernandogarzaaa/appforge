@echo off
REM Build script for quantum-core WASM module (Windows)

echo 🦀 Building Quantum Core WASM...

REM Navigate to quantum-core directory
cd /d "%~dp0\..\src\quantum-core"

REM Check if wasm-pack is installed
where wasm-pack >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ wasm-pack not found. Installing...
    cargo install wasm-pack
)

REM Build for web target
echo 📦 Running wasm-pack build...
wasm-pack build --target web --out-dir pkg --release

echo ✅ Build complete! Output in src\quantum-core\pkg\
