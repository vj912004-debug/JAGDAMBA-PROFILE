import React, { useState } from 'react';
import { type Role, useAppContext } from '../store/AppContext';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface UserCredential {
  username: string;
  password: string;
  role: Role;
  displayName: string;
}

export const USERS: UserCredential[] = [
  { username: 'admin', password: 'admin123', role: 'Admin', displayName: 'Admin (Owner)' },
  { username: 'office', password: 'office123', role: 'Office Entry', displayName: 'Office Entry Operator' },
  { username: 'production', password: 'prod123', role: 'Production Supervisor', displayName: 'Production Supervisor' },
  { username: 'nesting', password: 'nest123', role: 'Nesting Operator', displayName: 'Nesting Operator' },
  { username: 'dispatch', password: 'disp123', role: 'Dispatch', displayName: 'Dispatch User' },
  { username: 'accounts', password: 'acc123', role: 'Accounts User', displayName: 'Accounts User' },
];

export const LoginPage: React.FC = () => {
  const { setUser } = useAppContext();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const user = USERS.find(u => u.username === username.toLowerCase().trim() && u.password === password);
      if (user) {
        toast.success(`Welcome, ${user.displayName}!`, { icon: '👋' });
        setUser({ username: user.username, role: user.role, displayName: user.displayName });
        navigate('/');
      } else {
        setError('Invalid username or password');
        toast.error('Login failed');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* CAD Blueprint / Steel Grid Backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-70 pointer-events-none"></div>

      {/* Laser Sparks & Glowing Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px]"></div>
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[180px]"></div>
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Logo & Header */}
        <div className="text-center mb-8 relative">
          <h1 className="text-4xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-white to-slate-400 drop-shadow-[0_2px_10px_rgba(255,255,255,0.05)]">
            JAGDAMBA PROFILE
          </h1>
          <div className="flex items-center justify-center gap-3">
            <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-blue-500/50"></span>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.35em]">
              Steel Cutting ERP
            </p>
            <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-blue-500/50"></span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-8 border border-slate-800/80 shadow-2xl relative group overflow-hidden transition-all duration-500 hover:border-slate-700/80">
          {/* Futuristic card highlight line at the top */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-slate-950/80 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-800 shadow-inner shadow-blue-500/5 group-hover:border-blue-500/30 transition-colors duration-300">
              <Lock className="w-6 h-6 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]" />
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-wide">Sign In</h2>
            <p className="text-xs text-slate-400 mt-1.5">Access the profile management dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Username</label>
              <div className="relative group/input">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within/input:text-blue-400 transition-colors duration-300" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  className="w-full bg-slate-950/40 border border-slate-800/80 text-slate-100 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-700 transition-all duration-300 hover:border-slate-700"
                  placeholder="Enter username"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Password</label>
              <div className="relative group/input">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within/input:text-blue-400 transition-colors duration-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full bg-slate-950/40 border border-slate-800/80 text-slate-100 rounded-xl pl-11 pr-11 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-700 transition-all duration-300 hover:border-slate-700"
                  placeholder="Enter password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-950/30 border border-red-900/40 rounded-xl px-4 py-2.5 text-xs text-red-400 font-semibold text-center slide-up">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(37,99,235,0.15)] hover:shadow-[0_0_25px_rgba(37,99,235,0.3)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
