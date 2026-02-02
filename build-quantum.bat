@echo off
REM Build script for Quantum Core WASM module (Windows)

echo 🔮 Building Quantum Core WASM Module...

cd quantum-core

REM Check if wasm-pack is installed
where wasm-pack >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ wasm-pack not found. Please install it first:
    echo cargo install wasm-pack
    exit /b 1
)

REM Build the WASM module
echo ⚛️ Compiling Rust to WebAssembly...
wasm-pack build --target web --out-dir ../src/wasm

if %errorlevel% equ 0 (
    echo ✅ Quantum Core built successfully!
    echo 📦 WASM module available at: src/wasm/
) else (
    echo ❌ Build failed. Check Rust code for errors.
    exit /b 1
)

cd ..

echo.
echo 🚀 You can now import quantum features in your React components:
echo.
echo import init, { QuantumAnnealer } from '@/wasm/quantum_core';
echo.
echo await init^(^);
echo const annealer = new QuantumAnnealer^(100.0, 0.95^);
