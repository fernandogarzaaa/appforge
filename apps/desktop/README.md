# AppForge Desktop

A modern, user-friendly desktop application for AppForge - the quantum-powered development platform with swarm intelligence.

![AppForge Desktop](assets/screenshot.png)

## Features

- **One-Click Installation** - No more command-line setup
- **Interactive Onboarding Wizard** - Guided first-time setup with visual configuration
- **Beautiful Dashboard** - Real-time monitoring of services, agents, and quantum metrics
- **System Tray Integration** - Always-available menu bar/tray icon
- **Native Notifications** - Stay informed about important events
- **Cross-Platform** - Windows, macOS, and Linux support
- **CLI Compatibility** - Power users can still use commands

## Installation

### One-Line Installers

**Windows (PowerShell):**
```powershell
iwr -useb https://appforge.ai/install.ps1 | iex
```

**macOS/Linux (Bash):**
```bash
curl -fsSL https://appforge.ai/install.sh | bash
```

### Manual Download

Download the latest release for your platform:

- **Windows**: [AppForge-Setup-x64.exe](https://github.com/fernandogarzaaa/appforge/releases)
- **macOS**: [AppForge-x64.dmg](https://github.com/fernandogarzaaa/appforge/releases)
- **Linux**: [AppForge-x64.AppImage](https://github.com/fernandogarzaaa/appforge/releases)

## Development

### Prerequisites

- Node.js 20+
- npm or pnpm
- (Optional) Rust for Tauri build

### Setup

```bash
# Clone the repository
git clone https://github.com/fernandogarzaaa/appforge.git
cd appforge/desktop

# Install dependencies
npm install

# Run in development mode
npm run dev

# Start Electron in development mode
npm run electron:dev
```

### Building

```bash
# Build for all platforms
npm run electron:build

# Build for specific platforms
npm run electron:build:win    # Windows
npm run electron:build:mac    # macOS
npm run electron:build:linux  # Linux
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AppForge Desktop                         │
│              (Electron + React + TypeScript)                │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Dashboard  │  │    Swarm     │  │   Quantum    │      │
│  │   (React)    │  │   Control    │  │    Engine    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│              Electron Main Process (Node.js)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  System Tray │  │   Process    │  │   File I/O   │      │
│  │  Integration │  │   Manager    │  │   & Config   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│              AppForge Core (Existing)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Backend    │  │ Quantum-Core │  │    Swarm     │      │
│  │   (Node.js)  │  │    (Rust)    │  │   (Python)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## User Interface

### Onboarding Wizard

The onboarding wizard guides new users through:
1. Welcome & Introduction
2. Installation Path Selection
3. Service Configuration (Backend, Quantum Core, Swarm)
4. API Key Setup (Optional)
5. Launch

### Dashboard

The main dashboard provides:
- **Service Status** - Start/stop services with real-time status
- **Agent Activity** - Monitor swarm agents and their tasks
- **Quantum Metrics** - Real-time quantum engine statistics
- **System Health** - CPU, memory, and disk usage
- **System Logs** - Filterable log viewer with export
- **Quick Actions** - Common operations at your fingertips

## Configuration

AppForge Desktop stores configuration in:

- **Windows**: `%APPDATA%\AppForge\config.json`
- **macOS**: `~/Library/Application Support/AppForge/config.json`
- **Linux**: `~/.config/AppForge/config.json`

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + ,` | Open Settings |
| `Ctrl/Cmd + R` | Refresh Dashboard |
| `Ctrl/Cmd + Q` | Quit AppForge |
| `Ctrl/Cmd + M` | Minimize Window |
| `F11` | Toggle Fullscreen |

## API Integration

The desktop app communicates with AppForge core services via:
- **HTTP API** - RESTful endpoints for service control
- **WebSocket** - Real-time updates for metrics and logs
- **IPC** - Electron main-renderer communication

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

Apache-2.0 License - see [LICENSE](../LICENSE) for details.

## Support

- **Documentation**: https://docs.appforge.ai
- **Issues**: https://github.com/fernandogarzaaa/appforge/issues
- **Discord**: https://discord.gg/appforge

---

Built with ❤️ by the AppForge Team
