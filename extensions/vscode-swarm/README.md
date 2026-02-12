# AppForge Swarm - VSCode Extension

Private AI-powered coding assistant with autonomous agents.

## Features

- 🧠 **AI Code Generation** - Generate code with GPT-4, Claude, Gemini, or local models
- 🤖 **Autonomous Agents** - CryptoSwarm, RevenueHunter, FreelanceSwarm, and more
- 🔒 **Privacy First** - Local model support for offline operation
- 🌐 **Multi-Provider** - Switch between cloud and local models
- 📦 **Portable** - Works with any LLM provider

## Installation

```bash
# Package extension
cd extensions/vscode-swarm
npm install
npm run compile

# Install from VSIX
code --install-extension out/appforge-swarm-*.vsix
```

## Configuration

```json
{
  "appforgeSwarm.apiKey": "your-api-key",
  "appforgeSwarm.primaryModel": "gpt-4o",
  "appforgeSwarm.localModel": "ollama",
  "appforgeSwarm.autoActivate": true
}
```

## Requirements

- VSCode 1.85+
- Node.js 18+
- Optional: Ollama for local inference

## Architecture

```
┌─────────────────────────────────────────────────┐
│              VSCode Extension                    │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐              │
│  │  Command    │  │   Webview   │              │
│  │  Handler    │  │  Dashboard  │              │
│  └──────┬──────┘  └──────┬──────┘              │
│         │                │                     │
│  ┌──────▼────────────────▼──────┐              │
│  │      Swarm Core Engine        │              │
│  │  ┌─────────────────────────┐  │              │
│  │  │   Provider Registry    │  │              │
│  │  │  ┌─────┐ ┌─────┐ ┌───┐ │  │              │
│  │  │  │GPT-4│ │Claude│ │Gem │ │  │              │
│  │  │  └──┬──┘ └──┬──┘ └──┬──┘ │  │              │
│  │  │     │       │       │    │  │              │
│  │  │  ┌──▼──┐ ┌──▼──┐ ┌──▼──┐ │  │              │
│  │  │  │Local│ │Cloud│ │Decen│ │  │              │
│  │  │  │Ollama│ │API  │ │tral │ │  │              │
│  │  │  └─────┘ └─────┘ └─────┘ │  │              │
│  │  └─────────────────────────┘  │              │
│  └───────────────────────────────┘              │
└─────────────────────────────────────────────────┘
```

## License

MIT
