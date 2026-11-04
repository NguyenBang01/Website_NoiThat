import { useMemo } from 'react';
import { useAuthStore } from '@/lib/authStore';

export function usePermission() {
  const { user, permissions } = useAuthStore();

  const isSuperAdmin = useMemo(() => {
    if (!user) return false;
    if (user.role_detail?.name === 'super_admin') return true;
    if (user.role_id === 1) return true;
    if (permissions.includes('*') || permissions.includes('super_admin')) return true;
    // Default fallback: if admin with no permissions array yet, preserve backwards compatibility
    if (user.role === 'admin' && permissions.length === 0 && !user.role_id) return true;
    return false;
  }, [user, permissions]);

  const checkPermission = (perm: string): boolean => {
    if (isSuperAdmin) return true;
    if (permissions.includes(perm)) return true;

    // Wildcard matching e.g. "product.*" matches "product.create"
    const [module] = perm.split('.');
    if (module && permissions.includes(`${module}.*`)) {
      return true;
    }

    return false;
  };

  const can = (permission: string | string[]): boolean => {
    if (isSuperAdmin) return true;
    if (Array.isArray(permission)) {
      return permission.every((p) => checkPermission(p));
    }
    return checkPermission(permission);
  };

  const canAny = (...perms: string[]): boolean => {
    if (isSuperAdmin) return true;
    if (perms.length === 0) return true;
    return perms.some((p) => checkPermission(p));
  };

  const canAll = (...perms: string[]): boolean => {
    if (isSuperAdmin) return true;
    if (perms.length === 0) return true;
    return perms.every((p) => checkPermission(p));
  };

  return {
    can,
    canAny,
    canAll,
    isSuperAdmin,
    permissions,
    role: user?.role_detail,
    roleName: user?.role_detail?.name || (isSuperAdmin ? 'super_admin' : user?.role || ''),
    roleDisplayName: user?.role_detail?.display_name || (isSuperAdmin ? 'Quản trị viên tối cao' : 'Nhân viên'),
  };
}
