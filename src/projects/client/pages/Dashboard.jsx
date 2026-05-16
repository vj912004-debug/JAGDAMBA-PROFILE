import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Star, Truck, Award, UserPlus, Briefcase, Bell, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const COLORS = ['#f5a623', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f97316'];

export default function Dashboard() {
  const { state } = useApp();
  const { contacts, employees, candidates } = state;
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const vip = contacts.filter(c => c.status === 'VIP').length;
    const transporters = contacts.filter(c => c.category === 'Transporter').length;
    const traders = contacts.filter(c => c.category === 'Steel Trader').length;
    return { total: contacts.length, vip, transporters, traders };
  }, [contacts]);

  const categoryData = useMemo(() => {
    const map = {};
    contacts.forEach(c => {
      const key = c.categoryGroup || 'Other';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [contacts]);

  const cityData = useMemo(() => {
    const map = {};
    contacts.forEach(c => { if (c.city) map[c.city] = (map[c.city] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([city, count]) => ({ city, count }));
  }, [contacts]);

  const today = new Date();
  const birthdays = contacts.filter(c => {
    if (!c.birthday) return false;
    try {
      const d = parseISO(c.birthday);
      const diff = (new Date(today.getFullYear(), d.getMonth(), d.getDate()) - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000;
      return diff >= 0 && diff <= 30;
    } catch { return false; }
  }).sort((a, b) => {
    const da = parseISO(a.birthday), db = parseISO(b.birthday);
    return new Date(today.getFullYear(), da.getMonth(), da.getDate()) - new Date(today.getFullYear(), db.getMonth(), db.getDate());
  }).slice(0, 5);

  const followups = contacts.filter(c => {
    if (!c.followUpDate) return false;
    try {
      const diff = (new Date(c.followUpDate) - today) / 86400000;
      return diff >= -1 && diff <= 7;
    } catch { return false; }
  }).slice(0, 5);

  const statCards = [
    { label: 'Total Contacts', value: stats.total, icon: Users, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', link: '/contacts' },
    { label: 'VIP Contacts', value: stats.vip, icon: Star, color: '#f5a623', bg: 'rgba(245,166,35,0.15)', link: '/contacts?status=VIP' },
    { label: 'Transporters', value: stats.transporters, icon: Truck, color: '#10b981', bg: 'rgba(16,185,129,0.15)', link: '/contacts?cat=Transporter' },
    { label: 'Steel Traders', value: stats.traders, icon: TrendingUp, color: '#f97316', bg: 'rgba(249,115,22,0.15)', link: '/contacts?cat=Steel+Trader' },
    { label: 'Job Candidates', value: candidates.length, icon: UserPlus, color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', link: '/candidates' },
    { label: 'Staff Members', value: employees.length, icon: Briefcase, color: '#ef4444', bg: 'rgba(239,68,68,0.15)', link: '/staff' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Welcome to <span>Steel Connect Pro</span></div>
          <div className="page-subtitle">{format(today, 'EEEE, dd MMMM yyyy')} — Your business at a glance</div>
        </div>
      </div>

      <div className="stat-grid">
        {statCards.map(s => (
          <div key={s.label} className="stat-card" onClick={() => navigate(s.link)} style={{ cursor: 'pointer' }}>
            <div className="stat-card-icon" style={{ background: s.bg }}>
              <s.icon size={22} color={s.color} />
            </div>
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-glow" style={{ background: s.color }} />
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Category Distribution */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Contacts by Category</div>
            </div>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="table-empty">No contact data yet</div>}
          </div>

          {/* City-wise Bar */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Top Cities</div>
            </div>
            {cityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={cityData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="city" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                  <Bar dataKey="count" fill="var(--gold)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="table-empty">No city data yet</div>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Birthday Reminders */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">🎂 Upcoming Birthdays</div>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/reminders')}>View All</button>
            </div>
            {birthdays.length === 0
              ? <div className="table-empty">No upcoming birthdays in 30 days</div>
              : birthdays.map(c => {
                const d = parseISO(c.birthday);
                const upcoming = new Date(today.getFullYear(), d.getMonth(), d.getDate());
                const diff = Math.round((upcoming - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
                return (
                  <div key={c.id} className="reminder-item">
                    <div className="reminder-avatar">{(c.contactPerson || c.companyName || '?')[0].toUpperCase()}</div>
                    <div>
                      <div className="reminder-name">{c.contactPerson}</div>
                      <div className="reminder-sub">{c.companyName} · {c.city}</div>
                    </div>
                    <div className="reminder-date">{diff === 0 ? '🎉 Today!' : `in ${diff}d`}</div>
                  </div>
                );
              })}
          </div>

          {/* Follow-up Reminders */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">📋 Follow-ups Due</div>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/reminders')}>View All</button>
            </div>
            {followups.length === 0
              ? <div className="table-empty">No pending follow-ups</div>
              : followups.map(c => {
                const diff = Math.round((new Date(c.followUpDate) - today) / 86400000);
                return (
                  <div key={c.id} className="reminder-item">
                    <div className="reminder-avatar" style={{ background: diff < 0 ? 'var(--red)' : 'linear-gradient(135deg, var(--blue), #2563eb)' }}>
                      {(c.contactPerson || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="reminder-name">{c.contactPerson}</div>
                      <div className="reminder-sub">{c.companyName}</div>
                    </div>
                    <div className="reminder-date" style={{ color: diff < 0 ? 'var(--red)' : 'var(--gold)' }}>
                      {diff < 0 ? `${Math.abs(diff)}d overdue` : diff === 0 ? 'Today' : `in ${diff}d`}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
