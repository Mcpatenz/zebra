import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  LogOut, 
  UserCheck, 
  CheckCircle2, 
  ChevronDown, 
  ShieldCheck, 
  Building2, 
  Compass, 
  MapPin, 
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { CurrentUserSession, RoleType, Notification } from '../../types';
import { EnterpriseStorage } from '../../lib/storage';
import { formatDateTime } from '../../lib/formatters';

interface HeaderProps {
  session: CurrentUserSession;
  activeView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

const ROLE_OPTIONS: { role: RoleType; label: string; desc: string; icon: any }[] = [
  { role: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Full System & Policy Access', icon: ShieldCheck },
  { role: 'ADMIN', label: 'Systems Administrator', desc: 'IT Infrastructure & Users', icon: ShieldCheck },
  { role: 'REGIONAL_MANAGER', label: 'Regional Director', desc: 'Central Visayas (Region VII)', icon: Compass },
  { role: 'AREA_MANAGER', label: 'Area Operations Mgr', desc: 'Cebu Metro Area (5 branches)', icon: MapPin },
  { role: 'BRANCH_MANAGER', label: 'Branch Manager', desc: 'Cebu Main Operations Hub', icon: Building2 },
  { role: 'EMPLOYEE', label: 'Senior Teller / Counter', desc: 'Cebu Main Hub (Transactions)', icon: Briefcase },
  { role: 'AUDITOR', label: 'Compliance Auditor', desc: 'Internal Audit & Risk View', icon: CheckCircle2 },
];

export const Header: React.FC<HeaderProps> = ({ session, activeView, onNavigate, onLogout }) => {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotifications(EnterpriseStorage.getNotifications());
    const unsub = EnterpriseStorage.subscribe(() => {
      setNotifications(EnterpriseStorage.getNotifications());
    });
    return unsub;
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setRoleMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => n.status === 'UNREAD').length;

  const handleRoleChange = (role: RoleType) => {
    EnterpriseStorage.switchRole(role);
    setRoleMenuOpen(false);
  };

  const handleNotificationClick = (notif: Notification) => {
    EnterpriseStorage.markNotificationAsRead(notif.id);
    if (notif.link) {
      const targetView = notif.link.replace('/dashboard/', '');
      onNavigate(targetView);
    }
    setNotifMenuOpen(false);
  };

  const handleMarkAllRead = () => {
    EnterpriseStorage.markAllNotificationsAsRead();
  };

  const currentRoleInfo = ROLE_OPTIONS.find(r => r.role === session.role) || ROLE_OPTIONS[0];

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Zone 1: Single text element wordmark with active breadcrumb */}
      <div className="flex items-center gap-3">
        <a 
          href="#dashboard" 
          onClick={(e) => { e.preventDefault(); onNavigate('overview'); }}
          className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2 hover:opacity-90"
        >
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-900" />
          <span>ZEBRA ENTERPRISE</span>
        </a>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
          <span>/</span>
          <span className="font-medium text-slate-700 capitalize">{activeView.replace('-', ' ')}</span>
        </div>
      </div>

      {/* Zone 2: Scope Context Indicator */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-slate-600 bg-slate-100/70 py-1 px-3 rounded border border-slate-200/80">
        <span className="text-slate-400">Active Boundary:</span>
        <span className="font-semibold text-slate-800">
          {session.role === 'SUPER_ADMIN' || session.role === 'ADMIN' || session.role === 'AUDITOR' 
            ? 'Enterprise-Wide (All Units)'
            : session.role === 'REGIONAL_MANAGER'
            ? 'Central Visayas (Region VII)'
            : session.role === 'AREA_MANAGER'
            ? 'Cebu Metro Area'
            : session.branch?.name || 'Assigned Branch'}
        </span>
      </div>

      {/* Zone 3: Interactive Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Persona Switcher */}
        <div className="relative" ref={roleMenuRef}>
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Switch RBAC Persona to test different roles and scopes"
          >
            <UserCheck className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline font-semibold">{currentRoleInfo.label}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-lg shadow-xl py-1.5 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                <p className="font-semibold text-slate-800">Select Test Persona (RBAC)</p>
                <p className="text-[11px] text-slate-500">Test platform views, permissions & branch scope</p>
              </div>
              <div className="py-1 max-h-80 overflow-y-auto">
                {ROLE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = session.role === opt.role;
                  return (
                    <button
                      key={opt.role}
                      onClick={() => handleRoleChange(opt.role)}
                      className={`w-full text-left px-3 py-2 flex items-start gap-2.5 hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-slate-100/70 font-semibold text-slate-900' : 'text-slate-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-slate-900' : 'text-slate-400'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="truncate">{opt.label}</span>
                          {isSelected && <span className="text-[10px] text-emerald-700 font-semibold">ACTIVE</span>}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
            className="relative p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-600 rounded-full ring-2 ring-white" />
            )}
          </button>

          {notifMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-80 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900">Notifications</span>
                  <span className="text-slate-500 font-mono text-[11px]">({unreadCount} unread)</span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-slate-600 hover:text-slate-900 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-slate-400">No notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`px-3 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                        notif.status === 'UNREAD' ? 'bg-slate-50/60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-medium ${notif.status === 'UNREAD' ? 'text-slate-900' : 'text-slate-700'}`}>
                          {notif.title}
                        </p>
                        {notif.status === 'UNREAD' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1 shrink-0" />
                        )}
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1 tabular-nums font-mono">{formatDateTime(notif.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {session.employee ? `${session.employee.firstName} ${session.employee.lastName}` : session.user.username}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              {session.employee?.employeeNo || session.user.username}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
            title="Sign out of enterprise session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
