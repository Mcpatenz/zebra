import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  CheckSquare,
  Users,
  UserCheck,
  Building2,
  Shield,
  FileBarChart2,
  FileText,
  Lock,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { CurrentUserSession, PermissionCode } from '../../types';
import { hasPermission } from '../../lib/permissions';

interface SidebarProps {
  session: CurrentUserSession;
  activeView: string;
  onNavigate: (view: string) => void;
  pendingApprovalsCount: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  requiredPermission?: PermissionCode;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  session,
  activeView,
  onNavigate,
  pendingApprovalsCount,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: LayoutDashboard,
      requiredPermission: 'DASHBOARD_VIEW',
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: ArrowLeftRight,
      requiredPermission: 'TRANSACTIONS_VIEW',
    },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: CheckSquare,
      requiredPermission: 'TRANSACTIONS_APPROVE',
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      requiredPermission: 'CUSTOMERS_VIEW',
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: UserCheck,
      requiredPermission: 'EMPLOYEES_VIEW',
    },
    {
      id: 'organization',
      label: 'Organization',
      icon: Building2,
      requiredPermission: 'BRANCHES_MANAGE',
    },
    {
      id: 'users',
      label: 'Users & RBAC',
      icon: Shield,
      requiredPermission: 'USERS_VIEW',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileBarChart2,
      requiredPermission: 'REPORTS_VIEW',
    },
    {
      id: 'audit-logs',
      label: 'Audit Logs',
      icon: FileText,
      requiredPermission: 'AUDIT_VIEW',
    },
    {
      id: 'security',
      label: 'Security & Logins',
      icon: Lock,
      requiredPermission: 'USERS_VIEW',
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: Sliders,
      requiredPermission: 'SETTINGS_MANAGE',
    },
  ];

  const visibleNav = navItems.filter(item => {
    if (!item.requiredPermission) return true;
    return hasPermission(session.role, item.requiredPermission);
  });

  return (
    <aside className="w-56 lg:w-60 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none">
      <div className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        Operations Core
      </div>

      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors group cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded font-semibold ${
                  isActive ? 'bg-white text-slate-900' : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Organizational Scope Card at bottom */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 text-xs">
        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
          Node Identity
        </div>
        <div className="mt-1 font-semibold text-slate-800 text-[11px] truncate">
          {session.branch ? session.branch.name : 'Central Headquarters'}
        </div>
        <div className="text-[10px] text-slate-500 font-mono tabular-nums">
          Code: {session.branch ? session.branch.code : 'HQ-CORE-00'}
        </div>
      </div>
    </aside>
  );
};
