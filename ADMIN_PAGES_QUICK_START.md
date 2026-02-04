# Admin Pages Update - Quick Start Guide

## Overview
The admin pages have been completely rewritten with real backend API integration, error handling, loading states, pagination, and real-time auto-refresh capabilities (10-second intervals).

## Files Changed

### Updated Admin Pages (with `.updated.jsx` suffix)
1. **AdminAPIKeys.updated.jsx** - API Keys management with CRUD operations
2. **AdminSecrets.updated.jsx** - Secrets/environment variables management
3. **AdminSystemConfig.updated.jsx** - System configuration management
4. **AdminMonitoring.updated.jsx** - Real-time monitoring and metrics

### Documentation
5. **ADMIN_PAGES_UPDATE_GUIDE.md** - Comprehensive implementation guide
6. **BACKEND_API_SPEC.md** - Detailed API endpoint specifications
7. **ADMIN_PAGES_QUICK_START.md** - This file

## Installation Steps

### Step 1: Backup Original Files
```bash
cd src/pages/admin/
cp AdminAPIKeys.jsx AdminAPIKeys.jsx.backup
cp AdminSecrets.jsx AdminSecrets.jsx.backup
cp AdminSystemConfig.jsx AdminSystemConfig.jsx.backup
cp AdminMonitoring.jsx AdminMonitoring.jsx.backup
```

### Step 2: Replace with Updated Files
```bash
cp AdminAPIKeys.updated.jsx AdminAPIKeys.jsx
cp AdminSecrets.updated.jsx AdminSecrets.jsx
cp AdminSystemConfig.updated.jsx AdminSystemConfig.jsx
cp AdminMonitoring.updated.jsx AdminMonitoring.jsx
```

### Step 3: Configure Environment Variables
Create or update `.env` file in project root:
```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api/v1

# Optional: Customize auto-refresh interval (milliseconds)
REACT_APP_REFRESH_INTERVAL=10000
```

For production:
```env
REACT_APP_API_URL=https://api.yourdomain.com/api/v1
```

### Step 4: Verify Dependencies
Ensure these packages are installed in `package.json`:
```json
{
  "dependencies": {
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "sonner": "^1.3.0"
  }
}
```

Install if needed:
```bash
npm install recharts lucide-react sonner
```

### Step 5: Test Backend Connectivity
1. Ensure backend is running on configured API_URL
2. Verify all endpoints from `BACKEND_API_SPEC.md` are implemented
3. Test authentication token in localStorage

## Key Features Implemented

### 1. Real Backend API Integration ✅
- Authenticated HTTP requests with Bearer token
- Proper error handling and user feedback
- Automatic retry capability
- Request/response transformation

### 2. Data Loading & Error Handling ✅
- Loading spinners during data fetch
- Error alerts with dismissal option
- Network error recovery
- User-friendly error messages

### 3. Real-Time Auto-Refresh ✅
- 10-second auto-refresh interval
- Toggle switch to enable/disable
- Respects unsaved changes
- Manual refresh button

### 4. Pagination ✅
- Per-page configuration
- Previous/Next navigation
- Page number buttons
- Total count display

### 5. CRUD Operations ✅
- Create new items (keys, secrets, config)
- Read/list with filtering
- Update/edit with change tracking
- Delete with confirmation
- Bulk operations where applicable

### 6. Advanced Features ✅
- Sensitive value masking
- Show/hide toggle for secrets
- Copy to clipboard
- Diff previews for changes
- Audit logging
- Export/Import functionality
- Feature flag management
- Connection testing
- Rollback capabilities

## Usage Examples

### AdminAPIKeys
```javascript
// Pages automatically loads on mount
// Features:
- Create, read, update, delete API keys
- Copy key to clipboard
- Rotate keys
- Filter by user, status, scope
- Search by name
- Export to CSV
- Advanced/Beginner mode toggle
- Real-time statistics refresh
```

### AdminSecrets
```javascript
// Auto-loads all secrets on mount
// Features:
- Organize by category (environment, integrations, features, database, custom)
- Toggle feature flags
- Edit secrets with confirmation
- Rollback to previous values
- Export/Import with validation
- Audit trail tracking
- Search and filtering
- Beginner mode hides complex secrets
```

### AdminSystemConfig
```javascript
// Loads full system configuration
// Features:
- Edit database, email, deployment configs
- Test connections (MongoDB, Redis, Email)
- View migration history
- Configure connection pools
- Reset to defaults
- Export configuration backup
```

### AdminMonitoring
```javascript
// Real-time metrics and monitoring
// Features:
- Live metrics charts
- Health status indicators
- Error tracking
- Log viewer with pagination
- Alert management
- Configurable thresholds
- CPU/Memory monitoring
- Request latency graphs
```

## API Endpoints Required

All endpoints must be implemented at:
```
/api/v1/admin/...
```

See `BACKEND_API_SPEC.md` for complete endpoint list.

### Critical Endpoints
```
Admin Keys:
- GET    /admin/keys
- POST   /admin/keys
- PUT    /admin/keys/:id
- DELETE /admin/keys/:id
- PUT    /admin/keys/:id/rotate

Admin Secrets:
- GET    /admin/secrets
- POST   /admin/secrets
- PUT    /admin/secrets/:id
- DELETE /admin/secrets/:id
- GET    /admin/secrets/audit

Admin Config:
- GET    /admin/config
- PUT    /admin/config
- POST   /admin/config/test

Admin Monitoring:
- GET    /admin/monitoring/metrics
- GET    /admin/monitoring/health
- GET    /admin/monitoring/logs
- GET    /admin/monitoring/alerts
```

## Troubleshooting

### "Failed to load data" Error
1. Check `REACT_APP_API_URL` is correct
2. Verify backend is running
3. Check network tab in DevTools for actual request
4. Verify CORS is configured on backend

### Empty Data Despite Successful Load
1. Confirm backend returns `data` property in response
2. Check response format matches expected structure
3. Verify API is returning array for list endpoints

### Auto-refresh Not Working
1. Check browser console for errors
2. Verify `autoRefresh` switch is toggled on
3. Look for network errors in DevTools
4. Check rate limiting isn't blocking requests

### Authentication Failures
1. Verify token is in localStorage under key `authToken`
2. Check token is valid and not expired
3. Ensure backend is receiving Authorization header
4. Test with curl: `curl -H "Authorization: Bearer <token>" <endpoint>`

### Pagination Issues
1. Verify `pagination` object in API response
2. Check `currentPage` and `pageSize` state management
3. Ensure filtered results count is accurate
4. Look for off-by-one errors in page calculations

## Environment Variables

### Required
```env
REACT_APP_API_URL=http://localhost:5000/api/v1
```

### Optional
```env
# Enable debug logging
REACT_APP_DEBUG=true

# Custom refresh interval (milliseconds)
REACT_APP_REFRESH_INTERVAL=10000

# API timeout (milliseconds)
REACT_APP_API_TIMEOUT=30000
```

## Performance Tips

1. **Pagination**: Use reasonable page sizes (10-50 items)
2. **Search**: Debounce search input on backend
3. **Refresh**: Disable auto-refresh on tab if not active
4. **Caching**: Backend should cache metrics for 5-10 seconds
5. **Compression**: Enable gzip on API responses

## Security Checklist

- [ ] All API requests use HTTPS in production
- [ ] Auth token is httpOnly if possible (set via Set-Cookie)
- [ ] Secrets are masked in UI (✓ implemented)
- [ ] Sensitive operations require confirmation (✓ implemented)
- [ ] Audit logs track all mutations (required on backend)
- [ ] Rate limiting is enforced (recommended on backend)
- [ ] CORS is properly configured (required on backend)
- [ ] Input validation on both frontend and backend (frontend done, backend required)

## Testing

### Manual Testing Checklist
- [ ] Can load all pages without errors
- [ ] Real-time refresh works every 10 seconds
- [ ] Can create new items
- [ ] Can edit existing items
- [ ] Can delete items with confirmation
- [ ] Pagination works correctly
- [ ] Search/filter returns correct results
- [ ] Error handling displays user-friendly messages
- [ ] Network failures are handled gracefully
- [ ] Unsaved changes are detected
- [ ] Auto-refresh pauses during edits
- [ ] Can export data to CSV/JSON
- [ ] Copy to clipboard works
- [ ] Show/hide sensitive values works

### Unit Test Example
```javascript
// Test API client
describe('apiClient', () => {
  it('should include auth header', async () => {
    localStorage.setItem('authToken', 'test-token');
    // Mock fetch and verify Authorization header
  });
});

// Test pagination
describe('Pagination', () => {
  it('should calculate correct page numbers', () => {
    const total = 127;
    const pageSize = 10;
    const totalPages = Math.ceil(total / pageSize); // 13
    expect(totalPages).toBe(13);
  });
});
```

## Debugging

### Enable Debug Mode
```javascript
// In browser console
localStorage.setItem('DEBUG_ADMIN_PAGES', 'true');
```

### Check API Responses
```javascript
// In browser console
// View last API response
window.__lastApiResponse

// View all requests made
Object.keys(window.__apiRequests || {})
```

### Network Debugging
1. Open DevTools Network tab
2. Filter by XHR/Fetch
3. Check request headers and response bodies
4. Verify status codes are correct
5. Look for CORS errors

## Migration from Old Implementation

### Data Compatibility
Old mock data structure should still work if:
1. All required fields are present
2. Date formats are ISO-8601 strings
3. Status enum values match (active, inactive, expired)
4. Numeric values are numbers, not strings

### Breaking Changes
1. No more `useState` initializations with mock data
2. All data comes from API on mount
3. Error handling is required (alerts shown)
4. Pagination is required for large lists

## Support & Resources

### Documentation Files
- `ADMIN_PAGES_UPDATE_GUIDE.md` - Comprehensive guide
- `BACKEND_API_SPEC.md` - API specifications
- Code comments in updated files

### Backend Integration
Refer to backend route handlers in:
- `backend/routes/security.js` - API keys endpoints
- `backend/routes/admin.js` - Admin endpoints
- `backend/controllers/` - Controller implementations

### Common Issues & Solutions

**Issue: CORS Error**
```
Solution: Add frontend origin to CORS whitelist on backend
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',')
}));
```

**Issue: 401 Unauthorized**
```
Solution: Ensure token is being sent
localStorage.getItem('authToken') // should return valid token
```

**Issue: 404 Not Found**
```
Solution: Verify API_URL and endpoint paths match exactly
console.log(API_BASE_URL + '/admin/keys')
```

## Rollback Plan

If you need to rollback:

```bash
# Restore from backup
cp AdminAPIKeys.jsx.backup AdminAPIKeys.jsx
cp AdminSecrets.jsx.backup AdminSecrets.jsx
cp AdminSystemConfig.jsx.backup AdminSystemConfig.jsx
cp AdminMonitoring.jsx.backup AdminMonitoring.jsx

# Clear browser cache
localStorage.clear()
```

## Next Steps

1. ✅ Replace files
2. ✅ Configure .env
3. ✅ Install dependencies
4. ✅ Implement backend endpoints
5. ✅ Run manual tests
6. ✅ Deploy to staging
7. ✅ Run E2E tests
8. ✅ Deploy to production

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review relevant documentation file
3. Check browser console for error messages
4. Inspect network requests in DevTools
5. Verify backend API is working with curl/Postman

---

Last Updated: February 4, 2026
