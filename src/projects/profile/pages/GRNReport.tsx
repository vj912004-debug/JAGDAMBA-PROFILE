import React, { useState, useMemo } from 'react';
import { Download, Search, CheckCircle, FileText, X } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { PoToolbarActions } from '../components/PoToolbarActions';
import { clsx } from 'clsx';

export const GRNReport: React.FC = () => {
  const { t, purchaseOrders, purchaseReceipts, role, user, setPurchaseReceipts, persistErpNow } = useAppContext();
  const [search, setSearch] = useState('');
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  
  // Invoice processing modal state
  const [processingGrn, setProcessingGrn] = useState<string | null>(null);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  
  const canProcessInvoice = role === 'Admin' || role === 'Accounts User';

  const toolbarPo = useMemo(
    () => (selectedPoId ? purchaseOrders.find(p => p.id === selectedPoId) ?? null : null),
    [selectedPoId, purchaseOrders],
  );

  const grnReport = useMemo(() => {
    return purchaseReceipts.map(pr => {
      const po = purchaseOrders.find(p => p.id === pr.poId);
      return {
        ...pr,
        poNumber: po?.poNumber || 'Unknown',
        supplierName: po?.supplierName || 'Unknown',
        grade: po?.items[0]?.grade || 'N/A'
      };
    })
    .filter(pr => 
      pr.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      pr.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      pr.grade.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  }, [purchaseOrders, purchaseReceipts, search]);

  const handleExport = () => {
    const csvContent = "Date,PO Number,Supplier,Material Grade,Received Qty (Nos),Bill No,Transporter Name,Vehicle No,TC Available,Remark\n" + 
      grnReport.map(pr => 
        `"${pr.date}","${pr.poNumber}","${pr.supplierName}","${pr.grade}","${pr.receivedQty}","${pr.billNo || ''}","${pr.transporterName || ''}","${pr.vehicleNo || ''}","${pr.tcAvailable || 'No'}","${pr.remark || ''}"`
      ).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GRN_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleProcessInvoice = async () => {
    if (!processingGrn) return;
    const amount = parseFloat(invoiceAmount);
    
    const updated = purchaseReceipts.map(pr => 
      pr.id === processingGrn ? { 
        ...pr, 
        invoiceStatus: 'Processed' as const, 
        invoiceAmount: amount || 0,
        invoiceProcessedBy: user?.displayName || 'Unknown',
        invoiceProcessedDate: new Date().toISOString()
      } : pr
    );
    setPurchaseReceipts(updated);
    try {
      await persistErpNow({ purchaseReceipts: updated });
      setProcessingGrn(null);
      setInvoiceAmount('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('grnReport')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Goods Receipt Note Report - Tracking incoming material</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search supplier, PO, grade..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
            <Download className="w-4 h-4" /> Export
          </button>
          <PoToolbarActions purchaseOrder={toolbarPo} />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">PO Number</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Supplier</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Material Grade</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Received Qty (Nos)</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bill No</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Inspection</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Transporter</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vehicle No</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">TC</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invoice Status</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Accounts Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {grnReport.length === 0 ? (
                <tr><td colSpan={10} className="p-10 text-center text-slate-400 italic">No material receipts recorded yet</td></tr>
              ) : grnReport.map((pr, idx) => (
                <tr
                  key={`${pr.id}-${idx}`}
                  onClick={() => setSelectedPoId(pr.poId)}
                  className={clsx(
                    'hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer',
                    selectedPoId === pr.poId && 'ring-2 ring-inset ring-brand-blue bg-blue-50/40 dark:bg-blue-900/20',
                  )}
                >
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300 font-medium">{pr.date}</td>
                  <td className="p-4 text-sm font-mono text-blue-600 dark:text-blue-400 font-bold">{pr.poNumber}</td>
                  <td className="p-4 text-sm font-medium text-slate-800 dark:text-slate-100">{pr.supplierName}</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{pr.grade}</td>
                  <td className="p-4 text-sm text-emerald-600 dark:text-emerald-400 text-right font-bold">{pr.receivedQty} Nos</td>
                  <td className="p-4 text-sm text-slate-700 dark:text-slate-200 font-semibold">{pr.billNo || '-'}</td>
                  <td className="p-4 text-sm text-center">
                    {pr.conditionOfGoods === 'Rejected' ? (
                       <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full" title={pr.inspectionRemark}>Rejected</span>
                    ) : pr.conditionOfGoods === 'Partial' ? (
                       <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full" title={pr.inspectionRemark}>Partial</span>
                    ) : (
                       <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full" title={pr.inspectionRemark}>Accepted</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{pr.transporterName || '-'}</td>
                  <td className="p-4 text-sm font-mono text-slate-700 dark:text-slate-200">{pr.vehicleNo || '-'}</td>
                  <td className="p-4 text-sm text-center">
                    {pr.tcAvailable === 'Yes' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">Yes</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">No</span>
                    )}
                  </td>
                  <td className="p-4 text-sm font-medium">
                    {pr.invoiceStatus === 'Processed' ? (
                      <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5"/> Processed</span>
                    ) : (
                      <span className="text-amber-600">Pending</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-right">
                    {pr.invoiceStatus === 'Processed' ? (
                      <div className="text-xs text-slate-500">₹{pr.invoiceAmount}</div>
                    ) : canProcessInvoice ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); setProcessingGrn(pr.id); }}
                        className="bg-brand-blue text-white px-3 py-1 rounded shadow-sm text-xs hover:bg-blue-700 transition-colors"
                      >
                        Process
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Process Invoice Modal */}
      {processingGrn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col scale-in">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-blue" />
                Process Invoice
              </h3>
              <button onClick={() => setProcessingGrn(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                You are marking the invoice for this GRN as Processed. Please enter the finalized invoice amount.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Invoice Amount (₹)</label>
                <input 
                  type="number" 
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                  placeholder="e.g. 50000"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
              <button onClick={() => setProcessingGrn(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleProcessInvoice} className="px-6 py-2 text-sm font-bold text-white bg-brand-blue hover:bg-blue-700 rounded-xl shadow-sm transition-colors flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Mark Processed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
