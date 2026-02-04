# Admin Dashboard - Quick Reference & Usage Guide

## 🚀 Quick Start

### 1. Access the Admin Dashboard
```jsx
// Route configuration
import AdminDashboard from '@/pages/admin/AdminDashboard';

// Add to your router
<Route path="/admin" element={<AdminDashboard />} />
```

### 2. User Must Be Admin
```jsx
// The dashboard automatically checks this
const { isAdmin } = useAdminContext();
// Only renders if isAdmin === true
```

---

## 📱 Tab Structure

### Home Tab
```
8 Stat Cards (clickable):
├── Active API Keys (24) → links to API Keys tab
├── Secrets Stored (156) [encrypted]
├── Total Users (1,234)
├── API Requests/Min (45,231)
├── DB Status [Healthy]
├── CPU Usage [34%]
├── Storage [512GB/1TB] with progress bar
└── Active Alerts (3) → links to Monitoring tab

Recent Activity Section:
├── Recent API Key Activity (3 items)
└── Recent Secret Changes (3 items)

Quick Actions Bar:
├── [Create API Key]
├── [Add Secret]
├── [Invite User]
└── [View Settings]
```

### API Keys Tab
```
Header + Create Button
│
Admin Table:
├── Columns:
│   ├── Key Name (filterable, sortable)
│   ├── Type (public/private/webhook)
│   ├── Status (active/inactive/revoked)
│   ├── Created (sortable)
│   ├── Last Used (sortable)
│   ├── Rate Limit
│   └── Actions
│
├── Actions per row:
│   ├── [Eye] View details
│   ├── [Copy] Copy key ID
│   ├── [Rotate] Start rotation
│   ├── [Trash] Revoke key
│   └── [3dots] More options
│
Pagination: 20 items per page
Sorting: Click column header
Filtering: Type text in filter row
```

### Secrets Tab
```
Environment Tabs:
├── [dev] Development
├── [staging] Staging
└── [prod] Production (red)

Header + Actions:
├── [+ Add Secret]
├── [Upload] Import
├── [Download] Export
└── [Rotate All] Rotate all secrets

Admin Table:
├── Columns:
│   ├── Secret Name (masked)
│   ├── Last Updated
│   ├── Modified By
│   ├── Encryption Status
│   └── Actions
│
├── Actions per row:
│   ├── [Eye/EyeOff] Reveal/Hide
│   ├── [Rotate] Rotate secret
│   └── [Trash] Delete
│
Audit Trail:
├── Recent Changes (timestamp, user, action, env)
└── [View Full Audit] link

Retention Policy:
├── ( ) 30 days
├── ( ) 90 days [selected]
├── ( ) 180 days
├── ( ) 1 year
└── ( ) Forever
```

---

## 🎨 Component Usage

### StatCard Component

```jsx
import StatCard from '@/components/admin/StatCard';

// Basic usage
<StatCard
  icon={Key}              // lucide-react icon
  label="Active API Keys"
  value={24}
  trend="+3 this week"
  color="purple"          // purple|green|yellow|red|blue
  onClick={() => navigate('/admin?tab=api-keys')}
/>

// With progress bar
<StatCard
  icon={HardDrive}
  label="Storage"
  value="512GB / 1TB"
  progress={0.51}         // 0-1 range
  color="purple"
/>

// With status badge
<StatCard
  icon={Lock}
  label="Secrets Stored"
  value={156}
  status="encrypted"      // or "active", "warning", "error"
  color="blue"
/>
```

**Props:**
- `icon` - Lucide React component (required)
- `label` - Display text (required)
- `value` - Main value to display (required)
- `trend` - Optional trend text ("+3" or "-5%")
- `status` - Optional status badge
- `color` - Color theme (default: "purple")
- `progress` - Progress bar value 0-1
- `onClick` - Optional click handler

---

### AdminTable Component

```jsx
import AdminTable from '@/components/admin/AdminTable';

<AdminTable
  columns={[
    { key: 'name', label: 'Name', sortable: true, filterable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'created', label: 'Created', sortable: true },
    { key: 'actions', label: 'Actions' }
  ]}
  data={keys}
  loading={loading}
  itemsPerPage={20}
  selectable={true}
  renderRow={(row, idx, { isSelected, onSelect }) => (
    <tr key={idx}>
      <td>{row.name}</td>
      <td>{row.status}</td>
      <td>{row.created}</td>
      <td>
        <button onClick={() => handleEdit(row)}>Edit</button>
      </td>
    </tr>
  )}
  onSort={({ key, direction }) => {
    console.log(`Sort by ${key} ${direction}`);
  }}
  onFilterChange={(filters) => {
    console.log('Filters:', filters);
  }}
  onSelectionChange={(selectedIds) => {
    console.log('Selected:', selectedIds);
  }}
/>
```

**Props:**
- `columns` - Array of column definitions (required)
- `data` - Array of row data (required)
- `renderRow` - Function to render custom rows
- `loading` - Show loading spinner
- `itemsPerPage` - Pagination size (default: 20)
- `selectable` - Show checkboxes
- `onSort` - Sort callback
- `onFilterChange` - Filter callback
- `onSelectionChange` - Selection callback

**Column Definition:**
```javascript
{
  key: 'fieldName',        // Data key
  label: 'Display Label',  // Header text
  sortable: true,          // Enable sorting
  filterable: true         // Show filter input
}
```

---

### ConfirmDialog Component

```jsx
import ConfirmDialog from '@/components/admin/ConfirmDialog';

const [showConfirm, setShowConfirm] = useState(false);

<ConfirmDialog
  isOpen={showConfirm}
  title="Revoke API Key?"
  description="This key will be immediately disabled and cannot be restored."
  isDangerous={true}                    // Red styling
  confirmLabel="Revoke"
  cancelLabel="Cancel"
  loading={false}                       // Show spinner
  onConfirm={handleRevoke}              // Called when confirm clicked
  onCancel={() => setShowConfirm(false)}
/>
```

**Props:**
- `isOpen` - Show/hide dialog (required)
- `title` - Dialog title (required)
- `description` - Main message
- `isDangerous` - Red styling for destructive actions
- `confirmLabel` - Confirm button text
- `cancelLabel` - Cancel button text
- `loading` - Show loading spinner on button
- `onConfirm` - Confirm callback
- `onCancel` - Cancel callback
- `children` - Additional content

---

## 🔌 API Usage Examples

### List API Keys

```javascript
import { apiKeysAPI } from '@/api/admin-keys-api';

// Load keys
const response = await apiKeysAPI.listKeys({
  page: 1,
  limit: 20,
  status: 'active',
  type: 'private',
  sort: 'created'
});
// Returns: { data: [...keys], total: 100, page: 1 }
```

### Create API Key

```javascript
const response = await apiKeysAPI.createKey({
  name: 'Production API Key',
  description: 'Used for production environment',
  type: 'private',
  rateLimit: 5000,
  expiresAt: null,        // never expires
  scopes: ['read', 'write']
});
// Returns: { id, key, secret, name, ... }
```

### Rotate API Key

```javascript
const response = await apiKeysAPI.rotateKey('key-123', {
  gracePeriodDays: 7,
  completeEarly: false
});
// Old key still works for 7 days
```

### List Secrets

```javascript
import { secretsAPI } from '@/api/admin-secrets-api';

const response = await secretsAPI.listSecrets('prod', {
  page: 1,
  limit: 20
});
// Returns: { data: [...secrets], total: 50, page: 1 }
```

### Create Secret

```javascript
const response = await secretsAPI.createSecret({
  name: 'DB_PASSWORD',          // Must be UPPERCASE_WITH_UNDERSCORES
  value: 'secret-value-here',
  description: 'PostgreSQL password',
  environment: 'prod',
  encrypted: true,              // Always true
  expiresAt: null
});
// Returns: { id, name, environment, ... }
```

### Export Secrets

```javascript
// Get encrypted JSON
const response = await secretsAPI.exportSecrets('prod', {
  format: 'json'
});

// Or as .env file
const response = await secretsAPI.exportSecrets('prod', {
  format: 'env'
});
```

---

## 🎯 Integration Checklist

- [ ] Import AdminDashboard in router
- [ ] Add route: `/admin` → AdminDashboard
- [ ] Verify ProtectedAdminRoute working
- [ ] Verify useAdminContext() working
- [ ] Verify SpectrumNavigation rendering
- [ ] Test: Navigate to admin dashboard
- [ ] Test: Verify non-admin users can't access
- [ ] Test: All 8 tabs render correctly
- [ ] Test: Modal opens/closes smoothly
- [ ] Test: Dark mode toggle works
- [ ] Test: Mobile responsive layout
- [ ] Test: Keyboard navigation
- [ ] Replace mock data with real API calls
- [ ] Add error handling
- [ ] Add loading states
- [ ] Add success notifications

---

## ⌨️ Keyboard Shortcuts

### AdminTable
- `Tab` - Navigate through table cells
- `Enter` - Sort column (if sortable)
- `Shift+Tab` - Navigate backwards
- `Space` - Select/deselect row (if selectable)
- `Arrow Up/Down` - Page through results

### Modals
- `Escape` - Close modal
- `Tab` - Focus next element
- `Shift+Tab` - Focus previous element
- `Enter` - Confirm action

### Dialog
- `Tab` - Focus next button
- `Enter` - Click focused button
- `Escape` - Cancel

---

## 🎨 Color Reference

| Color | Hex | Usage |
|-------|-----|-------|
| Purple (Primary) | `#9333EA` | Buttons, active states |
| Green (Success) | `#22C55E` | Active, encrypted |
| Red (Danger) | `#EF4444` | Revoked, delete |
| Amber (Warning) | `#F59E0B` | Pending, inactive |
| Blue (Info) | `#6366F1` | Information |
| Gray (Neutral) | `#6B7280` | Default text |

---

## 📊 Data Structure Examples

### API Key Object
```javascript
{
  id: "key-123",
  name: "Production API Key",
  type: "private",
  status: "active",           // active|inactive|revoked
  created: "2024-01-15",
  lastUsed: "2 hours ago",
  rateLimit: 5000,
  requests: 1250000,
  expiresAt: null,
  scopes: ["read", "write", "admin"]
}
```

### Secret Object
```javascript
{
  id: "secret-123",
  name: "DB_PASSWORD",
  environment: "prod",
  lastUpdated: "2024-01-20",
  modifiedBy: "admin@example.com",
  encrypted: true,
  expiresAt: null,
  value: "••••••••" // masked in UI
}
```

### Stat Card Data
```javascript
{
  apiKeys: { count: 24, trend: "+3 this week" },
  secrets: { count: 156, status: "encrypted" },
  users: { count: 1234, lastLogin: "2 hours ago" },
  apiRequests: { count: 45231, trend: "↓ 12%" }
}
```

---

## 🐛 Common Issues & Fixes

| Issue | Cause | Solution |
|-------|-------|----------|
| Modal not closing | Event not handled | Check onClick/onClose handlers |
| Table not sorted | Wrong column key | Verify column key matches data |
| Dark mode not working | Tailwind not configured | Check `tailwind.config.js` |
| Icons not showing | Lucide React not imported | Add `import { Icon } from 'lucide-react'` |
| API calls failing | Mock data active | Replace mock with real API calls |
| Secrets visible | Encryption disabled | Always set `encrypted: true` |

---

## 📈 Performance Tips

1. **Pagination:** Always use pagination for large datasets
   - Default: 20 items per page
   - Max recommended: 50 items per page

2. **Lazy Loading:** Only fetch data for active tab
   - Implement `useEffect` with dependency on `activeTab`

3. **Memoization:** Prevent unnecessary re-renders
   - Use `React.memo` for StatCard
   - Use `useMemo` for computed values

4. **Debouncing:** Delay expensive operations
   - Debounce filter inputs (300ms)
   - Debounce sort operations (100ms)

5. **Code Splitting:** Load admin module separately
   - Use `React.lazy` for AdminDashboard route

---

## 🔐 Security Best Practices

1. **Never log secrets:** Use masked display in console
2. **HTTPS only:** All API calls must use HTTPS
3. **CSRF tokens:** Include in all POST/PUT/DELETE requests
4. **Rate limiting:** Implement on backend for API calls
5. **Access control:** Check permissions before displaying UI
6. **Encryption:** All secrets encrypted at rest and in transit
7. **Audit logging:** Log all admin actions
8. **Session timeout:** Implement auto-logout for admin sessions

---

## 📝 Code Style Guide

### Component Names
```javascript
// ✅ Good
export default function AdminDashboard() {}
export default function ApiKeysTab() {}
export default function StatCard() {}

// ❌ Bad
export default adminDashboard() {}
export const ApiKeysTab = () => {}
```

### Props Structure
```javascript
// ✅ Good
<StatCard
  icon={Key}
  label="Active API Keys"
  value={count}
  trend="+3"
/>

// ❌ Bad - inconsistent spacing
<StatCard icon={Key} label="Active API Keys" value={count} trend="+3"/>
```

### Styling
```javascript
// ✅ Good - consistent spacing
className={`
  px-4 py-3 rounded-lg
  bg-white dark:bg-gray-800
  border border-gray-200 dark:border-gray-700
  hover:bg-gray-50 dark:hover:bg-gray-700
  transition-colors
`}

// ❌ Bad - inconsistent
className="px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
```

---

## 🚀 Deployment Checklist

- [ ] All mock data replaced with real API
- [ ] Error boundaries added
- [ ] Loading states implemented
- [ ] Success/error notifications added
- [ ] Performance tested (bundle < 50KB)
- [ ] Accessibility audit passed
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive testing
- [ ] Dark mode thoroughly tested
- [ ] Security review completed
- [ ] Code review approved
- [ ] Unit tests added (> 80% coverage)
- [ ] E2E tests passing
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] User acceptance testing passed
- [ ] Deployed to production

---

**For detailed implementation information, see:**
[ADMIN_DASHBOARD_IMPLEMENTATION.md](ADMIN_DASHBOARD_IMPLEMENTATION.md)
