import React, { useState, useMemo } from 'react';
import { Transaction, Branch, Employee, CurrentUserSession } from '../../types';
import { formatCurrency, formatDateTime, formatTransactionType } from '../../lib/formatters';
import { Download, Printer, Calendar, TrendingUp, DollarSign, CheckCircle2, Building2, User } from 'lucide-react';

interface ReportsViewProps {
  session: CurrentUserSession;
  transactions: Transaction[];
  branches: Branch[];
  employees: Employee[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  session,
  transactions,
  branches,
  employees,
}) => {
  const [reportType, setReportType] = useState<'DAILY' | 'BRANCH' | 'EMPLOYEE'>('DAILY');
  const [dateRange, setDateRange] = useState('TODAY');

  const branchMap = useMemo(() => new Map(branches.map(b => [b.id, b])), [branches]);
  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

  // Aggregate metrics
  const totalVolume = transactions.reduce((acc, t) => acc + t.amount, 0);
  const totalFees = transactions.reduce((acc, t) => acc + t.fee, 0);
  const completedCount = transactions.filter(t => t.status === 'COMPLETED').length;
  const pendingCount = transactions.filter(t => t.status === 'PENDING').length;
  const failedCount = transactions.filter(t => t.status === 'REJECTED' || t.status === 'FAILED').length;

  // Branch performance metrics
  const branchPerformance = useMemo(() => {
    return branches.map(b => {
      const bTxns = transactions.filter(t => t.branchId === b.id);
      const bVolume = bTxns.reduce((acc, t) => acc + t.amount, 0);
      const bFees = bTxns.reduce((acc, t) => acc + t.fee, 0);
      const bCompleted = bTxns.filter(t => t.status === 'COMPLETED').length;
      return {
        branch: b,
        count: bTxns.length,
        volume: bVolume,
        fees: bFees,
        completedRate: bTxns.length > 0 ? Math.round((bCompleted / bTxns.length) * 100) : 100,
      };
    }).sort((a, b) => b.volume - a.volume);
  }, [branches, transactions]);

  // Employee productivity metrics
  const employeeProductivity = useMemo(() => {
    return employees.map(emp => {
      const eTxns = transactions.filter(t => t.employeeId === emp.id);
      const eVolume = eTxns.reduce((acc, t) => acc + t.amount, 0);
      return {
        employee: emp,
        branch: branchMap.get(emp.branchId),
        count: eTxns.length,
        volume: eVolume,
      };
    }).sort((a, b) => b.count - a.count);
  }, [employees, transactions, branchMap]);

  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (reportType === 'DAILY') {
      headers = ['Metric', 'Value'];
      rows = [
        ['Report Date', '2026-10-03'],
        ['Total Transactions', String(transactions.length)],
        ['Completed Transactions', String(completedCount)],
        ['Pending Approvals', String(pendingCount)],
        ['Failed / Rejected', String(failedCount)],
        ['Total Gross Turnover', String(totalVolume)],
        ['Total Service Fees Earned', String(totalFees)],
      ];
    } else if (reportType === 'BRANCH') {
      headers = ['BranchCode', 'BranchName', 'City', 'TransactionCount', 'GrossTurnover', 'FeeIncome', 'SuccessRate'];
      rows = branchPerformance.map(bp => [
        bp.branch.code,
        `"${bp.branch.name}"`,
        bp.branch.city || '',
        String(bp.count),
        String(bp.volume),
        String(bp.fees),
        `${bp.completedRate}%`,
      ]);
    } else {
      headers = ['EmployeeNo', 'EmployeeName', 'Position', 'Branch', 'TransactionsProcessed', 'VolumeTurnover'];
      rows = employeeProductivity.map(ep => [
        ep.employee.employeeNo,
        `"${ep.employee.lastName}, ${ep.employee.firstName}"`,
        `"${ep.employee.position}"`,
        ep.branch?.name || '',
        String(ep.count),
        String(ep.volume),
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `zebra_${reportType.toLowerCase()}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Operations Analytics & Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Executive turnover ledgers, branch productivity leaderboards, and teller reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Control bar: Report selector & date range */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-lg">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
          <button
            onClick={() => setReportType('DAILY')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
              reportType === 'DAILY' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Operations
          </button>
          <button
            onClick={() => setReportType('BRANCH')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
              reportType === 'BRANCH' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Branch Performance
          </button>
          <button
            onClick={() => setReportType('EMPLOYEE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
              reportType === 'EMPLOYEE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Teller Productivity
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Period:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded text-slate-800 font-medium"
          >
            <option value="TODAY">Current Day (Oct 03, 2026)</option>
            <option value="WEEK">Last 7 Operating Days</option>
            <option value="MONTH">Month to Date (MTD)</option>
          </select>
        </div>
      </div>

      {/* Report 1: Daily Operations Summary */}
      {reportType === 'DAILY' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <span className="text-slate-400 text-xs">Total Counter Volume</span>
              <p className="text-xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
                {formatCurrency(totalVolume)}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">Across all branch units</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <span className="text-slate-400 text-xs">Total Fee Revenue</span>
              <p className="text-xl font-bold font-mono text-emerald-700 mt-2 tabular-nums">
                {formatCurrency(totalFees)}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">Net fee earnings collected</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <span className="text-slate-400 text-xs">Total Transactions</span>
              <p className="text-xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
                {transactions.length}
              </p>
              <span className="text-[11px] text-emerald-700 font-medium mt-1 block">{completedCount} Completed</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <span className="text-slate-400 text-xs">Exceptions & Rejections</span>
              <p className="text-xl font-bold font-mono text-rose-700 mt-2 tabular-nums">
                {failedCount}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">0.8% failure/rejection rate</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Service Line Breakdown</h2>
            <div className="divide-y divide-slate-100 text-xs">
              {['REMITTANCE_SEND', 'REMITTANCE_PAYOUT', 'FOREIGN_EXCHANGE', 'PAWN_LOAN', 'BILLS_PAYMENT'].map((typeKey) => {
                const subTxns = transactions.filter(t => t.type === typeKey);
                const subTotal = subTxns.reduce((acc, t) => acc + t.amount, 0);
                const subFee = subTxns.reduce((acc, t) => acc + t.fee, 0);
                return (
                  <div key={typeKey} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">{formatTransactionType(typeKey as any)}</span>
                      <span className="block text-[11px] text-slate-400">{subTxns.length} operations</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 tabular-nums">{formatCurrency(subTotal)}</span>
                      <span className="block font-mono text-[10px] text-slate-400">Fees: {formatCurrency(subFee)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Report 2: Branch Performance */}
      {reportType === 'BRANCH' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-white">
            <h2 className="text-sm font-semibold text-slate-900">Branch Network Turnover Ranking</h2>
            <p className="text-xs text-slate-500 mt-0.5">Ranked by gross settlement amount</p>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase text-[11px]">
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">City / Province</th>
                <th className="px-4 py-3 text-right">Transactions</th>
                <th className="px-4 py-3 text-right">Gross Turnover</th>
                <th className="px-4 py-3 text-right">Fee Income</th>
                <th className="px-4 py-3 text-right">Clearance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {branchPerformance.map((bp, idx) => (
                <tr key={bp.branch.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-slate-400">
                    #{idx + 1}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <div>{bp.branch.name}</div>
                    <span className="font-mono text-[10px] text-slate-400">{bp.branch.code}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {bp.branch.city}, {bp.branch.province}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-800">
                    {bp.count}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {formatCurrency(bp.volume)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-700 font-semibold tabular-nums">
                    {formatCurrency(bp.fees)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {bp.completedRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report 3: Teller Productivity */}
      {reportType === 'EMPLOYEE' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-white">
            <h2 className="text-sm font-semibold text-slate-900">Counter Teller Operational Throughput</h2>
            <p className="text-xs text-slate-500 mt-0.5">Staff performance and total processed counter volume</p>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase text-[11px]">
                <th className="px-4 py-3">Employee #</th>
                <th className="px-4 py-3">Staff Name</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Assigned Branch</th>
                <th className="px-4 py-3 text-right">Transactions</th>
                <th className="px-4 py-3 text-right">Processed Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employeeProductivity.map((ep) => (
                <tr key={ep.employee.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                    {ep.employee.employeeNo}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {ep.employee.lastName}, {ep.employee.firstName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {ep.employee.position}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {ep.branch?.name || 'Assigned Branch'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {ep.count}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {formatCurrency(ep.volume)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
