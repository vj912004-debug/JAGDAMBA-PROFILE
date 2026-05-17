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
import { GRNReport } from './pages/GRNReport';
import { ProductionList } from './pages/ProductionList';
import { Reports } from './pages/Reports';
import { AlertCenter } from './pages/AlertCenter';
import { TCManagement } from './pages/TCManagement';
import { Quotation } from './pages/Quotation';
import { CNCQuotation } from './pages/CNCQuotation';
import { LoginPage } from './pages/LoginPage';
import { PartyMasterPage } from './pages/PartyMaster';
import { useAppContext, AppProvider } from './store/AppContext';
import './index.css';

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

export default function ProfileApp() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/order-entry" element={<OrderEntry />} />
            <Route path="/party-master" element={<PartyMasterPage />} />
            <Route path="/production-list" element={<ProductionList />} />
            <Route path="/production-status" element={<ProductionStatus />} />
            <Route path="/quotation" element={<Quotation />} />
            <Route path="/cnc-quotation" element={<CNCQuotation />} />
            <Route path="/plate-tracking" element={<PlateTracking />} />
            <Route path="/tc-management" element={<TCManagement />} />
            <Route path="/dispatch" element={<DispatchPage />} />
            <Route path="/challan" element={<ChallanPage />} />
            <Route path="/purchase-order" element={<PurchaseOrderEntry />} />
            <Route path="/material-receipt" element={<MaterialReceipt />} />
            <Route path="/grn-report" element={<GRNReport />} />
            <Route path="/purchase-reports" element={<PurchaseReports />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/alert-center" element={<AdminRoute><AlertCenter /></AdminRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
