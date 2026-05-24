import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { cn, navSections, type NavSection, type NavItem } from './Sidebar';

export const MobileNav: React.FC = () => {
  const { t, role } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <>
      {/* Floating Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed bottom-5 right-5 w-12 h-12 bg-gradient-to-br from-blue-600 to-sky-500 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center z-50 hover:shadow-xl transition-all focus:outline-none active:scale-95"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide Panel */}
      <div className={cn(
        "md:hidden fixed inset-y-0 right-0 w-72 bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Menu</h2>
            <p className="text-[10px] text-slate-400 font-medium">Jagdamba Profile ERP</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700 dark:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
          {navSections.map((section: NavSection) => {
            const visibleItems = section.items.filter((item: NavItem) => item.roles.includes(role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-2">
                <h3 className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.15em] mb-1">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {visibleItems.map((item: NavItem) => {
                    const isActive = pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-4 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300",
                          isActive
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                            : "text-slate-500 hover:bg-slate-50 dark:bg-slate-800/50 hover:text-blue-600"
                        )}
                      >
                        <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                        {t(item.labelKey)}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </>
  );
};
