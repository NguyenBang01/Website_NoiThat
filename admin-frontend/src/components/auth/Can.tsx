import React from 'react';
import { usePermission } from '@/hooks/usePermission';

export interface CanProps {
  permission?: string | string[];
  anyPermissions?: string[];
  allPermissions?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({
  permission,
  anyPermissions,
  allPermissions,
  fallback = null,
  children,
}) => {
  const { can, canAny, canAll } = usePermission();

  let hasAccess = true;

  if (permission) {
    hasAccess = hasAccess && can(permission);
  }

  if (anyPermissions && anyPermissions.length > 0) {
    hasAccess = hasAccess && canAny(...anyPermissions);
  }

  if (allPermissions && allPermissions.length > 0) {
    hasAccess = hasAccess && canAll(...allPermissions);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
