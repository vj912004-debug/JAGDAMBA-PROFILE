import React, { useState, useMemo } from 'react';
import { Download, Search, ClipboardCheck } from 'lucide-react';
import { useAppContext } from '../store/AppContext';

export const GRLReport: React.FC = () => {
  const { t, purchaseOrders, purchaseReceipts } = useAppContext();
  const [search, setSearch] = useState('');

  const grlReport = useMemo(() => {
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
      grlReport.map(pr => 
        `"${pr.date}","${pr.poNumber}","${pr.supplierName}","${pr.grade}","${pr.receivedQty}","${pr.billNo || ''}","${pr.transporterName || ''}","${pr.vehicleNo || ''}","${pr.tcAvailable || 'No'}","${pr.remark || ''}"`
      ).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GRL_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('grlReport')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Goods Receipt List - Tracking incoming material</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search supplier, PO, grade..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">PO Number</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Material Grade</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Received Qty (Nos)</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Bill No</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Transporter</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle No</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">TC</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {grlReport.length === 0 ? (
                <tr><td colSpan={10} className="p-10 text-center text-slate-400 italic">No material receipts recorded yet</td></tr>
              ) : grlReport.map((pr, idx) => (
                <tr key={`${pr.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-sm text-slate-600 font-medium">{pr.date}</td>
                  <td className="p-4 text-sm font-mono text-blue-600 font-bold">{pr.poNumber}</td>
                  <td className="p-4 text-sm font-medium text-slate-800">{pr.supplierName}</td>
                  <td className="p-4 text-sm text-slate-600">{pr.grade}</td>
                  <td className="p-4 text-sm text-emerald-600 text-right font-bold">{pr.receivedQty} Nos</td>
                  <td className="p-4 text-sm text-slate-700 font-semibold">{pr.billNo || '-'}</td>
                  <td className="p-4 text-sm text-slate-600">{pr.transporterName || '-'}</td>
                  <td className="p-4 text-sm font-mono text-slate-700">{pr.vehicleNo || '-'}</td>
                  <td className="p-4 text-sm text-center">
                    {pr.tcAvailable === 'Yes' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">Yes</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">No</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-slate-500 italic">{pr.remark || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
