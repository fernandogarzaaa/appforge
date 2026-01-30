# Admin Features Quick Reference

## 📊 Admin Control Center - Feature Overview

### Dashboard Layout
```
┌─────────────────────────────────────────────────────┐
│  Admin Control Center          [Help Icon]          │
│  Manage settings, API keys, and users               │
└─────────────────────────────────────────────────────┘
│ [🛡️ Health] [🔑 Keys] [⚙️ Settings] [👥 Users]    │
└─────────────────────────────────────────────────────┘
```

---

## 🔑 API Key Management

### Add New Key
- **Button**: "Add API Key"
- **Fields**: Name, Type, Secret Value
- **Types**: OpenAI, Anthropic, Google, Hugging Face, Stripe, GitHub, AWS, Custom

### Key Features
```
API Key Item:
├─ Service Name (e.g., "OpenAI API")
├─ Provider Icon (🤖, 🧠, 📚, etc.)
├─ Masked Key (sk-proj-•••••••)
├─ View/Hide Button (👁️)
├─ Copy Button (📋)
├─ Status Badge (Active/Inactive)
├─ Created Date
└─ Delete Button (🗑️)
```

### Keyboard Shortcuts
- `Click 👁️`: Show/hide full key
- `Click 📋`: Copy key to clipboard
- `Click 🗑️`: Delete key (confirmation required)

---

## ⚙️ Settings & Configuration

### 1. API Configuration
```
Setting Name              | Type   | Range    | Default
─────────────────────────────────────────────────────
Request Timeout          | Number | 5-300s   | 30s
Maximum Retries          | Number | 0-10     | 3
Rate Limit per Minute    | Number | 10-10k   | 100
Base URL (optional)      | String | URL      | Provider default
```

### 2. Security & Access
```
Setting                           | Type    | Default
───────────────────────────────────────────────────
Enable Encryption                 | Toggle  | ON
Enable Audit Logging              | Toggle  | ON
Require Multi-Factor Auth (MFA)  | Toggle  | OFF
Session Timeout                   | Number  | 30 min
```

### 3. Feature Flags
```
Feature                          | Type    | Default
──────────────────────────────────────────────────
Real-time Collaboration         | Toggle  | ON
WebSocket Server                | Toggle  | ON
Analytics & Monitoring          | Toggle  | ON
AI Features                      | Toggle  | ON
```

### 4. Resource Limits
```
Limit                           | Type   | Range      | Default
──────────────────────────────────────────────────────
Maximum Team Size              | Number | 5-10,000   | 100
Projects Per User              | Number | 1-1,000    | 50
Storage Per Account            | Number | 1-100GB    | 1,000GB
```

### 5. Notifications
```
Setting                         | Type    | Default
────────────────────────────────────────────────
Enable Email Notifications      | Toggle  | ON
Send Daily Digest              | Toggle  | ON
Send Weekly Report             | Toggle  | ON
```

### Save Settings
- **Button**: "Save All Settings"
- **Feedback**: Green confirmation message with timestamp

---

## 👥 User Management

### User Statistics
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   Total      │    Active    │    Admin     │   Inactive   │
│   Users      │    Users     │    Users     │    Users     │
│     4        │      2       │      2       │      2       │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### Search & Filter
- **Search**: By name or email
- **Filter by Role**: All, Admin, Moderator, User
- **Filter by Status**: All, Active, Inactive, Suspended

### User Operations
```
For Each User:
├─ Name & Email (primary info)
├─ Role Selector (Admin/Moderator/User)
│  └─ Colors: Purple (Admin), Blue (Moderator), Gray (User)
├─ Status Selector (Active/Inactive/Suspended)
│  └─ Colors: Green (Active), Gray (Inactive), Red (Suspended)
├─ Last Login (timestamp)
├─ Teams Count (number)
├─ Projects Count (number)
├─ Edit Button (✏️)
└─ Delete Button (🗑️)
```

### Role Permissions
```
Admin:
  ✓ Manage all users
  ✓ Configure settings
  ✓ View audit logs
  ✓ Manage API keys
  ✓ Access analytics

Moderator:
  ✓ View users
  ✓ Manage teams
  ✓ View analytics
  ✗ Configure settings
  ✗ Manage API keys

User:
  ✓ Manage own profile
  ✓ Create projects
  ✓ Collaborate on teams
  ✗ Manage other users
  ✗ View analytics
```

---

## 🛡️ System Health

### Monitoring
- System status overview
- Resource usage (CPU, Memory, Storage)
- Active connections
- Alert tracking
- Integration health

---

## 🔧 Common Configuration Scenarios

### Scenario 1: Setup OpenAI Integration
1. Go to API Keys tab
2. Click "Add API Key"
3. Name: "OpenAI API"
4. Type: OpenAI
5. Value: Paste sk-... key
6. Click "Save Key"
7. ✅ Key appears in list with green checkmark

### Scenario 2: Enable AI Features
1. Go to Settings tab
2. Find "Feature Flags" section
3. Toggle "AI Features" ON
4. Scroll to "API Configuration"
5. Add OpenAI or Anthropic key
6. Click "Test Connection"
7. Click "Save Configuration"
8. ✅ AI features now active

### Scenario 3: Promote User to Admin
1. Go to Users tab
2. Find user in table
3. Click role dropdown (currently "User")
4. Select "Admin"
5. ✅ User is now admin

### Scenario 4: Set Resource Limits
1. Go to Settings tab
2. Find "Resource Limits"
3. Set "Maximum Team Size" = 50
4. Set "Projects Per User" = 20
5. Click "Save All Settings"
6. ✅ Limits applied immediately

### Scenario 5: Rotate API Key
1. Go to API Keys tab
2. Get new key from provider
3. Add new key: "OpenAI API (v2)"
4. Test new key with green checkmark
5. Delete old key by clicking 🗑️
6. ✅ Migration complete

---

## 📊 Settings Breakdown by Use Case

### For Small Teams (< 20 users)
```
Maximum Team Size:      20
Projects Per User:      10
Storage Per Account:    100 GB
Rate Limit:            50 req/min
Session Timeout:       60 min
Require MFA:           OFF
```

### For Growing Company (20-200 users)
```
Maximum Team Size:      50
Projects Per User:      50
Storage Per Account:    500 GB
Rate Limit:            200 req/min
Session Timeout:       30 min
Require MFA:           OFF
```

### For Enterprise (200+ users)
```
Maximum Team Size:      500
Projects Per User:      200
Storage Per Account:    2000 GB
Rate Limit:            1000 req/min
Session Timeout:       15 min
Require MFA:           ON
Enable Encryption:     ON
Enable Audit Logging:  ON
```

---

## 🚀 Speed Tips

### Fast Setup (5 minutes)
1. Add primary API key (OpenAI or Claude)
2. Enable AI Features flag
3. Set team/project limits
4. Promote yourself to admin
5. Done! ✅

### Complete Setup (30 minutes)
1. Add all API keys
2. Configure all settings
3. Import/manage users
4. Set resource limits
5. Test all features
6. Review audit logs
7. Documentation complete ✅

---

## ⌚ Typical Admin Tasks & Time

| Task | Time | Frequency |
|------|------|-----------|
| Add API Key | 2 min | As needed |
| Promote User | 30 sec | As needed |
| Rotate Keys | 5 min | Quarterly |
| Review Settings | 10 min | Monthly |
| Audit Users | 15 min | Monthly |
| System Health Check | 5 min | Daily |
| Backup Settings | 10 min | Weekly |

---

## 🔗 Helpful Links

- **OpenAI API**: https://platform.openai.com
- **Anthropic API**: https://console.anthropic.com
- **Google Gemini**: https://ai.google.dev
- **AppForge Docs**: https://docs.appforge.dev
- **Security Guide**: See SECURITY.md
- **Backend API**: See BACKEND_API.md

---

## 💡 Pro Tips

1. **Test before saving**: Always click "Test Connection" before saving API keys
2. **Use descriptive names**: "OpenAI GPT-4 Production" is better than "Key1"
3. **Rotate regularly**: Change API keys every 3-6 months
4. **Monitor usage**: Check active users and resource usage weekly
5. **Keep admins minimal**: Only make essential people admins
6. **Document everything**: Note which keys are for which services
7. **Use MFA for admins**: Protect admin accounts with 2FA
8. **Export data**: Backup user data before deleting accounts
9. **Review logs**: Check audit logs weekly for unusual activity
10. **Stay updated**: Check release notes for new features

---

## ❓ FAQ

**Q: Can I edit an API key after saving?**
A: Delete the old key and add a new one. Keys are immutable for security.

**Q: Do changes take effect immediately?**
A: Yes! All setting changes are applied instantly (except server restarts).

**Q: Can I rollback settings?**
A: Settings are not version controlled. Note current values before changing.

**Q: How many API keys can I add?**
A: Unlimited, but we recommend one per service.

**Q: What happens if I delete a user?**
A: User account is permanently deleted. Their projects may be orphaned.

**Q: Can multiple admins edit settings?**
A: Yes, but last save wins (no conflict resolution).

**Q: Are changes logged for audit?**
A: Yes, all admin actions are logged if audit logging is enabled.

**Q: Can I use the same API key twice?**
A: Yes, but it's better to use different keys for different services.

**Q: How are API keys stored?**
A: Encrypted at rest, masked in UI, never logged in plaintext.

**Q: What if I forget my API key?**
A: You must regenerate it from the provider (we don't store the full key).

---

## 📞 Support

For help:
1. Check this guide
2. Hover over ℹ️ icons in the UI
3. Read in-app help tooltips
4. Contact: support@appforge.dev
5. Docs: docs.appforge.dev

**Last Updated**: January 30, 2026
**Version**: 1.0.0
