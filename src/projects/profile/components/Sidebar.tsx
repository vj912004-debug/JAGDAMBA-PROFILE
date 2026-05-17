import React from 'react';
import { useAppContext } from '../store/AppContext';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FilePlus, Kanban, Box, Truck, 
  FileSearch, FileText, ScrollText, ShoppingBag, ClipboardCheck, 
  PieChart, LayoutList, Briefcase, Settings2, ShieldAlert,
  ArrowLeft, Calculator, Scissors, Users
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
      { path: '/party-master', icon: Users, labelKey: 'partyMaster', roles: ['Admin', 'Office Entry'] },
      { path: '/quotation', icon: Calculator, labelKey: 'quotation', roles: ['Admin', 'Office Entry'] },
      { path: '/cnc-quotation', icon: Scissors, labelKey: 'cncQuotation', roles: ['Admin', 'Office Entry'] },
      { path: '/production-list', icon: LayoutList, labelKey: 'productionList', roles: ['Admin', 'Office Entry', 'Production Supervisor', 'Nesting Operator'] },
      { path: '/production-status', icon: Kanban, labelKey: 'productionStatus', roles: ['Admin', 'Office Entry', 'Production Supervisor', 'Nesting Operator'] },
    ]
  },
  {
    title: 'Logistics & Inventory',
    items: [
      { path: '/plate-tracking', icon: Box, labelKey: 'plateTracking', roles: ['Admin', 'Office Entry', 'Production Supervisor'] },
      { path: '/tc-management', icon: FileSearch, labelKey: 'tcManagement', roles: ['Admin', 'Office Entry', 'Dispatch'] },
      { path: '/dispatch', icon: Truck, labelKey: 'dispatch', roles: ['Admin', 'Office Entry', 'Dispatch'] },
    ]
  },
  {
    title: 'Procurement (Purchase)',
    items: [
      { path: '/purchase-order', icon: ShoppingBag, labelKey: 'purchaseOrder', roles: ['Admin', 'Office Entry'] },
      { path: '/material-receipt', icon: ClipboardCheck, labelKey: 'materialReceipt', roles: ['Admin', 'Office Entry'] },
      { path: '/grn-report', icon: ScrollText, labelKey: 'grnReport', roles: ['Admin', 'Office Entry', 'Accounts User'] },
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
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 shadow-sm z-50 transition-colors duration-300">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-50 dark:border-slate-800/50">
        <button 
          onClick={() => { localStorage.removeItem('jagdamba-project'); window.location.reload(); }}
          className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] font-black text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all border border-slate-100 dark:border-slate-800 hover:border-blue-100 dark:hover:border-blue-900 shadow-xs uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Portal
        </button>
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-1 shadow-lg shadow-blue-100 dark:shadow-none">
            <Briefcase className="text-white w-6 h-6" />
          </div>
          <h1 className="text-lg font-black bg-gradient-to-r from-blue-700 to-sky-500 bg-clip-text text-transparent tracking-tighter">
            JAGDAMBA PROFILE
          </h1>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Steel Cutting ERP</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
        {navSections.map((section) => {
          const visibleItems = section.items.filter(item => item.roles.includes(role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1.5">
              <h3 className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-2">
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
                          ? "bg-blue-600 text-white shadow-md shadow-blue-100 dark:shadow-none border border-blue-600"
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-blue-600 dark:hover:text-blue-400"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={cn("w-[18px] h-[18px]", isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400")} />
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
      <div className="p-4 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-colors duration-300">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
            <Settings2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{role}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">v2.0 Stable</p>
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

