<!-- markdownlint-disable MD013 -->
# Quick Start Guide - New Features

## 🎯 Getting Started with AppForge's New Features

Welcome to the enhanced AppForge platform! Here's how to quickly access and use each new feature.

---

## 1. Real-time Collaboration 🤝

**Access**: Navigate to `/collaboration` or find "Collaboration" in the menu

**Quick Start**:
1. Click "New Session" to generate a session ID
2. Share the session ID with team members
3. Everyone clicks "Join Session" with the same ID
4. See live cursors, chat, and collaborate in real-time

**Use Cases**:
- Pair programming sessions
- Code reviews with teammates
- Live project presentations
- Team brainstorming

---

## 2. API Rate Limits & Quotas 📊

**Access**: `/rate-limits`

**Quick Start**:
1. View your current tier (Free/Basic/Pro/Premium)
2. Check requests remaining this minute
3. Monitor monthly quotas (AI, storage, API calls)
4. Click "Test Limit" to see rate limiting in action
5. Review usage analytics and peak hours

**Tiers**:
- **Free**: 60 req/min, 100 AI/month
- **Basic**: 120 req/min, 500 AI/month
- **Pro**: 300 req/min, 2000 AI/month
- **Premium**: 1000 req/min, 10000 AI/month

---

## 3. Project Export & Import 📦

**Access**: `/project-export`

**To Export a Project**:
1. Enter your project ID
2. Check "Include data" if you want entity records
3. Click "Export as JSON"
4. Save the downloaded file

**To Import from JSON**:
1. Paste exported JSON into the textarea
2. Click "Import Project"
3. Get your new project ID

**To Import from GitHub**:
1. Enter GitHub repository URL
2. Click "Import from GitHub"
3. Auto-detects React components, APIs, schemas

---

## 4. AI Code Assistant 🤖

**Access**: `/ai-assistant` (existing page, enhanced with new backend)

**Quick Actions**:
- **Analyze Code**: Get code review and suggestions
- **Debug Error**: Paste error message for help
- **Suggest Architecture**: Get design patterns
- **Refactor**: Get refactoring recommendations

**How to Use**:
1. Type your question or paste code
2. Use quick action buttons for common tasks
3. Chat history saved (last 50 messages)
4. Clear history when starting new topic

---

## 5. Two-Factor Authentication 🔒

**Access**: `/two-factor-auth`

**Setup 2FA**:
1. Install authenticator app (Google Authenticator, Authy)
2. Scan QR code or enter secret key manually
3. Enter 6-digit code to enable
4. Save 10 backup codes securely

**Disable 2FA**:
1. Enter your password
2. Click "Disable 2FA"

**Regenerate Backup Codes**:
1. Enter password
2. Click "Regenerate"
3. Save new codes

---

## 6. Activity Audit Log 📝

**Access**: `/audit-log`

**Quick Start**:
1. View recent activity in the main panel
2. Use filters to narrow down logs:
   - Search by keyword
   - Filter by action type
   - Select date range
3. Export logs (CSV or JSON)
4. View timeline and statistics

**What's Logged**:
- User actions (create, update, delete, login)
- Resource affected
- IP address and user agent
- Timestamp and success status

---

## 7. Advanced Search 🔍

**Access**: `/advanced-search`

**Search Modes**:
- **General Search**: Search everything
- **Code Search**: Focus on code content
- **Files Only**: Search file names

**Features**:
- Type to search (minimum 2 characters)
- Autocomplete suggestions appear
- Results sorted by relevance (0-100%)
- Filter by type (projects, entities, pages, components)
- Click facets to narrow results

**Tips**:
- Use specific keywords for better results
- Check highlighted snippets for context
- Filter by project to narrow scope

---

## 8. Notification Center 🔔

**Access**: `/notifications`

**Features**:
1. **View Notifications**: Unread badges, color-coded by type
2. **Filter**: Toggle "Unread Only" vs "Show All"
3. **Manage**: Mark as read, delete, archive
4. **Preferences**: Configure Email/SMS/Push per category

**Categories**:
- General
- Payment
- Security
- Updates
- Collaboration

**Actions**:
- Click notification to view details
- Mark all as read with one click
- Send test notification to verify settings

---

## 🎨 UI Components Reference

All pages use consistent UI components:

- **Cards**: White containers with shadow
- **Buttons**: Primary (blue), Outline, Destructive (red)
- **Badges**: Color-coded labels (gray, blue, green, red, yellow)
- **Input Fields**: Standard text inputs with labels
- **Progress Bars**: Visual quota/limit indicators
- **Scroll Areas**: Smooth scrolling for long lists

---

## ⚡ Keyboard Shortcuts

### Search
- Start typing to trigger autocomplete

### Notifications
- No shortcuts (mouse-driven)

### Collaboration
- Enter in chat to send message

### AI Assistant
- Enter in chat to send message

---

## 🔧 Troubleshooting

### "Cannot connect to session"
- Check session ID is correct
- Ensure WebSocket connection (production needs WebSocket server)

### "Rate limit exceeded"
- Wait for reset time shown in header
- Upgrade tier for higher limits

### "Export failed"
- Verify project ID exists
- Check you have permission

### "2FA QR code not working"
- Ensure time is synced on device
- Try entering secret key manually

### "Search returns no results"
- Use broader keywords
- Check spelling
- Remove filters

### "Notifications not sending"
- Check preferences are enabled
- Production needs email/SMS integration

---

## 📞 Support

If you need help:
1. Check the detailed `NEW_FEATURES.md` documentation
2. Review `ENHANCEMENT_SUMMARY.md` for technical details
3. Contact support through `/support` page

---

## 🚀 Pro Tips

1. **Collaboration**: Use short session IDs for easy sharing
2. **Rate Limits**: Monitor usage to avoid unexpected limits
3. **Export**: Schedule regular exports as backups
4. **AI Assistant**: Be specific in your questions for better responses
5. **2FA**: Save backup codes in a password manager
6. **Audit Log**: Export monthly for compliance records
7. **Search**: Use filters to speed up finding specific items
8. **Notifications**: Customize per-category to reduce noise

---

Enjoy your enhanced AppForge platform! 🎉
