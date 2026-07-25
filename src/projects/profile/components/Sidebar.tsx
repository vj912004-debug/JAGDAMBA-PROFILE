import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, ShoppingCart, ShoppingBag, Boxes, Factory,
  Wallet, BarChart3, Settings2, ChevronDown, ShieldAlert, Truck, ClipboardList
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export interface NavLeaf { path: string; label: string; }
export interface NavGroup { title: string; icon: any; roles: string[]; path?: string; children?: NavLeaf[]; }

const ALL_ROLES = ['Admin', 'Office Entry', 'Production Supervisor', 'Nesting Operator', 'Dispatch', 'Accounts User'];

export const NAV_GROUPS: NavGroup[] = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ALL_ROLES },
  {
    title: 'Master', icon: Users, roles: ['Admin', 'Office Entry'], children: [
      { path: '/master-data', label: 'Master Saved Data' },
      { path: '/party-master', label: 'Party Master' },
      { path: '/item-master', label: 'Item Master' },
      { path: '/section-master', label: 'Section Master' },
      { path: '/grade-master', label: 'Grade Master' },
      { path: '/worker-master', label: 'Worker Master' },
      { path: '/transport-master', label: 'Transport Master' },
    ]
  },
  {
    title: 'Sales', icon: ShoppingCart, roles: ['Admin', 'Office Entry', 'Dispatch'], children: [
      { path: '/order-entry', label: 'Order Entry' },
      { path: '/cnc-rate-calculator', label: 'CNC Rate Calculator' },
      { path: '/cnc-quotation', label: 'CNC Quotation 2' },
      { path: '/cnc-quotation-list', label: 'CNC Quotation List' },
      { path: '/pending-cnc-quotation', label: 'Pending Quotation' },
      { path: '/order-list', label: 'Order List' },
      { path: '/pending-order', label: 'Pending Order' },
      { path: '/dispatch', label: 'Dispatch Entry' },
      { path: '/despatch-report', label: 'Despatch Report' },
      { path: '/invoice-entry', label: 'Invoice Entry' },
      { path: '/sales-reports', label: 'Sales Reports' },
    ]
  },
  {
    title: 'Purchase', icon: ShoppingBag, roles: ['Admin', 'Office Entry'], children: [
      { path: '/purchase-order', label: 'Purchase Order' },
      { path: '/ring-rate', label: 'Ring Rate Entry' },
      { path: '/ring-rate-list', label: 'Ring Rate List' },
      { path: '/quotation', label: 'Plate Quotation' },
      { path: '/plate-quotation-list', label: 'Plate Quotation List' },
      { path: '/purchase-return', label: 'Purchase Return' },
      { path: '/supplier-ledger', label: 'Supplier Ledger' },
      { path: '/reject-material-return', label: 'Reject Material Return' },
      { path: '/material-required-pending', label: 'Material Required Pending' },
    ]
  },
  {
    title: 'GRN', icon: ClipboardList, roles: ['Admin', 'Office Entry'], children: [
      { path: '/material-receipt', label: 'Add GRN' },
      { path: '/grn-list', label: 'GRN List / Edit' },
    ]
  },
  {
    title: 'Transport', icon: Truck, roles: ['Admin', 'Office Entry'], children: [
      { path: '/weight-bridge', label: 'Weight Bridge' },
      { path: '/transport-bill', label: 'Transport Bill Entry' },
      { path: '/transport-bill-register', label: 'Transport Bill Register' },
      { path: '/transport-pending-report', label: 'Transport Pending Report' },
      { path: '/transport-wise-summary', label: 'Transport Wise Summary' },
    ]
  },
  {
    title: 'Inventory', icon: Boxes, roles: ['Admin', 'Office Entry', 'Production Supervisor'], children: [
      { path: '/stock-summary', label: 'Stock Summary' },
      { path: '/stock-register', label: 'Stock Register' },
      { path: '/job-work-outward', label: 'Job Work Outward' },
      { path: '/job-work-inward', label: 'Job Work Inward' },
      { path: '/job-work-pending-report', label: 'Job Work Pending Report' },
      { path: '/plate-tracking', label: 'Plate Tracking' },
    ]
  },
  {
    title: 'Production', icon: Factory, roles: ['Admin', 'Office Entry', 'Production Supervisor', 'Nesting Operator'], children: [
      { path: '/cutting-allocation', label: 'Cutting Allocation Entry' },
      { path: '/cutting-allocation-list', label: 'Cutting Allocation List' },
      { path: '/worker-cutting', label: 'Worker Cutting List' },
      { path: '/ready-for-dispatch', label: 'Ready For Dispatch List' },
      { path: '/production-list', label: 'Production List' },
      { path: '/production-status', label: 'Production Status' },
      { path: '/tc-management', label: 'TC Management' },
      { path: '/tc-mtc-document-search', label: 'TC / MTC Document Search' },
      { path: '/mill-test-certificate-anms', label: 'Mill Test Certificate ANMS' },
    ]
  },
  {
    title: 'Accounts', icon: Wallet, roles: ['Admin', 'Office Entry', 'Accounts User'], children: [
      { path: '/ledger', label: 'Ledger' },
      { path: '/outstanding', label: 'Outstanding' },
      { path: '/payments', label: 'Payments' },
      { path: '/challan', label: 'Challan' },
    ]
  },
  {
    title: 'Reports', icon: BarChart3, roles: ['Admin', 'Office Entry', 'Accounts User'], children: [
      { path: '/purchase-reports', label: 'Purchase Reports' },
      { path: '/production-reports', label: 'Production Reports' },
      { path: '/stock-reports', label: 'Stock Reports' },
      { path: '/material-receipt-report', label: 'Material Receipt Report' },
      { path: '/pending-material-report', label: 'Pending Material Report' },
      { path: '/reports', label: 'Sales Dashboard' },
    ]
  },
  {
    title: 'Settings', icon: Settings2, roles: ['Admin'], children: [
      { path: '/company-profile', label: 'Company Profile' },
      { path: '/users-roles', label: 'Users & Roles' },
      { path: '/preferences', label: 'Preferences' },
      { path: '/alert-center', label: 'Alert Center' },
    ]
  },
];

// ── Back-compat exports for MobileNav ─────────────────────────
export interface NavItem { path: string; icon: any; labelKey: string; roles: string[]; }
export interface NavSection { title: string; items: NavItem[]; }
export const navSections: NavSection[] = NAV_GROUPS.map(g => ({
  title: g.title,
  items: (g.children ?? [{ path: g.path!, label: g.title }]).map(c => ({
    path: c.path, icon: g.icon, labelKey: c.label, roles: g.roles,
  })),
}));
export const navItems: NavItem[] = navSections.flatMap(s => s.items);

const groupActive = (g: NavGroup, pathname: string) =>
  g.path === pathname || (g.children?.some(c => c.path === pathname) ?? false);

export const Sidebar: React.FC = () => {
  const { pathname } = useLocation();
  const { role } = useAppContext();

  const visibleGroups = NAV_GROUPS.filter(g => g.roles.includes(role));
  const activeGroup = visibleGroups.find(g => groupActive(g, pathname))?.title;
  const [open, setOpen] = useState<Record<string, boolean>>(() => (activeGroup ? { [activeGroup]: true } : {}));

  const toggle = (title: string) => setOpen(prev => ({ ...prev, [title]: !prev[title] }));

  return (
    <aside className="erp-sidebar hidden md:flex flex-col w-60 shrink-0 self-stretch min-h-full shadow-lg z-30">
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {visibleGroups.map((g) => {
          const isActive = groupActive(g, pathname);

          // Direct link (Dashboard)
          if (!g.children) {
            return (
              <Link
                key={g.title}
                to={g.path!}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all",
                  isActive ? "bg-brand-orange text-white shadow-md" : "text-blue-100/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <g.icon className="w-[18px] h-[18px]" />
                {g.title}
              </Link>
            );
          }

          const isOpen = open[g.title] ?? false;
          return (
            <div key={g.title}>
              <button
                onClick={() => toggle(g.title)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all",
                  isActive ? "bg-brand-orange text-white shadow-md" : "text-blue-100/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <span className="flex items-center gap-3">
                  <g.icon className="w-[18px] h-[18px]" />
                  {g.title}
                </span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
              </button>

              {isOpen && (
                <div className="mt-0.5 mb-1 ml-3 pl-3 border-l border-white/15 space-y-0.5">
                  {g.children.map((c) => {
                    const leafActive = pathname === c.path;
                    return (
                      <Link
                        key={c.path}
                        to={c.path}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all",
                          leafActive ? "bg-brand-blue text-white shadow-sm" : "text-blue-100/70 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {c.path === '/alert-center'
                          ? <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          : <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", leafActive ? "bg-white" : "bg-blue-200/50")} />}
                        <span className="truncate">{c.label}</span>
                        {c.path === '/alert-center' && role === 'Admin' && <NotificationBadge />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <Settings2 className="w-4 h-4 text-blue-100" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">{role}</p>
            <p className="text-[10px] font-bold text-blue-200/60 tracking-wide">v2.0 Stable</p>
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
    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-2xs font-black text-white animate-pulse">
      {alertCount > 9 ? '9+' : alertCount}
    </span>
  );
};
