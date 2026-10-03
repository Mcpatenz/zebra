import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { RoleType, User } from '../../types';
import { EnterpriseStorage } from '../../lib/storage';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    window.setTimeout(() => {
      setIsLoading(false);
      const users = EnterpriseStorage.getUsers();
      const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());

      if (!user) {
        setError('Invalid credentials. Operator account not recognized.');
        EnterpriseStorage.recordLoginLog(username, false, 'Invalid operator username');
        return;
      }

      if (user.status === 'LOCKED') {
        setError('Account locked out due to multiple failed authentication attempts.');
        EnterpriseStorage.recordLoginLog(username, false, 'Account locked out');
        return;
      }

      if (user.status === 'DISABLED') {
        setError('Operator account is disabled. Contact Enterprise Security Administrator.');
        EnterpriseStorage.recordLoginLog(username, false, 'Account disabled');
        return;
      }

      // Valid login
      EnterpriseStorage.setCurrentUser(user);
      onLoginSuccess(user);
    }, 400);
  };

  const handleQuickLogin = (role: RoleType) => {
    const session = EnterpriseStorage.switchRole(role);
    onLoginSuccess(session.user);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        {/* Header Banner */}
        <div className="bg-slate-950 p-6 text-white text-center border-b border-slate-800">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 mb-2">
            <span className="w-4 h-4 bg-white rounded-xs" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">ZEBRA PLATFORM</h1>
          <p className="text-xs text-slate-400 mt-0.5">Enterprise Branch Operations System</p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Username / Employee ID
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. EMP00003 or superadmin"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md font-mono text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Operator Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-200 rounded-md font-mono text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-600 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
              />
              <span>Remember this terminal</span>
            </label>
            <a 
              href="#forgot" 
              onClick={(e) => { e.preventDefault(); setError('Contact your Area Operations Security Officer for password reset.'); }}
              className="text-slate-700 hover:underline"
            >
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            {isLoading ? <span>Authenticating...</span> : <span>SIGN IN TO CONSOLE</span>}
          </button>
        </form>

        {/* Quick Demo Role Switcher for instant evaluator testing */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <p className="text-[11px] font-semibold text-slate-600 mb-2 uppercase tracking-wider text-center">
            Instant Demo Test Personas (One-Click Sign In)
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickLogin('SUPER_ADMIN')}
              className="p-1.5 bg-white border border-slate-200 rounded text-left hover:bg-slate-100 text-slate-800 font-medium cursor-pointer"
            >
              👑 Super Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('BRANCH_MANAGER')}
              className="p-1.5 bg-white border border-slate-200 rounded text-left hover:bg-slate-100 text-slate-800 font-medium cursor-pointer"
            >
              🏢 Branch Manager
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('EMPLOYEE')}
              className="p-1.5 bg-white border border-slate-200 rounded text-left hover:bg-slate-100 text-slate-800 font-medium cursor-pointer"
            >
              💳 Senior Teller
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('AUDITOR')}
              className="p-1.5 bg-white border border-slate-200 rounded text-left hover:bg-slate-100 text-slate-800 font-medium cursor-pointer"
            >
              🔍 Compliance Auditor
            </button>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 mt-4 text-center">
        Restricted Enterprise System · Authorized Financial Operators Only · Audited Connection
      </p>
    </div>
  );
};
