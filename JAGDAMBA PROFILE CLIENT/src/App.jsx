import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import AppShell from './components/Layout/AppShell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ContactList from './pages/Contacts/ContactList';
import ContactForm from './pages/Contacts/ContactForm';
import ContactDetail from './pages/Contacts/ContactDetail';
import AdvancedSearch from './pages/Search/AdvancedSearch';
import Staff from './pages/Staff/Staff';
import Candidates from './pages/Staff/Candidates';
import Transport from './pages/Transport/Transport';
import Reminders from './pages/Reminders/Reminders';
import Masters from './pages/Masters/Masters';
import Reports from './pages/Reports/Reports';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1a2740', color: '#f1f5f9', border: '1px solid #1e3050' },
            success: { iconTheme: { primary: '#f5a623', secondary: '#000' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/contacts" element={<ContactList />} />
            <Route path="/contacts/new" element={<ContactForm />} />
            <Route path="/contacts/:id" element={<ContactDetail />} />
            <Route path="/contacts/:id/edit" element={<ContactForm />} />
            <Route path="/search" element={<AdvancedSearch />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/transport" element={<Transport />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/masters/categories" element={<Masters />} />
            <Route path="/masters/grades" element={<Masters />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
