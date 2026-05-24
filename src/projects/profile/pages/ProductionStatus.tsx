import React, { useState, useMemo } from 'react';
import { useAppContext, ALL_STAGES, type Stage, type Order } from '../store/AppContext';
import { CheckCircle2, AlertCircle, FastForward, Search, Printer, MapPin } from 'lucide-react';
import { generateOrderEntryPDF } from '../utils/pdfGenerator';
import toast from 'react-hot-toast';

const STAGE_COLORS: Record<Stage, { border: string; bg: string; text: string; dot: string }> = {
  'Order Received': { border: 'border-slate-400', bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-700 dark:text-slate-200', dot: 'bg-slate-400' },
  'Drawing Received': { border: 'border-indigo-400', bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-400' },
  'Nesting Pending': { border: 'border-violet-400', bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-400' },
  'Nesting Done': { border: 'border-purple-400', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-400' },
  'Production Pending': { border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
  'Cutting In Process': { border: 'border-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700', dot: 'bg-amber-500' },
  'Ready': { border: 'border-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  'Dispatch Done': { border: 'border-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  'Challan Done': { border: 'border-teal-500', bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
  'Payment Pending': { border: 'border-rose-400', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-400' },
  'Payment Received': { border: 'border-green-600', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-600' },
};

export const ProductionStatus: React.FC = () => {
  const { t, role, orders, setOrders, dispatches, setDispatches, branch } = useAppContext();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [filterStage, setFilterStage] = useState<string>('All');

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (branch && branch !== 'All') {
      result = result.filter(o => o.location === branch);
    }
    if (filterStage !== 'All') {
      result = result.filter(o => o.stage === filterStage);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.orderNo.toLowerCase().includes(q) ||
        o.partyName.toLowerCase().includes(q) ||
        o.items.some(item =>
          (item.drawingNumber && item.drawingNumber.toLowerCase().includes(q)) ||
          (item.partName && item.partName.toLowerCase().includes(q)) ||
          (item.thickness && item.thickness.toLowerCase().includes(q))
        )
      );
    }
    return result;
  }, [orders, search, branch, filterStage]);

  const canEditStatus = role === 'Admin' || role === 'Production Supervisor' || role === 'Nesting Operator';

  const moveOrder = (id: string, newStage: Stage) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, stage: newStage } : o));
    // Auto-advance logic handled by manual stage updates or specific module triggers
    if (newStage === 'Ready') {
      // Items are ready for partial/full dispatch tracking in the Dispatch module
    }
    toast.success(`Moved to ${newStage}`);
  };

  const advanceStage = (order: Order) => {
    const idx = ALL_STAGES.indexOf(order.stage);
    if (idx < ALL_STAGES.length - 1) {
      moveOrder(order.id, ALL_STAGES[idx + 1]);
    } else {
      toast('Already at final stage!', { icon: '🎉' });
    }
  };

  const totalQty = (order: Order) => order.items.reduce((s, i) => s + i.quantity, 0);

  // Active stages for Kanban (show only stages that have orders, or core production stages)
  const coreStages: Stage[] = ['Order Received', 'Drawing Received', 'Nesting Pending', 'Nesting Done', 'Production Pending', 'Cutting In Process', 'Ready', 'Dispatch Done'];

  return (
    <div className="max-w-full mx-auto space-y-4 fade-in">
      {/* Header & Search */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('productionStatus')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{filteredOrders.length} orders • Live tracking</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
          {branch && branch !== 'All' && (
            <div className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-lg border border-amber-100 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Filtered by {branch}
            </div>
          )}
          <div className="relative flex-1 lg:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search order, party, drawing, part..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full lg:w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="All">All Stages</option>
            {ALL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('kanban')} className={`px-3 py-2 text-xs font-semibold transition-colors ${viewMode === 'kanban' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50'}`}>Kanban</button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-2 text-xs font-semibold transition-colors ${viewMode === 'list' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50'}`}>List</button>
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex overflow-x-auto pb-4 gap-4 min-h-[calc(100vh-14rem)]">
          {coreStages.map(stage => {
            const stageOrders = filteredOrders.filter(o => o.stage === stage);
            const colors = STAGE_COLORS[stage];
            return (
              <div key={stage} className="flex-none w-72 bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200 dark:border-slate-700/60">
                <h2 className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-3 flex items-center justify-between px-1">
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${colors.dot}`}></span>
                    {stage}
                  </span>
                  <span className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[10px] py-0.5 px-2 rounded-full shadow-sm font-bold">
                    {stageOrders.length}
                  </span>
                </h2>
                <div className="space-y-2.5">
                  {stageOrders.map(order => (
                    <div key={order.id} className={`p-3 rounded-xl border-l-[3px] shadow-sm bg-white dark:bg-slate-900 hover:shadow-md transition-all ${order.urgent && stage !== 'Ready' && stage !== 'Dispatch Done' ? 'border-red-500' : colors.border}`}>
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">{order.orderNo}</span>
                        <div className="flex gap-1">
                          {order.urgent && stage !== 'Ready' && stage !== 'Dispatch Done' && (
                            <span className="flex items-center text-[10px] font-bold text-red-600 dark:text-red-400 gap-0.5 bg-red-100 px-1.5 py-0.5 rounded-full">
                              <AlertCircle className="w-2.5 h-2.5" /> Urgent
                            </span>
                          )}
                          {stage === 'Ready' && (
                            <span className="flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 gap-0.5 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Ready
                            </span>
                          )}
                        </div>
                      </div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">{order.partyName}</h3>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5 mb-2">
                        {order.items.length > 0 && (
                          <>
                            <p>Type: <span className="font-medium text-slate-800 dark:text-slate-100">{order.items[0].cuttingType}</span></p>
                            <p>Material: <span className="font-medium text-slate-800 dark:text-slate-100">{order.items[0].materialGrade || order.items[0].materialType} {order.items[0].thickness}</span></p>
                          </>
                        )}
                        <p>Qty: <span className="font-medium text-slate-800 dark:text-slate-100">{totalQty(order)} {order.items[0]?.unitType}</span>
                          {order.items.length > 1 && <span className="text-blue-600 dark:text-blue-400 ml-1">({order.items.length} items)</span>}
                        </p>
                        {order.deliveryDate && (
                          <p>Due: <span className="font-medium text-slate-800 dark:text-slate-100">{new Date(order.deliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span></p>
                        )}
                        <p>By: <span className="font-medium text-blue-600 dark:text-blue-400 italic">{order.handledBy || 'System'}</span></p>
                      </div>

                      {canEditStatus && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                          <select
                            value={order.stage}
                            onChange={(e) => moveOrder(order.id, e.target.value as Stage)}
                            className="flex-1 text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {ALL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button onClick={() => advanceStage(order)} title="Advance Stage" className="p-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg border border-blue-100 dark:border-blue-800 transition-colors">
                            <FastForward className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => generateOrderEntryPDF(order)} title="Print Order" className="p-1.5 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-800 transition-colors">
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {stageOrders.length === 0 && (
                    <div className="text-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 text-xs font-medium">
                      No orders
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="p-3 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Order No</th>
                  <th className="p-3 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Party</th>
                  <th className="p-3 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Items</th>
                  <th className="p-3 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Material</th>
                  <th className="p-3 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Qty</th>
                  <th className="p-3 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Due Date</th>
                  <th className="p-3 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  {canEditStatus && <th className="p-3 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map(order => {
                  const colors = STAGE_COLORS[order.stage];
                  return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                        <td className="p-3 text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
                          <div className="flex items-center gap-2">
                            {order.urgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 pulse-dot"></span>}
                            {order.orderNo}
                          </div>
                        </td>
                        <td className="p-3 text-sm font-medium text-slate-800 dark:text-slate-100">{order.partyName}</td>
                        <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{order.items.length}</td>
                        <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{order.items[0]?.materialGrade || order.items[0]?.materialType} {order.items[0]?.thickness}</td>
                        <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{totalQty(order)}</td>
                        <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '-'}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${colors.bg} ${colors.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
                            {order.stage}
                          </span>
                        </td>
                        {canEditStatus && (
                          <td className="p-3">
                            <div className="flex gap-1.5">
                              <button onClick={(e) => { e.stopPropagation(); advanceStage(order); }} title="Advance" className="p-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg border border-blue-100 dark:border-blue-800 transition-colors">
                                <FastForward className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); generateOrderEntryPDF(order); }} title="Print" className="p-1.5 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-800 transition-colors">
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                      {/* Expanded Detail Row */}
                      {expandedOrder === order.id && (
                        <tr>
                          <td colSpan={canEditStatus ? 8 : 7} className="p-0">
                            <div className="bg-blue-50/50 p-4 border-t border-blue-100 dark:border-blue-800 slide-up">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-xs">
                                <div><span className="text-slate-500 dark:text-slate-400">Contact:</span> <strong>{order.contactPerson || '-'}</strong></div>
                                <div><span className="text-slate-500 dark:text-slate-400">Mobile:</span> <strong>{order.mobileNumber || '-'}</strong></div>
                                <div><span className="text-slate-500 dark:text-slate-400">Location:</span> <strong>{order.location || '-'}</strong></div>
                                <div><span className="text-slate-500 dark:text-slate-400">Handled By:</span> <strong className="text-blue-600 dark:text-blue-400">{order.handledBy || 'System'}</strong></div>
                                <div><span className="text-slate-500 dark:text-slate-400">Address:</span> <strong>{order.deliveryAddress || '-'}</strong></div>
                              </div>
                              {order.remark && <p className="text-xs text-slate-600 dark:text-slate-300 mb-3"><span className="text-slate-500 dark:text-slate-400">Remark:</span> <strong>{order.remark}</strong></p>}
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-white dark:bg-slate-900/60">
                                    <th className="p-2 font-semibold text-slate-500 dark:text-slate-400">Type</th>
                                    <th className="p-2 font-semibold text-slate-500 dark:text-slate-400">Drawing</th>
                                    <th className="p-2 font-semibold text-slate-500 dark:text-slate-400">Part</th>
                                    <th className="p-2 font-semibold text-slate-500 dark:text-slate-400">Material</th>
                                    <th className="p-2 font-semibold text-slate-500 dark:text-slate-400">Thickness</th>
                                    <th className="p-2 font-semibold text-slate-500 dark:text-slate-400">Qty</th>
                                    <th className="p-2 font-semibold text-slate-500 dark:text-slate-400">Unit</th>
                                    <th className="p-2 font-semibold text-slate-500 dark:text-slate-400">Rate</th>
                                    <th className="p-2 font-semibold text-slate-500 dark:text-slate-400">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.items.map(item => (
                                    <tr key={item.id} className="border-t border-slate-200 dark:border-slate-700/50">
                                      <td className="p-2 font-medium">{item.cuttingType}</td>
                                      <td className="p-2">{item.drawingNumber || '-'}</td>
                                      <td className="p-2">{item.partName || '-'}</td>
                                      <td className="p-2">{item.materialGrade || item.materialType}</td>
                                      <td className="p-2">{item.thickness}</td>
                                      <td className="p-2 font-medium">{item.quantity}</td>
                                      <td className="p-2">{item.unitType}</td>
                                      <td className="p-2">₹{item.rate}</td>
                                      <td className="p-2 font-bold">₹{item.amount.toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
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
        </div>
      )}
    </div>
  );
};
