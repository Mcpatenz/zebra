import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Transaction, Customer, Branch, Employee, CurrentUserSession } from '../../types';
import { formatCurrency, formatDateTime, formatTransactionType, getTransactionStatusDetails } from '../../lib/formatters';
import { hasPermission } from '../../lib/permissions';
import { CheckCircle2, XCircle, ArrowRight, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  customer?: Customer;
  branch?: Branch;
  employee?: Employee;
  session: CurrentUserSession;
  onApprove?: (txnId: string, note: string) => void;
  onReject?: (txnId: string, reason: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
  customer,
  branch,
  employee,
  session,
  onApprove,
  onReject,
}) => {
  const [decisionNote, setDecisionNote] = useState('');
  const [actionType, setActionType] = useState<'idle' | 'approving' | 'rejecting'>('idle');

  if (!transaction) return null;

  const statusDetails = getTransactionStatusDetails(transaction.status);
  const canApprove = hasPermission(session.role, 'TRANSACTIONS_APPROVE') && transaction.status === 'PENDING';

  const handleDecisionSubmit = () => {
    if (actionType === 'approving' && onApprove) {
      onApprove(transaction.id, decisionNote.trim() || 'Verified and approved under branch operational policy.');
    } else if (actionType === 'rejecting' && onReject) {
      onReject(transaction.id, decisionNote.trim() || 'Declined: Incomplete KYC / threshold compliance failure.');
    }
    setActionType('idle');
    setDecisionNote('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Transaction Overview: ${transaction.transactionNo}`}
      subtitle="Complete operational audit trail, counter actor & settlement lifecycle"
      maxWidth="2xl"
    >
      <div className="space-y-5 text-xs">
        {/* Status & Lifecycle Step Bar */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 font-medium">Lifecycle Progression</span>
            <span className={`inline-flex items-center gap-1.5 font-semibold ${statusDetails.textColor}`}>
              <span className={`w-2 h-2 rounded-full ${statusDetails.dotColor}`} />
              <span>{statusDetails.label}</span>
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
            <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded">
              <span className="font-semibold block">1. Created</span>
              <span className="font-mono text-[10px] text-emerald-700">Logged</span>
            </div>
            <div className={`p-2 rounded border ${
              transaction.status !== 'FAILED'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}>
              <span className="font-semibold block">2. KYC Checked</span>
              <span className="font-mono text-[10px] text-emerald-700">Validated</span>
            </div>
            <div className={`p-2 rounded border ${
              transaction.requiresApproval
                ? transaction.status === 'COMPLETED'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : transaction.status === 'REJECTED'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <span className="font-semibold block">3. Supervisor</span>
              <span className="font-mono text-[10px]">
                {transaction.requiresApproval ? (transaction.status === 'PENDING' ? 'Pending' : transaction.status) : 'Exempt'}
              </span>
            </div>
            <div className={`p-2 rounded border ${
              transaction.status === 'COMPLETED'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : transaction.status === 'REJECTED'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}>
              <span className="font-semibold block">4. Settlement</span>
              <span className="font-mono text-[10px]">
                {transaction.status === 'COMPLETED' ? 'Settled' : transaction.status === 'REJECTED' ? 'Rejected' : 'Awaiting'}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-white border border-slate-200 rounded-md">
            <span className="text-slate-500 block text-[11px]">Principal Amount</span>
            <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
              {formatCurrency(transaction.amount)}
            </span>
          </div>
          <div className="p-3 bg-white border border-slate-200 rounded-md">
            <span className="text-slate-500 block text-[11px]">Service Fee Charged</span>
            <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
              {formatCurrency(transaction.fee)}
            </span>
          </div>
          <div className="p-3 bg-slate-900 text-white rounded-md">
            <span className="text-slate-300 block text-[11px]">Total Counter Settlement</span>
            <span className="text-base font-bold font-mono tabular-nums text-emerald-400">
              {formatCurrency(transaction.total)}
            </span>
          </div>
        </div>

        {/* Transactor & Branch Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <UserCheck className="w-4 h-4 text-slate-600" />
              <span>Customer Transactor</span>
            </div>
            {customer ? (
              <div className="space-y-1 text-slate-600">
                <p className="font-medium text-slate-900">{customer.lastName}, {customer.firstName} {customer.middleName || ''}</p>
                <p className="font-mono text-[11px]">No: {customer.customerNo} · Contact: {customer.contact}</p>
                <p className="text-[11px]">ID: {customer.idType} ({customer.idNumber})</p>
                <p className="text-[11px]">
                  KYC Status:{' '}
                  <span className={customer.kycVerified ? 'text-emerald-700 font-semibold' : 'text-amber-700'}>
                    {customer.kycVerified ? 'Verified Transactor' : 'Unverified'}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-slate-400">Customer record not found</p>
            )}
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <span>Branch & Staff Record</span>
            </div>
            <div className="space-y-1 text-slate-600">
              <p className="font-medium text-slate-900">{branch?.name || 'Branch'}</p>
              <p className="font-mono text-[11px]">Branch Code: {branch?.code} · City: {branch?.city || 'Cebu'}</p>
              <p className="text-[11px]">
                Processed by:{' '}
                <span className="font-medium text-slate-800">
                  {employee ? `${employee.firstName} ${employee.lastName} (${employee.employeeNo})` : 'Branch Staff'}
                </span>
              </p>
              <p className="font-mono text-[10px] text-slate-500">
                Logged: {formatDateTime(transaction.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Reference & Operational Notes */}
        <div className="p-3 bg-white border border-slate-200 rounded-md space-y-1.5">
          <div className="flex justify-between text-slate-600">
            <span>External Reference Code:</span>
            <span className="font-mono font-semibold text-slate-900">{transaction.referenceNo || 'None'}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Service Class:</span>
            <span className="font-medium text-slate-900">{formatTransactionType(transaction.type)}</span>
          </div>
          {transaction.notes && (
            <div className="pt-2 border-t border-slate-100 text-slate-700">
              <span className="font-medium text-slate-500 block mb-0.5">Operational Log:</span>
              <p className="bg-slate-50 p-2 rounded text-[11px] font-mono leading-relaxed">{transaction.notes}</p>
            </div>
          )}
        </div>

        {/* Action Panel for Pending Transactions */}
        {canApprove && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Supervisor Authorization Action</span>
            </div>
            <p className="text-[11px] text-slate-600">
              You are signed in with authorization privileges ({session.role}). You may approve or reject this transaction.
            </p>

            {actionType === 'idle' ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActionType('approving')}
                  className="px-3.5 py-1.5 bg-emerald-700 text-white rounded font-medium hover:bg-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Authorize Transaction</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('rejecting')}
                  className="px-3.5 py-1.5 bg-rose-700 text-white rounded font-medium hover:bg-rose-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 pt-2 border-t border-amber-200">
                <label className="block text-slate-800 font-semibold">
                  {actionType === 'approving' ? 'Decision & Authorization Note' : 'Rejection Reason (Audit record)'} *
                </label>
                <textarea
                  rows={2}
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder={
                    actionType === 'approving'
                      ? 'e.g. Identity verified via Philippine Passport. Currency notes checked.'
                      : 'e.g. Incomplete KYC documentation provided.'
                  }
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDecisionSubmit}
                    className={`px-3 py-1.5 text-white rounded font-semibold text-xs transition-colors cursor-pointer ${
                      actionType === 'approving' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-700 hover:bg-rose-800'
                    }`}
                  >
                    Confirm {actionType === 'approving' ? 'Approval' : 'Rejection'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('idle')}
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
