import React, { useState } from 'react';
import { MasterForm } from '../components/MasterForm';
import toast from 'react-hot-toast';

export const UsersRoles: React.FC = () => {
  const [f, setF] = useState({ name: 'Admin User', login: 'admin', role: 'Administrator', mobile: '9876543210', status: 'Active', password: '12345678' });
  const set = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v }));

  return (
    <MasterForm
      detailsTitle="Users & Roles Details"
      onSave={() => f.name.trim() && f.login.trim() ? toast.success('User saved') : toast.error('User Name & Login ID are required')}
      fields={[
        { label: 'User Name', value: f.name, onChange: set('name'), required: true },
        { label: 'Login ID', value: f.login, onChange: set('login'), required: true },
        { label: 'Role', value: f.role, onChange: set('role'), type: 'select', required: true, options: ['Administrator', 'Office Entry', 'Production Supervisor', 'Nesting Operator', 'Dispatch', 'Accounts User'] },
        { label: 'Mobile', value: f.mobile, onChange: set('mobile') },
        { label: 'Status', value: f.status, onChange: set('status'), type: 'select', options: ['Active', 'Inactive'] },
        { label: 'Password', value: f.password, onChange: set('password'), type: 'password' },
      ]}
    />
  );
};
