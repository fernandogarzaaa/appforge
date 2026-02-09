#!/bin/bash
# Build script for quantum-core WASM module

set -e

echo "🦀 Building Quantum Core WASM..."

# Navigate to quantum-core directory
cd "$(dirname "$0")/../src/quantum-core"

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack not found. Installing..."
    cargo install wasm-pack
fi

# Build for web target
echo "📦 Running wasm-pack build..."
wasm-pack build --target web --out-dir pkg --release

# Copy to a location Vite can find
echo "✅ Build complete! Output in src/quantum-core/pkg/"

# Show bundle size
if [ -f "pkg/quantum_core_bg.wasm" ]; then
    SIZE=$(du -h pkg/quantum_core_bg.wasm | cut -f1)
    echo "📊 WASM bundle size: $SIZE"
fi
