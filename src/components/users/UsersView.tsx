import React, { useState } from 'react';
import { User, Employee, CurrentUserSession, RoleType, UserStatus } from '../../types';
import { DataTable, Column } from '../common/DataTable';
import { formatDateTime, getUserStatusDetails } from '../../lib/formatters';
import { hasPermission, ROLE_PERMISSIONS } from '../../lib/permissions';
import { Shield, KeyRound, Check, X, Lock, Unlock, Eye } from 'lucide-react';
import { Modal } from '../common/Modal';

interface UsersViewProps {
  session: CurrentUserSession;
  users: User[];
  employees: Employee[];
  onUpdateStatus: (userId: string, status: UserStatus) => void;
  onUpdateRole: (userId: string, role: RoleType) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  session,
  users,
  employees,
  onUpdateStatus,
  onUpdateRole,
}) => {
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const employeeMap = new Map(employees.map(e => [e.id, e]));

  const ALL_ROLES: RoleType[] = [
    'SUPER_ADMIN',
    'ADMIN',
    'REGIONAL_MANAGER',
    'AREA_MANAGER',
    'BRANCH_MANAGER',
    'EMPLOYEE',
    'AUDITOR',
  ];

  const PERMISSION_ROWS = [
    { code: 'DASHBOARD_VIEW', label: 'Dashboard & Metrics' },
    { code: 'USERS_VIEW', label: 'View User Accounts' },
    { code: 'USERS_CREATE', label: 'Create User Accounts' },
    { code: 'USERS_EDIT', label: 'Modify / Lock User Accounts' },
    { code: 'ROLES_MANAGE', label: 'Role & Policy Governance' },
    { code: 'EMPLOYEES_VIEW', label: 'View Personnel Roster' },
    { code: 'EMPLOYEES_CREATE', label: 'Provision Personnel' },
    { code: 'EMPLOYEES_EDIT', label: 'Modify Personnel Status' },
    { code: 'REGIONS_MANAGE', label: 'Region Administration' },
    { code: 'AREAS_MANAGE', label: 'Area Governance' },
    { code: 'BRANCHES_MANAGE', label: 'Branch Network Governance' },
    { code: 'CUSTOMERS_VIEW', label: 'Customer Directory & KYC' },
    { code: 'CUSTOMERS_CREATE', label: 'Enroll Transactors' },
    { code: 'CUSTOMERS_EDIT', label: 'Edit Customer KYC' },
    { code: 'TRANSACTIONS_VIEW', label: 'Transaction Ledger Access' },
    { code: 'TRANSACTIONS_CREATE', label: 'Counter Transaction Execution' },
    { code: 'TRANSACTIONS_APPROVE', label: 'Authorize / Clear Transactions' },
    { code: 'TRANSACTIONS_CANCEL', label: 'Cancel / Reverse Transactions' },
    { code: 'REPORTS_VIEW', label: 'View Operations Reports' },
    { code: 'REPORTS_EXPORT', label: 'Export Data (CSV/PDF)' },
    { code: 'AUDIT_VIEW', label: 'Inspect Audit Logs' },
    { code: 'SETTINGS_MANAGE', label: 'System Configuration' },
  ];

  const columns: Column<User>[] = [
    {
      header: 'Username / Account',
      accessorKey: 'username',
      cell: (item) => (
        <span className="font-mono font-semibold text-slate-900">{item.username}</span>
      ),
    },
    {
      header: 'Linked Employee',
      cell: (item) => {
        const emp = item.employeeId ? employeeMap.get(item.employeeId) : undefined;
        if (!emp) return <span className="text-slate-400 font-mono text-[11px]">System Account</span>;
        return (
          <div>
            <span className="font-semibold text-slate-800">{emp.lastName}, {emp.firstName}</span>
            <span className="block text-[10px] text-slate-400 font-mono">{emp.employeeNo} · {emp.position}</span>
          </div>
        );
      },
    },
    {
      header: 'Assigned Role',
      cell: (item) => (
        <span className="font-mono text-xs font-semibold text-slate-800">
          {item.role.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Account Status',
      cell: (item) => {
        const details = getUserStatusDetails(item.status);
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium ${details.textColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${details.dotColor}`} />
            <span>{details.label}</span>
          </span>
        );
      },
    },
    {
      header: 'Failed Logins',
      align: 'right',
      cell: (item) => (
        <span className={`font-mono tabular-nums ${item.failedAttempts > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
          {item.failedAttempts} / 5
        </span>
      ),
    },
    {
      header: 'Last Authentication',
      cell: (item) => (
        <span className="font-mono text-slate-500 text-[11px] tabular-nums">
          {formatDateTime(item.lastLoginAt)}
        </span>
      ),
    },
    {
      header: 'Security Action',
      align: 'right',
      cell: (item) => {
        if (!hasPermission(session.role, 'USERS_EDIT')) return null;
        return (
          <div className="flex items-center justify-end gap-1.5">
            {item.status === 'LOCKED' ? (
              <button
                onClick={() => onUpdateStatus(item.id, 'ACTIVE')}
                className="px-2 py-1 text-[11px] bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Clear lockout and reset attempts"
              >
                <Unlock className="w-3 h-3 text-emerald-600" />
                <span>Unlock</span>
              </button>
            ) : item.status === 'ACTIVE' ? (
              <button
                onClick={() => onUpdateStatus(item.id, 'DISABLED')}
                className="px-2 py-1 text-[11px] bg-slate-50 text-slate-700 hover:bg-slate-200 rounded font-medium transition-colors cursor-pointer"
              >
                Disable
              </button>
            ) : (
              <button
                onClick={() => onUpdateStatus(item.id, 'ACTIVE')}
                className="px-2 py-1 text-[11px] bg-slate-50 text-slate-700 hover:bg-slate-200 rounded font-medium transition-colors cursor-pointer"
              >
                Activate
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            User Accounts & RBAC Governance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage enterprise operators, account lockouts, and inspect granular role permission policies
          </p>
        </div>

        <button
          onClick={() => setIsMatrixModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Shield className="w-4 h-4 text-slate-600" />
          <span>View RBAC Matrix</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Search by username, employee..."
        searchFilter={(u, q) => {
          const emp = u.employeeId ? employeeMap.get(u.employeeId) : undefined;
          return (
            u.username.toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q) ||
            (emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) : false)
          );
        }}
      />

      {/* RBAC Matrix Inspection Modal */}
      <Modal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        title="Enterprise RBAC Permission Matrix"
        subtitle="Server-enforced access boundary definition by organizational role"
        maxWidth="3xl"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-600 leading-relaxed text-[11px]">
            Every route and transaction mutation enforces both the <strong>Permission Code</strong> and the user's <strong>Organizational Scope Boundary</strong> (Region → Area → Branch).
          </div>

          <div className="overflow-x-auto max-h-[60vh] border border-slate-200 rounded-md">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100 z-10">
                <tr className="border-b border-slate-200 text-slate-700 font-semibold text-[11px]">
                  <th className="px-3 py-2.5">Permission Capability</th>
                  {ALL_ROLES.map(role => (
                    <th key={role} className="px-2 py-2.5 text-center font-mono text-[10px] uppercase">
                      {role.replace('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PERMISSION_ROWS.map(perm => (
                  <tr key={perm.code} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800">
                      <div>{perm.label}</div>
                      <span className="font-mono text-[10px] text-slate-400">{perm.code}</span>
                    </td>
                    {ALL_ROLES.map(role => {
                      const allowed = ROLE_PERMISSIONS[role].includes(perm.code as any);
                      return (
                        <td key={role} className="px-2 py-2 text-center">
                          {allowed ? (
                            <span className="inline-block p-1 text-emerald-700 bg-emerald-50 rounded">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-block p-1 text-slate-300">
                              <X className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-end">
            <button
              onClick={() => setIsMatrixModalOpen(false)}
              className="px-4 py-2 bg-slate-900 text-white rounded font-medium text-xs cursor-pointer"
            >
              Close Matrix
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
