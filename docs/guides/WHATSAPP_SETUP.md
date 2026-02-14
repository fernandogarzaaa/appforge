# WhatsApp Re-Authentication Guide

## Problem
WhatsApp connection failed with "401 Unauthorized" - authentication tokens expired.

## Solution: Scan New QR Code

### Step 1: Delete Old Auth Data
```bash
# Delete old tokens
rm -rf auth_info_baileys/*

# Verify deleted
dir auth_info_baileys
```

### Step 2: Start QR Code Server
```bash
# Start the swarm in QR mode
cd swarm
node whatsapp_qr_server.js
```

### Step 3: Scan QR Code
1. Open **WhatsApp** on your phone
2. Tap **three dots** → **Linked Devices**
3. Tap **"Link a Device"**
4. Scan the QR code shown in terminal

### Step 4: Verify Connection
Once scanned, you should see:
- "Connected" in terminal
- WhatsApp status in swarm logs
- Message: "WhatsApp is ready!"

---

## Alternative: Use test script

```bash
# Run WhatsApp test
npx tsx swarm/test_whatsapp_fix.ts
```

This will try to generate a new QR code if authentication fails.

---

## Troubleshooting

### "QR Code not showing"
- Make sure `auth_info_baileys` folder is empty
- Restart the swarm after deleting old tokens

### "Connection failed again"
- WhatsApp might have revoked the session
- Delete `auth_info_baileys/*` again
- Scan QR code within 60 seconds

### "Too many devices linked"
- Go to WhatsApp → Linked Devices
- Log out all other devices
- Try scanning again

---

## Expected Output

When successful, you'll see:
```
📡 [WhatsApp] Connected!
✅ WhatsApp authentication successful
📱 Device: WhatsApp on Android/iOS
```

---

## Once Connected

The swarm will:
- ✅ Send/receive messages automatically
- ✅ Process commands via WhatsApp
- ✅ Store session for future connections
