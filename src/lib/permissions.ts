import { RoleType, PermissionCode, OrganizationalScope } from '../types';

export const ROLE_PERMISSIONS: Record<RoleType, PermissionCode[]> = {
  SUPER_ADMIN: [
    'DASHBOARD_VIEW',
    'USERS_VIEW',
    'USERS_CREATE',
    'USERS_EDIT',
    'ROLES_MANAGE',
    'EMPLOYEES_VIEW',
    'EMPLOYEES_CREATE',
    'EMPLOYEES_EDIT',
    'REGIONS_MANAGE',
    'AREAS_MANAGE',
    'BRANCHES_MANAGE',
    'CUSTOMERS_VIEW',
    'CUSTOMERS_CREATE',
    'CUSTOMERS_EDIT',
    'TRANSACTIONS_VIEW',
    'TRANSACTIONS_CREATE',
    'TRANSACTIONS_APPROVE',
    'TRANSACTIONS_CANCEL',
    'REPORTS_VIEW',
    'REPORTS_EXPORT',
    'AUDIT_VIEW',
    'SETTINGS_MANAGE',
  ],
  ADMIN: [
    'DASHBOARD_VIEW',
    'USERS_VIEW',
    'USERS_CREATE',
    'USERS_EDIT',
    'ROLES_MANAGE',
    'EMPLOYEES_VIEW',
    'EMPLOYEES_CREATE',
    'EMPLOYEES_EDIT',
    'REGIONS_MANAGE',
    'AREAS_MANAGE',
    'BRANCHES_MANAGE',
    'CUSTOMERS_VIEW',
    'CUSTOMERS_CREATE',
    'CUSTOMERS_EDIT',
    'TRANSACTIONS_VIEW',
    'TRANSACTIONS_CREATE',
    'TRANSACTIONS_APPROVE',
    'TRANSACTIONS_CANCEL',
    'REPORTS_VIEW',
    'REPORTS_EXPORT',
    'AUDIT_VIEW',
    'SETTINGS_MANAGE',
  ],
  REGIONAL_MANAGER: [
    'DASHBOARD_VIEW',
    'USERS_VIEW',
    'EMPLOYEES_VIEW',
    'EMPLOYEES_CREATE',
    'EMPLOYEES_EDIT',
    'REGIONS_MANAGE',
    'AREAS_MANAGE',
    'BRANCHES_MANAGE',
    'CUSTOMERS_VIEW',
    'CUSTOMERS_CREATE',
    'CUSTOMERS_EDIT',
    'TRANSACTIONS_VIEW',
    'TRANSACTIONS_CREATE',
    'TRANSACTIONS_APPROVE',
    'REPORTS_VIEW',
    'REPORTS_EXPORT',
    'AUDIT_VIEW',
  ],
  AREA_MANAGER: [
    'DASHBOARD_VIEW',
    'USERS_VIEW',
    'EMPLOYEES_VIEW',
    'EMPLOYEES_CREATE',
    'EMPLOYEES_EDIT',
    'BRANCHES_MANAGE',
    'CUSTOMERS_VIEW',
    'CUSTOMERS_CREATE',
    'CUSTOMERS_EDIT',
    'TRANSACTIONS_VIEW',
    'TRANSACTIONS_CREATE',
    'TRANSACTIONS_APPROVE',
    'REPORTS_VIEW',
    'REPORTS_EXPORT',
    'AUDIT_VIEW',
  ],
  BRANCH_MANAGER: [
    'DASHBOARD_VIEW',
    'USERS_VIEW',
    'USERS_EDIT',
    'EMPLOYEES_VIEW',
    'EMPLOYEES_CREATE',
    'EMPLOYEES_EDIT',
    'CUSTOMERS_VIEW',
    'CUSTOMERS_CREATE',
    'CUSTOMERS_EDIT',
    'TRANSACTIONS_VIEW',
    'TRANSACTIONS_CREATE',
    'TRANSACTIONS_APPROVE',
    'TRANSACTIONS_CANCEL',
    'REPORTS_VIEW',
    'REPORTS_EXPORT',
    'AUDIT_VIEW',
  ],
  EMPLOYEE: [
    'DASHBOARD_VIEW',
    'EMPLOYEES_VIEW',
    'CUSTOMERS_VIEW',
    'CUSTOMERS_CREATE',
    'TRANSACTIONS_VIEW',
    'TRANSACTIONS_CREATE',
    'REPORTS_VIEW',
  ],
  AUDITOR: [
    'DASHBOARD_VIEW',
    'USERS_VIEW',
    'EMPLOYEES_VIEW',
    'CUSTOMERS_VIEW',
    'TRANSACTIONS_VIEW',
    'REPORTS_VIEW',
    'REPORTS_EXPORT',
    'AUDIT_VIEW',
  ],
};

export function hasPermission(role: RoleType, permission: PermissionCode): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function canAccessBranch(
  userRole: RoleType,
  userScope: OrganizationalScope,
  targetBranch: { id: string; areaId: string; regionId?: string },
  branchAreaMap?: Record<string, { regionId: string }>
): boolean {
  if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'AUDITOR') {
    return true;
  }
  if (userRole === 'BRANCH_MANAGER' || userRole === 'EMPLOYEE') {
    return userScope.branchId === targetBranch.id;
  }
  if (userRole === 'AREA_MANAGER') {
    return userScope.areaId === targetBranch.areaId;
  }
  if (userRole === 'REGIONAL_MANAGER') {
    const branchRegionId = targetBranch.regionId || (branchAreaMap && targetBranch.areaId ? branchAreaMap[targetBranch.areaId]?.regionId : undefined);
    return userScope.regionId === branchRegionId;
  }
  return false;
}
