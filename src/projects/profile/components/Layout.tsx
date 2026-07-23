import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { handleEnterAsTab } from '../utils/enterAsTab';
import { handleErpHotkeyEvent } from '../utils/erpHotkeys';

export const Layout: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (handleErpHotkeyEvent(event, () => navigate(-1))) return;
      handleEnterAsTab(event);
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [navigate]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 print:h-auto print:overflow-visible print:bg-white">
      <Header />
      <div className="flex flex-1 min-h-0 w-full print:block">
        <Sidebar />
        <main className="flex-1 min-w-0 min-h-0 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 transition-colors duration-300 print:overflow-visible print:p-0 print:bg-white">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
};
