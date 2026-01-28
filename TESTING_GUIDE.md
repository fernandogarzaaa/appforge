# 🧪 Testing the Integrated Enhanced AI

## Quick Start Test

### 1. **Launch the App**
```bash
npm run dev
# Open http://localhost:5173
```

### 2. **Create a Project with AI**
```
Click "Create with AI" on Dashboard
Type: "create online store"
Press Enter or click the arrow
```

### 3. **View Generated Project**
```
Wait for "Your website is LIVE!"
Click the link
```

### 4. **Check Database Tab**
You should see:
- ✅ **Category entity** (9 fields)
- ✅ **Product entity** (20 fields)
- ✅ Each with database indexes
- ✅ Each with REST API endpoints
- ✅ Relationship: Product → Category
```

---

## Test Cases

### Test 1: E-commerce Project
**Input**: `"create online store for handmade jewelry"`

**Expected Entities**:
- Category (with slug, parent_id)
- Product (with sku, pricing, variants)

**Expected Features**:
- search: true
- payment: false (implied)
- auth: false

**Expected Output**:
- 2 entities
- 5+ database indexes total
- 12+ API endpoints total

---

### Test 2: Blog/Content
**Input**: `"build blog for tech news and tutorials"`

**Expected Entities**:
- Article (with author, tags, seo)
- Comment (with nested replies)

**Expected Features**:
- search: true
- analytics: true (implied)

**Expected Output**:
- 2 entities
- Articles: 7 API endpoints
- Comments: 4 API endpoints

---

### Test 3: Restaurant/Cafe
**Input**: `"create menu site for my coffee shop"`

**Expected Entities**:
- MenuItem (with allergens, dietary tags)

**Expected Features**:
- search: false
- notifications: false

**Expected Output**:
- 1 entity
- 16 fields (with nutrition, allergens)
- 6 API endpoints

---

### Test 4: With Authentication
**Input**: `"build app with user login and profiles"`

**Expected Entities**:
- User (with roles, verification)
- (Additional entity based on context)

**Expected Features**:
- auth: true

**Expected Output**:
- User entity created
- API: register, login, logout, profile, verify-email

---

### Test 5: With Payment
**Input**: `"create marketplace with payment processing"`

**Expected Entities**:
- Product/Item
- Order (with payment tracking)
- User

**Expected Features**:
- payment: true
- auth: true (implied)

**Expected Output**:
- Order entity with payment_status
- API: webhook endpoint for payment updates

---

## Validation Checklist

### Database Tab Validation

**Entity Display**:
- [ ] Entity name is correct
- [ ] Field count matches implementation
- [ ] Index count shown
- [ ] Relationship count shown

**Schema Table**:
- [ ] All fields listed
- [ ] Data types are correct
- [ ] Constraints are shown with color-coding
- [ ] Required fields marked in red
- [ ] Unique fields marked in purple
- [ ] Min/max constraints shown
- [ ] Enum values displayed
- [ ] Reference fields shown as `→ EntityName`

**Indexes Section**:
- [ ] All indexes listed
- [ ] Common fields indexed (id, slug, created_at)
- [ ] Foreign keys indexed
- [ ] Status/boolean fields indexed

**Relationships Section**:
- [ ] Relationship type shown (belongsTo, hasMany)
- [ ] Both entities named
- [ ] Foreign key name displayed
- [ ] Arrow shows direction correctly

**API Endpoints Section**:
- [ ] HTTP method color-coded
  - GET: green
  - POST: blue
  - PUT: yellow
  - DELETE: red
- [ ] Paths are correct
- [ ] Auth requirements shown
- [ ] Cache durations displayed
- [ ] Admin-only endpoints marked

---

## Expected Outputs by Type

### Category Entity
```
Fields: 9
name (string, required, unique, min:2, max:50)
slug (string, required, unique, regex)
description (text, max:500)
icon (string)
parent_id (→ Category, self-reference)
display_order (number, default:0)
active (boolean, default:true)
created_at (datetime, default:now)

Indexes: [slug, active, parent_id]

Relationships: 1 (self-reference)

API Endpoints: 5 (list, get, create, update, delete)
```

### Product Entity
```
Fields: 20+
name (string, required, unique:false, min:3, max:100)
slug (string, required, unique, regex)
description (text)
price (number, required, min:0)
compare_price (number, min:0)
cost (number, min:0)
sku (string, unique)
barcode (string)
category_id (→ Category, required)
images (array)
stock (number, default:0, min:0)
featured (boolean, default:false)
active (boolean, default:true)
seo_title (string, max:60)
seo_description (string, max:160)
tags (array)
created_at (datetime, default:now)
updated_at (datetime, auto)
+ 2 more fields

Indexes: [slug, sku, category_id, featured, active]

Relationships: 1 (belongsTo Category)

API Endpoints: 7 (list, search, get, create, update, delete, bulk)
```

### User Entity
```
Fields: 12
email (string, required, unique, pattern)
username (string, unique, pattern)
full_name (string, required)
avatar (string)
bio (text)
role (enum: user|author|admin, default:user)
verified (boolean, default:false)
email_verified (boolean, default:false)
phone (string, pattern)
preferences (object)
created_at (datetime, default:now)
last_login (datetime)

Indexes: [email, username, role]

API Endpoints: 6 (register, login, logout, profile, update, verify)
```

---

## Visual Inspection

### Database Tab Should Look Like:
```
┌─────────────────────────────────────────────────────────┐
│ 📦 Product                                              │
│ 20 fields • 5 indexes • 1 relationships • 7 APIs         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Schema Table:                                           │
│ Field    Type         Constraints                       │
│ ─────────────────────────────────────────────          │
│ name     string       required  min:3  max:100          │
│ slug     string       required  unique  regex           │
│ price    number       required  min:0                   │
│ stock    number       default:0  min:0                  │
│ featured boolean      default:false                     │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ Database Indexes:                                       │
│ [slug]  [sku]  [category_id]  [featured]  [active]      │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ Relationships:                                          │
│ → belongsTo Product → Category (category_id)            │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ API Endpoints:                                          │
│ GET    /products             (public, 180s cache)       │
│ GET    /products/search      (public)                   │
│ GET    /products/:slug       (public, 300s cache)       │
│ POST   /products             🔒 admin                    │
│ PUT    /products/:id         🔒 admin                    │
│ DELETE /products/:id         🔒 admin                    │
│ POST   /products/bulk        🔒 admin                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Console Validation

Open browser console (F12) and check for:

### Expected Logs:
```javascript
// No errors about missing functions
✅ generateEnhancedEntities loaded

// Project created with metadata
✅ Project metadata includes: ai_generated, features, enhanced_schema

// Entities created successfully
✅ Entity.create() returned without errors

// Data fetched for display
✅ useQuery loaded entities with metadata
```

### Unexpected Issues:
```javascript
❌ generateEnhancedEntities is not a function
   → Import statement might be wrong
   
❌ entity.metadata is undefined
   → Metadata not stored in database
   
❌ Cannot read property 'schema' of undefined
   → Entity object structure mismatch
```

---

## Performance Metrics

### Expected Timings:
```
Page load:           < 1s
Entity generation:   < 100ms
Database display:    < 500ms
Schema rendering:    < 200ms
Total:              < 1.5s
```

### Network Requests:
```
GET /api/projects/:id          → 50-100ms
GET /api/entities?project_id   → 100-200ms
GET /api/pages?project_id      → 50-100ms
```

---

## Debugging Tips

### If Database Tab is Empty:
1. Check browser console for errors
2. Verify entities were created:
   - Open Network tab
   - Look for Entity.create() calls
   - Check response status (should be 201)

3. Check entity structure:
   - Click entity in console
   - Verify `schema` property exists
   - Verify `metadata` property exists

### If Constraints Not Showing:
1. Check that config object has properties
2. Verify config.minLength exists (not min)
3. Check for typos in property names
4. Ensure constraint values are not undefined

### If Indexes/APIs Not Showing:
1. Check metadata exists on entity
2. Verify metadata.indexes is an array
3. Verify metadata.api_endpoints is an object
4. Check that values aren't null/undefined

---

## Success Criteria

✅ **Test Passed If**:
1. Multiple entities created automatically
2. Each entity has 10+ fields
3. Constraints are displayed with colors
4. Indexes section shows 3+ indexes
5. Relationships show foreign keys
6. API endpoints listed with methods
7. No console errors
8. All data renders correctly
9. Performance is smooth
10. UI is professional and clear

---

## Reporting Issues

If something doesn't work, provide:
```
1. Input you typed
2. Expected entities
3. Actual entities created
4. Console errors (if any)
5. Missing fields/validations
6. Incorrect display
```

Example:
```
Input: "create online store"
Expected: Category + Product entities
Actual: Only Product created
Error: "Cannot read property 'indexes' of undefined"
Issue: Metadata not being stored
```

---

## Next Steps After Successful Test

1. ✅ Try different project types
2. ✅ Check that indexes optimize queries
3. ✅ Verify API endpoints are RESTful
4. ✅ Test with authentication phrases
5. ✅ Test with payment keywords
6. ✅ Test with real-time requirements

All tests should pass within **1 second** per project creation! 🚀
