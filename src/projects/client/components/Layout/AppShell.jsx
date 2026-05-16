import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useApp } from '../../context/AppContext';

export default function AppShell() {
  const { state } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  if (!state.isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(p => !p)} />
      <div className={`main-content${collapsed ? ' collapsed' : ''}`}>
        <Header
          collapsed={collapsed}
          onToggle={() => setCollapsed(p => !p)}
          onSearch={setSearchValue}
          searchValue={searchValue}
        />
        <div className="page-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
