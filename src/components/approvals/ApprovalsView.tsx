import React, { useState } from 'react';
import { Approval, CurrentUserSession } from '../../types';
import { formatCurrency, formatDateTime, getApprovalStatusDetails } from '../../lib/formatters';
import { hasPermission } from '../../lib/permissions';
import { CheckCircle2, XCircle, Clock, ShieldCheck, FileCheck, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';

interface ApprovalsViewProps {
  session: CurrentUserSession;
  approvals: Approval[];
  onApprove: (approvalId: string, decisionNote: string) => void;
  onReject: (approvalId: string, reason: string) => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  session,
  approvals,
  onApprove,
  onReject,
}) => {
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [decisionMode, setDecisionMode] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [note, setNote] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  const canDecide = hasPermission(session.role, 'TRANSACTIONS_APPROVE');

  // Filter approvals based on tab and organizational scope
  const filteredApprovals = approvals.filter(a => {
    if (activeTab !== a.status) return false;
    if (session.role === 'BRANCH_MANAGER' || session.role === 'EMPLOYEE') {
      return a.branchId === (session.branch?.id || 'br_01');
    }
    return true;
  });

  const pendingCount = approvals.filter(a => a.status === 'PENDING').length;
  const approvedCount = approvals.filter(a => a.status === 'APPROVED').length;
  const rejectedCount = approvals.filter(a => a.status === 'REJECTED').length;

  const handleOpenDecision = (approval: Approval, mode: 'APPROVE' | 'REJECT') => {
    setSelectedApproval(approval);
    setDecisionMode(mode);
    setNote(mode === 'APPROVE' ? 'Identity verified & transaction authenticated under branch limits.' : 'Documentation insufficient or compliance failure.');
  };

  const handleConfirmDecision = () => {
    if (!selectedApproval || !decisionMode) return;
    if (decisionMode === 'APPROVE') {
      onApprove(selectedApproval.id, note.trim());
    } else {
      onReject(selectedApproval.id, note.trim());
    }
    setSelectedApproval(null);
    setDecisionMode(null);
    setNote('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Authorization & Approvals Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervisory clearance workflows for high-value branch operations and forex clearances
          </p>
        </div>

        {/* Tab switcher adhering to functional segmented controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'PENDING'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Pending Review</span>
            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-mono text-[10px]">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'APPROVED'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Cleared History</span>
            <span className="font-mono text-[10px] text-slate-500">({approvedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'REJECTED'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Rejected</span>
            <span className="font-mono text-[10px] text-slate-500">({rejectedCount})</span>
          </button>
        </div>
      </div>

      {/* Approvals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredApprovals.map((item) => {
          const statusInfo = getApprovalStatusDetails(item.status);
          return (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {item.transactionNo}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusInfo.textColor}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                    <span>{statusInfo.label}</span>
                  </span>
                </div>

                <div className="mt-3">
                  <span className="text-[11px] text-slate-400 block">Requested Amount</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-slate-900">
                    {formatCurrency(item.amount)}
                  </span>
                </div>

                <div className="mt-3 p-2.5 bg-slate-50 rounded border border-slate-100 text-slate-600 text-xs leading-relaxed">
                  <p className="font-medium text-slate-800 text-[11px] mb-0.5">Authorization Trigger:</p>
                  <p className="text-[11px] text-slate-600">{item.reason}</p>
                </div>

                <div className="mt-3 space-y-1 text-slate-500 text-[11px]">
                  <p>
                    Branch: <strong className="text-slate-700">{item.branchName}</strong>
                  </p>
                  <p>
                    Originator: <span className="font-mono text-slate-700">{item.requesterName}</span>
                  </p>
                  <p className="font-mono text-[10px] text-slate-400">
                    Logged: {formatDateTime(item.createdAt)}
                  </p>
                  {item.decisionNote && (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-slate-700">
                      <span className="font-semibold text-slate-900 block">Decision Audit Record:</span>
                      <p className="italic text-[11px] text-slate-600">"{item.decisionNote}"</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        By: {item.approverName} · {formatDateTime(item.decidedAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons if Pending */}
              {item.status === 'PENDING' && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  {canDecide ? (
                    <>
                      <button
                        onClick={() => handleOpenDecision(item, 'APPROVE')}
                        className="flex-1 py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Authorize</span>
                      </button>
                      <button
                        onClick={() => handleOpenDecision(item, 'REJECT')}
                        className="py-1.5 px-3 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      View-only. Supervisor authorization required.
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredApprovals.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white border border-slate-200 rounded-lg">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 text-sm">No records in this queue</p>
            <p className="text-slate-400 mt-1">
              All transactions matching "{activeTab}" have been cleared or there are no current requests.
            </p>
          </div>
        )}
      </div>

      {/* Decision Modal */}
      <Modal
        isOpen={!!selectedApproval && !!decisionMode}
        onClose={() => {
          setSelectedApproval(null);
          setDecisionMode(null);
        }}
        title={decisionMode === 'APPROVE' ? 'Confirm Transaction Authorization' : 'Reject Transaction Request'}
        subtitle={`Action for ${selectedApproval?.transactionNo} · ${formatCurrency(selectedApproval?.amount || 0)}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className={`p-3 rounded-md flex items-start gap-2.5 ${
            decisionMode === 'APPROVE' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              {decisionMode === 'APPROVE'
                ? 'Authorizing this transaction will immediately mark it COMPLETED, clear the counter teller to dispense/receive cash, and produce an immutable audit log under your employee ID.'
                : 'Declining this request will cancel counter execution, reject the transaction, and notify the originator.'}
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Compliance Decision Note *
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Provide clear rationale for the compliance ledger..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setSelectedApproval(null);
                setDecisionMode(null);
              }}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDecision}
              className={`px-4 py-2 rounded text-xs font-semibold text-white transition-colors cursor-pointer ${
                decisionMode === 'APPROVE' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-700 hover:bg-rose-800'
              }`}
            >
              Confirm {decisionMode === 'APPROVE' ? 'Approval' : 'Rejection'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
