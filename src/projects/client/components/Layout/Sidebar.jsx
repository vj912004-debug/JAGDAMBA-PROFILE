import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserPlus, Briefcase, Truck,
  Star, BarChart2, Bell, Search, Settings, LogOut,
  ChevronLeft, ChevronRight, Database, Award, Package
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const navItems = [
  { section: 'Main' },
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/search', icon: Search, label: 'Advanced Search' },
  { section: 'Modules' },
  { to: '/staff', icon: Briefcase, label: 'Staff & Employees' },
  { to: '/candidates', icon: UserPlus, label: 'Job Candidates' },
  { to: '/transport', icon: Truck, label: 'Transport' },
  { to: '/reminders', icon: Bell, label: 'Reminders' },
  { section: 'Masters' },
  { to: '/masters/categories', icon: Database, label: 'Category Master' },
  { to: '/masters/grades', icon: Award, label: 'Steel Grade Master' },
  { section: 'Analytics' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { dispatch } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
  };

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-logo" style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <img
          src="/steel-connect-logo.png"
          alt="Steel Connect Pro"
          style={{
            width: collapsed ? 40 : 44,
            height: collapsed ? 40 : 44,
            objectFit: 'contain',
            flexShrink: 0,
            transition: 'width 0.3s, height 0.3s',
            filter: 'drop-shadow(0 0 6px rgba(123,104,238,0.3))',
          }}
        />
        <div className="logo-text" style={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto', overflow: 'hidden', transition: 'opacity 0.2s, width 0.3s' }}>
          Steel Connect<span>Pro</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, i) => {
          if (item.section) {
            return <div key={i} className="nav-section-label">{item.section}</div>;
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button 
          className="nav-item" 
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '8px', color: '#3b82f6' }} 
          onClick={() => { localStorage.removeItem('jagdamba-project'); window.location.reload(); }}
        >
          <ChevronLeft size={18} />
          <span>Back to Portal</span>
        </button>
        <button className="nav-item" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }} onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
