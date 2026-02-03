# Installing Node.js v20 to Fix Windows ESM Issue

## Quick Install Options

### Option 1: Direct Download (Recommended)
1. Download Node v20.18.2: https://nodejs.org/download/release/v20.18.2/node-v20.18.2-x64.msi
2. Run the installer
3. Restart your terminal
4. Verify: `node --version` (should show v20.18.2)
5. Run: `cd backend && npm run dev`

### Option 2: Using Chocolatey
```powershell
choco install nodejs-lts --version=20.18.2
```

### Option 3: Using Volta (Modern Node Manager)
```powershell
# Install Volta
winget install Volta.Volta

# Restart terminal, then:
volta install node@20
cd backend
npm run dev
```

### Option 4: Manual fnm Setup
```powershell
# Close and reopen PowerShell as Administrator
fnm install 20
fnm use 20
fnm default 20
```

## After Installing Node v20

```powershell
cd backend
node --version  # Should show v20.x.x
npm run dev     # Server should start successfully
```

The queue infrastructure will then work perfectly!
