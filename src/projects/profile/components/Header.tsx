import React from 'react';
import { useAppContext, BRANCHES } from '../store/AppContext';
import { Globe, MapPin, LogOut } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout, language, setLanguage, branch, setBranch } = useAppContext();

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-14 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile Title */}
        <h1 className="text-lg font-extrabold bg-linear-to-r from-blue-700 to-sky-500 bg-clip-text text-transparent md:hidden">
          Jagdamba
        </h1>
        
        {/* Branch Selector */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="text-xs bg-transparent border-none text-slate-700 font-semibold focus:ring-0 cursor-pointer outline-none"
          >
            <option value="All">All Branches</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Language Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-full border border-slate-200">
          <Globe className="w-3.5 h-3.5 text-slate-500 ml-2" />
          <div className="flex bg-white rounded-full p-0.5 shadow-sm">
            <button
              onClick={() => setLanguage('English')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all ${language === 'English' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('Gujarati')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all ${language === 'Gujarati' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              ગુજ
            </button>
          </div>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-2 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-[11px] font-bold text-slate-800 leading-tight">{user?.displayName}</span>
            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-tighter leading-tight">{user?.role}</span>
          </div>
          <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block"></div>
          <button
            onClick={logout}
            className="p-1 text-slate-500 hover:text-red-600 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
