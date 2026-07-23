import React, { useState, useMemo } from 'react';
import { Printer, RefreshCw, Search, RotateCcw, FileText, Edit, Trash2, Eye, FileSpreadsheet } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export const GRNListEdit: React.FC = () => {
  const { purchaseOrders, purchaseReceipts, setPurchaseReceipts, persistErpNow } = useAppContext();
  
  // Filters state
  const [fromDate, setFromDate] = useState('2025-05-01');
  const [toDate, setToDate] = useState('2025-05-20');
  const [supplier, setSupplier] = useState('');
  const [billStatus, setBillStatus] = useState('');
  const [grnNo, setGrnNo] = useState('');
  const [poNo, setPoNo] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [createdBy, setCreatedBy] = useState('');

  // Enriched GRN Data
  const grnData = useMemo(() => {
    return purchaseReceipts.map(pr => {
      const po = purchaseOrders.find(p => p.id === pr.poId);
      const totalItems = pr.items?.length || 0;
      let grnAmount = 0;
      if (po && pr.items) {
        pr.items.forEach(item => {
          const poItem = po.items.find(pi => pi.id === item.itemId);
          if (poItem && poItem.nos) {
            const perPiece = poItem.kg / poItem.nos;
            const receivedKg = perPiece * item.receivedQty;
            grnAmount += receivedKg * poItem.rate;
          }
        });
      }
      return {
        ...pr,
        poNumber: po?.poNumber || '-',
        supplierName: po?.supplierName || '-',
        totalItems,
        grnAmount,
        createdBy: 'Admin', // default for mockup
      };
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [purchaseOrders, purchaseReceipts]);

  // Filtering Logic
  const filteredData = useMemo(() => {
    return grnData.filter(pr => {
      if (fromDate && pr.date < fromDate) return false;
      if (toDate && pr.date > toDate) return false;
      if (supplier && !pr.supplierName.toLowerCase().includes(supplier.toLowerCase())) return false;
      if (billStatus) {
        const isPassed = pr.invoiceStatus === 'Processed';
        if (billStatus === 'Bill Passed' && !isPassed) return false;
        if (billStatus === 'Pending' && isPassed) return false;
      }
      if (grnNo && !(pr.grnNumber || '').toLowerCase().includes(grnNo.toLowerCase())) return false;
      if (poNo && !pr.poNumber.toLowerCase().includes(poNo.toLowerCase())) return false;
      if (vehicleNo && !(pr.vehicleNo || '').toLowerCase().includes(vehicleNo.toLowerCase())) return false;
      return true;
    });
  }, [grnData, fromDate, toDate, supplier, billStatus, grnNo, poNo, vehicleNo]);

  // Pagination (Mocked for UI)
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Metrics
  const totalGrnCount = filteredData.length;
  const totalAmount = filteredData.reduce((sum, pr) => sum + pr.grnAmount, 0);
  const billPassedAmount = filteredData.filter(pr => pr.invoiceStatus === 'Processed').reduce((sum, pr) => sum + (pr.invoiceAmount || pr.grnAmount), 0);
  const pendingAmount = filteredData.filter(pr => pr.invoiceStatus !== 'Processed').reduce((sum, pr) => sum + pr.grnAmount, 0);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleReset = () => {
    setFromDate('');
    setToDate('');
    setSupplier('');
    setBillStatus('');
    setGrnNo('');
    setPoNo('');
    setVehicleNo('');
    setCreatedBy('');
  };

  const handleDelete = async (id: string, invoiceStatus?: string) => {
    if (invoiceStatus === 'Processed') {
      toast.error('Bill Passed GRN cannot be deleted.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this GRN?')) {
      const updated = purchaseReceipts.filter(pr => pr.id !== id);
      setPurchaseReceipts(updated);
      await persistErpNow({ purchaseReceipts: updated });
      toast.success('GRN deleted successfully');
    }
  };

  return (
    <div className="w-full h-full bg-[#f8f9fa] p-4 flex flex-col gap-4 fade-in">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-3 shadow-sm rounded-md border border-gray-200">
        <h1 className="text-xl font-bold text-[#1e3a8a] uppercase tracking-wide">GRN EDIT / DELETE LIST</h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 bg-[#28a745] hover:bg-green-700 text-white px-3 py-1.5 rounded shadow text-sm font-medium transition-colors">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-[#fd7e14] hover:bg-orange-600 text-white px-3 py-1.5 rounded shadow text-sm font-medium transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button className="flex items-center gap-1.5 bg-[#0d6efd] hover:bg-blue-700 text-white px-3 py-1.5 rounded shadow text-sm font-medium transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 shadow-sm rounded-md border border-gray-200 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1 font-medium">From Date</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1 font-medium">To Date</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1 font-medium">Supplier</label>
          <select value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500">
            <option value="">-- All Supplier --</option>
            {Array.from(new Set(grnData.map(d => d.supplierName))).filter(s => s !== '-').map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1 font-medium">Bill Status</label>
          <select value={billStatus} onChange={e => setBillStatus(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500">
            <option value="">-- All --</option>
            <option value="Bill Passed">Bill Passed</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1 font-medium">GRN No / Ref No</label>
          <input type="text" placeholder="Enter GRN No / Ref No" value={grnNo} onChange={e => setGrnNo(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1 font-medium">PO No</label>
          <input type="text" placeholder="Enter PO No" value={poNo} onChange={e => setPoNo(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1 font-medium">Vehicle No</label>
          <input type="text" placeholder="Enter Vehicle No" value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1 font-medium">Created By</label>
          <select value={createdBy} onChange={e => setCreatedBy(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500">
            <option value="">-- All --</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        <div className="col-span-1 lg:col-span-2 flex items-end justify-end gap-2">
          <button className="flex items-center gap-1.5 bg-[#0d6efd] hover:bg-blue-700 text-white px-5 py-1.5 rounded shadow text-sm font-medium transition-colors">
            <Search className="w-4 h-4" /> Search
          </button>
          <button onClick={handleReset} className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-1.5 rounded shadow-sm text-sm font-medium transition-colors">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#e8f3fe] border border-[#b8d6f9] rounded-md p-4 flex items-center shadow-sm">
          <div className="bg-[#0d6efd] p-3 rounded-lg mr-4 text-white">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Total GRN</p>
            <h3 className="text-xl font-bold text-[#0d6efd]">{totalGrnCount}</h3>
          </div>
        </div>
        
        <div className="bg-[#e6f8ec] border border-[#a6e6c2] rounded-md p-4 flex items-center shadow-sm">
          <div className="bg-[#198754] p-3 rounded-lg mr-4 text-white">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Total Amount</p>
            <h3 className="text-xl font-bold text-[#198754]">₹ {formatCurrency(totalAmount)}</h3>
          </div>
        </div>

        <div className="bg-[#fff3cd] border border-[#ffe69c] rounded-md p-4 flex items-center shadow-sm">
          <div className="bg-[#fd7e14] p-3 rounded-lg mr-4 text-white">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Bill Passed Amount</p>
            <h3 className="text-xl font-bold text-[#fd7e14]">₹ {formatCurrency(billPassedAmount)}</h3>
          </div>
        </div>

        <div className="bg-[#f3e8fc] border border-[#d8bbf7] rounded-md p-4 flex items-center shadow-sm">
          <div className="bg-[#6f42c1] p-3 rounded-lg mr-4 text-white">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Pending Amount</p>
            <h3 className="text-xl font-bold text-[#6f42c1]">₹ {formatCurrency(pendingAmount)}</h3>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white shadow-sm rounded-md border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1e3a8a] text-white">
              <tr>
                <th className="px-3 py-3 font-semibold border-r border-[#2d4b9c] text-center w-12">Sr No</th>
                <th className="px-3 py-3 font-semibold border-r border-[#2d4b9c]">GRN No</th>
                <th className="px-3 py-3 font-semibold border-r border-[#2d4b9c]">GRN Date</th>
                <th className="px-3 py-3 font-semibold border-r border-[#2d4b9c]">PO No</th>
                <th className="px-3 py-3 font-semibold border-r border-[#2d4b9c]">Supplier Name</th>
                <th className="px-3 py-3 font-semibold border-r border-[#2d4b9c] text-center">Total Items</th>
                <th className="px-3 py-3 font-semibold border-r border-[#2d4b9c] text-right">GRN Amount (₹)</th>
                <th className="px-3 py-3 font-semibold border-r border-[#2d4b9c] text-right">Bill Amount (₹)</th>
                <th className="px-3 py-3 font-semibold border-r border-[#2d4b9c] text-center">Bill Status</th>
                <th className="px-3 py-3 font-semibold border-r border-[#2d4b9c]">Created By</th>
                <th className="px-3 py-3 font-semibold text-center w-64">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500 italic">No GRN records found</td>
                </tr>
              ) : paginatedData.map((pr, index) => {
                const isPassed = pr.invoiceStatus === 'Processed';
                return (
                  <tr key={pr.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-center border-r border-gray-100">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-3 py-2 border-r border-gray-100">{pr.grnNumber || '-'}</td>
                    <td className="px-3 py-2 border-r border-gray-100">{pr.date}</td>
                    <td className="px-3 py-2 border-r border-gray-100">{pr.poNumber}</td>
                    <td className="px-3 py-2 border-r border-gray-100">{pr.supplierName}</td>
                    <td className="px-3 py-2 text-center border-r border-gray-100">{pr.totalItems}</td>
                    <td className="px-3 py-2 text-right border-r border-gray-100">{formatCurrency(pr.grnAmount)}</td>
                    <td className="px-3 py-2 text-right border-r border-gray-100">{isPassed ? formatCurrency(pr.invoiceAmount || pr.grnAmount) : '0.00'}</td>
                    <td className="px-3 py-2 text-center border-r border-gray-100">
                      {isPassed ? (
                        <span className="inline-block px-2 py-0.5 border border-green-300 text-green-700 bg-green-50 rounded text-xs font-semibold">Bill Passed</span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 border border-orange-300 text-orange-600 bg-orange-50 rounded text-xs font-semibold">Pending</span>
                      )}
                    </td>
                    <td className="px-3 py-2 border-r border-gray-100">{pr.createdBy}</td>
                    <td className="px-3 py-2 flex items-center justify-center gap-1.5">
                      <button onClick={() => toast('Edit feature under construction')} className="flex items-center gap-1 bg-[#0d6efd] hover:bg-blue-700 text-white px-2 py-1 rounded text-[11px] font-medium transition-colors">
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => handleDelete(pr.id, pr.invoiceStatus)} className={clsx("flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors", isPassed ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-[#dc3545] hover:bg-red-700 text-white")}>
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                      <button onClick={() => toast('View feature under construction')} className="flex items-center gap-1 bg-[#17a2b8] hover:bg-cyan-700 text-white px-2 py-1 rounded text-[11px] font-medium transition-colors">
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Footer / Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center p-3 border-t border-gray-200 bg-gray-50 mt-auto gap-4 sm:gap-0">
          <div className="text-xs text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
          </div>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-2.5 py-1 border border-gray-300 bg-white text-gray-600 rounded text-xs hover:bg-gray-100 disabled:opacity-50">&laquo;</button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={clsx("px-2.5 py-1 border rounded text-xs", currentPage === idx + 1 ? "bg-[#0d6efd] text-white border-[#0d6efd]" : "border-gray-300 bg-white text-gray-600 hover:bg-gray-100")}
              >
                {idx + 1}
              </button>
            ))}
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-2.5 py-1 border border-gray-300 bg-white text-gray-600 rounded text-xs hover:bg-gray-100 disabled:opacity-50">&raquo;</button>
          </div>
        </div>
      </div>

      {/* Note Block */}
      <div className="flex flex-wrap gap-4 mt-2">
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded shadow-sm border border-gray-200">
          <Edit className="w-3.5 h-3.5 text-[#0d6efd]" />
          <span className="text-xs text-gray-600"><strong className="text-[#0d6efd]">Edit :</strong> GRN details edit karva mate.</span>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded shadow-sm border border-gray-200">
          <Trash2 className="w-3.5 h-3.5 text-[#dc3545]" />
          <span className="text-xs text-gray-600"><strong className="text-[#dc3545]">Delete :</strong> GRN delete karva mate.</span>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded shadow-sm border border-gray-200">
          <Eye className="w-3.5 h-3.5 text-[#17a2b8]" />
          <span className="text-xs text-gray-600"><strong className="text-[#17a2b8]">View :</strong> GRN details jova mate.</span>
        </div>
        <div className="flex items-center gap-2 bg-[#fff3cd] px-3 py-1.5 rounded shadow-sm border border-[#ffe69c] ml-auto">
          <span className="text-xs text-[#856404]"><strong>Note :</strong> Bill Passed GRN delete kari shakay nahi. (Only Pending GRN delete kari shakay.)</span>
        </div>
      </div>
    </div>
  );
};
