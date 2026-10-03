import {
  Region,
  Area,
  Branch,
  Employee,
  User,
  Customer,
  Transaction,
  Approval,
  Notification,
  AuditLog,
  LoginLog,
  SystemSettings,
  CurrentUserSession,
  RoleType,
  TransactionType,
  TransactionStatus
} from '../types';
import {
  INITIAL_REGIONS,
  INITIAL_AREAS,
  INITIAL_BRANCHES,
  INITIAL_EMPLOYEES,
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_TRANSACTIONS,
  INITIAL_APPROVALS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_LOGIN_LOGS,
  INITIAL_SETTINGS
} from './seedData';
import { ROLE_PERMISSIONS } from './permissions';

const STORAGE_KEYS = {
  REGIONS: 'zebra_regions_v1',
  AREAS: 'zebra_areas_v1',
  BRANCHES: 'zebra_branches_v1',
  EMPLOYEES: 'zebra_employees_v1',
  USERS: 'zebra_users_v1',
  CUSTOMERS: 'zebra_customers_v1',
  TRANSACTIONS: 'zebra_transactions_v1',
  APPROVALS: 'zebra_approvals_v1',
  NOTIFICATIONS: 'zebra_notifications_v1',
  AUDIT_LOGS: 'zebra_audit_logs_v1',
  LOGIN_LOGS: 'zebra_login_logs_v1',
  SETTINGS: 'zebra_settings_v1',
  CURRENT_USER: 'zebra_current_user_v1',
};

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`Error reading ${key}`, e);
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key}`, e);
  }
}

export class EnterpriseStorage {
  private static listeners: Array<() => void> = [];

  public static subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notify(): void {
    this.listeners.forEach(l => l());
  }

  public static getRegions(): Region[] {
    return getItem(STORAGE_KEYS.REGIONS, INITIAL_REGIONS);
  }

  public static getAreas(): Area[] {
    return getItem(STORAGE_KEYS.AREAS, INITIAL_AREAS);
  }

  public static getBranches(): Branch[] {
    return getItem(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
  }

  public static getEmployees(): Employee[] {
    return getItem(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
  }

  public static getUsers(): User[] {
    return getItem(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  public static getCustomers(): Customer[] {
    return getItem(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }

  public static getTransactions(): Transaction[] {
    return getItem(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  }

  public static getApprovals(): Approval[] {
    return getItem(STORAGE_KEYS.APPROVALS, INITIAL_APPROVALS);
  }

  public static getNotifications(): Notification[] {
    return getItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }

  public static getAuditLogs(): AuditLog[] {
    return getItem(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  public static getLoginLogs(): LoginLog[] {
    return getItem(STORAGE_KEYS.LOGIN_LOGS, INITIAL_LOGIN_LOGS);
  }

  public static getSettings(): SystemSettings {
    return getItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  // Session & Auth
  public static getCurrentSession(): CurrentUserSession | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) {
      // Default to Super Admin for rich exploration on start
      const defaultUser = INITIAL_USERS[0];
      const session = this.buildSessionForUser(defaultUser);
      setItem(STORAGE_KEYS.CURRENT_USER, session);
      return session;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public static setCurrentUser(user: User): CurrentUserSession {
    const session = this.buildSessionForUser(user);
    setItem(STORAGE_KEYS.CURRENT_USER, session);
    this.logAudit({
      action: 'LOGIN',
      module: 'AUTH',
      recordId: user.id,
      newValue: { username: user.username, role: user.role },
      result: 'SUCCESS',
    });
    this.recordLoginLog(user.username, true);
    this.notify();
    return session;
  }

  public static logout(): void {
    const current = this.getCurrentSession();
    if (current) {
      this.logAudit({
        action: 'LOGOUT',
        module: 'AUTH',
        recordId: current.user.id,
        result: 'SUCCESS',
      });
    }
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    this.notify();
  }

  public static switchRole(role: RoleType): CurrentUserSession {
    const users = this.getUsers();
    const targetUser = users.find(u => u.role === role) || users[0];
    return this.setCurrentUser(targetUser);
  }

  private static buildSessionForUser(user: User): CurrentUserSession {
    const employees = this.getEmployees();
    const branches = this.getBranches();
    const areas = this.getAreas();
    const regions = this.getRegions();

    const employee = user.employeeId ? employees.find(e => e.id === user.employeeId) : undefined;
    const branch = employee ? branches.find(b => b.id === employee.branchId) : (user.role === 'SUPER_ADMIN' ? undefined : branches[0]);
    const area = branch ? areas.find(a => a.id === branch.areaId) : (user.role === 'AREA_MANAGER' ? areas[0] : undefined);
    const region = area ? regions.find(r => r.id === area.regionId) : (user.role === 'REGIONAL_MANAGER' ? regions[1] : undefined);

    const scope = {
      regionId: user.role === 'REGIONAL_MANAGER' ? 'reg_02' : region?.id,
      areaId: user.role === 'AREA_MANAGER' ? 'area_01' : area?.id,
      branchId: (user.role === 'BRANCH_MANAGER' || user.role === 'EMPLOYEE') ? (branch?.id || 'br_01') : undefined,
    };

    return {
      user,
      employee,
      branch,
      area,
      region,
      role: user.role,
      permissions: ROLE_PERMISSIONS[user.role] || [],
      scope,
    };
  }

  // Audit Logger
  public static logAudit(params: {
    action: string;
    module: AuditLog['module'];
    recordId?: string;
    oldValue?: Record<string, any>;
    newValue?: Record<string, any>;
    result?: 'SUCCESS' | 'FAILURE';
  }): void {
    const session = this.getCurrentSession();
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: session?.user.id,
      username: session?.user.username || 'system',
      employeeId: session?.employee?.id,
      action: params.action,
      module: params.module,
      recordId: params.recordId,
      oldValue: params.oldValue,
      newValue: params.newValue,
      ipAddress: '192.168.1.100',
      userAgent: navigator.userAgent.substring(0, 60),
      result: params.result || 'SUCCESS',
      createdAt: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs]);
  }

  public static recordLoginLog(username: string, success: boolean, reason?: string): void {
    const logs = this.getLoginLogs();
    const newLog: LoginLog = {
      id: `log_${Date.now()}`,
      username,
      success,
      reason,
      ipAddress: '192.168.1.100',
      userAgent: navigator.userAgent.substring(0, 50),
      createdAt: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.LOGIN_LOGS, [newLog, ...logs]);
  }

  // Transaction mutations
  public static createTransaction(params: {
    customerId: string;
    branchId: string;
    type: TransactionType;
    amount: number;
    referenceNo?: string;
    notes?: string;
  }): { transaction: Transaction; requiresApproval: boolean } {
    const session = this.getCurrentSession();
    const settings = this.getSettings();
    const transactions = this.getTransactions();
    const approvals = this.getApprovals();
    const branches = this.getBranches();

    // Standard fee calculation
    let fee = 25;
    if (params.type === 'REMITTANCE_SEND') {
      fee = Math.max(50, Math.round(params.amount * 0.015));
    } else if (params.type === 'REMITTANCE_PAYOUT') {
      fee = 0;
    } else if (params.type === 'FOREIGN_EXCHANGE') {
      fee = 100;
    } else if (params.type === 'PAWN_LOAN') {
      fee = Math.round(params.amount * 0.02);
    }

    const total = params.amount + fee;
    const requiresApproval = params.amount >= settings.approvalThresholdAmount || params.type === 'FOREIGN_EXCHANGE';

    const transactionId = `txn_${Date.now()}`;
    const transactionNo = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(transactions.length + 101).padStart(6, '0')}`;

    const newTxn: Transaction = {
      id: transactionId,
      transactionNo,
      customerId: params.customerId,
      branchId: params.branchId,
      employeeId: session?.employee?.id || 'emp_04',
      type: params.type,
      amount: params.amount,
      fee,
      total,
      status: requiresApproval ? 'PENDING' : 'COMPLETED',
      referenceNo: params.referenceNo || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: params.notes,
      requiresApproval,
      createdAt: new Date().toISOString(),
      completedAt: requiresApproval ? undefined : new Date().toISOString(),
    };

    if (requiresApproval) {
      const approvalId = `app_${Date.now()}`;
      newTxn.approvalId = approvalId;

      const branch = branches.find(b => b.id === params.branchId);
      const newApproval: Approval = {
        id: approvalId,
        transactionId: newTxn.id,
        transactionNo: newTxn.transactionNo,
        requesterId: session?.user.id || 'usr_teller',
        requesterName: `${session?.employee?.firstName || 'Ana'} ${session?.employee?.lastName || 'Reyes'}`,
        branchId: params.branchId,
        branchName: branch?.name || 'Branch',
        amount: params.amount,
        status: 'PENDING',
        reason: `Transaction amount ₱${params.amount.toLocaleString()} reaches or exceeds approval threshold (₱${settings.approvalThresholdAmount.toLocaleString()}) or requires FX compliance verification.`,
        createdAt: new Date().toISOString(),
      };
      setItem(STORAGE_KEYS.APPROVALS, [newApproval, ...approvals]);

      // Create notification for Branch Manager
      this.createNotification({
        userId: 'usr_branch',
        title: 'New Transaction Pending Approval',
        message: `${newTxn.transactionNo} for ₱${params.amount.toLocaleString()} requested at ${branch?.name}.`,
        link: '/dashboard/approvals',
      });
    }

    setItem(STORAGE_KEYS.TRANSACTIONS, [newTxn, ...transactions]);

    this.logAudit({
      action: 'CREATE_TRANSACTION',
      module: 'TRANSACTION',
      recordId: newTxn.id,
      newValue: newTxn,
      result: 'SUCCESS',
    });

    this.notify();
    return { transaction: newTxn, requiresApproval };
  }

  // Approvals decision
  public static decideApproval(
    approvalId: string,
    decision: 'APPROVED' | 'REJECTED',
    decisionNote: string
  ): void {
    const session = this.getCurrentSession();
    const approvals = this.getApprovals();
    const transactions = this.getTransactions();

    const approvalIndex = approvals.findIndex(a => a.id === approvalId);
    if (approvalIndex === -1) return;

    const approval = approvals[approvalIndex];
    const updatedApproval: Approval = {
      ...approval,
      status: decision === 'APPROVED' ? 'APPROVED' : 'REJECTED',
      approverId: session?.user.id,
      approverName: `${session?.employee?.firstName || 'Manager'} ${session?.employee?.lastName || ''}`,
      decisionNote,
      decidedAt: new Date().toISOString(),
    };
    approvals[approvalIndex] = updatedApproval;
    setItem(STORAGE_KEYS.APPROVALS, approvals);

    // Update corresponding transaction
    const txnIndex = transactions.findIndex(t => t.id === approval.transactionId);
    if (txnIndex !== -1) {
      const txn = transactions[txnIndex];
      const newStatus: TransactionStatus = decision === 'APPROVED' ? 'COMPLETED' : 'REJECTED';
      const updatedTxn: Transaction = {
        ...txn,
        status: newStatus,
        completedAt: new Date().toISOString(),
        notes: `${txn.notes || ''} [${decision}: ${decisionNote}]`,
      };
      transactions[txnIndex] = updatedTxn;
      setItem(STORAGE_KEYS.TRANSACTIONS, transactions);

      this.logAudit({
        action: decision === 'APPROVED' ? 'APPROVE_TRANSACTION' : 'REJECT_TRANSACTION',
        module: 'APPROVAL',
        recordId: txn.id,
        oldValue: { status: txn.status },
        newValue: { status: newStatus, decisionNote },
        result: 'SUCCESS',
      });
    }

    this.notify();
  }

  // Customer mutations
  public static createCustomer(data: Omit<Customer, 'id' | 'customerNo' | 'createdAt'>): Customer {
    const customers = this.getCustomers();
    const newCustomer: Customer = {
      ...data,
      id: `cus_${Date.now()}`,
      customerNo: `CUS${String(customers.length + 101).padStart(6, '0')}`,
      createdAt: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.CUSTOMERS, [newCustomer, ...customers]);

    this.logAudit({
      action: 'CREATE_CUSTOMER',
      module: 'CUSTOMER',
      recordId: newCustomer.id,
      newValue: newCustomer,
      result: 'SUCCESS',
    });

    this.notify();
    return newCustomer;
  }

  // Employee mutations
  public static createEmployee(data: Omit<Employee, 'id' | 'employeeNo'>): Employee {
    const employees = this.getEmployees();
    const newEmployee: Employee = {
      ...data,
      id: `emp_${Date.now()}`,
      employeeNo: `EMP${String(employees.length + 1).padStart(5, '0')}`,
    };
    setItem(STORAGE_KEYS.EMPLOYEES, [newEmployee, ...employees]);

    this.logAudit({
      action: 'CREATE_EMPLOYEE',
      module: 'EMPLOYEE',
      recordId: newEmployee.id,
      newValue: newEmployee,
      result: 'SUCCESS',
    });

    this.notify();
    return newEmployee;
  }

  public static updateEmployeeStatus(employeeId: string, status: Employee['status']): void {
    const employees = this.getEmployees();
    const idx = employees.findIndex(e => e.id === employeeId);
    if (idx !== -1) {
      const old = employees[idx];
      employees[idx] = { ...old, status };
      setItem(STORAGE_KEYS.EMPLOYEES, employees);

      this.logAudit({
        action: 'UPDATE_EMPLOYEE_STATUS',
        module: 'EMPLOYEE',
        recordId: employeeId,
        oldValue: { status: old.status },
        newValue: { status },
        result: 'SUCCESS',
      });
      this.notify();
    }
  }

  // User mutations
  public static updateUserStatus(userId: string, status: User['status']): void {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      const old = users[idx];
      users[idx] = {
        ...old,
        status,
        failedAttempts: status === 'ACTIVE' ? 0 : old.failedAttempts,
        lockedUntil: status === 'ACTIVE' ? undefined : old.lockedUntil,
      };
      setItem(STORAGE_KEYS.USERS, users);

      this.logAudit({
        action: 'UPDATE_USER_STATUS',
        module: 'USER',
        recordId: userId,
        oldValue: { status: old.status },
        newValue: { status },
        result: 'SUCCESS',
      });
      this.notify();
    }
  }

  public static updateUserRole(userId: string, role: RoleType): void {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      const old = users[idx];
      users[idx] = { ...old, role };
      setItem(STORAGE_KEYS.USERS, users);

      this.logAudit({
        action: 'UPDATE_USER_ROLE',
        module: 'USER',
        recordId: userId,
        oldValue: { role: old.role },
        newValue: { role },
        result: 'SUCCESS',
      });
      this.notify();
    }
  }

  // Branch mutations
  public static createBranch(data: Omit<Branch, 'id'>): Branch {
    const branches = this.getBranches();
    const newBranch: Branch = {
      ...data,
      id: `br_${Date.now()}`,
    };
    setItem(STORAGE_KEYS.BRANCHES, [newBranch, ...branches]);

    this.logAudit({
      action: 'CREATE_BRANCH',
      module: 'BRANCH',
      recordId: newBranch.id,
      newValue: newBranch,
      result: 'SUCCESS',
    });

    this.notify();
    return newBranch;
  }

  // Settings
  public static updateSettings(newSettings: Partial<SystemSettings>): void {
    const old = this.getSettings();
    const merged = { ...old, ...newSettings };
    setItem(STORAGE_KEYS.SETTINGS, merged);

    this.logAudit({
      action: 'UPDATE_SETTINGS',
      module: 'SETTINGS',
      oldValue: old,
      newValue: merged,
      result: 'SUCCESS',
    });

    this.notify();
  }

  // Notifications
  public static createNotification(data: Omit<Notification, 'id' | 'status' | 'createdAt'>): void {
    const notifs = this.getNotifications();
    const newNotif: Notification = {
      ...data,
      id: `notif_${Date.now()}`,
      status: 'UNREAD',
      createdAt: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.NOTIFICATIONS, [newNotif, ...notifs]);
    this.notify();
  }

  public static markNotificationAsRead(id: string): void {
    const notifs = this.getNotifications();
    const idx = notifs.findIndex(n => n.id === id);
    if (idx !== -1) {
      notifs[idx].status = 'READ';
      setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
      this.notify();
    }
  }

  public static markAllNotificationsAsRead(): void {
    const notifs = this.getNotifications().map(n => ({ ...n, status: 'READ' as const }));
    setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
    this.notify();
  }

  public static resetToSeedData(): void {
    localStorage.clear();
    this.notify();
  }
}
