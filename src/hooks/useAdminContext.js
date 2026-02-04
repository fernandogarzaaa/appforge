import { useAdminContext } from '@/lib/AdminContext';

/**
 * Custom hook to access admin context
 * Must be used within AdminProvider
 * 
 * Usage:
 * const { isAdmin, userRole, permissions, canDo } = useAdminContext();
 * 
 * if (!isAdmin) {
 *   return <AccessDenied />;
 * }
 * 
 * if (!canDo('canManageUsers')) {
 *   return <PermissionDenied />;
 * }
 */
export default useAdminContext;
