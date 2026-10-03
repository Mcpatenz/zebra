import React, { useState } from 'react';
import { AuditLog, CurrentUserSession } from '../../types';
import { DataTable, Column } from '../common/DataTable';
import { formatDateTime } from '../../lib/formatters';
import { Modal } from '../common/Modal';
import { FileCode, CheckCircle2, XCircle } from 'lucide-react';

interface AuditLogsViewProps {
  session: CurrentUserSession;
  auditLogs: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ session, auditLogs }) => {
  const [inspectedLog, setInspectedLog] = useState<AuditLog | null>(null);

  const columns: Column<AuditLog>[] = [
    {
      header: 'Timestamp',
      accessorKey: 'createdAt',
      cell: (item) => (
        <span className="font-mono text-slate-700 text-[11px] tabular-nums">
          {formatDateTime(item.createdAt)}
        </span>
      ),
    },
    {
      header: 'Operator / User',
      cell: (item) => (
        <div>
          <span className="font-mono font-semibold text-slate-900">{item.username}</span>
          {item.employeeId && (
            <span className="block text-[10px] text-slate-400 font-mono">ID: {item.employeeId}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Action Mutated',
      accessorKey: 'action',
      cell: (item) => (
        <span className="font-mono text-xs font-semibold text-slate-800">
          {item.action}
        </span>
      ),
    },
    {
      header: 'Module Scope',
      accessorKey: 'module',
      cell: (item) => (
        <span className="text-slate-600 font-medium">
          {item.module}
        </span>
      ),
    },
    {
      header: 'IP Address',
      accessorKey: 'ipAddress',
      cell: (item) => (
        <span className="font-mono text-slate-500 text-[11px] tabular-nums">
          {item.ipAddress}
        </span>
      ),
    },
    {
      header: 'Result',
      cell: (item) => (
        <span className={`inline-flex items-center gap-1 font-medium ${
          item.result === 'SUCCESS' ? 'text-emerald-700' : 'text-rose-700'
        }`}>
          {item.result === 'SUCCESS' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
          )}
          <span>{item.result}</span>
        </span>
      ),
    },
    {
      header: 'State Diff',
      align: 'right',
      cell: (item) => (
        <button
          onClick={() => setInspectedLog(item)}
          className="px-2.5 py-1 text-slate-700 bg-slate-50 hover:bg-slate-200 hover:text-slate-900 rounded font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <FileCode className="w-3 h-3 text-slate-500" />
          <span>Inspect</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Centralized Audit Ledger
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable event stream capturing all administrative, transaction, and policy mutations
        </p>
      </div>

      <DataTable
        columns={columns}
        data={auditLogs}
        searchPlaceholder="Filter by action, user, module..."
        searchFilter={(l, q) =>
          l.action.toLowerCase().includes(q) ||
          l.username.toLowerCase().includes(q) ||
          l.module.toLowerCase().includes(q) ||
          l.ipAddress.includes(q)
        }
      />

      {/* Snapshot Diff Modal */}
      <Modal
        isOpen={!!inspectedLog}
        onClose={() => setInspectedLog(null)}
        title={`Audit Record: ${inspectedLog?.action}`}
        subtitle={`Logged at ${formatDateTime(inspectedLog?.createdAt)} by ${inspectedLog?.username} (${inspectedLog?.ipAddress})`}
        maxWidth="xl"
      >
        {inspectedLog && (
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md grid grid-cols-2 gap-2 text-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px]">Actor Account:</span>
                <span className="font-semibold">{inspectedLog.username}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Target Record ID:</span>
                <span className="font-semibold">{inspectedLog.recordId || 'N/A'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px]">User Agent Client:</span>
                <span className="text-[11px] truncate block">{inspectedLog.userAgent}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="font-semibold text-slate-700 block mb-1 font-sans">Previous State (Before)</span>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-md text-[11px] overflow-x-auto max-h-52">
                  {inspectedLog.oldValue ? JSON.stringify(inspectedLog.oldValue, null, 2) : 'null (Created anew)'}
                </pre>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1 font-sans">Committed State (After)</span>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-md text-[11px] overflow-x-auto max-h-52">
                  {inspectedLog.newValue ? JSON.stringify(inspectedLog.newValue, null, 2) : 'null (Record deleted)'}
                </pre>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end font-sans">
              <button
                onClick={() => setInspectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium text-xs cursor-pointer"
              >
                Close Audit Entry
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
