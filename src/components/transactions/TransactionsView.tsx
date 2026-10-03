import React, { useState, useMemo } from 'react';
import { 
  Transaction, 
  Customer, 
  Branch, 
  Employee, 
  CurrentUserSession, 
  TransactionType, 
  TransactionStatus 
} from '../../types';
import { DataTable, Column } from '../common/DataTable';
import { formatCurrency, formatDateTime, formatTransactionType, getTransactionStatusDetails } from '../../lib/formatters';
import { hasPermission } from '../../lib/permissions';
import { PlusCircle, Filter } from 'lucide-react';
import { NewTransactionModal } from './NewTransactionModal';
import { TransactionDetailModal } from './TransactionDetailModal';

interface TransactionsViewProps {
  session: CurrentUserSession;
  transactions: Transaction[];
  customers: Customer[];
  branches: Branch[];
  employees: Employee[];
  approvalThreshold: number;
  onCreateTransaction: (data: {
    customerId: string;
    branchId: string;
    type: TransactionType;
    amount: number;
    referenceNo?: string;
    notes?: string;
  }) => void;
  onApproveTransaction: (txnId: string, note: string) => void;
  onRejectTransaction: (txnId: string, reason: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  session,
  transactions,
  customers,
  branches,
  employees,
  approvalThreshold,
  onCreateTransaction,
  onApproveTransaction,
  onRejectTransaction,
}) => {
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Customer map & branch map for quick resolution
  const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
  const branchMap = useMemo(() => new Map(branches.map(b => [b.id, b])), [branches]);
  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

  // Scoped transaction filter
  const scopedData = useMemo(() => {
    return transactions.filter(t => {
      // Role scope check
      if (session.role === 'BRANCH_MANAGER' || session.role === 'EMPLOYEE') {
        if (t.branchId !== (session.branch?.id || 'br_01')) return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      // Type filter
      if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;
      return true;
    });
  }, [transactions, session, statusFilter, typeFilter]);

  const searchFilter = (item: Transaction, query: string): boolean => {
    const cust = customerMap.get(item.customerId);
    const branch = branchMap.get(item.branchId);
    return (
      item.transactionNo.toLowerCase().includes(query) ||
      (item.referenceNo?.toLowerCase().includes(query) ?? false) ||
      (cust ? `${cust.firstName} ${cust.lastName}`.toLowerCase().includes(query) : false) ||
      (branch ? branch.name.toLowerCase().includes(query) : false)
    );
  };

  const handleExportCsv = () => {
    const headers = ['TransactionNo', 'Type', 'Amount', 'Fee', 'Total', 'Status', 'Date', 'Customer', 'Branch'];
    const rows = scopedData.map(t => {
      const cust = customerMap.get(t.customerId);
      const branch = branchMap.get(t.branchId);
      return [
        t.transactionNo,
        t.type,
        t.amount,
        t.fee,
        t.total,
        t.status,
        t.createdAt,
        cust ? `"${cust.lastName}, ${cust.firstName}"` : '',
        branch ? `"${branch.name}"` : '',
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `zebra_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: Column<Transaction>[] = [
    {
      header: 'Transaction #',
      accessorKey: 'transactionNo',
      cell: (item) => (
        <div>
          <span className="font-mono font-semibold text-slate-900">{item.transactionNo}</span>
          {item.referenceNo && (
            <span className="block text-[10px] text-slate-400 font-mono">Ref: {item.referenceNo}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Service Type',
      cell: (item) => (
        <span className="font-medium text-slate-700">
          {formatTransactionType(item.type)}
        </span>
      ),
    },
    {
      header: 'Transactor',
      cell: (item) => {
        const cust = customerMap.get(item.customerId);
        if (!cust) return <span className="text-slate-400">—</span>;
        return (
          <div>
            <span className="font-medium text-slate-900">{cust.lastName}, {cust.firstName}</span>
            <span className="block text-[10px] text-slate-500 font-mono">{cust.customerNo}</span>
          </div>
        );
      },
    },
    {
      header: 'Branch Node',
      cell: (item) => {
        const branch = branchMap.get(item.branchId);
        return (
          <span className="text-slate-600 truncate max-w-[140px] block" title={branch?.name}>
            {branch ? branch.name : item.branchId}
          </span>
        );
      },
    },
    {
      header: 'Amount (PHP)',
      align: 'right',
      cell: (item) => (
        <span className="font-mono font-bold text-slate-900 tabular-nums">
          {formatCurrency(item.amount)}
        </span>
      ),
    },
    {
      header: 'Fee',
      align: 'right',
      cell: (item) => (
        <span className="font-mono text-slate-500 tabular-nums">
          {formatCurrency(item.fee)}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (item) => {
        const details = getTransactionStatusDetails(item.status);
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium ${details.textColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${details.dotColor}`} />
            <span>{details.label}</span>
          </span>
        );
      },
    },
    {
      header: 'Timestamp',
      cell: (item) => (
        <span className="font-mono text-slate-500 text-[11px] tabular-nums">
          {formatDateTime(item.createdAt)}
        </span>
      ),
    },
    {
      header: 'Action',
      align: 'right',
      cell: (item) => (
        <button
          onClick={() => setSelectedTxn(item)}
          className="px-2.5 py-1 text-slate-700 bg-slate-50 hover:bg-slate-200 hover:text-slate-900 rounded font-medium transition-colors cursor-pointer"
        >
          Details
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Transaction Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational registry of all retail branch counter transactions, clearances, and fees
          </p>
        </div>

        {hasPermission(session.role, 'TRANSACTIONS_CREATE') && (
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Transaction</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={scopedData}
        searchPlaceholder="Filter by txn #, ref, customer..."
        searchFilter={searchFilter}
        onExportCsv={handleExportCsv}
        filterComponent={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending Approval</option>
              <option value="PROCESSING">Processing</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-700"
            >
              <option value="ALL">All Types</option>
              <option value="REMITTANCE_SEND">Remittance (Send)</option>
              <option value="REMITTANCE_PAYOUT">Remittance (Claim)</option>
              <option value="BILLS_PAYMENT">Bills Payment</option>
              <option value="FOREIGN_EXCHANGE">Forex</option>
              <option value="PAWN_LOAN">Pawn Loan</option>
              <option value="WALLET_CASHOUT">E-Wallet</option>
            </select>
          </div>
        }
      />

      <NewTransactionModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        customers={customers}
        branches={branches}
        currentBranchId={session.branch?.id}
        approvalThreshold={approvalThreshold}
        onSubmit={onCreateTransaction}
      />

      <TransactionDetailModal
        isOpen={!!selectedTxn}
        onClose={() => setSelectedTxn(null)}
        transaction={selectedTxn}
        customer={selectedTxn ? customerMap.get(selectedTxn.customerId) : undefined}
        branch={selectedTxn ? branchMap.get(selectedTxn.branchId) : undefined}
        employee={selectedTxn ? employeeMap.get(selectedTxn.employeeId) : undefined}
        session={session}
        onApprove={onApproveTransaction}
        onReject={onRejectTransaction}
      />
    </div>
  );
};
