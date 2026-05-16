import { useState, Suspense, lazy } from 'react';

// Lazy load the projects
const ProfileApp = lazy(() => import('./projects/profile/ProfileApp'));
// @ts-ignore
const ClientApp = lazy(() => import('./projects/client/ClientApp'));

const Loading = () => (
  <div className="min-h-screen bg-[#080d16] flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const Portal = ({ onSelect }: { onSelect: (project: 'profile' | 'client') => void }) => {
  return (
    <div className="min-h-screen bg-[#080d16] flex flex-col items-center justify-center p-6 sm:p-12 overflow-x-hidden">
      <div className="max-w-5xl w-full text-center space-y-16">
        <div className="space-y-6">
          <div className="inline-block p-2 px-4 bg-blue-500/10 rounded-full border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-[0.2em] animate-pulse">
            Enterprise Management System
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight">
            JAGDAMBA <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-sky-400">STEEL</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
            Select a module to access your workspace and manage operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Profile Card */}
          <button
            onClick={() => onSelect('profile')}
            className="group relative bg-[#0f1824] border border-slate-800 p-10 rounded-[2.5rem] hover:border-blue-500 hover:bg-[#141f2e] transition-all duration-500 text-left overflow-hidden shadow-2xl hover:shadow-blue-500/10"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-3">Profile ERP</h2>
                <p className="text-slate-400 leading-relaxed line-clamp-2">
                  Manage steel profiles, production tracking, and internal factory operations.
                </p>
              </div>
              <div className="pt-2 flex items-center text-blue-500 font-bold group-hover:gap-4 transition-all">
                Launch Application
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </button>

          {/* Client Card */}
          <button
            onClick={() => onSelect('client')}
            className="group relative bg-[#0f1824] border border-slate-800 p-10 rounded-[2.5rem] hover:border-orange-500 hover:bg-[#141f2e] transition-all duration-500 text-left overflow-hidden shadow-2xl hover:shadow-orange-500/10"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-500"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-3">Client Portal</h2>
                <p className="text-slate-400 leading-relaxed line-clamp-2">
                  Client relationship management, contact tracking, and sales reports.
                </p>
              </div>
              <div className="pt-2 flex items-center text-orange-500 font-bold group-hover:gap-4 transition-all">
                Launch Application
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
          <p>© 2026 Jagdamba Steel & Infrastructure. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-blue-400 cursor-help">Technical Support</span>
            <span className="hover:text-blue-400 cursor-help">Documentation</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [selectedProject, setSelectedProject] = useState<'profile' | 'client' | null>(null);

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

  return <Portal onSelect={setSelectedProject} />;
}
