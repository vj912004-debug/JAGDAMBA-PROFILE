import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isToday, parseISO } from 'date-fns';

export default function Header({ collapsed, onToggle, onSearch, searchValue }) {
  const { state } = useApp();
  const navigate = useNavigate();

  const todayBirthdays = state.contacts.filter(c => {
    if (!c.birthday) return false;
    try {
      const d = parseISO(c.birthday);
      const today = new Date();
      return d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
    } catch { return false; }
  });

  const overdueFollowups = state.contacts.filter(c => {
    if (!c.followUpDate) return false;
    try { return new Date(c.followUpDate) <= new Date(); } catch { return false; }
  });

  const reminderCount = todayBirthdays.length + overdueFollowups.length;

  return (
    <header className="header">
      <button className="header-toggle" onClick={onToggle}>
        <Menu size={20} />
      </button>
      <div className="header-search">
        <Search className="search-icon" />
        <input
          type="text"
          placeholder="Quick search contacts..."
          value={searchValue}
          onChange={e => onSearch(e.target.value)}
          onFocus={() => navigate('/search')}
        />
      </div>
      <div className="header-right">
        <button className="icon-btn" onClick={() => navigate('/reminders')} title="Reminders">
          <Bell size={18} />
          {reminderCount > 0 && <span className="badge-dot" />}
        </button>
        <div className="user-chip">
          <div className="user-avatar">A</div>
          <span>Admin</span>
        </div>
      </div>
    </header>
  );
}
