import React from 'react';
import { useAppContext, BRANCHES } from '../store/AppContext';
import { useLocation } from 'react-router-dom';
import { Globe, MapPin, LogOut, Sun, Moon, CalendarDays, ChevronDown, User, Users } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/order-entry': 'Sales Order Entry',
  '/order-list': 'Order List',
  '/pending-order': 'Pending Order',
  '/invoice-entry': 'Invoice Entry',
  '/sales-reports': 'Sales Reports',
  '/party-master': 'PARTY MASTER',
  '/master-data': 'Master Saved Data',
  '/item-master': 'Item Master',
  '/section-master': 'Section Master',
  '/grade-master': 'Grade Master',
  '/worker-master': 'Worker Master',
  '/transport-master': 'TRANSPORT MASTER',
  '/quotation': 'PLATE QUOTATION ENTRY',
  '/plate-quotation-list': 'Plate Quotation List',
  '/ring-rate': 'Ring Rate Entry',
  '/ring-rate-list': 'Ring Rate List',
  '/cutting-allocation': 'Cutting Allocation Entry',
  '/cutting-allocation-list': 'Cutting Allocation List',
  '/worker-cutting': 'Worker Cutting List with Ready Entry',
  '/ready-for-dispatch': 'Ready For Dispatch List',
  '/cnc-rate-calculator': 'CNC Rate Calculator',
  '/cnc-quotation': 'CNC Quotation 2',
  '/cnc-quotation-list': 'CNC Quotation List',
  '/pending-cnc-quotation': 'Pending CNC Quotation',
  '/cnc-quotation-convert': 'Convert Quotation to Order',
  '/production-list': 'Production List',
  '/production-status': 'Production Status',
  '/production-reports': 'Production Reports',
  '/plate-tracking': 'Plate Tracking',
  '/tc-management': 'TC / MTC DOCUMENT MANAGEMENT SYSTEM',
  '/tc-mtc-document-search': 'TC / MTC DOCUMENT SEARCH SYSTEM',
  '/mill-test-certificate-anms': 'MILL TEST CERTIFICATE',
  '/dispatch': 'Dispatch Entry',
  '/purchase-order': 'Purchase Order Entry',
  '/purchase-return': 'Purchase Return',
  '/supplier-ledger': 'Supplier Ledger',
  '/material-receipt': 'GRN Entry (Against Purchase Order)',
  '/reject-material-return': 'Reject Material Return Entry',
  '/stock-register': 'Stock Register',
  '/transport-bill': 'Transport Bill Entry',
  '/transport-bill-register': 'Transport Bill Register Report',
  '/transport-bill-detail': 'Transport Bill Detail Report',
  '/transport-wise-summary': 'Transport Wise Summary Report',
  '/transport-pending-report': 'Transport Pending Bill Report',
  '/job-work-outward': 'Job Work Outward',
  '/job-work-inward': 'Job Work Inward (Material Return)',
  '/job-work-pending-report': 'Job Work Pending Report',
  '/stock-summary': 'Stock Summary',
  '/stock-reports': 'Stock Reports',
  '/material-receipt-report': 'Grade Wise Material Receipt Report',
  '/material-pending-report': 'Purchase Order Pending Report',
  '/grn-report': 'GRN Report',
  '/challan': 'Challan',
  '/ledger': 'Ledger',
  '/outstanding': 'Outstanding',
  '/payments': 'Payments',
  '/purchase-reports': 'Purchase Reports',
  '/reports': 'Reports',
  '/company-profile': 'Company Profile',
  '/users-roles': 'Users & Roles',
  '/preferences': 'Preferences',
  '/alert-center': 'Alert Center',
};

export const Header: React.FC = () => {
  const { user, logout, language, setLanguage, branch, setBranch, theme, setTheme } = useAppContext();
  const { pathname } = useLocation();

  const pageTitle = PAGE_TITLES[pathname] || 'Jagdamba Profile ERP';
  const today = new Date().toLocaleDateString('en-GB');

  const switchToClientPortal = () => {
    localStorage.setItem('jagdamba-project', 'client');
    window.location.reload();
  };

  return (
    <header className="erp-header-bar h-16 shrink-0 flex items-center justify-between pl-3 pr-3 sm:pr-5 sticky top-0 z-40 shadow-md text-white">
      {/* Brand + Page Title */}
      <div className="flex items-center gap-3 sm:gap-5 min-w-0">
        <button
          onClick={() => { localStorage.removeItem('jagdamba-project'); window.location.reload(); }}
          className="flex items-center gap-2.5 shrink-0"
          title="Back to Portal"
        >
          <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black text-brand-orange text-base shadow-sm">
            JP
          </span>
          <span className="hidden sm:flex flex-col leading-none text-left">
            <span className="text-base font-black tracking-tight text-white">JAGDAMBA</span>
            <span className="text-[10px] font-bold tracking-[0.25em] text-white/80">PROFILE ERP</span>
          </span>
        </button>

        <div className="h-8 w-px bg-white/25 hidden md:block" />

        <h1 className="text-base sm:text-lg font-bold truncate uppercase tracking-wide text-white lg:hidden">{pageTitle}</h1>
      </div>

      <div className="hidden lg:flex flex-1 justify-center px-4 min-w-0">
        <span className="erp-page-title-pill truncate max-w-md">{pageTitle}</span>
      </div>

      {/* Controls + User */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={switchToClientPortal}
          className="hidden sm:flex items-center gap-1.5 bg-orange-500/90 hover:bg-orange-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
          title="Switch to Client Portal"
        >
          <Users className="w-3.5 h-3.5" />
          Client Portal
        </button>
        <button
          type="button"
          onClick={switchToClientPortal}
          className="sm:hidden p-1.5 bg-orange-500/90 hover:bg-orange-500 text-white rounded-lg transition-colors"
          title="Switch to Client Portal"
        >
          <Users className="w-4 h-4" />
        </button>

        {/* Branch */}
        <div className="hidden lg:flex items-center gap-1.5 bg-white/15 hover:bg-white/20 px-2.5 py-1.5 rounded-lg transition-colors">
          <MapPin className="w-3.5 h-3.5 text-white/80" />
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="text-xs bg-transparent border-none text-white font-semibold focus:ring-0 cursor-pointer outline-none [&>option]:text-slate-800"
          >
            <option value="All">All Branches</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Language */}
        <div className="hidden sm:flex items-center bg-white/15 rounded-full p-0.5">
          <Globe className="w-3.5 h-3.5 text-white/80 ml-1.5" />
          <button
            onClick={() => setLanguage('English')}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-all ${language === 'English' ? 'bg-white text-brand-orange' : 'text-white/80'}`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('Gujarati')}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-all ${language === 'Gujarati' ? 'bg-white text-brand-orange' : 'text-white/80'}`}
          >
            ગુજ
          </button>
        </div>

        {/* Theme */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-1.5 bg-white/15 hover:bg-white/25 text-white rounded-full transition-all"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Date */}
        <div className="hidden md:flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-lg">
          <CalendarDays className="w-4 h-4 text-white/80" />
          <span className="text-xs font-semibold">{today}</span>
        </div>

        {/* User */}
        <div className="flex items-center gap-2 bg-white/15 hover:bg-white/20 pl-2 pr-1.5 py-1 rounded-lg transition-colors">
          <span className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center">
            <User className="w-4 h-4 text-brand-orange" />
          </span>
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-xs font-bold">{user?.displayName}</span>
            <span className="text-[10px] font-medium text-white/80">{user?.role}</span>
          </div>
          <button
            onClick={logout}
            className="p-1 text-white/80 hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <ChevronDown className="w-3.5 h-3.5 text-white/80 hidden sm:block" />
        </div>
      </div>
    </header>
  );
};
