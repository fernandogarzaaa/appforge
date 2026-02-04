#!/usr/bin/env node

/**
 * Admin Authentication & Authorization System - Setup & Examples
 * 
 * This file contains practical examples for implementing and testing
 * the admin authentication and authorization system.
 */

// ============================================================================
// EXAMPLE 1: Using AdminContext in Components
// ============================================================================

import { useAdminContext } from '@/lib/AdminContext';
import { AccessDenied } from '@/pages/AdminErrorPages';

function UserManagementPage() {
  const { isAdmin, isLoadingAdmin, userRole, hasPermission, canDo } = useAdminContext();

  // Show loading state
  if (isLoadingAdmin) {
    return <div>Loading admin permissions...</div>;
  }

  // Redirect if not admin
  if (!isAdmin) {
    return <AccessDenied message="You must be an admin to access this page." />;
  }

  // Check specific permission
  if (!hasPermission('canManageUsers')) {
    return <AccessDenied permission="canManageUsers" />;
  }

  return (
    <div>
      <h1>User Management</h1>
      <p>Your role: {userRole}</p>
      
      {canDo('canInviteUsers') && (
        <button>Invite New User</button>
      )}
      
      {canDo('canEditUserRoles') && (
        <button>Edit User Roles</button>
      )}
      
      {canDo('canRemoveUsers') && (
        <button>Remove Users</button>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Using AdminAuthGuard Component
// ============================================================================

import AdminAuthGuard from '@/components/auth/AdminAuthGuard';
import { CustomErrorPage } from '@/pages/admin/CustomErrorPage';

function AdminDashboard() {
  return (
    <AdminAuthGuard requiredRole="admin" fallback={<CustomErrorPage />}>
      <div>
        <h1>Admin Dashboard</h1>
        {/* Admin content here */}
      </div>
    </AdminAuthGuard>
  );
}

// ============================================================================
// EXAMPLE 3: Using ProtectedAdminRoute with React Router
// ============================================================================

import { Routes, Route } from 'react-router-dom';
import ProtectedAdminRoute from '@/components/auth/ProtectedAdminRoute';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import UserManagement from '@/pages/admin/UserManagement';
import KeyManagement from '@/pages/admin/KeyManagement';

function AdminRoutes() {
  return (
    <Routes>
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedAdminRoute requiredRole="admin">
            <UserManagement />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/keys"
        element={
          <ProtectedAdminRoute requiredRole="super_admin">
            <KeyManagement />
          </ProtectedAdminRoute>
        }
      />
    </Routes>
  );
}

// ============================================================================
// EXAMPLE 4: Using Admin API
// ============================================================================

import { adminAPI } from '@/api/admin-api';

async function fetchUsersList() {
  try {
    const response = await adminAPI.listUsers(50, 0);
    console.log('Users:', response.data);
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
}

async function updateUserRole(userId, newRole) {
  try {
    const response = await adminAPI.updateUserRole(userId, newRole);
    console.log('User role updated:', response.data);
  } catch (error) {
    console.error('Failed to update user role:', error);
  }
}

async function logAdminAction(action, resource) {
  try {
    await adminAPI.logAdminAction(action, resource, {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

// ============================================================================
// EXAMPLE 5: Permission Checking
// ============================================================================

import { 
  checkPermission, 
  getPermissionsForRole, 
  isAdminRole,
  isSuperAdminRole,
  canManageRole
} from '@/lib/permissions';

// Check if admin can manage keys
const canManageKeys = checkPermission('admin', 'canManageKeys');
console.log('Admin can manage keys:', canManageKeys); // true

// Get all permissions for a role
const adminPerms = getPermissionsForRole('admin');
console.log('Admin permissions:', adminPerms);

// Check if a role is admin level
console.log('Is admin role?', isAdminRole('admin')); // true
console.log('Is admin role?', isAdminRole('operator')); // false

// Check if a role is super admin
console.log('Is super admin?', isSuperAdminRole('super_admin')); // true

// Check role management
console.log('Can admin manage operator?', canManageRole('admin', 'operator')); // true
console.log('Can operator manage admin?', canManageRole('operator', 'admin')); // false

// ============================================================================
// EXAMPLE 6: Conditional Rendering Based on Permissions
// ============================================================================

import { useAdminContext } from '@/lib/AdminContext';

function FeatureToggleComponent() {
  const { canDo } = useAdminContext();

  return (
    <div>
      {canDo('canManageSecrets') && (
        <section>
          <h2>Secrets Management</h2>
          {/* Secrets management UI */}
        </section>
      )}

      {canDo('canManageUsers') && (
        <section>
          <h2>User Management</h2>
          {/* User management UI */}
        </section>
      )}

      {canDo('canViewAudit') && (
        <section>
          <h2>Audit Log</h2>
          {/* Audit log UI */}
        </section>
      )}

      {canDo('canManageSystem') && (
        <section>
          <h2>System Settings</h2>
          {/* System settings UI */}
        </section>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: API Response Handling
// ============================================================================

/**
 * Backend API Response Format
 */

// GET /api/user/admin-status
const adminStatusExample = {
  data: {
    isAdmin: true,
    role: 'super_admin',
    permissions: {
      canManageKeys: true,
      canManageSecrets: true,
      // ... all other permissions
    }
  }
};

// POST /api/audit/admin-action
const auditLogExample = {
  data: {
    id: 'audit_123',
    userId: 'user_456',
    action: 'user_role_updated',
    resource: 'users',
    details: {
      targetUserId: 'user_789',
      oldRole: 'operator',
      newRole: 'admin'
    },
    timestamp: '2024-01-15T10:30:00Z',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
  }
};

// GET /api/audit/logs?limit=50&offset=0
const auditLogsExample = {
  data: {
    total: 1245,
    limit: 50,
    offset: 0,
    logs: [
      {
        id: 'audit_123',
        userId: 'user_456',
        action: 'user_role_updated',
        resource: 'users',
        timestamp: '2024-01-15T10:30:00Z',
        status: 'success'
      },
      // ... more logs
    ]
  }
};

// ============================================================================
// EXAMPLE 8: Security Best Practices
// ============================================================================

/**
 * Security Checklist for Admin Features
 * 
 * ✓ Admin status checked on app initialization
 * ✓ Admin status cached locally (1 hour)
 * ✓ Cache invalidated on logout
 * ✓ Backend role check on every sensitive operation
 * ✓ All admin API calls include auth token
 * ✓ Admin actions logged to audit trail
 * ✓ Failed auth attempts logged
 * ✓ Session timeout for admin (15 min inactivity)
 * ✓ HTTPS enforced for all admin endpoints
 * ✓ CORS configured for admin endpoints
 * ✓ Defense-in-depth: email check + backend role check
 * ✓ Admin badge shown only if isAdmin flag is true
 */

// ============================================================================
// EXAMPLE 9: Testing Admin Features
// ============================================================================

/**
 * Manual Testing Scenarios
 */

async function testAdminFlow() {
  // 1. Login as admin
  console.log('Test 1: Login as admin user');
  // User logs in with fernandogarzaaa@gmail.com

  // 2. Check admin status loads
  console.log('Test 2: Admin context initializes');
  // Should set isAdmin=true, userRole='super_admin'

  // 3. Navigate to admin dashboard
  console.log('Test 3: Navigate to /admin');
  // Should show admin dashboard, not redirect

  // 4. Check permissions
  console.log('Test 4: Check permissions');
  // Should see all permission buttons enabled

  // 5. Perform admin action
  console.log('Test 5: Create API key');
  // Action should be logged to audit trail

  // 6. Check audit log
  console.log('Test 6: View audit log');
  // Should show the action just performed

  // 7. Logout
  console.log('Test 7: Logout');
  // Admin cache should be cleared

  // 8. Login as non-admin
  console.log('Test 8: Login as regular user');
  // isAdmin should be false

  // 9. Try to access admin page
  console.log('Test 9: Try to access /admin');
  // Should be redirected to /dashboard
}

// ============================================================================
// EXAMPLE 10: Custom Admin Components
// ============================================================================

import { useAdminContext } from '@/lib/AdminContext';

function AdminBadge() {
  const { isAdmin, userRole } = useAdminContext();

  if (!isAdmin) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-sm font-medium">
      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
      {userRole === 'super_admin' ? 'Super Admin' : 'Admin'}
    </div>
  );
}

function PermissionButton({ permission, children, ...props }) {
  const { canDo } = useAdminContext();

  const isAllowed = canDo(permission);

  return (
    <button
      disabled={!isAllowed}
      className={isAllowed ? 'opacity-100' : 'opacity-50 cursor-not-allowed'}
      title={isAllowed ? undefined : `Requires: ${permission}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default {
  AdminBadge,
  PermissionButton
};
