<!-- markdownlint-disable MD036 -->
# 🧪 START FULL APPLICATION TESTING

## Quick Start - Follow These Steps

### Step 1: Start Backend Server (Terminal 1)
```bash
cd c:\Users\ferna\Downloads\appforge-main\functions

# Run the Deno backend server
deno run --allow-all --watch server.ts
```

**Wait for output:**
```
✅ Server running on http://localhost:8000
✅ Database initialized
✅ WebSocket server ready
```

---

### Step 2: Start Frontend Server (Terminal 2)
```bash
cd c:\Users\ferna\Downloads\appforge-main

# Run Vite dev server
npm run dev
```

**Wait for output:**
```
✅ Local: http://localhost:5173/
✅ press h + enter to show help
```

---

### Step 3: Open Browser
```
http://localhost:5173
```

---

## 📋 Testing Phases (12 Total)

Complete each phase in order:

### ✅ Phase 1: Server Setup & Initialization (DONE via steps above)
- Backend running ✓
- Frontend running ✓

### 🧪 Phase 2: Authentication Flow (15 mins)
- [ ] Register new account
- [ ] Login with credentials
- [ ] Test invalid credentials
- [ ] Verify token persistence on refresh

**Commands in browser:**
1. Click "/Register" or go to `http://localhost:5173/Register`
2. Fill in email and password, click "Create Account"
3. Should redirect to Login
4. Login with the same credentials
5. Should see Dashboard

**Expected Results:**
- Registration works ✓
- Login works ✓
- Token stored in localStorage ✓
- Can't access private pages without token ✓

---

### 🏠 Phase 3: Protected Routes (10 mins)
- [ ] Logout
- [ ] Try accessing `/Dashboard` → should redirect to Login
- [ ] Login again
- [ ] Access all private pages: Dashboard, Projects, Collaboration, Security, Notifications
- [ ] All should load without errors

**Expected Results:**
- Can't access private routes without auth ✓
- Can access with auth ✓
- No console errors ✓

---

### 📊 Phase 4: Dashboard & Quantum Features (15 mins)
- [ ] Check stat cards load (Users, Projects, Docs, Circuits, Collaborators)
- [ ] Expand "Quantum Computing Lab"
- [ ] Test Display tab (metrics)
- [ ] Test Visualizer tab (circuit diagram)
- [ ] Test Education tab (learning content)

**Expected Results:**
- All stat cards show numbers ✓
- Quantum tabs switch properly ✓
- No loading errors ✓
- Responsive layout ✓

---

### 📄 Phase 5: Collaboration Features (20 mins)
1. Click "Collaboration" in navigation
2. Click "New Document"
3. Enter title: "Test Doc"
4. Enter content: "Testing content"
5. Click "Create"
6. Click "Edit" on the document
7. In editor:
   - Type more text
   - Click "Undo"
   - Click "Redo"
   - Click "Save"
   - Click "Copy"
   - Click "Download"
   - Check chat/presence sidebar
8. Click "Exit Editor"

**Expected Results:**
- Create/list documents ✓
- Live editor works ✓
- Undo/Redo work ✓
- Save/Copy/Download work ✓
- Presence indicator shows current user ✓
- Exit returns to document list ✓

---

### 🔐 Phase 6: Security Features (15 mins)
1. Click "Security" in navigation
2. Test Data Encryption:
   - Enter text: "Hello World"
   - Click "Encrypt Data"
   - Should show encrypted output
   - Click "Decrypt"
   - Should show original text
3. Test Data Anonymization:
   - Enter pattern: "test_"
   - Enter replacement: "USER_"
   - Enter text: "test_123"
   - Click "Anonymize"
   - Should show "USER_123"
4. Test GDPR:
   - Click "Export My Data"
   - Should show export dialog
   - Click "Export"
   - Should show success message

**Expected Results:**
- Encryption/Decryption works ✓
- Anonymization works ✓
- GDPR export works ✓
- Activity logged ✓

---

### 🔔 Phase 7: Notifications & Activity (10 mins)
1. Click bell icon in top-right (Header)
2. Should show notifications dropdown
3. Click "View All" or navigate to `/Notifications`
4. Should see activity feed with filters:
   - All
   - Unread
   - Success
   - Errors
5. Test filtering and clearing

**Expected Results:**
- Notification bell shows count ✓
- Can view all notifications ✓
- Can filter by type ✓
- Can delete/mark as read ✓

---

### 🌐 Phase 8: Offline Mode (15 mins)
1. Open DevTools (F12)
2. Network tab
3. Click throttle dropdown → "Offline"
4. **Expected:** Red "You're offline" indicator at bottom
5. Try creating a new collaboration document
6. Go back to Network → "Online"
7. **Expected:** Green indicator, queued messages sent

**Expected Results:**
- Offline indicator appears ✓
- Can still interact ✓
- Goes back online ✓
- Messages queue and sync ✓

---

### 🚪 Phase 9: Logout (5 mins)
1. Click user dropdown in header (top-right)
2. Click "Logout"
3. Should redirect to `/Login`
4. Try accessing `/Dashboard`
5. Should redirect to `/Login`

**Expected Results:**
- Token cleared ✓
- Redirected to login ✓
- Can't access private pages ✓

---

### 📱 Phase 10: Responsive Design (10 mins)
1. DevTools → Device Toolbar (Ctrl+Shift+M)
2. Test on:
   - iPhone SE (375px) - should stack vertically
   - iPad (768px) - should have 2-column layout
   - Desktop (1920px) - full multi-column

**Expected Results:**
- Mobile layout is readable ✓
- Tablet layout is optimized ✓
- Desktop shows all features ✓
- No horizontal scroll ✓

---

### 🎨 Phase 11: Dark Mode (5 mins)
1. Click sun/moon icon in header
2. Should toggle dark mode
3. Refresh page
4. Dark mode should persist
5. Visit different pages - all should be readable

**Expected Results:**
- Dark mode toggles ✓
- Persists on refresh ✓
- All pages readable in dark ✓

---

### 🧪 Phase 12: Browser Console (10 mins)
1. DevTools → Console tab
2. Should see NO red error messages
3. May see yellow warnings (OK)
4. Network tab → check API calls
5. All should return 200/201 status
6. Local Storage → should show token, activities, preferences

**Expected Results:**
- No console errors ✓
- All API calls successful ✓
- LocalStorage working ✓

---

## ⏱️ Estimated Total Time: 2-3 hours

---

## 📝 Quick Test Results Template

### Test Session
- **Date:** _________
- **Duration:** _________
- **Tester:** _________

### Results Summary
```
Phase 2 (Auth): ✅ PASS / ⚠️ WARN / ❌ FAIL
Phase 3 (Routes): ✅ PASS / ⚠️ WARN / ❌ FAIL
Phase 4 (Dashboard): ✅ PASS / ⚠️ WARN / ❌ FAIL
Phase 5 (Collaboration): ✅ PASS / ⚠️ WARN / ❌ FAIL
Phase 6 (Security): ✅ PASS / ⚠️ WARN / ❌ FAIL
Phase 7 (Notifications): ✅ PASS / ⚠️ WARN / ❌ FAIL
Phase 8 (Offline): ✅ PASS / ⚠️ WARN / ❌ FAIL
Phase 9 (Logout): ✅ PASS / ⚠️ WARN / ❌ FAIL
Phase 10 (Responsive): ✅ PASS / ⚠️ WARN / ❌ FAIL
Phase 11 (Dark Mode): ✅ PASS / ⚠️ WARN / ❌ FAIL
Phase 12 (Console): ✅ PASS / ⚠️ WARN / ❌ FAIL
```

### Issues Found
```
1. [Phase X] Issue: _____
   Expected: _____
   Actual: _____
   Severity: Critical / High / Medium / Low

2. [Phase X] Issue: _____
   Expected: _____
   Actual: _____
   Severity: Critical / High / Medium / Low
```

### Overall Status
- **Total Tests:** 12 phases
- **Passed:** __ / 12
- **Failed:** __ / 12
- **Success Rate:** __ %

---

## ✅ Success Criteria

✅ All 12 phases completed
✅ Zero console errors
✅ All API calls successful
✅ All features working
✅ Responsive on all devices
✅ Dark mode functional
✅ Offline support working

---

**Ready to test? Let's go! 🚀**
