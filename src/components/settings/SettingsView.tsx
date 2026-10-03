import React, { useState } from 'react';
import { SystemSettings, CurrentUserSession } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import { Sliders, Save, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SettingsViewProps {
  session: CurrentUserSession;
  settings: SystemSettings;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  session,
  settings,
  onUpdateSettings,
  onResetData,
}) => {
  const [approvalThreshold, setApprovalThreshold] = useState(settings.approvalThresholdAmount);
  const [dailyLimit, setDailyLimit] = useState(settings.dailyBranchLimit);
  const [timeout, setTimeout] = useState(settings.sessionTimeoutMinutes);
  const [require2FA, setRequire2FA] = useState(settings.requireTwoFactorForManagers);
  const [allowWeekend, setAllowWeekend] = useState(settings.allowWeekendTransactions);
  const [maintenance, setMaintenance] = useState(settings.maintenanceMode);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      approvalThresholdAmount: Number(approvalThreshold),
      dailyBranchLimit: Number(dailyLimit),
      sessionTimeoutMinutes: Number(timeout),
      requireTwoFactorForManagers: require2FA,
      allowWeekendTransactions: allowWeekend,
      maintenanceMode: maintenance,
    });
    setSavedMessage(true);
    window.setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          System Configuration & Operational Parameters
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Establish regulatory limits, approval threshold amounts, and platform session governance
        </p>
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Configuration saved and propagated across active branch nodes.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Transaction Rules */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            1. Branch Transaction & AML Limits
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Single Transaction Approval Threshold (PHP ₱) *
              </label>
              <input
                type="number"
                min="1000"
                step="500"
                value={approvalThreshold}
                onChange={(e) => setApprovalThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Any counter transaction $\ge$ {formatCurrency(approvalThreshold)} requires supervisory authorization.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Daily Branch Settlement Ceiling (PHP ₱) *
              </label>
              <input
                type="number"
                min="50000"
                step="50000"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Maximum aggregate cash handling allowance per physical branch node.
              </p>
            </div>
          </div>
        </div>

        {/* Security & Access Policies */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            2. Security & Session Policies
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Session Idle Inactivity Timeout (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={timeout}
                onChange={(e) => setTimeout(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md font-mono tabular-nums text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Terminates browser session after specified minutes of operator inactivity.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={require2FA}
                  onChange={(e) => setRequire2FA(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-slate-700 font-medium">
                  Enforce Hardware MFA / OTP for Branch Managers
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowWeekend}
                  onChange={(e) => setAllowWeekend(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-slate-700 font-medium">
                  Permit Saturday / Sunday Mall Branch Transactions
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Maintenance & Dangerous Operations */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            3. Platform Governance & Database State
          </h2>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div>
              <span className="font-semibold text-slate-800 block">Maintenance Lockdown Mode</span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Restricts non-administrative teller operations across all retail nodes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMaintenance(!maintenance)}
              className={`px-3 py-1.5 rounded font-semibold text-xs transition-colors cursor-pointer ${
                maintenance
                  ? 'bg-rose-700 text-white hover:bg-rose-800'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {maintenance ? 'Maintenance ACTIVE' : 'Normal Operation'}
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div>
              <span className="font-semibold text-slate-800 block">Reset Demonstration Data</span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Restores original enterprise seed state (all transactions, branches, users, and ledger).
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset all demonstration database records back to default enterprise state?')) {
                  onResetData();
                }
              }}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Seed Data</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Apply Operational Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
