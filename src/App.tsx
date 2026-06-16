import { useState, Suspense, lazy } from 'react';

// Lazy load the projects
const ProfileApp = lazy(() => import('./projects/profile/ProfileApp'));
// @ts-ignore
const ClientApp = lazy(() => import('./projects/client/ClientApp'));

const Loading = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
    {/* Blueprint Grid Backdrop */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50 pointer-events-none"></div>
    <div className="relative z-10 flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="text-xs font-bold text-slate-400 tracking-[0.2em] uppercase animate-pulse">Loading Workspace</p>
    </div>
  </div>
);

const Portal = ({ onSelect }: { onSelect: (project: 'profile' | 'client') => void }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden select-none">
      {/* CAD Blueprint / Steel Grid Backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-70 pointer-events-none"></div>

      {/* Dual Color Ambient Glow (Blue on Left for ERP, Orange on Right for Client Portal) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px]"></div>
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-500/5 rounded-full blur-[180px]"></div>
      </div>

      <div className="max-w-5xl w-full text-center space-y-16 z-10">
        <div className="space-y-6">
          <div className="inline-block p-1 px-4 bg-slate-900/80 border border-slate-800/80 rounded-full text-blue-400 text-2xs font-bold uppercase tracking-[0.25em] shadow-[0_0_15px_rgba(37,99,235,0.05)]">
            Enterprise Management System
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-white to-slate-400 tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.05)]">
            JAGDAMBA <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">STEEL</span>
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto tracking-wide">
            Select an operational module below to access your tailored workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Profile Card */}
          <button
            onClick={() => onSelect('profile')}
            className="group relative bg-slate-900/40 border border-slate-800 p-10 rounded-[2.5rem] hover:border-blue-500/40 hover:bg-slate-900/60 transition-all duration-500 text-left overflow-hidden shadow-2xl hover:shadow-[0_0_30px_rgba(37,99,235,0.08)] cursor-pointer"
          >
            {/* Active glowing accent line at the top */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent group-hover:via-blue-500/70 transition-all duration-500"></div>
            
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/15 transition-all duration-500"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-center group-hover:scale-105 group-hover:border-blue-500/30 transition-all duration-500">
                <svg className="w-8 h-8 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-white mb-3 tracking-wide">Profile ERP</h2>
                <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                  Manage steel profiles, production tracking, and internal factory operations.
                </p>
              </div>
              <div className="pt-2 flex items-center text-sm text-blue-400 font-bold group-hover:text-blue-300 transition-colors">
                <span>Launch Application</span>
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </button>

          {/* Client Card */}
          <button
            onClick={() => onSelect('client')}
            className="group relative bg-slate-900/40 border border-slate-800 p-10 rounded-[2.5rem] hover:border-orange-500/40 hover:bg-slate-900/60 transition-all duration-500 text-left overflow-hidden shadow-2xl hover:shadow-[0_0_30px_rgba(249,115,22,0.08)] cursor-pointer"
          >
            {/* Active glowing accent line at the top */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent group-hover:via-orange-500/70 transition-all duration-500"></div>
            
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/15 transition-all duration-500"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-center group-hover:scale-105 group-hover:border-orange-500/30 transition-all duration-500">
                <svg className="w-8 h-8 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-white mb-3 tracking-wide">Client Portal</h2>
                <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                  Client relationship management, contact tracking, and sales reports.
                </p>
              </div>
              <div className="pt-2 flex items-center text-sm text-orange-400 font-bold group-hover:text-orange-300 transition-colors">
                <span>Launch Application</span>
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-xs">
          <p>© 2026 Jagdamba Steel & Infrastructure. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-blue-400 hover:underline cursor-pointer transition-colors">Technical Support</span>
            <span className="hover:text-blue-400 hover:underline cursor-pointer transition-colors">Documentation</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [selectedProject, setSelectedProject] = useState<'profile' | 'client' | null>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('jagdamba-project') as 'profile' | 'client') || null;
    }
    return null;
  });

  const handleSelect = (project: 'profile' | 'client') => {
    setSelectedProject(project);
    localStorage.setItem('jagdamba-project', project);
  };

  if (selectedProject === 'profile') {
    return (
      <div className="relative min-h-screen bg-slate-950">
        <div className="profile-app-container">
          <Suspense fallback={<Loading />}>
            <ProfileApp />
          </Suspense>
        </div>
      </div>
    );
  }

  if (selectedProject === 'client') {
    return (
      <div className="relative min-h-screen bg-[#080d16]">
        <div className="client-app-container">
          <Suspense fallback={<Loading />}>
            <ClientApp />
          </Suspense>
        </div>
      </div>
    );
  }

  return <Portal onSelect={handleSelect} />;
}
