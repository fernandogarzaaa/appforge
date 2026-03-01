# AppForge & CHIMERA - Production Deployment Guide

Complete guide for deploying AppForge with CHIMERA QUANTUM LLM in production.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [CHIMERA Server Deployment](#chimera-server-deployment)
3. [AppForge Desktop Deployment](#appforge-desktop-deployment)
4. [Configuration](#configuration)
5. [Monitoring](#monitoring)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

**Minimum:**
- CPU: 4 cores
- RAM: 8 GB
- Storage: 10 GB free space
- OS: Windows 10+, macOS 12+, or Ubuntu 20.04+
- Network: Internet connection for API calls

**Recommended:**
- CPU: 8+ cores
- RAM: 16 GB
- Storage: 50 GB SSD
- OS: Windows 11, macOS 14+, or Ubuntu 22.04+

### Software Requirements

1. **Python 3.9+** (for CHIMERA server)
   ```bash
   # Windows: Download from python.org
   # macOS: brew install python@3.11
   # Ubuntu: sudo apt install python3.11 python3.11-pip
   ```

2. **Node.js 20+** (for AppForge Desktop)
   ```bash
   # Windows: Download from nodejs.org
   # macOS: brew install node@20
   # Ubuntu: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   ```

3. **Git** (for cloning repository)
   ```bash
   # All platforms: https://git-scm.com/downloads
   ```

## CHIMERA Server Deployment

### Step 1: Clone Repository

```bash
git clone https://github.com/fernandogarzaaa/appforge.git
cd appforge/infrastructure/clawd-hybrid-rtx
```

### Step 2: Create Virtual Environment (Recommended)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Configure Environment

```bash
# Copy example environment file
cp .env.clawd.example .env.clawd

# Edit with your API keys
# Windows: notepad .env.clawd
# macOS/Linux: nano .env.clawd
```

Required configuration:
```ini
# OpenRouter API Key (required)
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Optional: Kimi API Key for premium fallback
KIMI_API_KEY=sk-your-kimi-key

# Server settings
CLAWD_PORT=7860
CLAWD_HOST=0.0.0.0
```

### Step 5: Start the Server

**Windows (PowerShell - Recommended):**
```powershell
.\scripts\start_chimera.ps1
```

**Development Mode:**
```powershell
.\scripts\start_chimera.ps1 -DevMode
```

**Manual Start:**
```bash
python -m uvicorn src.chimera_server:app --host 0.0.0.0 --port 7860
```

### Step 6: Verify Installation

```bash
# Test health endpoint
curl http://localhost:7860/health

# Run benchmark suite
python benchmark.py
```

Expected output:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "models_configured": 5,
  "fallback_models": 3
}
```

### Step 7: Production Service Setup

**Windows (NSSM):**
```powershell
# Install NSSM (Non-Sucking Service Manager)
# Download from https://nssm.cc/download

# Create service
nssm install CHIMERA "C:\path\to\python.exe"
nssm set CHIMERA AppDirectory "C:\path\to\appforge\infrastructure\clawd-hybrid-rtx"
nssm set CHIMERA AppParameters "-m uvicorn src.chimera_server:app --host 0.0.0.0 --port 7860"
nssm start CHIMERA
```

**Linux (systemd):**
```bash
sudo tee /etc/systemd/system/chimera.service > /dev/null <<EOF
[Unit]
Description=CHIMERA QUANTUM LLM Server
After=network.target

[Service]
Type=simple
User=chimera
WorkingDirectory=/opt/appforge/infrastructure/clawd-hybrid-rtx
Environment=PATH=/opt/appforge/venv/bin
ExecStart=/opt/appforge/venv/bin/python -m uvicorn src.chimera_server:app --host 0.0.0.0 --port 7860
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable chimera
sudo systemctl start chimera
```

**macOS (launchd):**
```bash
sudo tee /Library/LaunchDaemons/com.appforge.chimera.plist > /dev/null <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.appforge.chimera</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/appforge/venv/bin/python</string>
        <string>-m</string>
        <string>uvicorn</string>
        <string>src.chimera_server:app</string>
        <string>--host</string>
        <string>0.0.0.0</string>
        <string>--port</string>
        <string>7860</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/opt/appforge/infrastructure/clawd-hybrid-rtx</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF

sudo launchctl load /Library/LaunchDaemons/com.appforge.chimera.plist
```

## AppForge Desktop Deployment

### Step 1: Navigate to Desktop App

```bash
cd appforge/apps/desktop
# or
cd appforge/desktop
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Backend URL

Edit `src/config.ts` or `.env`:
```typescript
VITE_API_URL=http://localhost:7860
```

### Step 4: Build Application

```bash
# Build frontend
npm run build

# Build Electron app
npm run electron:build
```

### Step 5: Install Application

**Windows:**
```powershell
# Run installer
.\dist\AppForge-Setup-3.0.0.exe
```

**macOS:**
```bash
# Mount DMG
open dist/AppForge-3.0.0.dmg
# Drag to Applications
```

**Linux:**
```bash
# Make executable
chmod +x dist/AppForge-3.0.0.AppImage
# Run
./dist/AppForge-3.0.0.AppImage
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENROUTER_API_KEY` | OpenRouter API key | - | Yes |
| `KIMI_API_KEY` | Kimi fallback API key | - | No |
| `CLAWD_PORT` | Server port | 7860 | No |
| `CLAWD_HOST` | Server host | 0.0.0.0 | No |
| `ENABLE_QUANTUM` | Enable quantum engine | 1 | No |
| `ENABLE_CACHE` | Enable semantic cache | 1 | No |
| `ENABLE_HYPER` | Enable hyper intelligence | 1 | No |
| `MAX_PRIMARY_MODELS` | Max primary models | 3 | No |
| `MAX_FALLBACK_MODELS` | Max fallback models | 5 | No |
| `CACHE_SIMILARITY_THRESHOLD` | Cache threshold | 0.92 | No |
| `MAX_CALLS_PER_MINUTE` | Rate limit | 10 | No |

### Model Configuration

Edit `src/config.py` or set `OPENROUTER_MODELS`:
```python
MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "qwen/qwen3-coder:free",
    "deepseek/deepseek-r1-0528:free",
]
```

## Monitoring

### Dashboard

Access the live dashboard at:
```
http://localhost:7860/dashboard
```

### Health Check

```bash
curl http://localhost:7860/health
```

### Logs

**Server logs:**
```bash
# Windows
type logs\chimera.log

# macOS/Linux
tail -f logs/chimera.log
```

**System logs:**
```bash
# Linux
sudo journalctl -u chimera -f

# macOS
sudo log stream --predicate 'process == "python"'
```

### Metrics

Key metrics to monitor:
- Cache hit rate (target: >40%)
- Average response time (target: <5s)
- Model success rate (target: >90%)
- Error rate (target: <1%)

## Troubleshooting

### Server Won't Start

**Port already in use:**
```bash
# Windows
Get-NetTCPConnection -LocalPort 7860
Stop-Process -Id <PID>

# macOS/Linux
lsof -i :7860
kill -9 <PID>
```

**Missing dependencies:**
```bash
pip install -r requirements.txt --force-reinstall
```

**Permission denied:**
```bash
# Linux/macOS
chmod +x scripts/start_chimera.ps1
```

### API Errors

**401 Unauthorized:**
- Check `OPENROUTER_API_KEY` is set correctly
- Verify key is valid at https://openrouter.ai/keys

**429 Rate Limited:**
- Reduce `MAX_CALLS_PER_MINUTE`
- Add more fallback models
- Enable caching

**500 Internal Error:**
- Check logs: `logs/chimera.log`
- Verify all modules load correctly
- Test with `python benchmark.py`

### Performance Issues

**Slow responses:**
- Enable caching: `ENABLE_CACHE=1`
- Reduce `MAX_PRIMARY_MODELS`
- Check network connection

**High memory usage:**
- Reduce `CACHE_MAX_ENTRIES`
- Limit conversation memory
- Restart server periodically

### Desktop App Issues

**Won't connect to server:**
- Verify CHIMERA is running: `curl http://localhost:7860/health`
- Check firewall settings
- Verify API URL in settings

**Build fails:**
```bash
# Clear cache
npm clean-install

# Rebuild
npm run build
```

## Security Best Practices

1. **API Keys:**
   - Never commit `.env.clawd` to git
   - Use strong, unique API keys
   - Rotate keys regularly

2. **Network:**
   - Use firewall to restrict port access
   - Consider reverse proxy (nginx/traefik)
   - Enable HTTPS in production

3. **Updates:**
   - Keep dependencies updated
   - Monitor security advisories
   - Test updates in staging first

## Support

- **Documentation:** https://docs.appforge.ai
- **Issues:** https://github.com/fernandogarzaaa/appforge/issues
- **Discord:** https://discord.gg/appforge

---

**Last Updated:** 2026-03-01  
**Version:** 3.0.0 Production
