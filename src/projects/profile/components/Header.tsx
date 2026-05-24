import React from 'react';
import { useAppContext, BRANCHES } from '../store/AppContext';
import { Globe, MapPin, LogOut, Sun, Moon } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout, language, setLanguage, branch, setBranch, theme, setTheme } = useAppContext();

  return (
    <header className="bg-white dark:bg-slate-900/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-14 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 shadow-sm transition-colors duration-300">
      <div className="flex items-center gap-3">
        {/* Mobile Title */}
        <h1 className="text-lg font-extrabold bg-gradient-to-r from-blue-700 to-sky-500 bg-clip-text text-transparent md:hidden">
          Jagdamba
        </h1>
        
        {/* Branch Selector */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
          <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="text-xs bg-transparent border-none text-slate-700 dark:text-slate-300 font-semibold focus:ring-0 cursor-pointer outline-none"
          >
            <option value="All" className="dark:bg-slate-900">All Branches</option>
            {BRANCHES.map(b => <option key={b} value={b} className="dark:bg-slate-900">{b}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Language Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-full border border-slate-200 dark:border-slate-700 transition-colors">
          <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ml-2" />
          <div className="flex bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm transition-colors">
            <button
              onClick={() => setLanguage('English')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all ${language === 'English' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('Gujarati')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all ${language === 'Gujarati' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800'}`}
            >
              ગુજ
            </button>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* User Info & Logout */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">{user?.displayName}</span>
            <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tighter leading-tight">{user?.role}</span>
          </div>
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block"></div>
          <button
            onClick={logout}
            className="p-1 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
