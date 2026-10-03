import React, { useState, useMemo } from 'react';
import { Employee, Branch, CurrentUserSession, EmployeeStatus } from '../../types';
import { DataTable, Column } from '../common/DataTable';
import { formatDate } from '../../lib/formatters';
import { hasPermission } from '../../lib/permissions';
import { PlusCircle, UserCheck, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';

interface EmployeesViewProps {
  session: CurrentUserSession;
  employees: Employee[];
  branches: Branch[];
  onCreateEmployee: (data: Omit<Employee, 'id' | 'employeeNo'>) => void;
  onUpdateStatus: (employeeId: string, status: EmployeeStatus) => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  session,
  employees,
  branches,
  onCreateEmployee,
  onUpdateStatus,
}) => {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL');

  // New employee state
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState('Counter Operations Associate');
  const [department, setDepartment] = useState('Retail Banking & Remittance');
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [dateHired, setDateHired] = useState('2026-01-15');
  const [formError, setFormError] = useState<string | null>(null);

  const branchMap = useMemo(() => new Map(branches.map(b => [b.id, b])), [branches]);

  const scopedEmployees = useMemo(() => {
    return employees.filter(e => {
      if (session.role === 'BRANCH_MANAGER' || session.role === 'EMPLOYEE') {
        if (e.branchId !== (session.branch?.id || 'br_01')) return false;
      }
      if (selectedBranchFilter !== 'ALL' && e.branchId !== selectedBranchFilter) {
        return false;
      }
      return true;
    });
  }, [employees, session, selectedBranchFilter]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setFormError('First and last names are required.');
      return;
    }
    setFormError(null);
    onCreateEmployee({
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim(),
      position: position.trim(),
      department: department.trim(),
      branchId,
      contact: contact.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      dateHired: dateHired || new Date().toISOString().slice(0, 10),
      status: 'ACTIVE',
    });
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setContact('');
    setEmail('');
    setIsNewModalOpen(false);
  };

  const getStatusColor = (status: EmployeeStatus) => {
    switch (status) {
      case 'ACTIVE':
        return { text: 'text-emerald-700', dot: 'bg-emerald-500' };
      case 'ON_LEAVE':
        return { text: 'text-amber-700', dot: 'bg-amber-500' };
      case 'INACTIVE':
      case 'TERMINATED':
        return { text: 'text-rose-700', dot: 'bg-rose-500' };
    }
  };

  const columns: Column<Employee>[] = [
    {
      header: 'Employee #',
      accessorKey: 'employeeNo',
      cell: (item) => (
        <span className="font-mono font-semibold text-slate-900">{item.employeeNo}</span>
      ),
    },
    {
      header: 'Name',
      cell: (item) => (
        <div>
          <span className="font-semibold text-slate-900">{item.lastName}, {item.firstName}</span>
          {item.middleName && <span className="text-slate-400 text-[11px] ml-1">{item.middleName}</span>}
        </div>
      ),
    },
    {
      header: 'Position & Dept',
      cell: (item) => (
        <div>
          <span className="font-medium text-slate-800">{item.position}</span>
          <span className="block text-[11px] text-slate-400">{item.department}</span>
        </div>
      ),
    },
    {
      header: 'Assigned Branch',
      cell: (item) => {
        const branch = branchMap.get(item.branchId);
        return (
          <span className="text-slate-700 font-medium">
            {branch ? branch.name : item.branchId}
          </span>
        );
      },
    },
    {
      header: 'Contact',
      cell: (item) => (
        <div className="font-mono text-[11px] text-slate-600">
          <div>{item.contact || '—'}</div>
          {item.email && <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{item.email}</div>}
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (item) => {
        const sc = getStatusColor(item.status);
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium ${sc.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
            <span>{item.status.replace('_', ' ')}</span>
          </span>
        );
      },
    },
    {
      header: 'Date Hired',
      cell: (item) => (
        <span className="font-mono text-slate-500 text-[11px] tabular-nums">
          {formatDate(item.dateHired)}
        </span>
      ),
    },
    {
      header: 'Status Action',
      align: 'right',
      cell: (item) => {
        if (!hasPermission(session.role, 'EMPLOYEES_EDIT')) return null;
        return (
          <select
            value={item.status}
            onChange={(e) => onUpdateStatus(item.id, e.target.value as EmployeeStatus)}
            className="px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ACTIVE">Set Active</option>
            <option value="ON_LEAVE">Set On Leave</option>
            <option value="INACTIVE">Set Inactive</option>
            <option value="TERMINATED">Set Terminated</option>
          </select>
        );
      },
    },
  ];

  const searchFilter = (item: Employee, query: string): boolean => {
    return (
      item.employeeNo.toLowerCase().includes(query) ||
      item.firstName.toLowerCase().includes(query) ||
      item.lastName.toLowerCase().includes(query) ||
      item.position.toLowerCase().includes(query)
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Employee & Personnel Roster
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational personnel assignments, branch teller rosters, and credentials
          </p>
        </div>

        {hasPermission(session.role, 'EMPLOYEES_CREATE') && (
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Personnel</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={scopedEmployees}
        searchPlaceholder="Search by employee #, name, position..."
        searchFilter={searchFilter}
        filterComponent={
          <select
            value={selectedBranchFilter}
            onChange={(e) => setSelectedBranchFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-700"
          >
            <option value="ALL">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
            ))}
          </select>
        }
      />

      {/* Add Employee Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Add Personnel to Operational Roster"
        subtitle="Provision an enterprise staff record and assign to branch node"
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Gabriel"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Middle Name</label>
              <input
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="e.g. V."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Lim"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Position / Job Title *</label>
              <input
                type="text"
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Branch Teller"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Retail Banking"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Branch *</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-slate-900"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date Hired</label>
              <input
                type="date"
                value={dateHired}
                onChange={(e) => setDateHired(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="+63 917 XXX XXXX"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md font-mono text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corporate Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee@zebra-enterprise.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold cursor-pointer"
            >
              Provision Employee
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
