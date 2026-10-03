import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Customer, Branch, TransactionType } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import { AlertCircle, CheckCircle, Calculator } from 'lucide-react';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  branches: Branch[];
  currentBranchId?: string;
  approvalThreshold: number;
  onSubmit: (data: {
    customerId: string;
    branchId: string;
    type: TransactionType;
    amount: number;
    referenceNo?: string;
    notes?: string;
  }) => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  customers,
  branches,
  currentBranchId,
  approvalThreshold,
  onSubmit,
}) => {
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [branchId, setBranchId] = useState(currentBranchId || branches[0]?.id || '');
  const [type, setType] = useState<TransactionType>('REMITTANCE_SEND');
  const [amountStr, setAmountStr] = useState('5000');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const amount = parseFloat(amountStr) || 0;

  // Fee calculation preview
  let fee = 25;
  if (type === 'REMITTANCE_SEND') {
    fee = Math.max(50, Math.round(amount * 0.015));
  } else if (type === 'REMITTANCE_PAYOUT') {
    fee = 0;
  } else if (type === 'FOREIGN_EXCHANGE') {
    fee = 100;
  } else if (type === 'PAWN_LOAN') {
    fee = Math.round(amount * 0.02);
  }
  const total = amount + fee;
  const willRequireApproval = amount >= approvalThreshold || type === 'FOREIGN_EXCHANGE';

  const selectedCustomer = customers.find(c => c.id === customerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError('Please select a valid registered customer.');
      return;
    }
    if (amount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    if (type === 'FOREIGN_EXCHANGE' && !selectedCustomer?.kycVerified) {
      setError('Foreign exchange regulations require verified customer KYC.');
      return;
    }

    setError(null);
    onSubmit({
      customerId,
      branchId,
      type,
      amount,
      referenceNo: referenceNo.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Counter Transaction"
      subtitle="Issue a new retail branch operation under RBAC & KYC policy"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Customer Select */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Customer / Transactor *
          </label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white text-xs"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.customerNo} — {c.lastName}, {c.firstName} ({c.contact}) {c.kycVerified ? '✓ KYC' : '⚠ Unverified'}
              </option>
            ))}
          </select>
          {selectedCustomer && (
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span>ID: {selectedCustomer.idType || 'Govt ID'} ({selectedCustomer.idNumber || 'On file'})</span>
              <span aria-hidden="true">·</span>
              <span className={selectedCustomer.kycVerified ? 'text-emerald-700 font-medium' : 'text-amber-700'}>
                {selectedCustomer.kycVerified ? 'Verified Transactor' : 'Pending Verification'}
              </span>
            </p>
          )}
        </div>

        {/* Operation Branch & Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Processing Branch *
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white text-xs"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} - {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Transaction Service Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white text-xs"
            >
              <option value="REMITTANCE_SEND">Domestic Remittance (Send)</option>
              <option value="REMITTANCE_PAYOUT">Domestic Remittance (Claim)</option>
              <option value="BILLS_PAYMENT">Bills & Utility Payment</option>
              <option value="FOREIGN_EXCHANGE">Foreign Exchange (Forex)</option>
              <option value="PAWN_LOAN">Pawn Loan Collateral</option>
              <option value="INSURANCE_PREMIUM">Microinsurance Policy</option>
              <option value="WALLET_CASHOUT">E-Wallet Cash In / Out</option>
            </select>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Principal Amount (PHP ₱) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-semibold text-slate-400">
              ₱
            </span>
            <input
              type="number"
              min="1"
              step="any"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md font-mono text-sm font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
            />
          </div>
        </div>

        {/* Fee & Calculation Summary Box */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1.5 font-mono text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Principal:</span>
            <span className="tabular-nums">{formatCurrency(amount)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Calculated Service Fee:</span>
            <span className="tabular-nums">{formatCurrency(fee)}</span>
          </div>
          <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
            <span>Total Counter Collection:</span>
            <span className="tabular-nums">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Approval Threshold Notice */}
        {willRequireApproval ? (
          <div className="p-3 bg-amber-50/80 border border-amber-200 text-amber-900 rounded-md flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Supervisory Sign-Off Required:</strong> This transaction amount ({formatCurrency(amount)}) meets or exceeds the single transaction limit of {formatCurrency(approvalThreshold)} or involves Foreign Exchange currency controls. It will be placed into the <strong>Pending Approval</strong> queue for a Branch Manager to authorize before completion.
            </div>
          </div>
        ) : (
          <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 text-emerald-900 rounded-md flex items-center gap-2 text-[11px]">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Standard limit compliant. Transaction will complete immediately upon submission.</span>
          </div>
        )}

        {/* Reference & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              External Reference # (Optional)
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. BILL-99210-A / REF-001"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Teller Notes / Purpose
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Utility bill payment for family"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white text-xs"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {willRequireApproval ? 'Submit for Authorization' : 'Process & Complete'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
