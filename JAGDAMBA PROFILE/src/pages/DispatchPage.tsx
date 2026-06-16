import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { Truck, PackageCheck, ListFilter, AlertCircle, ChevronRight, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';

export const DispatchPage: React.FC = () => {
  const { t, role, dispatches, orders, dispatchItems } = useAppContext();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [vehicleNo, setVehicleNo] = useState('');
  const [remark, setRemark] = useState('');
  const [dispatchQuantities, setDispatchQuantities] = useState<Record<string, number>>({});

  const canEdit = role === 'Admin' || role === 'Dispatch';

  // Orders that have items ready to dispatch (completedQty > dispatchedQty)
  const readyOrders = useMemo(() => {
    return orders.filter(order => 
      order.items.some(item => (item.completedQty || 0) > (item.dispatchedQty || 0))
    );
  }, [orders]);

  const selectedOrder = useMemo(() => 
    orders.find(o => o.id === selectedOrderId), 
  [orders, selectedOrderId]);

  const itemsToDispatch = useMemo(() => {
    if (!selectedOrder) return [];
    return selectedOrder.items.filter(item => (item.completedQty || 0) > (item.dispatchedQty || 0));
  }, [selectedOrder]);

  const handleDispatch = async () => {
    if (!selectedOrderId || !vehicleNo) {
      toast.error('Vehicle Number is required');
      return;
    }

    const payload = itemsToDispatch
      .map(item => ({
        itemId: item.id,
        qty: dispatchQuantities[item.id] || 0
      }))
      .filter(p => p.qty > 0);

    if (payload.length === 0) {
      toast.error('Select at least one item quantity to dispatch');
      return;
    }

    await dispatchItems(selectedOrderId, payload, vehicleNo, remark);
    setSelectedOrderId(null);
    setVehicleNo('');
    setRemark('');
    setDispatchQuantities({});
  };

  const completedDispatches = [...dispatches].sort((a, b) => 
    (b.dispatchDate || '').localeCompare(a.dispatchDate || '')
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 rounded-xl">
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{t('dispatch')} Control</h1>
            <p className="text-sm text-slate-500">{readyOrders.length} orders ready for partial or full dispatch</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ready Orders List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            <ListFilter className="w-3 h-3" />
            Ready for Dispatch
          </div>
          <div className="space-y-2 overflow-y-auto max-h-[600px] pr-1 custom-scrollbar">
            {readyOrders.map(order => (
              <div 
                key={order.id}
                onClick={() => {
                  setSelectedOrderId(order.id);
                  const initialQtys: Record<string, number> = {};
                  order.items.forEach(item => {
                    initialQtys[item.id] = (item.completedQty || 0) - (item.dispatchedQty || 0);
                  });
                  setDispatchQuantities(initialQtys);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer group ${selectedOrderId === order.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 hover:border-blue-200 text-slate-600 shadow-sm'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-mono font-bold ${selectedOrderId === order.id ? 'text-blue-100' : 'text-slate-400'}`}>{order.orderNo}</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedOrderId === order.id ? 'translate-x-1 text-white' : 'text-slate-300'}`} />
                </div>
                <h3 className={`font-bold text-sm mb-1 truncate ${selectedOrderId === order.id ? 'text-white' : 'text-slate-800'}`}>{order.partyName}</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-2xs px-1.5 py-0.5 rounded-full ${selectedOrderId === order.id ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600 font-bold'}`}>
                    {order.items.filter(i => (i.completedQty || 0) > (i.dispatchedQty || 0)).length} Items Ready
                  </span>
                </div>
              </div>
            ))}
            {readyOrders.length === 0 && (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                <PackageCheck className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No completed items awaiting dispatch</p>
              </div>
            )}
          </div>
        </div>

        {/* Dispatch Form */}
        <div className="lg:col-span-2">
          {selectedOrder ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full min-h-[500px]">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedOrder.partyName}</h2>
                  <p className="text-xs text-slate-500 font-medium font-mono">{selectedOrder.orderNo} • {selectedOrder.deliveryAddress}</p>
                </div>
                <Truck className="w-8 h-8 text-blue-500 opacity-20" />
              </div>

              <div className="p-6 flex-1 overflow-y-auto max-h-[400px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-3 text-2xs font-bold text-slate-400 uppercase">Item Description</th>
                      <th className="pb-3 text-2xs font-bold text-slate-400 uppercase text-center">Ready</th>
                      <th className="pb-3 text-2xs font-bold text-slate-400 uppercase text-center">Prev. Disp</th>
                      <th className="pb-3 text-2xs font-bold text-slate-400 uppercase text-center w-32">Qty to Dispatch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {itemsToDispatch.map(item => (
                      <tr key={item.id}>
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">{item.partName || item.cuttingType}</span>
                            <span className="text-2xs text-slate-400">{item.thickness} | {item.materialGrade}</span>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <span className="text-sm font-bold text-emerald-600">{item.completedQty || 0}</span>
                        </td>
                        <td className="py-4 text-center">
                          <span className="text-sm text-slate-400 font-medium">{item.dispatchedQty || 0}</span>
                        </td>
                        <td className="py-4 text-center">
                          <input 
                            type="number"
                            min="0"
                            max={(item.completedQty || 0) - (item.dispatchedQty || 0)}
                            value={dispatchQuantities[item.id] || 0}
                            onChange={(e) => setDispatchQuantities(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                            className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-center text-sm font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-slate-50/80 border-t border-slate-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-slate-400 uppercase ml-1">Vehicle Number</label>
                    <input 
                      type="text" 
                      value={vehicleNo}
                      onChange={(e) => setVehicleNo(e.target.value)}
                      placeholder="GJ-06-AB-1234"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-slate-400 uppercase ml-1">Remark / Delivery Note</label>
                    <input 
                      type="text" 
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="e.g. Driver name, Gate entry..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    onClick={() => setSelectedOrderId(null)}
                    className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDispatch}
                    disabled={!canEdit || !vehicleNo}
                    className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
                  >
                    <PackageCheck className="w-4 h-4" /> Confirm & Create Dispatch
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center p-20 text-center min-h-[500px]">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Truck className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-lg font-bold text-slate-400">Select an Order</h3>
              <p className="text-slate-300 text-sm max-w-xs">Select a ready order from the left to begin the dispatch process.</p>
            </div>
          )}
        </div>
      </div>

      {/* Dispatch History */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Dispatch History
            <span className="bg-emerald-100 text-emerald-600 text-2xs px-2 py-0.5 rounded-full font-bold uppercase">{completedDispatches.length}</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-2xs font-bold tracking-wider text-slate-500 uppercase">Dispatch Date</th>
                <th className="p-4 text-2xs font-bold tracking-wider text-slate-500 uppercase">Order / Party</th>
                <th className="p-4 text-2xs font-bold tracking-wider text-slate-500 uppercase text-center">Qty Dispatched</th>
                <th className="p-4 text-2xs font-bold tracking-wider text-slate-500 uppercase">Vehicle No</th>
                <th className="p-4 text-2xs font-bold tracking-wider text-slate-500 uppercase">DN Number</th>
                <th className="p-4 text-2xs font-bold tracking-wider text-slate-500 uppercase">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {completedDispatches.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <span className="text-sm font-medium text-slate-700">{item.dispatchDate}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700 font-mono">{item.orderNo}</span>
                      <span className="text-xs text-slate-400">{item.partyName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-sm font-bold text-emerald-600">{item.dispatchQty}</span>
                  </td>
                  <td className="p-4 text-sm text-slate-600 font-medium uppercase">{item.vehicleNo}</td>
                  <td className="p-4 text-sm font-mono text-blue-600 font-bold">{item.deliveryNote}</td>
                  <td className="p-4 text-sm text-slate-500 italic">{item.remark || '-'}</td>
                </tr>
              ))}
              {completedDispatches.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <p className="text-slate-300 font-medium">No previous dispatch records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
