# Admin Control Center - User Guide

## Overview

The Admin Control Center provides a comprehensive interface for managing your AppForge application without needing to edit code. You can manage API keys, configure settings, control features, and manage users all from a single dashboard.

## Accessing the Admin Dashboard

1. Log in with an admin account
2. Navigate to `/admin` or click "Admin" in your navigation menu
3. You'll see the main Admin Control Center with four tabs

## Main Tabs

### 1. 🛡️ Health (System Health)
Monitor your application's health and performance.

**Features:**
- System status overview
- Resource usage monitoring
- Active connections tracking
- Alert analytics
- System insights and recommendations

**Use this tab to:**
- Check if all systems are running properly
- Monitor resource usage (CPU, memory, storage)
- View recent alerts and warnings
- Identify bottlenecks or performance issues

---

### 2. 🔑 API Keys (API Key Management)
Manage all API keys for external services in one place.

#### Adding a New API Key

1. Click the **"Add API Key"** button
2. Enter the following details:
   - **Service Name**: A descriptive name (e.g., "OpenAI API Key")
   - **Provider Type**: Select from available providers:
     - 🤖 OpenAI
     - 🧠 Anthropic (Claude)
     - 📚 Google (Gemini)
     - 🤗 Hugging Face
     - 💳 Stripe
     - 🐙 GitHub
     - ☁️ AWS
     - ⚙️ Custom
   - **API Key Value**: Paste your actual API key
3. Click **"Save Key"**

#### Managing API Keys

For each API key, you can:
- **View/Hide**: Click the eye icon to reveal/hide the full key
- **Copy**: Click the copy icon to copy to clipboard (shows ✓ confirmation)
- **Delete**: Click the trash icon to remove the key
- **Monitor Status**: See if the key is active/inactive
- **Track Usage**: View when it was created and last used

#### Security Features

- API keys are **masked** in the UI (only showing first and last characters)
- Full keys only visible when needed
- Keys are **encrypted** in storage
- All access is **audit logged**
- Keys can be **revoked** at any time

---

### 3. ⚙️ Settings (Application Settings)
Configure how your application behaves without editing code.

#### API Configuration
- **Request Timeout**: How long to wait for API responses (5-300 seconds)
- **Maximum Retries**: How many times to retry failed requests (0-10)
- **Rate Limit**: Maximum API requests per minute (10-10,000)

#### Security & Access
- **Enable Encryption**: Encrypt all sensitive data
- **Enable Audit Logging**: Log all user actions
- **Require Multi-Factor Authentication**: Force 2FA for all users
- **Session Timeout**: Auto-logout inactive users after X minutes

#### Feature Flags
Toggle features on/off instantly:
- ✨ Real-time Collaboration
- 📡 WebSocket Server
- 📊 Analytics & Monitoring
- 🤖 AI Features

#### Resource Limits
Set quotas for your users:
- **Maximum Team Size**: Max members per team (5-10,000)
- **Projects Per User**: Max projects a user can create (1-1,000)
- **Storage Per Account**: Max storage space (1-100,000 GB)

#### Notifications
Control how users receive updates:
- **Enable Email Notifications**: Send emails to users
- **Daily Digest**: Send daily summary emails
- **Weekly Report**: Send weekly summary emails

#### How to Save Settings
1. Adjust any settings by clicking toggles or entering values
2. Click **"Save All Settings"** at the bottom
3. You'll see a success confirmation
4. Changes take effect immediately

---

### 4. 👥 Users (User Management)
Manage user accounts, roles, and permissions.

#### User Statistics
At the top, see quick stats:
- Total Users
- Active Users
- Admin Users
- Inactive Users

#### Searching and Filtering Users
1. **Search**: Type a name or email to find users
2. **Filter by Role**: Show only Admin, Moderator, or User roles
3. **Filter by Status**: Show only Active, Inactive, or Suspended users

#### Managing Individual Users

For each user, you can:

**Change Role** - Click the role badge to change:
- 👤 **User**: Regular user with basic permissions
- 👔 **Moderator**: Can manage teams and view analytics
- 👑 **Admin**: Full access to all features and settings

**Change Status** - Click the status badge to change:
- ✅ **Active**: User can log in and use the app
- ⏱️ **Inactive**: User account exists but they can't log in
- 🚫 **Suspended**: User is blocked from access

**Edit or Delete**:
- Click the edit icon to view detailed settings
- Click the trash icon to permanently delete the user

#### Role Permissions Reference

**Admin Permissions:**
- ✓ Manage all users
- ✓ Configure settings
- ✓ View audit logs
- ✓ Manage API keys
- ✓ Access analytics

**Moderator Permissions:**
- ✓ View users
- ✓ Manage teams
- ✓ View analytics
- ✗ Configure settings
- ✗ Manage API keys

**User Permissions:**
- ✓ Manage own profile
- ✓ Create projects
- ✓ Collaborate on teams
- ✗ Manage other users
- ✗ View analytics

---

## API Configuration (Advanced)

### Quick Start to Add API Keys

1. Go to **Settings** tab → API Configuration section
2. Choose your provider (OpenAI, Anthropic, Google, etc.)
3. Enter your API key
4. Enter your preferred model (e.g., gpt-4, claude-3)
5. Click **"Test Connection"** to verify it works
6. Click **"Save Configuration"**

### Supported Providers

| Provider | Models | Documentation |
|----------|--------|---|
| **OpenAI** | GPT-4, GPT-3.5 Turbo | [platform.openai.com](https://platform.openai.com/docs) |
| **Anthropic** | Claude models | [docs.anthropic.com](https://docs.anthropic.com) |
| **Google** | Gemini models | [ai.google.dev](https://ai.google.dev) |
| **Hugging Face** | Various | [huggingface.co](https://huggingface.co) |
| **AWS** | Various | [aws.amazon.com](https://aws.amazon.com) |

### Getting Your API Keys

**OpenAI:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign in or create account
3. Go to API keys section
4. Click "Create new secret key"
5. Copy the key and paste it in Admin Dashboard

**Anthropic (Claude):**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign in or create account
3. Go to API keys
4. Create new key
5. Copy and paste in Admin Dashboard

**Google (Gemini):**
1. Go to [ai.google.dev](https://ai.google.dev)
2. Click "Get API key"
3. Create new API key in Google Cloud
4. Copy and paste in Admin Dashboard

---

## Best Practices

### Security Best Practices

1. **Never share API keys**: Keep them confidential
2. **Rotate keys regularly**: Change API keys every 3-6 months
3. **Use different keys for different services**: Don't reuse keys
4. **Enable MFA**: Require multi-factor authentication for admin accounts
5. **Monitor audit logs**: Regularly check who accessed what and when
6. **Set appropriate timeouts**: Balance performance with resource limits
7. **Review user access**: Regularly audit who has admin access

### Performance Best Practices

1. **Adjust timeouts**: Set appropriate request timeouts for your APIs
2. **Configure rate limits**: Balance between performance and usage
3. **Enable compression**: Reduce network bandwidth
4. **Monitor resource usage**: Check CPU, memory, and storage regularly
5. **Archive old logs**: Clean up audit logs periodically
6. **Optimize storage**: Set reasonable storage limits per user

### User Management Best Practices

1. **Principle of least privilege**: Only give users the access they need
2. **Regular audits**: Review user roles and permissions quarterly
3. **Disable unused accounts**: Deactivate inactive users
4. **Remove terminated users**: Delete accounts for users no longer with organization
5. **Limit admins**: Keep the number of admins minimal
6. **Backup user data**: Before deleting users, export their data

---

## Common Tasks

### Task: Add Multiple API Keys
1. Collect all API keys you need
2. Go to Admin → API Keys tab
3. Click "Add API Key" for each one
4. Verify each connection works
5. Document which key is for which service

### Task: Enable AI Features
1. Go to Admin → Settings tab
2. Find "Feature Flags" section
3. Toggle "AI Features" on
4. Scroll to "API Configuration"
5. Add your OpenAI or Anthropic API key
6. Click "Save Configuration"
7. Test using AI features in the app

### Task: Promote User to Admin
1. Go to Admin → Users tab
2. Search for the user
3. Click their role badge (currently shows "User")
4. Select "Admin" from dropdown
5. Changes take effect immediately

### Task: Set Usage Limits
1. Go to Admin → Settings tab
2. Scroll to "Resource Limits"
3. Adjust maximum team size, projects per user, or storage
4. Click "Save All Settings"
5. New limits apply to new creations

### Task: Disable a Feature
1. Go to Admin → Settings tab
2. Find "Feature Flags" section
3. Toggle the feature off (e.g., "WebSocket Server")
4. Click "Save All Settings"
5. Feature is disabled immediately for all users

---

## Troubleshooting

### Problem: API Key Not Working
**Solution:**
1. Verify the key is correct (copy-paste carefully)
2. Check the provider's documentation
3. Ensure the key has the right permissions/scopes
4. Try regenerating the key on the provider's site
5. Test the connection again

### Problem: Settings Won't Save
**Solution:**
1. Check for validation errors (all fields filled correctly)
2. Try refreshing the page
3. Check your internet connection
4. Clear browser cache
5. Try in an incognito/private window

### Problem: User Status Won't Change
**Solution:**
1. Verify you have admin privileges
2. Try refreshing the page
3. Check that the status you're setting is different from current
4. Logout and log back in
5. Contact system administrator if issue persists

### Problem: Can't Add API Key
**Solution:**
1. Ensure the API key field is not empty
2. Verify the key format is correct
3. Check that special characters are handled properly
4. Try copying from the provider's site again
5. Check browser console for error messages

---

## Keyboard Shortcuts

- `Ctrl/Cmd + S`: Save settings (when on Settings tab)
- `Ctrl/Cmd + K`: Open search (when on Users tab)
- `Ctrl/Cmd + +`: Increase font size
- `Ctrl/Cmd + -`: Decrease font size

---

## Support & Resources

### Getting Help

1. **In-app Help**: Hover over ℹ️ icons for contextual help
2. **Documentation**: Visit our docs at [docs.appforge.dev](https://docs.appforge.dev)
3. **API Docs**: View API documentation in API Explorer
4. **Community**: Ask questions in our community forum
5. **Support Email**: contact support@appforge.dev

### Related Documentation

- [Backend API Documentation](./BACKEND_API.md)
- [API Key Security Guide](./SECURITY.md)
- [User Management Guide](./USER_GUIDE.md)
- [Team Collaboration Guide](./COLLABORATION.md)

---

## Summary

The Admin Control Center lets you:
- ✅ Manage API keys without editing code
- ✅ Configure application settings instantly
- ✅ Control feature flags on/off
- ✅ Manage user accounts and permissions
- ✅ Monitor system health
- ✅ Set usage limits and quotas
- ✅ No deployment needed for changes

All changes take effect **immediately** and are **backed by audit logs** for compliance.

**Happy administrating!** 🚀
