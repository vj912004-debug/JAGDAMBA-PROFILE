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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">JAGDAMBA PROFILE</h1>
          <p className="text-sm font-medium text-blue-300/70 uppercase tracking-[0.3em]">Steel Cutting ERP</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-sky-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Sign In</h2>
            <p className="text-sm text-slate-400 mt-1">Enter your credentials to access the system</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  className="w-full bg-white/10 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500 transition-all"
                  placeholder="Enter username"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full bg-white/10 border border-white/10 text-white rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500 transition-all"
                  placeholder="Enter password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-2.5 text-sm text-red-300 font-medium text-center break-words">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white py-3 rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Quick Login Hints */}
        <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">Demo Credentials</p>
          <div className="grid grid-cols-2 gap-2">
            {USERS.map(u => (
              <button
                key={u.username}
                onClick={() => { setUsername(u.username); setPassword(u.password); }}
                className="text-left bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 transition-colors border border-white/5 group"
              >
                <p className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{u.displayName}</p>
                <p className="text-[10px] text-slate-500 font-mono">{u.username} / {u.password}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
