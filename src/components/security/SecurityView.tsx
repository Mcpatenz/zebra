import React from 'react';
import { LoginLog, CurrentUserSession } from '../../types';
import { DataTable, Column } from '../common/DataTable';
import { formatDateTime } from '../../lib/formatters';
import { ShieldAlert, CheckCircle2, XCircle, Lock, ShieldCheck, Key } from 'lucide-react';

interface SecurityViewProps {
  session: CurrentUserSession;
  loginLogs: LoginLog[];
}

export const SecurityView: React.FC<SecurityViewProps> = ({ session, loginLogs }) => {
  const failedLogins = loginLogs.filter(l => !l.success);

  const columns: Column<LoginLog>[] = [
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
      header: 'Account / Username',
      accessorKey: 'username',
      cell: (item) => (
        <span className="font-mono font-semibold text-slate-900">{item.username}</span>
      ),
    },
    {
      header: 'Authentication Result',
      cell: (item) => (
        <span className={`inline-flex items-center gap-1.5 font-medium ${
          item.success ? 'text-emerald-700' : 'text-rose-700 font-bold'
        }`}>
          {item.success ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
          )}
          <span>{item.success ? 'Authorized Access' : 'Access Denied'}</span>
        </span>
      ),
    },
    {
      header: 'Failure Reason / Diagnostics',
      cell: (item) => (
        <span className="text-slate-600 text-[11px]">
          {item.reason || 'Authentication valid'}
        </span>
      ),
    },
    {
      header: 'Terminal IP Address',
      accessorKey: 'ipAddress',
      cell: (item) => (
        <span className="font-mono text-slate-500 text-[11px] tabular-nums">
          {item.ipAddress}
        </span>
      ),
    },
    {
      header: 'Client Platform',
      accessorKey: 'userAgent',
      cell: (item) => (
        <span className="text-slate-500 text-[11px] truncate max-w-[200px] block">
          {item.userAgent}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Security Operations & Access Monitoring
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time terminal access attempts, brute-force mitigation, and account lockout tracking
        </p>
      </div>

      {/* Security Health Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Brute-Force Lockout Policy</span>
            <Lock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 mt-2">
            5 Attempts Max
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Automatic 6-hour lock on threshold</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Failed Inbound Logins</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold font-mono text-rose-700 mt-2">
            {failedLogins.length} events
          </p>
          <span className="text-[11px] text-rose-600 mt-1 block">1 account currently locked</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Session Protection</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-700 mt-2">
            HTTP-Only Cookie
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">SameSite=Lax + Strict TLS</span>
        </div>
      </div>

      {/* Login Table */}
      <DataTable
        columns={columns}
        data={loginLogs}
        searchPlaceholder="Search authentication logs..."
        searchFilter={(l, q) =>
          l.username.toLowerCase().includes(q) ||
          l.ipAddress.includes(q) ||
          (l.reason?.toLowerCase().includes(q) ?? false)
        }
      />
    </div>
  );
};
