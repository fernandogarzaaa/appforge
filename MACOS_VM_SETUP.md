# macOS VM Setup for BlueBubbles

## Overview

To run BlueBubbles (iMessage), you need macOS. Since you don't have a physical Mac, you have two options:

1. **Cloud macOS** (Easier - use a remote Mac)
2. **Local VM** (If you have Apple Silicon hardware)

---

## Option 1: Cloud macOS (Recommended)

### MacStadium ($40-100/month)

1. **Sign up**: https://www.macstadium.com/
2. **Create Mac Mini**:
   - Select M1/M2 Mac Mini
   - Choose macOS Ventura or Sonoma
   - Allocate: 4 vCPU, 8GB RAM
3. **Access via VNC**:
   - MacStadium provides VNC access
   - Or use: `ssh user@your-mac-ip`
4. **Install BlueBubbles**:
   - Download from bluebubbles.app
   - Sign in with `fernandogarzaaa@gmail.com`
5. **Get VM IP**:
   - Note the Mac Mini's IP address
   - Example: `23.45.67.89`
6. **Update AppForge**:
   ```env
   BLUEBUBBLES_SERVER_URL=http://23.45.67.89:1234
   BLUEBUBBLES_PASSWORD=appforge_swarm_2024
   TRANSPORT_PRIORITY=imessage
   ```

### AWS EC2 Mac ($1-3/hour)

1. **Launch Instance**:
   - AWS Console → EC2 → Instances
   - Search for "macOS" or "Apple"
   - Select `mac2-ec2-instance` (M1 Mac Mini)
2. **Configure**:
   - t4g.medium equivalent
   - 120GB SSD
   - Key pair required
3. **Connect**:
   - Use AWS SSM Session Manager
   - Or VNC viewer
4. **Install BlueBubbles**:
   - Download and install
   - Configure API
5. **Security Group**:
   - Allow inbound port 1234 from your AppForge IP

---

## Option 2: Local macOS VM (Requires Apple Silicon)

### Requirements

- **Mac with M1/M2/M3 chip** (Intel Mac won't work)
- **UTM or VMware Fusion**
- **macOS IPSW file**

### Setup Steps

1. **Download UTM**:
   - https://mac.getutm.app/
   - Install on your Mac

2. **Download macOS IPSW**:
   ```
   https://updates.cdn-apple.com/2023WinterFalls/fullchainess-041-019-20231211-20231211/3F957920-6D1B-4E7A-93B5-9F3C9B2E9AAA/UniversalMac_23F79.Restore/UniversalMac_23F79.Restore.ipsw
   ```

3. **Create VM**:
   - Open UTM
   - "Create a New Virtual Machine"
   - "Virtualize"
   - Select macOS
   - Select IPSW file
   - Allocate: 4GB RAM, 4 CPU cores, 100GB storage

4. **Install macOS**:
   - Follow installer
   - Create admin user

5. **Configure Network**:
   - UTM VM Settings → Network
   - Set to "Bridged"
   - Note IP: `192.168.x.x`

6. **Install BlueBubbles**:
   - Download from bluebubbles.app
   - Sign in with Apple ID
   - Enable API

---

## BlueBubbles Configuration (On macOS)

1. **Open BlueBubbles**
2. **Sign in**: `fernandogarzaaa@gmail.com`
3. **Create Project**:
   - Click "+ New Project"
   - Name: "AppForge Swarm"
4. **Enable API**:
   - Settings → API
   - Enable API
   - Password: `appforge_swarm_2024`
5. **Get Server Info**:
   - Note the server URL shown
   - Example: `http://192.168.1.50:1234`

---

## AppForge Configuration

Update `.env.local`:
```env
# Transport Priority
TRANSPORT_PRIORITY=imessage

# BlueBubbles Settings
BLUEBUBBLES_SERVER_URL=http://192.168.1.50:1234
BLUEBUBBLES_PASSWORD=appforge_swarm_2024

# iMessage Recipient
IMESSAGE_RECIPIENT=fernandogarzaaa@gmail.com

# Fallback to WhatsApp
WHATSAPP_PHONE_NUMBER=+639761267704
```

Restart swarm:
```bash
npx pm2 restart appforge-swarm
```

---

## Troubleshooting

### "Connection Refused"
- Check BlueBubbles is running
- Verify port 1234 is open
- Check firewall rules

### "Authentication Failed"
- Verify API password matches
- Restart BlueBubbles

### "No Projects Found"
- Sign out/in of Apple ID
- Wait for iCloud sync
- Create new project manually

---

## Estimated Costs

| Option | Monthly Cost | Notes |
|--------|-------------|-------|
| MacStadium | $40-100 | Managed, reliable |
| AWS EC2 | $70-100 | Pay-as-you-go |
| UTM (local) | $0 | Requires Mac hardware |
| MacInCloud | $20-50 | Shared Mac access |

---

## Next Steps

1. **Choose provider** (MacStadium recommended for simplicity)
2. **Rent Mac** and get IP address
3. **Install BlueBubbles**
4. **Configure API**
5. **Update AppForge .env.local**
6. **Restart swarm**

Once configured, your swarm will use iMessage as primary and WhatsApp as fallback!
