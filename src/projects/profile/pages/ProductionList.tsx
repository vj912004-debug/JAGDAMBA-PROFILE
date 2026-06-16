import React, { useState, useMemo } from 'react';
import { useAppContext, EMPLOYEES } from '../store/AppContext';
import { LayoutList, Search, CheckCircle2, Clock, User, ClipboardList, AlertCircle, Download, FileText } from 'lucide-react';
import { generateOrderEntryPDF, generateSalesOrderPDF } from '../utils/pdfGenerator';

export const ProductionList: React.FC = () => {
   const { t, orders, updateItemCompletedQty, updateItemWorker, role, parties } = useAppContext();
  const [search, setSearch] = useState('');
  const [workerFilter, setWorkerFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Flatten all line items across all active orders
  const allItems = useMemo(() => {
    const list: { orderNo: string; partyName: string; orderId: string; item: any }[] = [];
    orders.forEach(order => {
      // Show orders that are in production phases or ready
      if (['Order Received', 'Drawing Received', 'Nesting Pending', 'Nesting Done', 'Production Pending', 'Cutting In Process', 'Ready'].includes(order.stage)) {
        order.items.forEach(item => {
          list.push({
            orderNo: order.orderNo,
            partyName: order.partyName,
            orderId: order.id,
            item
          });
        });
      }
    });
    return list;
  }, [orders]);

  const filteredItems = useMemo(() => {
    return allItems.filter(entry => {
      const q = search.toLowerCase();
      const matchesSearch = 
        (entry.orderNo || '').toLowerCase().includes(q) ||
        (entry.partyName || '').toLowerCase().includes(q) ||
        (entry.item.partName || '').toLowerCase().includes(q) ||
        (entry.item.drawingNumber || '').toLowerCase().includes(q);
      
      const matchesWorker = workerFilter === 'All' || entry.item.assignedWorker === workerFilter;
      const matchesStatus = statusFilter === 'All' || (entry.item.itemStatus || 'Pending') === statusFilter;

      return matchesSearch && matchesWorker && matchesStatus;
    });
  }, [allItems, search, workerFilter, statusFilter]);

  const canEdit = role === 'Admin' || role === 'Production Supervisor' || role === 'Nesting Operator';

  const workerSummary = useMemo(() => {
    const summary: Record<string, { total: number; completed: number }> = {};
    allItems.forEach(entry => {
      const worker = entry.item.assignedWorker || 'Unassigned';
      if (!summary[worker]) summary[worker] = { total: 0, completed: 0 };
      summary[worker].total++;
      if (entry.item.itemStatus === 'Completed') summary[worker].completed++;
    });
    return summary;
  }, [allItems]);

  return (
    <div className="max-w-full mx-auto space-y-4 fade-in">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('productionList')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track worker-wise item completion and task status</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search part, drawing, order..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full lg:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
          <select
            value={workerFilter}
            onChange={(e) => setWorkerFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="All">All Workers</option>
            {EMPLOYEES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Worker Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto pb-2">
        {Object.entries(workerSummary).map(([worker, stats]) => (
          <div key={worker} className={`p-3 rounded-xl border transition-all ${workerFilter === worker ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-200 dark:hover:border-blue-700'}`} onClick={() => setWorkerFilter(worker === workerFilter ? 'All' : worker)}>
            <div className="flex justify-between items-start mb-1">
              <span className="text-2xs font-bold uppercase tracking-wider opacity-80">{worker}</span>
              <User className={`w-3 h-3 ${workerFilter === worker ? 'text-blue-100' : 'text-slate-400'}`} />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-lg font-bold">{stats.completed}/{stats.total}</span>
              <span className="text-2xs font-medium opacity-80">{Math.round((stats.completed / stats.total) * 100)}%</span>
            </div>
            <div className="w-full bg-black/10 h-1 rounded-full mt-2 overflow-hidden">
              <div className={`h-full ${workerFilter === worker ? 'bg-white dark:bg-slate-900' : 'bg-blue-500'}`} style={{ width: `${(stats.completed / stats.total) * 100}%` }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="p-4 table-head-cell">Order / Customer</th>
                <th className="p-4 table-head-cell">Item Details</th>
                <th className="p-4 table-head-cell">Specifications</th>
                <th className="p-4 table-head-cell text-center">Completed / Total Qty</th>
                <th className="p-4 table-head-cell">Assigned Worker</th>
                <th className="p-4 table-head-cell text-center">{t('itemStatus')}</th>
                <th className="p-4 table-head-cell text-center">Docs</th>
                {canEdit && <th className="p-4 table-head-cell text-center">Update Completed</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(({ orderNo, partyName, orderId, item }) => (
                <tr 
                  key={`${orderId}-${item.id}`} 
                  className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                  onClick={() => {
                    const order = orders.find(o => o.id === orderId);
                    if (order) setSelectedOrder(order);
                  }}
                >
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">{orderNo}</span>
                      <span className="text-xs text-slate-400">{partyName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.partName || 'No Part Name'}</span>
                      <span className="text-2xs text-slate-400 font-mono">{item.drawingNumber}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      <span className="text-2xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{item.cuttingType}</span>
                      <span className="text-2xs bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400">{item.materialGrade}</span>
                      <span className="text-2xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{item.thickness}{item.thickness && !item.thickness.toLowerCase().includes('mm') ? 'mm' : ''}</span>
                      {item.cuttingType === 'Circle' && (item.outerDiameter || item.innerDiameter) && (
                        <span className="text-2xs bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-600 font-bold">
                          OD:{item.outerDiameter || '-'} ID:{item.innerDiameter || '-'}
                        </span>
                      )}
                      {item.cuttingType === 'Square' && (item.length || item.width) && (
                        <span className="text-2xs bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-600 font-bold">
                          {item.length || '-'}x{item.width || '-'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {item.completedQty || 0} / {item.quantity}
                      </span>
                      <span className="text-3xs text-slate-400">{item.unitType}</span>
                      <div className="w-12 bg-slate-100 dark:bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${((item.completedQty || 0) / item.quantity) * 100}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {canEdit ? (
                        <select
                          value={item.assignedWorker || ''}
                          onChange={(e) => updateItemWorker(orderId, item.id, e.target.value)}
                          className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">Unassigned</option>
                          {EMPLOYEES.map(emp => (
                            <option key={emp} value={emp}>{emp}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {item.assignedWorker || 'Unassigned'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider
                      ${(item.itemStatus || 'Pending') === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' : 
                        (item.itemStatus || 'Pending') === 'In Progress' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 border border-amber-100' : 
                        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
                      {(item.itemStatus || 'Pending') === 'Completed' ? <CheckCircle2 className="w-3 h-3" /> : 
                       (item.itemStatus || 'Pending') === 'In Progress' ? <Clock className="w-3 h-3" /> : 
                       <AlertCircle className="w-3 h-3" />}
                      {item.itemStatus || 'Pending'}
                    </span>
                    {item.completedAt && (
                      <div className="text-3xs text-slate-400 mt-1">
                        Done: {new Date(item.completedAt).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          const order = orders.find(o => o.id === orderId);
                          if (order) generateSalesOrderPDF(order, parties);
                        }}
                        className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg transition-colors"
                        title="Download Sales Order"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const order = orders.find(o => o.id === orderId);
                          if (order) generateOrderEntryPDF(order);
                        }}
                        className="p-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 border border-emerald-100 dark:border-emerald-800 rounded-lg transition-colors"
                        title="Download Acknowledgement"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  {canEdit && (
                    <td className="p-4 text-center">
                      <div className="flex justify-center items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={item.completedQty || 0}
                          onChange={(e) => updateItemCompletedQty(orderId, item.id, Number(e.target.value))}
                          className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {item.completedQty < item.quantity && (
                          <button
                            onClick={() => updateItemCompletedQty(orderId, item.id, item.quantity)}
                            className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:bg-emerald-900/30 rounded-lg transition-colors"
                            title="Mark All Completed"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <LayoutList className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium text-sm">No items found in active production phase.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Order Item List Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Order Items: {selectedOrder.orderNo}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{selectedOrder.partyName} • Delivery: {new Date(selectedOrder.deliveryDate).toLocaleDateString()}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"
              >
                <AlertCircle className="w-5 h-5 rotate-45" />
              </button>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="p-3 table-head-cell">Item Details</th>
                    <th className="p-3 table-head-cell text-center">Thick</th>
                    <th className="p-3 table-head-cell text-center">Width / OD</th>
                    <th className="p-3 table-head-cell text-center">Length / ID</th>
                    <th className="p-3 table-head-cell text-center">Total Nos</th>
                    <th className="p-3 table-head-cell text-center">Done</th>
                    <th className="p-3 table-head-cell text-center">Grade</th>
                    <th className="p-3 table-head-cell">Worker</th>
                    <th className="p-3 table-head-cell text-center">Status</th>
                    {canEdit && <th className="p-3 table-head-cell text-center">Update</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedOrder.items.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.partName || 'No Part Name'}</span>
                          <span className="text-2xs text-slate-400 font-mono">{item.drawingNumber}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {item.thickness}{item.thickness && !item.thickness.toLowerCase().includes('mm') ? 'mm' : ''}
                        </span>
                      </td>
                      <td className="p-3 text-center text-xs font-medium text-slate-600 dark:text-slate-300">
                        {item.cuttingType === 'Circle' ? (item.outerDiameter || '-') : (item.width || '-')}
                      </td>
                      <td className="p-3 text-center text-xs font-medium text-slate-600 dark:text-slate-300">
                        {item.cuttingType === 'Circle' ? (item.innerDiameter || '-') : (item.length || '-')}
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.quantity}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-xs font-bold ${item.completedQty === item.quantity ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                          {item.completedQty || 0}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-2xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold">
                          {item.materialGrade}
                        </span>
                      </td>
                      <td className="p-3">
                        {canEdit ? (
                          <select
                            value={item.assignedWorker || ''}
                            onChange={(e) => updateItemWorker(selectedOrder.id, item.id, e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="">Unassigned</option>
                            {EMPLOYEES.map(emp => (
                              <option key={emp} value={emp}>{emp}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {item.assignedWorker || 'Unassigned'}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider
                          ${(item.itemStatus || 'Pending') === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' : 
                            (item.itemStatus || 'Pending') === 'In Progress' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 border border-amber-100' : 
                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
                          {item.itemStatus || 'Pending'}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={item.completedQty || 0}
                            onChange={(e) => updateItemCompletedQty(selectedOrder.id, item.id, Number(e.target.value))}
                            className="w-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-800/50">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
