import React, { useState, useMemo } from 'react';
import { Clock, CheckCircle, Users, Box, Download, Search, Eye, X, ClipboardCheck, Edit, Trash2, Mail } from 'lucide-react';
import { useAppContext, type PurchaseOrder } from '../store/AppContext';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

import { PurchaseOrderPrint } from '../components/PurchaseOrderPrint';
import { downloadPDF, generatePurchaseReportPDF } from '../utils/pdfGenerator';

type TabType = 'pending' | 'completed' | 'supplier' | 'item';

export const PurchaseReports: React.FC = () => {
  const { t, purchaseOrders, purchaseReceipts, role, deletePurchaseOrder } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [search, setSearch] = useState('');
  const [previewPO, setPreviewPO] = useState<PurchaseOrder | null>(null);
  const [showReceipts, setShowReceipts] = useState<string | null>(null);

  // Helper to get total received for a PO (in Nos)
  const getReceivedQty = (poId: string) => {
    return purchaseReceipts
      .filter(pr => pr.poId === poId)
      .reduce((sum, pr) => sum + pr.receivedQty, 0);
  };

  // Helper to get total ordered Nos for a PO
  const getTotalNos = (po: PurchaseOrder) => {
    return po.items.reduce((sum, item) => sum + (item.nos || 0), 0);
  };

  const getReceiptsForPO = (poId: string) => {
    return purchaseReceipts.filter(pr => pr.poId === poId).sort((a, b) => b.date.localeCompare(a.date));
  };

  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter(po => {
      const itemGrades = po.items.map(i => i.grade.toLowerCase()).join(' ');
      const matchesSearch = po.supplierName.toLowerCase().includes(search.toLowerCase()) || 
                           po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
                           itemGrades.includes(search.toLowerCase());
      
      if (!matchesSearch) return false;

      if (activeTab === 'pending') return po.status !== 'Complete';
      if (activeTab === 'completed') return po.status === 'Complete';
      return true;
    });
  }, [purchaseOrders, activeTab, search]);

  const supplierWise = useMemo(() => {
    const map: Record<string, { ordered: number, received: number, pending: number, count: number }> = {};
    purchaseOrders.forEach(po => {
      const received = getReceivedQty(po.id);
      const totalNos = getTotalNos(po);
      if (!map[po.supplierName]) {
        map[po.supplierName] = { ordered: 0, received: 0, pending: 0, count: 0 };
      }
      map[po.supplierName].ordered += totalNos;
      map[po.supplierName].received += received;
      map[po.supplierName].pending += Math.max(0, totalNos - received);
      map[po.supplierName].count += 1;
    });
    return Object.entries(map).sort((a, b) => b[1].ordered - a[1].ordered);
  }, [purchaseOrders, purchaseReceipts]);

  const itemWise = useMemo(() => {
    const map: Record<string, { ordered: number, received: number, pending: number }> = {};
    purchaseOrders.forEach(po => {
      po.items.forEach(item => {
        const key = `${item.grade} | ${item.thickness}`;
        const received = 0; // Simplified for item-wise
        if (!map[key]) {
          map[key] = { ordered: 0, received: 0, pending: 0 };
        }
        map[key].ordered += (item.nos || 0);
        map[key].received += received;
        map[key].pending += Math.max(0, (item.nos || 0) - received);
      });
    });
    return Object.entries(map).sort((a, b) => b[1].ordered - a[1].ordered);
  }, [purchaseOrders, purchaseReceipts]);



  const handleExport = () => {
    // Fake export
    const csvContent = "PO Number,Supplier,Total Nos,Received,Pending,Status\n" + 
      filteredOrders.map(o => {
        const received = getReceivedQty(o.id);
        const totalNos = getTotalNos(o);
        return `${o.poNumber},${o.supplierName},${totalNos},${received},${totalNos - received},${o.status}`;
      }).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase_report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('purchaseReports')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track and manage your material procurement</p>
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
          <button onClick={handleExport} className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-all">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button 
            onClick={() => generatePurchaseReportPDF(filteredOrders)} 
            disabled={filteredOrders.length === 0}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-200"
          >
            <Download className="w-4 h-4" /> PDF Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-max border border-slate-200 dark:border-slate-700/50">
        <TabButton active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} icon={Clock} label={t('pendingPurchase')} />
        <TabButton active={activeTab === 'completed'} onClick={() => setActiveTab('completed')} icon={CheckCircle} label={t('completedPurchase')} />
        <TabButton active={activeTab === 'supplier'} onClick={() => setActiveTab('supplier')} icon={Users} label={t('supplierWise')} />
        <TabButton active={activeTab === 'item'} onClick={() => setActiveTab('item')} icon={Box} label={t('itemWiseStock')} />
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {(activeTab === 'pending' || activeTab === 'completed') && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">PO Number</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Supplier</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Material Grade</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Ordered (Nos)</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Received (Nos)</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Pending (Nos)</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={9} className="p-10 text-center text-slate-400 italic">No records found</td></tr>
                ) : filteredOrders.map(po => {
                  const received = getReceivedQty(po.id);
                  const totalNos = getTotalNos(po);
                  const pending = totalNos - received;
                  const itemDisplay = po.items.length > 1 
                    ? `${po.items[0].grade} (+${po.items.length - 1} more)`
                    : po.items[0]?.grade || 'N/A';
                  return (
                    <React.Fragment key={po.id}>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                      <td className="p-4 font-mono text-sm text-blue-600 dark:text-blue-400 font-semibold">{po.poNumber}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{po.date}</td>
                      <td className="p-4 text-sm font-medium text-slate-800 dark:text-slate-100">{po.supplierName}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{itemDisplay}</td>
                      <td className="p-4 text-sm text-slate-800 dark:text-slate-100 text-right font-medium">{totalNos}</td>
                      <td className="p-4 text-sm text-emerald-600 dark:text-emerald-400 text-right font-medium">{received}</td>
                      <td className={clsx("p-4 text-sm text-right font-bold", pending > 0 ? "text-blue-600 dark:text-blue-400" : "text-slate-400")}>
                        {pending}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className={clsx(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-max",
                            po.status === 'Complete' ? "bg-emerald-100 text-emerald-700 dark:text-emerald-400 border border-emerald-200" :
                            po.status === 'Partial' ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700" :
                            "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          )}>
                            {po.status}
                          </span>
                          {po.status === 'Partial' && (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold ml-1">
                              ({pending} Nos Pending)
                            </span>
                          )}
                          {po.status === 'Pending' && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold ml-1">
                              ({totalNos} Nos Pending)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => setPreviewPO(po)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:bg-blue-900/30 rounded-lg transition-colors"
                            title="Preview & Print"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {(role === 'Admin' || role === 'Office Entry') && (
                            <button 
                              onClick={() => navigate(`/purchase-order?edit=${po.id}`)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Purchase Order"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {(role === 'Admin' || role === 'Office Entry') && (
                            <button 
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this Purchase Order?')) {
                                  deletePurchaseOrder(po.id);
                                }
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Purchase Order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => setShowReceipts(showReceipts === po.id ? null : po.id)}
                            className={clsx(
                              "p-1.5 rounded-lg transition-colors",
                              showReceipts === po.id ? "bg-amber-100 text-amber-700" : "text-amber-600 hover:bg-amber-50 dark:bg-amber-900/30"
                            )}
                            title="View Receipts"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {showReceipts === po.id && (
                      <tr>
                        <td colSpan={9} className="p-0 bg-amber-50/30 dark:bg-amber-900/30 border-b border-amber-100/50">
                          <div className="p-4 slide-down">
                            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2 uppercase tracking-widest">
                              <ClipboardCheck className="w-3 h-3" />
                              Receipt History for {po.poNumber}
                            </h4>
                            <div className="overflow-hidden rounded-xl border border-amber-100 bg-white dark:bg-slate-900">
                              <table className="w-full text-left border-collapse">
                                <thead className="bg-amber-50 dark:bg-amber-900/30">
                                  <tr>
                                    <th className="p-2.5 text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase">Date</th>
                                    <th className="p-2.5 text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase text-right">Qty Received</th>
                                    <th className="p-2.5 text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase text-right">Qty Pending</th>
                                    <th className="p-2.5 text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase">Received Items</th>
                                    <th className="p-2.5 text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase">Remark</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-50">
                                  {getReceiptsForPO(po.id).length === 0 ? (
                                    <tr><td colSpan={5} className="p-4 text-center text-xs text-slate-400 italic">No receipts recorded yet</td></tr>
                                  ) : getReceiptsForPO(po.id).map(pr => {
                                    const totalNos = getTotalNos(po);
                                    const receipts = purchaseReceipts.filter(r => r.poId === po.id);
                                    const totalReceivedUpToPr = receipts
                                      .filter(r => r.id <= pr.id)
                                      .reduce((sum, r) => sum + r.receivedQty, 0);
                                    const pendingAfterPr = Math.max(0, totalNos - totalReceivedUpToPr);

                                    return (
                                      <tr key={pr.id} className="align-top hover:bg-amber-50/20 dark:bg-amber-900/20 transition-colors">
                                        <td className="p-2.5 text-xs text-slate-600 dark:text-slate-300 font-medium">{pr.date}</td>
                                        <td className="p-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold text-right">{pr.receivedQty} Nos</td>
                                        <td className={clsx("p-2.5 text-xs font-bold text-right", pendingAfterPr > 0 ? "text-blue-600 dark:text-blue-400" : "text-slate-400")}>
                                          {pendingAfterPr} Nos
                                        </td>
                                        <td className="p-2.5 text-xs text-slate-700 dark:text-slate-200">
                                          {pr.items && pr.items.length > 0 ? (
                                            <div className="flex flex-col gap-1.5 max-w-xs">
                                              {pr.items.map(ri => {
                                                const poItem = po.items.find(i => i.id === ri.itemId);
                                                if (!poItem || ri.receivedQty <= 0) return null;
                                                
                                                const totalItemReceivedUpToPr = receipts
                                                  .filter(r => r.id <= pr.id)
                                                  .reduce((sum, r) => {
                                                    const match = r.items?.find(i => i.itemId === ri.itemId);
                                                    return sum + (match ? match.receivedQty : 0);
                                                  }, 0);
                                                const itemPendingAfterPr = Math.max(0, (poItem.nos || 0) - totalItemReceivedUpToPr);

                                                return (
                                                  <div key={ri.itemId} className="flex flex-col gap-0.5 text-[10px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded px-1.5 py-1">
                                                    <span className="font-semibold text-slate-600 dark:text-slate-300">{poItem.grade} ({poItem.thickness}mm)</span>
                                                    <div className="flex justify-between gap-4 text-[9px] mt-0.5">
                                                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Recd: {ri.receivedQty} Nos</span>
                                                      <span className={clsx("font-bold", itemPendingAfterPr > 0 ? "text-blue-600 dark:text-blue-400" : "text-slate-400")}>
                                                        Pend: {itemPendingAfterPr} Nos
                                                      </span>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          ) : (
                                            <span className="text-slate-400 italic text-[10px]">Flat receipt</span>
                                          )}
                                        </td>
                                        <td className="p-2.5 text-xs text-slate-500 dark:text-slate-400 italic">{pr.remark || '-'}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'supplier' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Supplier Name</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Total POs</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Total Ordered (Nos)</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Total Received (Nos)</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Total Pending (Nos)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplierWise.map(([supplier, data]) => (
                  <tr key={supplier} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-800 dark:text-slate-100">{supplier}</td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300 text-center">{data.count}</td>
                    <td className="p-4 text-sm text-slate-800 dark:text-slate-100 text-right font-medium">{data.ordered.toFixed(0)}</td>
                    <td className="p-4 text-sm text-emerald-600 dark:text-emerald-400 text-right font-medium">{data.received.toFixed(0)}</td>
                    <td className="p-4 text-sm text-blue-600 dark:text-blue-400 text-right font-bold">{data.pending.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'item' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Material Grade & Size</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Ordered (Nos)</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Received (Nos)</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">In Transit / Pending (Nos)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itemWise.map(([item, data]) => (
                  <tr key={item} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-800 dark:text-slate-100">{item}</td>
                    <td className="p-4 text-sm text-slate-800 dark:text-slate-100 text-right font-medium">{data.ordered}</td>
                    <td className="p-4 text-sm text-emerald-600 dark:text-emerald-400 text-right font-medium">{data.received}</td>
                    <td className="p-4 text-sm text-blue-600 dark:text-blue-400 text-right font-bold">{data.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}


      </div>

      {/* Preview Modal */}
      {previewPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[95vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-900 rounded-t-3xl">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Box className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Purchase Order Preview - {previewPO.poNumber}
              </h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => downloadPDF('po-print-area', `PO_${previewPO.poNumber}`)} 
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <button 
                  onClick={() => {
                    const el = document.getElementById('po-print-area');
                    if (!el) return;
                    const printWindow = window.open('', '_blank', 'width=900,height=700');
                    if (!printWindow) return;
                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta charset="UTF-8" />
                          <title>Purchase Order - ${previewPO.poNumber}</title>
                          <style>
                            * { box-sizing: border-box; margin: 0; padding: 0; }
                            body { background: #fff; }
                            @page { size: A4; margin: 0; }
                            @media print {
                              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            }
                          </style>
                        </head>
                        <body>
                          ${el.outerHTML}
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.focus();
                    setTimeout(() => {
                      printWindow.print();
                      printWindow.close();
                    }, 500);
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
                >
                  Print PO
                </button>
                {previewPO.supplierEmail && (
                  <button 
                    onClick={() => {
                      const body = [
                        `Dear ${previewPO.supplierName},`,
                        ``,
                        `Please find the attached Purchase Order ${previewPO.poNumber} from Jagdamba Profile.`,
                        `Kindly acknowledge receipt and confirm the delivery schedule.`,
                        ``,
                        `Thanks & Regards,`,
                        `Jagdamba Profile`,
                        `504/1/A, GIDC Makarpura, Vadodara - 390010`,
                        `Mo: 8799617251 / 8799617252`,
                      ].join('\n');

                      const subject = encodeURIComponent(`Purchase Order ${previewPO.poNumber} - Jagdamba Profile`);
                      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${previewPO.supplierEmail}&su=${subject}&body=${encodeURIComponent(body)}`;
                      window.open(gmailUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
                  >
                    <Mail className="w-4 h-4" /> Email PO
                  </button>
                )}
                <button 
                  onClick={() => setPreviewPO(null)} 
                  className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-grow overflow-y-auto p-8 bg-slate-200 dark:bg-slate-700/50">
              <div className="scale-75 sm:scale-90 lg:scale-100 origin-top">
                <PurchaseOrderPrint po={previewPO} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon: Icon, label }) => (
  <button 
    onClick={onClick}
    className={clsx(
      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
      active ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100"
    )}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);
