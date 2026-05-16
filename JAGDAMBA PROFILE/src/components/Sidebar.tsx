import React from 'react';
import { useAppContext } from '../store/AppContext';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FilePlus, Kanban, Box, Truck, 
  FileText, ScrollText, ShoppingBag, ClipboardCheck, 
  PieChart, LayoutList, Briefcase, Settings2, ShieldAlert
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export interface NavItem {
  path: string;
  icon: any;
  labelKey: string;
  roles: string[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: 'General',
    items: [
      { path: '/', icon: LayoutDashboard, labelKey: 'dashboard', roles: ['Admin', 'Office Entry', 'Production Supervisor', 'Nesting Operator', 'Dispatch', 'Accounts User'] },
    ]
  },
  {
    title: 'Sales & Production',
    items: [
      { path: '/order-entry', icon: FilePlus, labelKey: 'orderEntry', roles: ['Admin', 'Office Entry'] },
      { path: '/production-list', icon: LayoutList, labelKey: 'productionList', roles: ['Admin', 'Office Entry', 'Production Supervisor', 'Nesting Operator'] },
      { path: '/production-status', icon: Kanban, labelKey: 'productionStatus', roles: ['Admin', 'Office Entry', 'Production Supervisor', 'Nesting Operator'] },
    ]
  },
  {
    title: 'Logistics & Inventory',
    items: [
      { path: '/plate-tracking', icon: Box, labelKey: 'plateTracking', roles: ['Admin', 'Office Entry', 'Production Supervisor'] },
      { path: '/dispatch', icon: Truck, labelKey: 'dispatch', roles: ['Admin', 'Office Entry', 'Dispatch'] },
    ]
  },
  {
    title: 'Procurement (Purchase)',
    items: [
      { path: '/purchase-order', icon: ShoppingBag, labelKey: 'purchaseOrder', roles: ['Admin', 'Office Entry'] },
      { path: '/material-receipt', icon: ClipboardCheck, labelKey: 'materialReceipt', roles: ['Admin', 'Office Entry'] },
      { path: '/grl-report', icon: ScrollText, labelKey: 'grlReport', roles: ['Admin', 'Office Entry', 'Accounts User'] },
    ]
  },
  {
    title: 'Accounts & Reports',
    items: [
      { path: '/challan', icon: ScrollText, labelKey: 'challan', roles: ['Admin', 'Office Entry', 'Accounts User'] },
      { path: '/purchase-reports', icon: PieChart, labelKey: 'purchaseReports', roles: ['Admin', 'Office Entry', 'Accounts User'] },
      { path: '/reports', icon: FileText, labelKey: 'reports', roles: ['Admin', 'Office Entry', 'Accounts User'] },
    ]
  },
  {
    title: 'Security & Audit',
    items: [
      { path: '/alert-center', icon: ShieldAlert, labelKey: 'alertCenter', roles: ['Admin'] },
    ]
  }
];

export const navItems = navSections.flatMap(section => section.items);

export const Sidebar: React.FC = () => {
  const { pathname } = useLocation();
  const { role, t } = useAppContext();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 shadow-sm z-50">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-50 flex flex-col items-center gap-1">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-1 shadow-lg shadow-blue-100">
          <Briefcase className="text-white w-6 h-6" />
        </div>
        <h1 className="text-lg font-black bg-gradient-to-r from-blue-700 to-sky-500 bg-clip-text text-transparent tracking-tighter">
          JAGDAMBA PROFILE
        </h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Steel Cutting ERP</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
        {navSections.map((section) => {
          const visibleItems = section.items.filter(item => item.roles.includes(role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1.5">
              <h3 className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.15em] mb-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300 group",
                        isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-100 border border-blue-600"
                          : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={cn("w-[18px] h-[18px]", isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600")} />
                        {t(item.labelKey)}
                      </div>
                      {item.path === '/alert-center' && role === 'Admin' && <NotificationBadge />}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-50 bg-slate-50/50">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
            <Settings2 className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">{role}</p>
            <p className="text-[10px] text-slate-400">v2.0 Stable</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

const NotificationBadge: React.FC = () => {
  const { logs } = useAppContext();
  const alertCount = logs.filter(l => l.type === 'alert').length;
  
  if (alertCount === 0) return null;
  
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white animate-pulse">
      {alertCount > 9 ? '9+' : alertCount}
    </span>
  );
};

