import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { ShieldAlert, Info, AlertCircle, Search, Clock, User, Filter, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

export const AlertCenter: React.FC = () => {
  const { t, logs, role } = useAppContext();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'alert' | 'warning' | 'info'>('All');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      (log.orderNo || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === 'All' || log.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  if (role !== 'Admin') {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <ShieldAlert className="w-16 h-16 mb-4 opacity-20" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>Only administrators can access the Alert Center.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
            {t('alertCenter')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Audit trail and security notifications</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-semibold text-slate-600 dark:text-slate-300"
          >
            <option value="All">All Logs</option>
            <option value="alert" className="text-red-600 dark:text-red-400 font-bold">Red Alerts</option>
            <option value="warning" className="text-amber-600 font-bold">Warnings</option>
            <option value="info" className="text-blue-600 dark:text-blue-400 font-bold">Info</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          label="Total Activities" 
          value={logs.length} 
          icon={Info} 
          color="blue" 
        />
        <StatCard 
          label="Security Alerts" 
          value={logs.filter(l => l.type === 'alert').length} 
          icon={ShieldAlert} 
          color="red" 
        />
        <StatCard 
          label="System Warnings" 
          value={logs.filter(l => l.type === 'warning').length} 
          icon={AlertCircle} 
          color="amber" 
        />
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16 text-center">Type</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Details</th>
                <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-slate-400 italic">
                    <div className="flex flex-col items-center gap-2">
                      <Info className="w-12 h-12 opacity-10" />
                      <p>No activity logs found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.map(log => (
                <tr key={log.id} className={clsx("hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors", log.type === 'alert' && "bg-red-50/30 dark:bg-red-900/30")}>
                  <td className="p-4 text-center">
                    <div className="flex justify-center">
                      {log.type === 'alert' && <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 animate-pulse" />}
                      {log.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-500" />}
                      {log.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                        {log.user.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{log.user}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{log.role}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={clsx(
                      "text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter",
                      log.type === 'alert' ? "text-red-700" : log.type === 'warning' ? "text-amber-700" : "text-blue-700 dark:text-blue-300"
                    )}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className={clsx("text-sm max-w-md", log.type === 'alert' ? "text-red-700 font-bold" : "text-slate-600 dark:text-slate-300")}>
                      {log.details}
                    </p>
                  </td>
                  <td className="p-4">
                    {log.orderNo && (
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded border border-blue-100 dark:border-blue-800">
                        {log.orderNo}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; icon: any; color: 'blue' | 'red' | 'amber' }> = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
    <div className={clsx(
      "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
      color === 'blue' ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : 
      color === 'red' ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400" : 
      "bg-amber-50 dark:bg-amber-900/30 text-amber-600"
    )}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none mt-1">{value}</p>
    </div>
  </div>
);
