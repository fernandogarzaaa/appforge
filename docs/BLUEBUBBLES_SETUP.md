# BlueBubbles Server Setup Guide for AppForge Swarm

## Quick Setup Steps

### 1. Download BlueBubbles

**Option A: Direct Download**
- Go to: https://bluebubbles.app/get-started
- Download BlueBubbles.dmg for macOS

**Option B: Homebrew**
```bash
brew install --cask bluebubbles
```

### 2. Initial Configuration

1. **Open BlueBubbles** from Applications
2. **Sign in with Apple ID**: `fernandogarzaaa@gmail.com`
3. **Wait for iCloud sync** (may take 5-15 minutes)
   - You'll see "Syncing..." indicator
   - BlueBubbles needs to download message history

### 3. Create Your First Project

When BlueBubbles shows "No Projects Found":

1. Click **"+ New Project"** button
2. Select your iMessage account (should show your email)
3. Name it: `AppForge Swarm`
4. Click **Create**

### 4. Enable API Access

1. Go to **Settings** → **API**
2. Toggle **"Enable API"** to ON
3. Set **API Password**: `appforge_swarm_2024`
4. Note your Server URL (shown at top, e.g., `http://192.168.1.100:1234`)

### 5. Configure Firewall

```bash
# Allow BlueBubbles through macOS Firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /Applications/BlueBubbles.app/Contents/MacOS/BlueBubbles
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /Applications/BlueBubbles.app/Contents/MacOS/BlueBubbles
```

Or via System Preferences:
- System Preferences → Security & Privacy → Firewall → Firewall Options
- Add BlueBubbles and allow incoming connections

### 6. Get Your macOS IP Address

```bash
# Terminal command
ipconfig getifaddr en0

# Or check in System Preferences
# System Preferences → Network → Wi-Fi → IP Address
```

### 7. Update AppForge .env.local

On your AppForge machine, update `.env.local`:

```env
# BlueBubbles Configuration
BLUEBUBBLES_SERVER_URL=http://YOUR_MAC_IP:1234
BLUEBUBBLES_PASSWORD=appforge_swarm_2024
TRANSPORT_PRIORITY=imessage
IMESSAGE_RECIPIENT=fernandogarzaaa@gmail.com
```

### 8. Restart AppForge Swarm

```bash
cd /path/to/appforge-main
npx pm2 restart appforge-swarm
```

## Testing the Connection

### Test BlueBubbles API

On your macOS machine, open terminal:

```bash
# Test if API is responding
curl http://localhost:1234/api/v1/server/info

# Should return JSON like:
# {"success":true,"data":{"version":"1.9.0","os":"macos"...}}
```

### Test from AppForge

```bash
# Check swarm status
npx pm2 status

# Send transport command
npx pm2 sendline appforge-swarm transport
```

## Troubleshooting

### "Connection Refused" Error

1. Check BlueBubbles is running
2. Verify port 1234 is open
3. Check firewall settings
4. Ensure both machines are on same network or port is forwarded

### "Authentication Failed"

1. Verify password in .env.local matches BlueBubbles API settings
2. Try regenerating API password in BlueBubbles

### "No Projects Found" in BlueBubbles

1. Sign out and sign back into iCloud in BlueBubbles
2. Wait for sync to complete (can take 30+ minutes for large message databases)
3. Try creating a new project manually
4. Restart BlueBubbles

### Messages Not Sending

1. Check BlueBubbles logs (Window → Show Logs)
2. Verify recipient is in your contacts
3. Try sending to phone number instead of email

## Production Deployment

For 24/7 operation:

1. **Enable LaunchAgent** (auto-start on boot):
   ```bash
   cp BlueBubbles.app/Contents/Resources/com.bluebubbles.server.plist ~/Library/LaunchAgents/
   launchctl load ~/Library/LaunchAgents/com.bluebubbles.server.plist
   ```

2. **Set static IP** on your macOS machine
3. **Configure port forwarding** on router if accessing remotely

## Swarm Commands

Once configured, you can control transport from within swarm:

```
transport   - Show current transport status
imessage    - Switch to iMessage (if available)
whatsapp    - Switch to WhatsApp
status      - Show swarm health
```

## API Reference

### Send Message
```bash
curl -X POST http://localhost:1234/api/v1/chat/text \
  -H "Content-Type: application/json" \
  -H "Password: appforge_swarm_2024" \
  -d '{
    "guid": "fernandogarzaaa@gmail.com",
    "text": "Hello from AppForge Swarm!"
  }'
```

### Get Chats
```bash
curl http://localhost:1234/api/v1/chat \
  -H "Password: appforge_swarm_2024"
```

### Server Info
```bash
curl http://localhost:1234/api/v1/server/info \
  -H "Password: appforge_swarm_2024"
```
