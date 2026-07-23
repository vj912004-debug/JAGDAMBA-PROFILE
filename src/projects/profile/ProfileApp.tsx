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
import { MaterialReceiptReport } from './pages/MaterialReceiptReport';
import { MaterialRequiredPendingReport } from './pages/MaterialRequiredPendingReport';
import { MaterialPendingReport } from './pages/MaterialPendingReport';
import { PendingMaterialReport } from './pages/PendingMaterialReport';
import { StockRegister } from './pages/StockRegister';
import { TransportBillEntry } from './pages/TransportBillEntry';
import { RingRateEntry } from './pages/RingRateEntry';
import { CuttingAllocationEntry } from './pages/CuttingAllocationEntry';
import { WorkerCuttingList } from './pages/WorkerCuttingList';
import { GRNReport } from './pages/GRNReport';
import { GRNListEdit } from './pages/GRNListEdit';
import { ProductionList } from './pages/ProductionList';
import { Reports } from './pages/Reports';
import { AlertCenter } from './pages/AlertCenter';
import { TCManagement } from './pages/TCManagement';
import { TcMtcDocumentSearch } from './pages/TcMtcDocumentSearch';
import { MillTestCertificateAnms } from './pages/MillTestCertificateAnms';
import { Quotation } from './pages/Quotation';
import { CNCQuotation } from './pages/CNCQuotation';
import { PendingCNCQuotation } from './pages/PendingCNCQuotation';
import { ConvertCNCQuotationToOrder } from './pages/ConvertCNCQuotationToOrder';
import { CNCRateCalculator } from './pages/CNCRateCalculator';
import { LoginPage } from './pages/LoginPage';
import { PartyMasterPage } from './pages/PartyMaster';
import { ItemMaster } from './pages/ItemMaster';
import { GradeMaster } from './pages/GradeMaster';
import { SectionMaster } from './pages/SectionMaster';
import { WorkerMaster } from './pages/WorkerMaster';
import { TransportMaster } from './pages/TransportMaster';
import { MasterDataList } from './pages/MasterDataList';
import { CompanyProfile } from './pages/CompanyProfile';
import { UsersRoles } from './pages/UsersRoles';
import { Preferences } from './pages/Preferences';
import { OrderList, PendingOrder, InvoiceEntry, SalesReports, CNCQuotationList } from './pages/SalesLists';
import { PurchaseReturn, SupplierLedger, RingRateList, PlateQuotationList, PurchaseReportsList } from './pages/PurchaseLists';
import { StockSummary, StockReports } from './pages/InventoryLists';
import { JobWorkOutward } from './pages/JobWorkOutward';
import { JobWorkInward } from './pages/JobWorkInward';
import { JobWorkPendingReport } from './pages/JobWorkPendingReport';
import { TransportBillRegisterReport } from './pages/TransportBillRegisterReport';
import { TransportBillDetailReport } from './pages/TransportBillDetailReport';
import { TransportWiseSummaryReport } from './pages/TransportWiseSummaryReport';
import { TransportPendingBillReport } from './pages/TransportPendingBillReport';
import { CuttingAllocationList, ProductionReports } from './pages/ProductionLists';
import { Ledger, Outstanding, Payments } from './pages/AccountsLists';
import { ReadyForDispatch } from './pages/ReadyForDispatch';
import { RejectMaterialReturnEntry } from './pages/RejectMaterialReturnEntry';
import { DespatchReport } from './pages/DespatchReport';
import { WeightBridge } from './pages/WeightBridge';
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
            <Route path="/order-list" element={<OrderList />} />
            <Route path="/pending-order" element={<PendingOrder />} />
            <Route path="/invoice-entry" element={<InvoiceEntry />} />
            <Route path="/sales-reports" element={<SalesReports />} />
            <Route path="/party-master" element={<PartyMasterPage />} />
            <Route path="/master-data" element={<MasterDataList />} />
            <Route path="/item-master" element={<ItemMaster />} />
            <Route path="/section-master" element={<SectionMaster />} />
            <Route path="/grade-master" element={<GradeMaster />} />
            <Route path="/worker-master" element={<WorkerMaster />} />
            <Route path="/transport-master" element={<TransportMaster />} />
            <Route path="/purchase-return" element={<PurchaseReturn />} />
            <Route path="/supplier-ledger" element={<SupplierLedger />} />
            <Route path="/ring-rate-list" element={<RingRateList />} />
            <Route path="/plate-quotation-list" element={<PlateQuotationList />} />
            <Route path="/stock-summary" element={<StockSummary />} />
            <Route path="/job-work-outward" element={<JobWorkOutward />} />
            <Route path="/job-work-inward" element={<JobWorkInward />} />
            <Route path="/material-inward" element={<Navigate to="/job-work-inward" replace />} />
            <Route path="/material-outward" element={<Navigate to="/job-work-outward" replace />} />
            <Route path="/stock-reports" element={<StockReports />} />
            <Route path="/cutting-allocation-list" element={<CuttingAllocationList />} />
            <Route path="/ready-for-dispatch" element={<ReadyForDispatch />} />
            <Route path="/production-reports" element={<ProductionReports />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/outstanding" element={<Outstanding />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/company-profile" element={<CompanyProfile />} />
            <Route path="/users-roles" element={<UsersRoles />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/production-list" element={<ProductionList />} />
            <Route path="/production-status" element={<ProductionStatus />} />
            <Route path="/quotation" element={<Quotation />} />
            <Route path="/cnc-quotation-list" element={<CNCQuotationList />} />
            <Route path="/cnc-rate-calculator" element={<CNCRateCalculator />} />
            <Route path="/cnc-quotation" element={<CNCQuotation />} />
            <Route path="/pending-cnc-quotation" element={<PendingCNCQuotation />} />
            <Route path="/cnc-quotation-convert" element={<ConvertCNCQuotationToOrder />} />
            <Route path="/plate-tracking" element={<PlateTracking />} />
            <Route path="/tc-management" element={<TCManagement />} />
            <Route path="/tc-mtc-document-search" element={<TcMtcDocumentSearch />} />
            <Route path="/mill-test-certificate-anms" element={<MillTestCertificateAnms />} />
            <Route path="/dispatch" element={<DispatchPage />} />
            <Route path="/despatch-report" element={<DespatchReport />} />
            <Route path="/challan" element={<ChallanPage />} />
            <Route path="/purchase-order" element={<PurchaseOrderEntry />} />
            <Route path="/material-receipt" element={<MaterialReceipt />} />
            <Route path="/reject-material-return" element={<RejectMaterialReturnEntry />} />
            <Route path="/stock-register" element={<StockRegister />} />
            <Route path="/transport-bill" element={<TransportBillEntry />} />
            <Route path="/weight-bridge" element={<WeightBridge />} />
            <Route path="/transport-bill-register" element={<TransportBillRegisterReport />} />
            <Route path="/transport-bill-detail" element={<TransportBillDetailReport />} />
            <Route path="/transport-wise-summary" element={<TransportWiseSummaryReport />} />
            <Route path="/transport-pending-report" element={<TransportPendingBillReport />} />
            <Route path="/material-receipt-report" element={<MaterialReceiptReport />} />
            <Route path="/material-required-pending" element={<MaterialRequiredPendingReport />} />
            <Route path="/job-work-pending-report" element={<JobWorkPendingReport />} />
            <Route path="/material-pending-report" element={<MaterialPendingReport />} />
            <Route path="/pending-material-report" element={<PendingMaterialReport />} />
            <Route path="/ring-rate" element={<RingRateEntry />} />
            <Route path="/cutting-allocation" element={<CuttingAllocationEntry />} />
            <Route path="/worker-cutting" element={<WorkerCuttingList />} />
            <Route path="/grn-report" element={<GRNReport />} />
            <Route path="/grn-list" element={<GRNListEdit />} />
            <Route path="/purchase-reports" element={<PurchaseReportsList />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/alert-center" element={<AdminRoute><AlertCenter /></AdminRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
