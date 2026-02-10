#!/bin/bash

# Build VS Code Extension
echo "🔨 Building VS Code Extension..."

cd packages/vscode-swarm-extension

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package extension
npx vsce package

echo "✅ Extension packaged: autonomous-swarm-vscode-1.0.0.vsix"
echo ""
echo "📦 To install:"
echo "   code --install-extension autonomous-swarm-vscode-1.0.0.vsix"
