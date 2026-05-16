import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { OrderEntry } from './pages/OrderEntry';
import { ProductionStatus } from './pages/ProductionStatus';
import { PlateTracking } from './pages/PlateTracking';
import { DispatchPage } from './pages/DispatchPage';
import { ChallanPage } from './pages/ChallanPage';
import { PurchaseOrderEntry } from './pages/PurchaseOrderEntry';
import { MaterialReceipt } from './pages/MaterialReceipt';
import { PurchaseReports } from './pages/PurchaseReports';
import { GRLReport } from './pages/GRLReport';
import { ProductionList } from './pages/ProductionList';
import { Reports } from './pages/Reports';
import { AlertCenter } from './pages/AlertCenter';
import { LoginPage } from './pages/LoginPage';
import { useAppContext } from './store/AppContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAppContext();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, role } = useAppContext();
  if (!user || role !== 'Admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/order-entry" element={<OrderEntry />} />
          <Route path="/production-status" element={<ProductionStatus />} />
          <Route path="/plate-tracking" element={<PlateTracking />} />
          <Route path="/dispatch" element={<DispatchPage />} />
          <Route path="/challan" element={<ChallanPage />} />
          <Route path="/purchase-order" element={<PurchaseOrderEntry />} />
          <Route path="/material-receipt" element={<MaterialReceipt />} />
          <Route path="/purchase-reports" element={<PurchaseReports />} />
          <Route path="/grl-report" element={<GRLReport />} />
          <Route path="/production-list" element={<ProductionList />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/alert-center" element={<AdminRoute><AlertCenter /></AdminRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
