import React, { useState } from 'react';
import { useAppContext, type ChallanRecord, type Order } from '../store/AppContext';
import { ScrollText, Plus, X, CheckCircle, Clock, Download, Eye, Trash2 } from 'lucide-react';
import { generateChallanPDF } from '../utils/pdfGenerator';
import toast from 'react-hot-toast';
import { ChallanPrint } from '../components/ChallanPrint';

export const ChallanPage: React.FC = () => {
  const { t, role, challans, setChallans, orders, dispatches, nextChallanNo, parties } = useAppContext();
  const [showCreate, setShowCreate] = useState(false);
  const [previewChallan, setPreviewChallan] = useState<{ challan: ChallanRecord, order?: Order } | null>(null);

  // Form
  const [selectedDispatchId, setSelectedDispatchId] = useState('');
  const [taxableAmount, setTaxableAmount] = useState(0);
  const [gstRate, setGstRate] = useState(18);
  const [dueDate, setDueDate] = useState('');

  const canEdit = role === 'Admin' || role === 'Accounts User';

  const selectedDispatch = dispatches.find(d => d.id === selectedDispatchId);
  const gstAmount = taxableAmount * (gstRate / 100);
  const totalAmount = taxableAmount + gstAmount;

  const handleCreate = () => {
    if (!selectedDispatchId) { toast.error('Select a dispatch record'); return; }
    if (taxableAmount <= 0) { toast.error('Taxable amount must be > 0'); return; }

    const newChallan: ChallanRecord = {
      id: Date.now().toString(),
      challanNo: nextChallanNo(),
      challanDate: new Date().toISOString().split('T')[0],
      orderNo: selectedDispatch?.orderNo || '',
      partyName: selectedDispatch?.partyName || '',
      taxableAmount,
      gstAmount: Math.round(gstAmount),
      totalAmount: Math.round(totalAmount),
      amountPaid: 0,
      balanceAmount: Math.round(totalAmount),
      dueDate: dueDate || '',
      status: 'Pending',
    };

    setChallans(prev => [...prev, newChallan]);
    setShowCreate(false);
    setSelectedDispatchId(''); setTaxableAmount(0); setDueDate('');
    toast.success(`Challan ${newChallan.challanNo} created`);
  };


  const toggleStatus = (id: string) => {
    if (!canEdit) { toast.error('Only Admin or Accounts can update status'); return; }
    setChallans(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'Pending' ? 'Done' : 'Pending' } : c));
    toast.success('Status updated');
  };

  const handleDelete = (id: string) => {
    if (!canEdit) { toast.error('Only Admin or Accounts can delete challans'); return; }
    if (window.confirm('Are you sure you want to delete this challan?')) {
      setChallans(prev => prev.filter(c => c.id !== id));
      toast.success('Challan deleted');
    }
  };

  const totalPending = challans.reduce((sum, c) => sum + (c.balanceAmount ?? 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-5 fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-100 rounded-xl">
            <ScrollText className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('challan')}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{challans.length} challans • ₹{totalPending.toLocaleString()} pending</p>
          </div>
        </div>
        {canEdit && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Create Challan
          </button>
        )}
      </div>

      {!canEdit && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5 text-sm text-amber-800 dark:text-amber-200 font-medium">
          ⚠️ Read-only view. Only Admin or Accounts role can create/update challans.
        </div>
      )}

      {/* Create Challan Form */}
      {showCreate && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-teal-100 slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">New Challan</h2>
            <button onClick={() => setShowCreate(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Dispatch Record *</label>
              <select value={selectedDispatchId} onChange={(e) => {
                setSelectedDispatchId(e.target.value);
                const dispatch = dispatches.find(d => d.id === e.target.value);
                const order = orders.find(o => o.orderNo === dispatch?.orderNo);
                if (order) {
                  // Rough calculation: total order amount * (this dispatch qty / total order qty)
                  const totalItemsQty = order.items.reduce((s, i) => s + i.quantity, 0);
                  const totalItemsAmount = order.items.reduce((s, i) => s + i.amount, 0);
                  const dispatchQty = dispatch?.dispatchQty || 0;
                  const ratio = dispatchQty / totalItemsQty;
                  setTaxableAmount(Math.round(totalItemsAmount * ratio));
                }
              }} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                <option value="">Select Dispatch</option>
                {dispatches.filter(d => d.dispatchQty > 0 && !challans.some(c => c.orderNo === d.orderNo && c.totalAmount > 0)).map(d => (
                  <option key={d.id} value={d.id}>{d.orderNo} | {d.partyName} | Qty: {d.dispatchQty}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Taxable Amount (₹)</label>
              <div className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                ₹{taxableAmount.toLocaleString()}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">GST %</label>
              <select value={gstRate} onChange={(e) => setGstRate(Number(e.target.value))} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
            <div className="flex flex-col justify-end gap-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">Total: <strong className="text-slate-800 dark:text-slate-100">₹{Math.round(totalAmount).toLocaleString()}</strong></p>
              <button onClick={handleCreate} className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Challans Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="p-3 table-head-cell">Challan No</th>
                <th className="p-3 table-head-cell">Date</th>
                <th className="p-3 table-head-cell">Order</th>
                <th className="p-3 table-head-cell">Party</th>
                <th className="p-3 table-head-cell">Taxable (₹)</th>
                <th className="p-3 table-head-cell">GST (₹)</th>
                <th className="p-3 table-head-cell">Total (₹)</th>
                <th className="p-3 table-head-cell">Paid (₹)</th>
                <th className="p-3 table-head-cell">Balance (₹)</th>
                <th className="p-3 table-head-cell">Due Date</th>
                <th className="p-3 table-head-cell text-center">Status</th>
                <th className="p-3 table-head-cell text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...challans].sort((a,b) => b.challanDate.localeCompare(a.challanDate) || b.challanNo.localeCompare(a.challanNo)).map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">{item.challanNo}</td>
                  <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{item.challanDate}</td>
                  <td className="p-3 text-sm text-slate-600 dark:text-slate-300 font-mono">{item.orderNo}</td>
                  <td className="p-3 text-sm font-medium text-slate-800 dark:text-slate-100">{item.partyName}</td>
                  <td className="p-3 text-sm text-slate-600 dark:text-slate-300">₹{item.taxableAmount.toLocaleString()}</td>
                  <td className="p-3 text-sm text-slate-600 dark:text-slate-300">₹{(item.gstAmount || 0).toLocaleString()}</td>
                  <td className="p-3 text-sm font-bold text-slate-800 dark:text-slate-100">₹{(item.totalAmount || 0).toLocaleString()}</td>
                  <td className="p-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                    ₹{(item.amountPaid ?? 0).toLocaleString()}
                  </td>
                  <td className={`p-3 text-sm font-bold ${item.balanceAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    ₹{(item.balanceAmount ?? (item.totalAmount - (item.amountPaid || 0))).toLocaleString()}
                  </td>
                  <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{item.dueDate || '-'}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => toggleStatus(item.id)}
                      disabled={!canEdit}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold transition-colors cursor-pointer disabled:cursor-default ${item.status === 'Done' ? 'bg-emerald-100 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                    >
                      {item.status === 'Done' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {item.status}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          const order = orders.find(o => o.orderNo === item.orderNo);
                          setPreviewChallan({ challan: item, order });
                        }}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Preview & Print"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const order = orders.find(o => o.orderNo === item.orderNo);
                          generateChallanPDF(item, order, parties, dispatches);
                          toast.success(`Downloading ${item.challanNo}`);
                        }}
                        className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete Challan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {challans.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
          <ScrollText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No challans created yet.</p>
        </div>
      )}

      {/* Preview Modal */}
      {previewChallan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[95vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-900 rounded-t-3xl">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-teal-600" />
                Challan Preview - {previewChallan.challan.challanNo}
              </h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => generateChallanPDF(previewChallan.challan, previewChallan.order, parties, dispatches)} 
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <button 
                  onClick={() => window.print()} 
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
                >
                  Print Challan
                </button>
                <button 
                  onClick={() => setPreviewChallan(null)} 
                  className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-grow overflow-y-auto p-8 bg-slate-200 dark:bg-slate-700/50">
              <div className="scale-75 sm:scale-90 lg:scale-100 origin-top">
                <ChallanPrint challan={previewChallan.challan} order={previewChallan.order} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
