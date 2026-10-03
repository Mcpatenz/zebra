import React from 'react';
import { 
  TrendingUp, 
  Clock, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  PlusCircle, 
  FileCheck2,
  Users
} from 'lucide-react';
import { CurrentUserSession, Transaction, Approval } from '../../types';
import { formatCurrency, formatDateTime, formatTransactionType, getTransactionStatusDetails } from '../../lib/formatters';
import { hasPermission } from '../../lib/permissions';

interface OverviewViewProps {
  session: CurrentUserSession;
  transactions: Transaction[];
  approvals: Approval[];
  onNavigate: (view: string) => void;
  onOpenNewTransaction: () => void;
  onInspectTransaction: (txn: Transaction) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  session,
  transactions,
  approvals,
  onNavigate,
  onOpenNewTransaction,
  onInspectTransaction,
}) => {
  // Compute KPIs scoped to current session if applicable
  const scopedTransactions = session.role === 'SUPER_ADMIN' || session.role === 'ADMIN' || session.role === 'AUDITOR'
    ? transactions
    : session.role === 'REGIONAL_MANAGER'
    ? transactions // in seed, sample spans branches
    : session.role === 'AREA_MANAGER'
    ? transactions.filter(t => t.branchId === 'br_01' || t.branchId === 'br_02' || t.branchId === 'br_03')
    : transactions.filter(t => t.branchId === (session.branch?.id || 'br_01'));

  const pendingApprovals = approvals.filter(a => a.status === 'PENDING');
  
  const todayTotalAmount = scopedTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const completedCount = scopedTransactions.filter(t => t.status === 'COMPLETED').length;
  const completionRate = scopedTransactions.length > 0 
    ? Math.round((completedCount / scopedTransactions.length) * 100) 
    : 100;

  // Chart data simulation (Hours from 08:00 to 17:00)
  const hourlyData = [
    { hour: '08:00', amount: 48500, count: 4 },
    { hour: '09:00', amount: 82000, count: 9 },
    { hour: '10:00', amount: 125400, count: 14 },
    { hour: '11:00', amount: 96000, count: 11 },
    { hour: '12:00', amount: 62000, count: 7 },
    { hour: '13:00', amount: 110500, count: 12 },
    { hour: '14:00', amount: 145000, count: 16 },
    { hour: '15:00', amount: 178000, count: 21 },
    { hour: '16:00', amount: 132000, count: 15 },
  ];

  const maxAmount = Math.max(...hourlyData.map(d => d.amount));

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Operations Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational dashboard for <span className="font-semibold text-slate-700">{session.branch?.name || 'All Regional Branches'}</span>. Real-time transaction reconciliation and status logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission(session.role, 'TRANSACTIONS_CREATE') && (
            <button
              onClick={onOpenNewTransaction}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Transaction</span>
            </button>
          )}

          {hasPermission(session.role, 'TRANSACTIONS_APPROVE') && pendingApprovals.length > 0 && (
            <button
              onClick={() => onNavigate('approvals')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-100 border border-amber-300 rounded-md hover:bg-amber-200 transition-colors cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4 text-amber-700" />
              <span>Review Pending ({pendingApprovals.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Today's Gross Turnover</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
              {formatCurrency(todayTotalAmount)}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
              <span>{scopedTransactions.length} processed operations</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-medium">99.8% SLA</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
              {pendingApprovals.length}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
              <span>Awaiting manager sign-off</span>
              {pendingApprovals.length > 0 && (
                <span className="text-amber-800 font-medium">Over threshold</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Operational Nodes</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
              7 Active
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
              <span>4 Regions</span>
              <span aria-hidden="true">·</span>
              <span>5 Areas</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-medium">All Online</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
              {completionRate}%
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
              <span>{completedCount} successful transactions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Volume Trend (Clean SVG Bar Chart) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                Intraday Turnover Curve (₱)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Hourly settlement volume across branch counter operations
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono tabular-nums">Oct 03, 2026</span>
          </div>

          <div className="h-56 flex items-end gap-2 sm:gap-4 pt-6 pb-2 px-2">
            {hourlyData.map((d, i) => {
              const heightPct = Math.round((d.amount / maxAmount) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20 font-mono tabular-nums shadow-md">
                    {formatCurrency(d.amount)} ({d.count} txns)
                  </div>

                  <div className="w-full bg-slate-100 rounded-t-sm flex items-end overflow-hidden h-44">
                    <div 
                      className="w-full bg-slate-800 group-hover:bg-slate-700 transition-all rounded-t-sm"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                    {d.hour}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Peak Hour: <strong className="text-slate-800">15:00 (₱178,000.00)</strong></span>
            <span>Average Counter Settlement Time: <strong className="text-slate-800">2.4 mins</strong></span>
          </div>
        </div>

        {/* Operational Queues & Compliance Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                Supervisory Alert Queue
              </h2>
              <span className="text-xs text-slate-400 font-mono">Real-time</span>
            </div>

            <div className="space-y-3">
              {pendingApprovals.slice(0, 3).map((app) => (
                <div 
                  key={app.id} 
                  className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-md text-xs hover:bg-amber-50 transition-colors"
                >
                  <div className="flex items-center justify-between font-semibold text-amber-900">
                    <span className="font-mono">{app.transactionNo}</span>
                    <span className="font-mono tabular-nums">{formatCurrency(app.amount)}</span>
                  </div>
                  <p className="text-slate-600 mt-1 line-clamp-2 text-[11px] leading-relaxed">
                    {app.reason}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{app.branchName}</span>
                    <button
                      onClick={() => onNavigate('approvals')}
                      className="text-amber-900 font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      Authorize <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {pendingApprovals.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
                  All high-value transactions cleared.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 text-xs text-slate-500 flex items-center justify-between">
            <span>Threshold limit: <strong>₱10,000.00</strong></span>
            <button 
              onClick={() => onNavigate('settings')}
              className="text-slate-700 hover:text-slate-900 underline text-[11px]"
            >
              Adjust Rules
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table Preview */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center justify-between pb-3 mb-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              Recent Counter Transactions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest financial movements recorded at branch counters
            </p>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-medium text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View Full Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-2.5">Transaction #</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Reference</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scopedTransactions.slice(0, 6).map((txn) => {
                const statusDetails = getTransactionStatusDetails(txn.status);
                return (
                  <tr key={txn.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-2.5 font-mono font-medium text-slate-900">
                      {txn.transactionNo}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">
                      {formatTransactionType(txn.type)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-500">
                      {txn.referenceNo || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                      {formatCurrency(txn.amount)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusDetails.textColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDetails.dotColor}`} />
                        <span>{statusDetails.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 font-mono tabular-nums">
                      {formatDateTime(txn.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => onInspectTransaction(txn)}
                        className="text-slate-600 hover:text-slate-900 font-medium hover:underline cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
