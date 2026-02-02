#!/bin/bash

# Build script for Quantum Core WASM module

echo "🔮 Building Quantum Core WASM Module..."

cd quantum-core

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null
then
    echo "❌ wasm-pack not found. Installing..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Build the WASM module
echo "⚛️ Compiling Rust to WebAssembly..."
wasm-pack build --target web --out-dir ../src/wasm

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Quantum Core built successfully!"
    echo "📦 WASM module available at: src/wasm/"
else
    echo "❌ Build failed. Check Rust code for errors."
    exit 1
fi

cd ..

echo "🚀 You can now import quantum features in your React components:"
echo ""
echo "import init, { QuantumAnnealer } from '@/wasm/quantum_core';"
echo ""
echo "await init();"
echo "const annealer = new QuantumAnnealer(100.0, 0.95);"
