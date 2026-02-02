# Technical Debt Remediation - Implementation Checklist
**Status:** Ready for Development  
**Commit:** `398b2a0`  
**Updated:** February 2, 2026

---

## 📋 ITEM 1: Database Transition (localStorage → Backend Persistence)

### Phase 1: Backend Models (4-5 hours)
- [ ] Create `backend/src/models/UserState.js` 
  - [ ] Onboarding state schema
  - [ ] UI preferences schema
  - [ ] Tour tracking schema
  - [ ] Tutorial progress schema
  
- [ ] Create `backend/src/models/Analytics.js`
  - [ ] Feature usage tracking
  - [ ] Event logging schema
  - [ ] Engagement metrics
  - [ ] Performance benchmarks
  
- [ ] Create `backend/src/models/SyncLog.js`
  - [ ] Synced projects tracking
  - [ ] Watched paths
  - [ ] Sync history

- [ ] Update existing models with indexes and validation
  - [ ] `UserSettings.js` - add compound indexes
  - [ ] `AdminConfiguration.js` - optimize query patterns
  - [ ] `Team.js` - add performance indexes

### Phase 2: Backend API Routes (3-4 hours)
- [ ] Create `backend/src/routes/api/persistence.js`
  - [ ] `POST /api/user/state` - Save state
  - [ ] `GET /api/user/state` - Get state
  - [ ] `PATCH /api/user/state/ui` - Update preferences
  - [ ] `PATCH /api/user/state/onboarding` - Update progress
  
- [ ] Create `backend/src/routes/api/analytics.js`
  - [ ] `POST /api/analytics/events` - Log event
  - [ ] `POST /api/analytics/feature-usage` - Track feature
  - [ ] `GET /api/analytics/summary` - Get summary
  - [ ] `POST /api/analytics/performance` - Record benchmark
  
- [ ] Create `backend/src/routes/api/sync.js`
  - [ ] `POST /api/sync/start` - Begin sync
  - [ ] `POST /api/sync/complete` - Complete sync
  - [ ] `POST /api/sync/watched-paths` - Update paths
  - [ ] `GET /api/sync/history` - Get history
  
- [ ] Create `backend/src/routes/api/admin.js`
  - [ ] `POST /api/admin/feature-toggles` - Set flags
  - [ ] `GET /api/admin/feature-toggles` - Get flags
  - [ ] `POST /api/admin/logs` - Add log
  - [ ] `GET /api/admin/logs` - Get logs

- [ ] Add middleware
  - [ ] Authentication validation
  - [ ] Rate limiting
  - [ ] Request validation schemas
  - [ ] Error handling

### Phase 3: Frontend Service Layer (3-4 hours)
- [ ] Create `src/services/persistenceService.js`
  - [ ] UserState methods (saveState, getState, updatePreferences)
  - [ ] Analytics methods (logEvent, trackFeature, getAnalytics)
  - [ ] Sync methods (updateSync, getSyncHistory)
  - [ ] Admin methods (getFeatureToggles, setFeatureToggles)

- [ ] Create `src/utils/dataFallback.js`
  - [ ] IndexedDB queue implementation
  - [ ] Offline change queueing
  - [ ] Sync on reconnect
  - [ ] Conflict resolution for offline changes

- [ ] Create `src/utils/dataMigration.js`
  - [ ] localStorage → Database migration script
  - [ ] Run on first app load
  - [ ] Fallback to localStorage if API fails
  - [ ] Migration logging

### Phase 4: Frontend Component Migration (3-4 hours)

**Priority 1: Core Settings (do first)**
- [ ] `src/features/keyboardShortcuts/useKeyboardShortcuts.js`
  - [ ] Replace localStorage with persistenceService
  - [ ] Add offline fallback
  - [ ] Test keyboard shortcuts persist
  
- [ ] `src/features/themes/useThemeManager.js`
  - [ ] Replace localStorage with persistenceService
  - [ ] Sync theme across tabs
  - [ ] Test theme persistence

- [ ] `src/pages/LLMSettings.jsx`
  - [ ] Replace localStorage with persistenceService
  - [ ] Encrypt API keys on backend
  - [ ] Test settings persist

**Priority 2: User State Features**
- [ ] `src/features/onboarding/useOnboarding.js`
  - [ ] Migrate onboarding state
  - [ ] Track tour progress
  - [ ] Test tour resumption

- [ ] `src/features/admin/useAdminDashboard.js`
  - [ ] Migrate admin settings
  - [ ] Migrate feature toggles
  - [ ] Migrate admin logs

**Priority 3: Analytics**
- [ ] `src/features/analytics/useFeatureAnalytics.js`
  - [ ] Log feature events to backend
  - [ ] Track user engagement
  - [ ] Record performance metrics

- [ ] `src/features/codeReviewGamification/useCodeReviewGamification.js`
  - [ ] Persist leaderboard data
  - [ ] Save review statistics
  - [ ] Maintain badges

**Priority 4: Sync & Workflows**
- [ ] `src/features/localSync/useLocalSync.js`
  - [ ] Track sync history
  - [ ] Persist watched paths
  - [ ] Log sync operations

- [ ] `src/features/gitWorkflows/useGitWorkflows.js`
  - [ ] Save workflow definitions
  - [ ] Track workflow history

- [ ] `src/features/pairProgramming/usePairProgramming.js`
  - [ ] Persist session data
  - [ ] Track pair sessions

- [ ] `src/utils/environmentManager.js`
  - [ ] Move environment configs to backend
  - [ ] Persist across sessions

### Phase 5: Data Migration (1-2 hours)
- [ ] Create migration script that runs on app startup
- [ ] Test localStorage → Database transfer
- [ ] Verify data integrity after migration
- [ ] Create rollback procedure
- [ ] Document migration for production deployment

### Phase 6: Testing & Validation (1-2 hours)
- [ ] Unit tests for PersistenceService
- [ ] Integration tests for API endpoints
- [ ] E2E tests for migration flow
- [ ] Offline mode testing
- [ ] Cross-tab sync testing
- [ ] Performance benchmarks
- [ ] Browser DevTools verification (no localStorage)

---

## 🎯 ITEM 2: Production WebSocket Integration

### Phase 1: Backend WebSocket Server (2-3 hours)
- [ ] Create `backend/src/websocket/server.js`
  - [ ] Initialize Socket.io server
  - [ ] CORS configuration
  - [ ] Authentication middleware
  - [ ] Connection/disconnection handlers
  - [ ] Graceful shutdown

- [ ] Create `backend/src/websocket/events/`
  - [ ] `collaboration.js` - Code change events
  - [ ] `presence.js` - User presence tracking
  - [ ] `comments.js` - Comment events
  - [ ] `notifications.js` - Notification events

- [ ] Create `backend/src/websocket/presence.js`
  - [ ] PresenceManager class
  - [ ] Cursor position tracking
  - [ ] Activity status tracking
  - [ ] Presence cleanup on disconnect

### Phase 2: Conflict Resolution (1-2 hours)
- [ ] Create `backend/src/utils/operationalTransform.js`
  - [ ] Transform function for concurrent edits
  - [ ] Priority-based conflict resolution
  - [ ] Line number adjustment for insertions/deletions
  - [ ] Test with 10+ concurrent operations

- [ ] Create `backend/src/utils/changeTracking.js`
  - [ ] Track code changes by line
  - [ ] Version control for collaborative edits
  - [ ] Undo/redo support
  - [ ] Change history persistence

### Phase 3: Frontend Integration (1-2 hours)
- [ ] Update `src/api/services/websocketService.js`
  - [ ] Implement startRealtimeSession(roomId)
  - [ ] Add sendCodeChange(roomId, filePath, changes)
  - [ ] Add updatePresence(roomId, presence)
  - [ ] Add real-time event listeners
  - [ ] Connection error handling

- [ ] Create `src/hooks/useRealtimeCollaboration.js`
  - [ ] Room management
  - [ ] Presence synchronization
  - [ ] Change propagation
  - [ ] Conflict handling (OT)

### Phase 4: Real-time UI Components (1-2 hours)
- [ ] Create `src/components/collaboration/RemoteUserCursors.jsx`
  - [ ] Display remote user cursors
  - [ ] Update cursor positions in real-time
  - [ ] Show user info on hover
  - [ ] Color-coded per user

- [ ] Create `src/components/collaboration/RealtimeEditor.jsx`
  - [ ] Code editor with real-time updates
  - [ ] Show other users' edits
  - [ ] Preserve local typing
  - [ ] Handle concurrent changes

- [ ] Create `src/components/collaboration/PresenceIndicator.jsx`
  - [ ] Show active users in session
  - [ ] Display user status
  - [ ] Connection status
  - [ ] Activity indicator

### Phase 5: Production Deployment (1-2 hours)
- [ ] Update `backend/src/server.js`
  - [ ] Initialize WebSocket server
  - [ ] Health check endpoint
  - [ ] Graceful shutdown handling
  - [ ] Connection monitoring

- [ ] Create `.env.production` settings
  - [ ] `WEBSOCKET_ENABLED=true`
  - [ ] `WEBSOCKET_URL=wss://api.appforge.com`
  - [ ] `WEBSOCKET_PATH=/socket.io`
  - [ ] `FRONTEND_URL=https://appforge.com`

- [ ] Create deployment documentation
  - [ ] Staging environment setup
  - [ ] Production rollout procedure
  - [ ] Monitoring setup
  - [ ] Rollback procedure

### Phase 6: Testing & Monitoring (1 hour)
- [ ] Unit tests for collaboration service
- [ ] Integration tests for WebSocket events
- [ ] E2E tests for real-time editing
- [ ] Load testing (50+ concurrent users)
- [ ] Performance monitoring setup
- [ ] Error tracking configuration
- [ ] Browser compatibility testing

---

## ✅ Completion Checklist

### Pre-Implementation
- [ ] All models designed and documented
- [ ] API contract agreed upon
- [ ] Test data prepared
- [ ] Team aligned on implementation approach

### Database Transition
- [ ] All models created
- [ ] All API endpoints working
- [ ] Frontend service layer complete
- [ ] Components migrated (priority order)
- [ ] Data migration tested
- [ ] Zero localStorage in production build
- [ ] All tests passing
- [ ] Deployed to staging
- [ ] Tested with real data
- [ ] Performance validated

### WebSocket Integration
- [ ] Backend server deployed
- [ ] Real-time events working
- [ ] Conflict resolution tested
- [ ] Presence system working
- [ ] Frontend components updated
- [ ] Real-time collaboration tested
- [ ] Load tested (50+ users)
- [ ] Monitoring active
- [ ] Documentation complete

### Production Readiness
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Error handling tested
- [ ] Offline mode works
- [ ] Graceful degradation verified
- [ ] Rollback procedure documented
- [ ] Team trained on new system
- [ ] Support documentation prepared

---

## 📊 Estimated Timeline

| Phase | Duration | Team | Start | End |
|-------|----------|------|-------|-----|
| Backend Models + Routes | 7-9 hrs | Backend | Feb 3 | Feb 3 |
| Frontend Service Layer | 3-4 hrs | Frontend | Feb 3 | Feb 3 |
| Component Migration | 3-4 hrs | Frontend | Feb 4 | Feb 4 |
| Testing & Validation | 2-3 hrs | QA | Feb 5 | Feb 5 |
| **Database Transition Subtotal** | **15-20 hrs** | **Mixed** | **Feb 3** | **Feb 5** |
| WebSocket Server | 2-3 hrs | Backend | Feb 6 | Feb 6 |
| Conflict Resolution | 1-2 hrs | Backend | Feb 6 | Feb 6 |
| Frontend Integration | 1-2 hrs | Frontend | Feb 6 | Feb 7 |
| Real-time Components | 1-2 hrs | Frontend | Feb 7 | Feb 7 |
| Testing & Monitoring | 1-2 hrs | QA | Feb 7 | Feb 7 |
| **WebSocket Subtotal** | **6-11 hrs** | **Mixed** | **Feb 6** | **Feb 7** |
| **TOTAL** | **21-31 hrs** | **Team** | **Feb 3** | **Feb 7** |

**Recommended Approach:** Parallel work on database transition (backend) while WebSocket server is being completed (can start Feb 6).

---

## 🎓 Knowledge Transfer Resources

### Documentation
- Backend models: `backend/src/models/` (existing examples)
- API patterns: `backend/src/routes/` (existing examples)
- WebSocket example: `src/api/services/websocketService.js` (client-side reference)

### Key Files to Review
- Migration script template: `backend/scripts/migrate.js`
- Database config: `backend/src/config/database.js`
- Current localStorage usage: search for `localStorage` in `src/`

### Testing Framework
- Test examples: `src/**/*.test.js`
- Jest configuration: `package.json`
- Mock patterns: `src/test/utils.jsx`

---

**Next Step:** Schedule kickoff meeting to assign team members to parallel workstreams.
