import React, { useState, useMemo } from 'react';
import { ClipboardCheck, Search, AlertCircle } from 'lucide-react';
import { useAppContext, type PurchaseReceipt, type PurchaseOrder } from '../store/AppContext';
import toast from 'react-hot-toast';

export const MaterialReceipt: React.FC = () => {
  const { t, purchaseOrders, setPurchaseOrders, purchaseReceipts, setPurchaseReceipts, role } = useAppContext();

  const [selectedPOId, setSelectedPOId] = useState('');
  const [receivedQty, setReceivedQty] = useState<number>(0);
  const [remark, setRemark] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const selectedPO = useMemo(() => 
    purchaseOrders.find(po => po.id === selectedPOId), 
    [selectedPOId, purchaseOrders]
  );

  const totalReceivedBefore = useMemo(() => {
    if (!selectedPOId) return 0;
    return purchaseReceipts
      .filter(pr => pr.poId === selectedPOId)
      .reduce((sum, pr) => sum + pr.receivedQty, 0);
  }, [selectedPOId, purchaseReceipts]);

  const pendingQty = useMemo(() => {
    if (!selectedPO) return 0;
    return selectedPO.totalKg - totalReceivedBefore;
  }, [selectedPO, totalReceivedBefore]);

  const newPendingQty = useMemo(() => {
    return pendingQty - receivedQty;
  }, [pendingQty, receivedQty]);

  const handleSave = () => {
    if (!selectedPOId) { toast.error('Please select a Purchase Order'); return; }
    if (receivedQty <= 0) { toast.error('Received Quantity must be greater than 0'); return; }

    const newReceipt: PurchaseReceipt = {
      id: Date.now().toString(),
      poId: selectedPOId,
      receivedQty,
      date,
      remark: remark.trim(),
    };

    setPurchaseReceipts(prev => [...prev, newReceipt]);

    // Update PO Status
    const totalNow = totalReceivedBefore + receivedQty;
    let newStatus: PurchaseOrder['status'] = 'Partial';
    if (totalNow >= selectedPO!.totalKg) {
      newStatus = 'Complete';
    }

    setPurchaseOrders(prev => prev.map(po => 
      po.id === selectedPOId ? { ...po, status: newStatus } : po
    ));

    toast.success('Material receipt recorded successfully!', { icon: '✅' });
    
    // Reset fields
    setSelectedPOId('');
    setReceivedQty(0);
    setRemark('');
  };

  const activePOs = purchaseOrders.filter(po => po.status !== 'Complete');
  const canEntry = role === 'Admin' || role === 'Office Entry';

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{t('materialReceipt')}</h1>
        <p className="text-sm text-slate-500 mt-0.5">Record goods received against purchase orders (GRN)</p>
      </div>

      {!canEntry && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 font-medium">
          ⚠️ Only Admin or Office Entry role can record material receipts.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selection & Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-base font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Select Purchase Order
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Purchase Order *</label>
                <select 
                  value={selectedPOId} 
                  onChange={(e) => setSelectedPOId(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">-- Select Pending PO --</option>
                  {activePOs.map(po => (
                    <option key={po.id} value={po.id}>{po.poNumber} - {po.supplierName} ({po.items[0]?.grade || 'N/A'}{po.items.length > 1 ? '...' : ''})</option>
                  ))}
                </select>
              </div>

              {selectedPO && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Received Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Received Qty (MT) *</label>
                    <input 
                      type="number" 
                      step="0.001"
                      value={receivedQty || ''} 
                      onChange={(e) => setReceivedQty(Number(e.target.value))} 
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.000"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Remark / Batch Info</label>
                    <input 
                      type="text" 
                      value={remark} 
                      onChange={(e) => setRemark(e.target.value)} 
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  disabled={!canEntry || receivedQty <= 0}
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
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">PO Status Summary</h2>
            
            {selectedPO ? (
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Ordered Qty:</span>
                  <span className="font-bold text-slate-800">{selectedPO.totalKg.toFixed(3)} MT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Previously Received:</span>
                  <span className="font-bold text-emerald-600">{totalReceivedBefore.toFixed(3)} MT</span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-100 pt-2">
                  <span className="text-slate-500">Currently Pending:</span>
                  <span className="font-bold text-blue-600">{pendingQty.toFixed(3)} MT</span>
                </div>
                
                {receivedQty > 0 && (
                  <div className={`p-3 rounded-lg text-xs font-medium flex gap-2 ${newPendingQty < 0 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <div>
                      {newPendingQty < 0 ? (
                        <p>ALERT: You are receiving {(Math.abs(newPendingQty)).toFixed(3)} MT more than ordered!</p>
                      ) : newPendingQty === 0 ? (
                        <p>This will COMPLETE the purchase order.</p>
                      ) : (
                        <p>Remaining Pending after this: {newPendingQty.toFixed(3)} MT</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Details</div>
                  <div className="text-xs text-slate-600 space-y-1">
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
