import React, { useState, useEffect } from 'react';
import { EnterpriseStorage } from './lib/storage';
import { 
  CurrentUserSession, 
  Transaction, 
  Approval, 
  Customer, 
  Branch, 
  Employee, 
  User, 
  AuditLog, 
  LoginLog, 
  SystemSettings,
  TransactionType,
  EmployeeStatus,
  UserStatus,
  RoleType
} from './types';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { OverviewView } from './components/dashboard/OverviewView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { ApprovalsView } from './components/approvals/ApprovalsView';
import { CustomersView } from './components/customers/CustomersView';
import { EmployeesView } from './components/employees/EmployeesView';
import { OrganizationView } from './components/organization/OrganizationView';
import { UsersView } from './components/users/UsersView';
import { ReportsView } from './components/reports/ReportsView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { SecurityView } from './components/security/SecurityView';
import { SettingsView } from './components/settings/SettingsView';
import { LoginScreen } from './components/auth/LoginScreen';
import { NewTransactionModal } from './components/transactions/NewTransactionModal';
import { TransactionDetailModal } from './components/transactions/TransactionDetailModal';

export default function App() {
  const [session, setSession] = useState<CurrentUserSession | null>(() => EnterpriseStorage.getCurrentSession());
  const [activeView, setActiveView] = useState<string>('overview');

  // Core Data States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [regions, setRegions] = useState(EnterpriseStorage.getRegions());
  const [areas, setAreas] = useState(EnterpriseStorage.getAreas());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(EnterpriseStorage.getSettings());

  // Global modals
  const [isNewTxnModalOpen, setIsNewTxnModalOpen] = useState(false);
  const [inspectedTxn, setInspectedTxn] = useState<Transaction | null>(null);

  // Synchronize state with reactive storage
  const syncData = () => {
    setSession(EnterpriseStorage.getCurrentSession());
    setTransactions(EnterpriseStorage.getTransactions());
    setApprovals(EnterpriseStorage.getApprovals());
    setCustomers(EnterpriseStorage.getCustomers());
    setBranches(EnterpriseStorage.getBranches());
    setEmployees(EnterpriseStorage.getEmployees());
    setUsers(EnterpriseStorage.getUsers());
    setRegions(EnterpriseStorage.getRegions());
    setAreas(EnterpriseStorage.getAreas());
    setAuditLogs(EnterpriseStorage.getAuditLogs());
    setLoginLogs(EnterpriseStorage.getLoginLogs());
    setSettings(EnterpriseStorage.getSettings());
  };

  useEffect(() => {
    syncData();
    const unsubscribe = EnterpriseStorage.subscribe(() => {
      syncData();
    });
    return unsubscribe;
  }, []);

  if (!session) {
    return <LoginScreen onLoginSuccess={() => syncData()} />;
  }

  const pendingApprovalsCount = approvals.filter(a => {
    if (a.status !== 'PENDING') return false;
    if (session.role === 'BRANCH_MANAGER' || session.role === 'EMPLOYEE') {
      return a.branchId === (session.branch?.id || 'br_01');
    }
    return true;
  }).length;

  // Handlers for mutations
  const handleCreateTransaction = (data: {
    customerId: string;
    branchId: string;
    type: TransactionType;
    amount: number;
    referenceNo?: string;
    notes?: string;
  }) => {
    EnterpriseStorage.createTransaction(data);
  };

  const handleApproveTransaction = (txnId: string, note: string) => {
    const approval = approvals.find(a => a.transactionId === txnId && a.status === 'PENDING');
    if (approval) {
      EnterpriseStorage.decideApproval(approval.id, 'APPROVED', note);
    }
  };

  const handleRejectTransaction = (txnId: string, reason: string) => {
    const approval = approvals.find(a => a.transactionId === txnId && a.status === 'PENDING');
    if (approval) {
      EnterpriseStorage.decideApproval(approval.id, 'REJECTED', reason);
    }
  };

  const handleCreateCustomer = (data: Omit<Customer, 'id' | 'customerNo' | 'createdAt'>) => {
    EnterpriseStorage.createCustomer(data);
  };

  const handleCreateEmployee = (data: Omit<Employee, 'id' | 'employeeNo'>) => {
    EnterpriseStorage.createEmployee(data);
  };

  const handleUpdateEmployeeStatus = (employeeId: string, status: EmployeeStatus) => {
    EnterpriseStorage.updateEmployeeStatus(employeeId, status);
  };

  const handleUpdateUserStatus = (userId: string, status: UserStatus) => {
    EnterpriseStorage.updateUserStatus(userId, status);
  };

  const handleUpdateUserRole = (userId: string, role: RoleType) => {
    EnterpriseStorage.updateUserRole(userId, role);
  };

  const handleCreateBranch = (data: Omit<Branch, 'id'>) => {
    EnterpriseStorage.createBranch(data);
  };

  const handleUpdateSettings = (newSettings: Partial<SystemSettings>) => {
    EnterpriseStorage.updateSettings(newSettings);
  };

  const handleResetData = () => {
    EnterpriseStorage.resetToSeedData();
    syncData();
  };

  const customerMap = new Map(customers.map(c => [c.id, c]));
  const branchMap = new Map(branches.map(b => [b.id, b]));
  const employeeMap = new Map(employees.map(e => [e.id, e]));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Header
        session={session}
        activeView={activeView}
        onNavigate={setActiveView}
        onLogout={() => EnterpriseStorage.logout()}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          session={session}
          activeView={activeView}
          onNavigate={setActiveView}
          pendingApprovalsCount={pendingApprovalsCount}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeView === 'overview' && (
              <OverviewView
                session={session}
                transactions={transactions}
                approvals={approvals}
                onNavigate={setActiveView}
                onOpenNewTransaction={() => setIsNewTxnModalOpen(true)}
                onInspectTransaction={setInspectedTxn}
              />
            )}

            {activeView === 'transactions' && (
              <TransactionsView
                session={session}
                transactions={transactions}
                customers={customers}
                branches={branches}
                employees={employees}
                approvalThreshold={settings.approvalThresholdAmount}
                onCreateTransaction={handleCreateTransaction}
                onApproveTransaction={handleApproveTransaction}
                onRejectTransaction={handleRejectTransaction}
              />
            )}

            {activeView === 'approvals' && (
              <ApprovalsView
                session={session}
                approvals={approvals}
                onApprove={(appId, note) => EnterpriseStorage.decideApproval(appId, 'APPROVED', note)}
                onReject={(appId, reason) => EnterpriseStorage.decideApproval(appId, 'REJECTED', reason)}
              />
            )}

            {activeView === 'customers' && (
              <CustomersView
                session={session}
                customers={customers}
                transactions={transactions}
                onCreateCustomer={handleCreateCustomer}
              />
            )}

            {activeView === 'employees' && (
              <EmployeesView
                session={session}
                employees={employees}
                branches={branches}
                onCreateEmployee={handleCreateEmployee}
                onUpdateStatus={handleUpdateEmployeeStatus}
              />
            )}

            {activeView === 'organization' && (
              <OrganizationView
                session={session}
                regions={regions}
                areas={areas}
                branches={branches}
                onCreateBranch={handleCreateBranch}
              />
            )}

            {activeView === 'users' && (
              <UsersView
                session={session}
                users={users}
                employees={employees}
                onUpdateStatus={handleUpdateUserStatus}
                onUpdateRole={handleUpdateUserRole}
              />
            )}

            {activeView === 'reports' && (
              <ReportsView
                session={session}
                transactions={transactions}
                branches={branches}
                employees={employees}
              />
            )}

            {activeView === 'audit-logs' && (
              <AuditLogsView
                session={session}
                auditLogs={auditLogs}
              />
            )}

            {activeView === 'security' && (
              <SecurityView
                session={session}
                loginLogs={loginLogs}
              />
            )}

            {activeView === 'settings' && (
              <SettingsView
                session={session}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onResetData={handleResetData}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global New Transaction Modal */}
      <NewTransactionModal
        isOpen={isNewTxnModalOpen}
        onClose={() => setIsNewTxnModalOpen(false)}
        customers={customers}
        branches={branches}
        currentBranchId={session.branch?.id}
        approvalThreshold={settings.approvalThresholdAmount}
        onSubmit={handleCreateTransaction}
      />

      {/* Global Inspect Transaction Modal */}
      <TransactionDetailModal
        isOpen={!!inspectedTxn}
        onClose={() => setInspectedTxn(null)}
        transaction={inspectedTxn}
        customer={inspectedTxn ? customerMap.get(inspectedTxn.customerId) : undefined}
        branch={inspectedTxn ? branchMap.get(inspectedTxn.branchId) : undefined}
        employee={inspectedTxn ? employeeMap.get(inspectedTxn.employeeId) : undefined}
        session={session}
        onApprove={handleApproveTransaction}
        onReject={handleRejectTransaction}
      />
    </div>
  );
}
