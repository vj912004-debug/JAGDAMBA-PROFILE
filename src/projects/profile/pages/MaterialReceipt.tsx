import React, { useState, useMemo, useEffect } from 'react';
import { ClipboardCheck, Search, AlertCircle } from 'lucide-react';
import { useAppContext, type PurchaseReceipt, type PurchaseOrder } from '../store/AppContext';
import toast from 'react-hot-toast';

export const MaterialReceipt: React.FC = () => {
  const { t, purchaseOrders, setPurchaseOrders, purchaseReceipts, setPurchaseReceipts, role } = useAppContext();

  const [selectedPOId, setSelectedPOId] = useState('');
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [remark, setRemark] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [billNo, setBillNo] = useState('');
  const [transporterName, setTransporterName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [tcAvailable, setTcAvailable] = useState<'Yes' | 'No'>('No');

  const selectedPO = useMemo(() => 
    purchaseOrders.find(po => po.id === selectedPOId), 
    [selectedPOId, purchaseOrders]
  );

  const getTotalNos = (po: PurchaseOrder) => {
    return po.items.reduce((sum, item) => sum + (item.nos || 0), 0);
  };

  const getItemReceivedBefore = (itemId: string) => {
    return purchaseReceipts
      .filter(pr => pr.poId === selectedPOId)
      .reduce((sum, pr) => {
        if (pr.items) {
          const matchingItem = pr.items.find(i => i.itemId === itemId);
          return sum + (matchingItem ? matchingItem.receivedQty : 0);
        }
        return sum;
      }, 0);
  };

  useEffect(() => {
    if (selectedPO) {
      const initial: Record<string, number> = {};
      selectedPO.items.forEach(item => {
        const prevRecd = getItemReceivedBefore(item.id);
        const pending = Math.max(0, (item.nos || 0) - prevRecd);
        initial[item.id] = pending;
      });
      setItemQuantities(initial);
    } else {
      setItemQuantities({});
    }
  }, [selectedPOId, purchaseReceipts]);

  const totalReceivedBefore = useMemo(() => {
    if (!selectedPOId) return 0;
    return purchaseReceipts
      .filter(pr => pr.poId === selectedPOId)
      .reduce((sum, pr) => sum + pr.receivedQty, 0);
  }, [selectedPOId, purchaseReceipts]);

  const currentTotalReceived = useMemo(() => {
    return Object.values(itemQuantities).reduce((sum, qty) => sum + qty, 0);
  }, [itemQuantities]);

  const pendingQty = useMemo(() => {
    if (!selectedPO) return 0;
    return getTotalNos(selectedPO) - totalReceivedBefore;
  }, [selectedPO, totalReceivedBefore]);

  const newPendingQty = useMemo(() => {
    return pendingQty - currentTotalReceived;
  }, [pendingQty, currentTotalReceived]);

  const handleSave = () => {
    if (!selectedPOId) { toast.error('Please select a Purchase Order'); return; }
    
    const totalCurrentReceived = Object.values(itemQuantities).reduce((sum, qty) => sum + qty, 0);
    if (totalCurrentReceived <= 0) {
      toast.error('Total received quantity must be greater than 0');
      return;
    }

    const newReceipt: PurchaseReceipt = {
      id: Date.now().toString(),
      poId: selectedPOId,
      receivedQty: totalCurrentReceived,
      date,
      remark: remark.trim(),
      billNo: billNo.trim(),
      transporterName: transporterName.trim(),
      vehicleNo: vehicleNo.trim(),
      tcAvailable,
      items: Object.entries(itemQuantities).map(([itemId, qty]) => ({
        itemId,
        receivedQty: qty
      }))
    };

    setPurchaseReceipts(prev => [...prev, newReceipt]);

    // Update PO Status
    const totalOrdered = getTotalNos(selectedPO!);
    const totalNow = totalReceivedBefore + totalCurrentReceived;
    let newStatus: PurchaseOrder['status'] = 'Partial';
    if (totalNow >= totalOrdered) {
      newStatus = 'Complete';
    }

    setPurchaseOrders(prev => prev.map(po => 
      po.id === selectedPOId ? { ...po, status: newStatus } : po
    ));

    toast.success('Material receipt recorded successfully!', { icon: '✅' });
    
    // Reset fields
    setSelectedPOId('');
    setItemQuantities({});
    setRemark('');
    setBillNo('');
    setTransporterName('');
    setVehicleNo('');
    setTcAvailable('No');
  };

  const activePOs = purchaseOrders.filter(po => po.status !== 'Complete');
  const canEntry = role === 'Admin' || role === 'Office Entry';

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('materialReceipt')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Record goods received against purchase orders (GRN)</p>
      </div>

      {!canEntry && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-800 dark:text-amber-200 font-medium">
          ⚠️ Only Admin or Office Entry role can record material receipts.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selection & Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Select Purchase Order
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Purchase Order *</label>
                <select 
                  value={selectedPOId} 
                  onChange={(e) => setSelectedPOId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">-- Select Pending PO --</option>
                  {activePOs.map(po => (
                    <option key={po.id} value={po.id}>{po.poNumber} - {po.supplierName} ({po.items[0]?.grade || 'N/A'}{po.items.length > 1 ? '...' : ''})</option>
                  ))}
                </select>
              </div>

              {selectedPO && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Received Date</label>
                      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Bill No</label>
                      <input type="text" value={billNo} onChange={(e) => setBillNo(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter Bill No" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Transporter Name</label>
                      <input type="text" value={transporterName} onChange={(e) => setTransporterName(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter Transporter Name" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Vehicle No</label>
                      <input type="text" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="GJ-06-XX-XXXX" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">TC (Test Certificate) Available?</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setTcAvailable('Yes')}
                        className={`flex-1 py-2.5 rounded-lg border text-sm font-bold transition-all duration-300 ${
                          tcAvailable === 'Yes'
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setTcAvailable('No')}
                        className={`flex-1 py-2.5 rounded-lg border text-sm font-bold transition-all duration-300 ${
                          tcAvailable === 'No'
                            ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-100'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Item Details & Received Quantities *</label>
                    <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/20 dark:bg-slate-800/20">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <th className="p-3 font-semibold text-slate-500 dark:text-slate-400">Item Specifications</th>
                            <th className="p-3 font-semibold text-slate-500 dark:text-slate-400 text-center">Ordered</th>
                            <th className="p-3 font-semibold text-slate-500 dark:text-slate-400 text-center">Prev. Recd</th>
                            <th className="p-3 font-semibold text-slate-500 dark:text-slate-400 text-center">Pending</th>
                            <th className="p-3 font-semibold text-slate-500 dark:text-slate-400 text-center w-28">Recd Qty (Nos)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white dark:bg-slate-900">
                          {selectedPO.items.map((item) => {
                            const prevRecd = getItemReceivedBefore(item.id);
                            const pending = Math.max(0, (item.nos || 0) - prevRecd);
                            const curQty = itemQuantities[item.id] ?? 0;

                            return (
                              <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                                <td className="p-3 font-medium text-slate-700 dark:text-slate-200">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-800 dark:text-slate-100">{item.grade}</span>
                                    <span className="text-slate-400 text-[10px]">{item.thickness}mm • {item.width}x{item.length}mm</span>
                                  </div>
                                </td>
                                <td className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">{item.nos} Nos</td>
                                <td className="p-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">{prevRecd} Nos</td>
                                <td className="p-3 text-center text-blue-600 dark:text-blue-400 font-bold">{pending} Nos</td>
                                <td className="p-3 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={curQty || ''}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setItemQuantities(prev => ({
                                        ...prev,
                                        [item.id]: val
                                      }));
                                    }}
                                    className="w-20 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-slate-700 dark:text-slate-200 focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Remark / Batch Info</label>
                    <input 
                      type="text" 
                      value={remark} 
                      onChange={(e) => setRemark(e.target.value)} 
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Heat No, Vehicle No, etc."
                    />
                  </div>
                </div>
              )}
            </div>

            {selectedPO && (
              <div className="mt-8">
                <button 
                  onClick={handleSave}
                  disabled={!canEntry || currentTotalReceived <= 0}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold shadow-md shadow-blue-100 transition-all disabled:opacity-50"
                >
                  <ClipboardCheck className="w-5 h-5" /> Record Receipt
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Card */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 sticky top-6">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">PO Status Summary</h2>
            
            {selectedPO ? (
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Ordered Qty:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{getTotalNos(selectedPO)} Nos</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Previously Received:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{totalReceivedBefore} Nos</span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-100 dark:border-slate-800 pt-2">
                  <span className="text-slate-500 dark:text-slate-400">Currently Pending:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{pendingQty} Nos</span>
                </div>
                
                {currentTotalReceived > 0 && (
                  <div className={`p-3 rounded-lg text-xs font-medium flex gap-2 ${newPendingQty < 0 ? 'bg-red-50 dark:bg-red-900/30 text-red-700 border border-red-100 dark:border-red-800' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800'}`}>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <div>
                      {newPendingQty < 0 ? (
                        <p>ALERT: You are receiving {Math.abs(newPendingQty)} Nos more than ordered!</p>
                      ) : newPendingQty === 0 ? (
                        <p>This will COMPLETE the purchase order.</p>
                      ) : (
                        <p>Remaining Pending after this: {newPendingQty} Nos</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Details</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p><strong>Supplier:</strong> {selectedPO.supplierName}</p>
                    <p><strong>Items:</strong> {selectedPO.items.map(i => i.grade).join(', ')}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Select a PO to see status</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
