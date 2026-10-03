export type RoleType = 
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'REGIONAL_MANAGER'
  | 'AREA_MANAGER'
  | 'BRANCH_MANAGER'
  | 'EMPLOYEE'
  | 'AUDITOR';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'SUSPENDED' | 'DISABLED';

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';

export type BranchStatus = 'ACTIVE' | 'INACTIVE' | 'TEMPORARILY_CLOSED' | 'PERMANENTLY_CLOSED';

export type TransactionStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REVERSED'
  | 'FAILED'
  | 'REJECTED';

export type TransactionType = 
  | 'REMITTANCE_SEND'
  | 'REMITTANCE_PAYOUT'
  | 'BILLS_PAYMENT'
  | 'FOREIGN_EXCHANGE'
  | 'PAWN_LOAN'
  | 'INSURANCE_PREMIUM'
  | 'WALLET_CASHOUT';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED';

export type PermissionCode = 
  | 'DASHBOARD_VIEW'
  | 'USERS_VIEW'
  | 'USERS_CREATE'
  | 'USERS_EDIT'
  | 'ROLES_MANAGE'
  | 'EMPLOYEES_VIEW'
  | 'EMPLOYEES_CREATE'
  | 'EMPLOYEES_EDIT'
  | 'REGIONS_MANAGE'
  | 'AREAS_MANAGE'
  | 'BRANCHES_MANAGE'
  | 'CUSTOMERS_VIEW'
  | 'CUSTOMERS_CREATE'
  | 'CUSTOMERS_EDIT'
  | 'TRANSACTIONS_VIEW'
  | 'TRANSACTIONS_CREATE'
  | 'TRANSACTIONS_APPROVE'
  | 'TRANSACTIONS_CANCEL'
  | 'REPORTS_VIEW'
  | 'REPORTS_EXPORT'
  | 'AUDIT_VIEW'
  | 'SETTINGS_MANAGE';

export interface OrganizationalScope {
  regionId?: string;
  areaId?: string;
  branchId?: string;
}

export interface User {
  id: string;
  employeeId?: string;
  username: string;
  role: RoleType;
  roleId: string;
  status: UserStatus;
  lastLoginAt?: string;
  failedAttempts: number;
  lockedUntil?: string;
  createdAt: string;
}

export interface Region {
  id: string;
  code: string;
  name: string;
  managerName?: string;
  status: boolean;
}

export interface Area {
  id: string;
  regionId: string;
  code: string;
  name: string;
  managerName?: string;
  status: boolean;
}

export interface Branch {
  id: string;
  areaId: string;
  code: string;
  name: string;
  address?: string;
  city?: string;
  province?: string;
  contact?: string;
  email?: string;
  managerId?: string;
  managerName?: string;
  status: BranchStatus;
}

export interface Employee {
  id: string;
  employeeNo: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  position: string;
  department: string;
  birthDate?: string;
  gender?: string;
  contact?: string;
  email?: string;
  address?: string;
  dateHired: string;
  branchId: string;
  status: EmployeeStatus;
}

export interface Customer {
  id: string;
  customerNo: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  contact: string;
  email?: string;
  address: string;
  idType?: string;
  idNumber?: string;
  kycVerified: boolean;
  status: boolean;
  createdAt: string;
}

export interface TransactionStatusHistory {
  id: string;
  transactionId: string;
  status: TransactionStatus;
  changedById: string;
  changedByName: string;
  notes?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  transactionNo: string;
  customerId: string;
  branchId: string;
  employeeId: string;
  type: TransactionType;
  amount: number;
  fee: number;
  total: number;
  status: TransactionStatus;
  referenceNo?: string;
  notes?: string;
  requiresApproval?: boolean;
  approvalId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Approval {
  id: string;
  transactionId: string;
  transactionNo: string;
  requesterId: string;
  requesterName: string;
  approverId?: string;
  approverName?: string;
  branchId: string;
  branchName: string;
  amount: number;
  status: ApprovalStatus;
  reason: string;
  decisionNote?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  status: NotificationStatus;
  link?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  username: string;
  employeeId?: string;
  action: string;
  module: 'AUTH' | 'USER' | 'EMPLOYEE' | 'BRANCH' | 'CUSTOMER' | 'TRANSACTION' | 'APPROVAL' | 'SETTINGS' | 'REPORT';
  recordId?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  result: 'SUCCESS' | 'FAILURE';
  createdAt: string;
}

export interface LoginLog {
  id: string;
  userId?: string;
  username: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  reason?: string;
  createdAt: string;
}

export interface SystemSettings {
  organizationName: string;
  approvalThresholdAmount: number;
  dailyBranchLimit: number;
  sessionTimeoutMinutes: number;
  requireTwoFactorForManagers: boolean;
  maintenanceMode: boolean;
  allowWeekendTransactions: boolean;
  defaultCurrency: string;
}

export interface CurrentUserSession {
  user: User;
  employee?: Employee;
  branch?: Branch;
  area?: Area;
  region?: Region;
  role: RoleType;
  permissions: PermissionCode[];
  scope: OrganizationalScope;
}
