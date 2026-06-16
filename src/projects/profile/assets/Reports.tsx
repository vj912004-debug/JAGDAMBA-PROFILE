import React, { useState, useMemo } from 'react';
import { useAppContext, CUTTING_TYPES, ALL_STAGES } from '../store/AppContext';
import { Calendar, Users, Database, Kanban, Layers, Download } from 'lucide-react';
import { generateChallanPDF } from '../utils/pdfGenerator';

type ReportTab = 'Daily' | 'Party' | 'ItemWise' | 'Production' | 'Material';

export const Reports: React.FC = () => {
  const { t, orders, plates, usages, challans, branch, parties, dispatches } = useAppContext();
  const [activeTab, setActiveTab] = useState<ReportTab>('Daily');
  const [selectedParty, setSelectedParty] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let result = orders;
    if (branch && branch !== 'All') result = result.filter(o => o.location === branch);
    if (dateFrom) result = result.filter(o => o.orderDate >= dateFrom);
    if (dateTo) result = result.filter(o => o.orderDate <= dateTo);
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => 
        o.orderNo.toLowerCase().includes(q) ||
        o.partyName.toLowerCase().includes(q) ||
        o.items.some(i => i.drawingNumber.toLowerCase().includes(q) || i.partName.toLowerCase().includes(q))
      );
    }
    return result;
  }, [orders, branch, dateFrom, dateTo, searchQuery]);

  const today = new Date().toISOString().split('T')[0];
  const todayOrders = filtered.filter(o => o.orderDate === today);
  const completedToday = filtered.filter(o => o.stage === 'Ready' || o.stage === 'Dispatch Done' || o.stage === 'Challan Done' || o.stage === 'Payment Received');
  const pendingOrders = filtered.filter(o => !['Dispatch Done','Challan Done','Payment Pending','Payment Received'].includes(o.stage));
  const urgentOrders = filtered.filter(o => o.urgent && !['Dispatch Done','Challan Done','Payment Received'].includes(o.stage));

  const uniqueParties = Array.from(new Set(orders.map(o => o.partyName)));
  const partyOrders = filtered.filter(o => o.partyName === selectedParty);
  const partyChallans = challans.filter(c => c.partyName === selectedParty);

  const totalInitial = plates.reduce((a, p) => a + p.initialWeight, 0);
  const totalUsed = usages.reduce((a, u) => a + u.usedWeight, 0);
  const totalScrap = usages.reduce((a, u) => a + u.scrapQuantity, 0);
  const totalBalance = totalInitial - totalUsed - totalScrap;
  const customerPlates = plates.filter(p => p.source === 'Customer');

  const exportCSV = (headers: string[], rows: string[][], filename: string) => {
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { key: 'Daily' as ReportTab, label: 'Daily', icon: Calendar, color: 'blue' },
    { key: 'Party' as ReportTab, label: 'Party Wise', icon: Users, color: 'purple' },
    { key: 'ItemWise' as ReportTab, label: 'Item Wise', icon: Layers, color: 'amber' },
    { key: 'Production' as ReportTab, label: 'Production', icon: Kanban, color: 'emerald' },
    { key: 'Material' as ReportTab, label: 'Material', icon: Database, color: 'teal' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5 fade-in">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('reports')}</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-75">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Database className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by Order, Party, Drawing or Part Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-sm">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">From:</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm outline-none" />
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-sm">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">To:</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm outline-none" />
        </div>
        {(dateFrom || dateTo || searchQuery) && (
          <button onClick={() => { setDateFrom(''); setDateTo(''); setSearchQuery(''); }} className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-xl transition-colors">Clear All</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden w-max">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-colors ${activeTab === tab.key ? `bg-${tab.color}-50 text-${tab.color}-700 border-b-2 border-${tab.color}-600` : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ── Daily Report ── */}
      {activeTab === 'Daily' && (
        <div className="space-y-5 slide-up">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Orders Today', value: todayOrders.length, color: 'blue' },
              { label: 'Completed', value: completedToday.length, color: 'emerald' },
              { label: 'Pending', value: pendingOrders.length, color: 'amber' },
              { label: 'Urgent', value: urgentOrders.length, color: 'red' },
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{s.label}</p>
                <h3 className={`text-3xl font-bold text-${s.color}-600`}>{s.value}</h3>
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">All Orders ({filtered.length})</h3>
              <button onClick={() => exportCSV(
                ['Order No','Date','Party','Stage','Items','Urgent'],
                filtered.map(o => [o.orderNo, o.orderDate, o.partyName, o.stage, String(o.items.length), o.urgent ? 'Yes' : 'No']),
                'daily_report.csv'
              )} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1 rounded-lg"><Download className="w-3 h-3" /> CSV</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  {['Order','Date','Party','Type','Material','Qty','Stage'].map(h => <th key={h} className="p-3 table-head-cell">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="p-3 text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">{o.orderNo}</td>
                      <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{o.orderDate}</td>
                      <td className="p-3 text-sm font-medium text-slate-800 dark:text-slate-100">{o.partyName}</td>
                      <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{o.items[0]?.cuttingType || '-'}</td>
                      <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{o.items[0]?.materialGrade || o.items[0]?.materialType} {o.items[0]?.thickness}</td>
                      <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{o.items.reduce((s,i) => s+i.quantity, 0)}</td>
                      <td className="p-3"><span className="text-2xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-1 rounded-full">{o.stage}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Party Wise ── */}
      {activeTab === 'Party' && (
        <div className="space-y-5 slide-up">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4">
            <label className="font-semibold text-sm text-slate-700 dark:text-slate-200">Select Party:</label>
            <select value={selectedParty} onChange={e => setSelectedParty(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none w-64">
              <option value="">-- Choose Party --</option>
              {uniqueParties.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {selectedParty && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Orders - {selectedParty} ({partyOrders.length})</h3>
                  <button onClick={() => exportCSV(
                    ['Order','Date','Stage','Qty','Amount'],
                    partyOrders.map(o => [o.orderNo, o.orderDate, o.stage, String(o.items.reduce((s,i)=>s+i.quantity,0)), String(o.items.reduce((s,i)=>s+i.amount,0))]),
                    `party_${selectedParty}.csv`
                  )} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1 rounded-lg"><Download className="w-3 h-3" /> CSV</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      {['Order','Date','Cutting Type','Qty','Amount (₹)','Stage'].map(h => <th key={h} className="p-3 table-head-cell">{h}</th>)}
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {partyOrders.map(o => (
                        <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="p-3 text-sm font-bold font-mono text-slate-700 dark:text-slate-200">{o.orderNo}</td>
                          <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{o.orderDate}</td>
                          <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{o.items[0]?.cuttingType}</td>
                          <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{o.items.reduce((s,i)=>s+i.quantity,0)}</td>
                          <td className="p-3 text-sm font-bold text-slate-700 dark:text-slate-200">₹{o.items.reduce((s,i)=>s+i.amount,0).toLocaleString()}</td>
                          <td className="p-3"><span className="text-2xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-1 rounded-full">{o.stage}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Challan Summary</h3>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-2xs text-slate-500 dark:text-slate-400 uppercase font-bold">Total Billed</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-100">₹{partyChallans.reduce((s,c)=>s+c.totalAmount,0).toLocaleString()}</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800">
                      <p className="text-2xs text-emerald-600 dark:text-emerald-400 uppercase font-bold">Total Paid</p>
                      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">₹{partyChallans.reduce((s,c)=>s+(c.amountPaid || 0),0).toLocaleString()}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-xl border border-red-100 dark:border-red-800">
                      <p className="text-2xs text-red-600 dark:text-red-400 uppercase font-bold">Pending</p>
                      <p className="text-lg font-bold text-red-700">₹{partyChallans.reduce((s,c)=>s+(c.balanceAmount ?? (c.totalAmount - (c.amountPaid || 0))),0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Challan History</h4>
                    {partyChallans.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 group">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              const order = orders.find(o => o.orderNo === c.orderNo);
                              generateChallanPDF(c, order, parties, dispatches);
                            }}
                            className="p-2 bg-teal-100 text-teal-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{c.challanNo}</p>
                            <p className="text-2xs text-slate-500 dark:text-slate-400">{c.challanDate}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">₹{c.totalAmount.toLocaleString()}</p>
                          <p className="text-2xs text-red-500 font-bold">Bal: ₹{(c.balanceAmount ?? (c.totalAmount - (c.amountPaid || 0))).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                    {partyChallans.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No challans for this party</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Item Wise ── */}
      {activeTab === 'ItemWise' && (
        <div className="space-y-5 slide-up">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {CUTTING_TYPES.map(ct => {
              const count = filtered.filter(o => o.items.some(i => i.cuttingType === ct)).length;
              return (
                <div key={ct} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{count}</h3>
                  <p className="text-2xs font-semibold text-slate-500 dark:text-slate-400 uppercase">{ct}</p>
                </div>
              );
            })}
          </div>
          {/* Thickness-wise */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Thickness Wise Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  {['Thickness','Orders','Total Qty','Cutting Types'].map(h => <th key={h} className="p-3 table-head-cell">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.from(new Set(filtered.flatMap(o => o.items.map(i => i.thickness)).filter(Boolean))).sort().map(th => {
                    const matchOrders = filtered.filter(o => o.items.some(i => i.thickness === th));
                    const totalQty = matchOrders.flatMap(o => o.items.filter(i => i.thickness === th)).reduce((s,i) => s+i.quantity, 0);
                    const types = Array.from(new Set(matchOrders.flatMap(o => o.items.filter(i => i.thickness === th).map(i => i.cuttingType))));
                    return (
                      <tr key={th} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="p-3 text-sm font-bold text-slate-800 dark:text-slate-100">{th}</td>
                        <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{matchOrders.length}</td>
                        <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{totalQty}</td>
                        <td className="p-3">{types.map(t => <span key={t} className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-2xs font-bold px-1.5 py-0.5 rounded mr-1 mb-1">{t}</span>)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Production ── */}
      {activeTab === 'Production' && (
        <div className="space-y-5 slide-up">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Nesting Pending', stages: ['Nesting Pending'], color: 'violet' },
              { label: 'Cutting In Process', stages: ['Cutting In Process'], color: 'amber' },
              { label: 'Ready for Dispatch', stages: ['Ready'], color: 'emerald' },
              { label: 'Dispatched', stages: ['Dispatch Done'], color: 'blue' },
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{s.label}</p>
                <h3 className={`text-3xl font-bold text-${s.color}-600`}>{filtered.filter(o => s.stages.includes(o.stage)).length}</h3>
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Stage-wise Order List</h3>
              <button onClick={() => exportCSV(
                ['Order','Party','Stage','Qty','Due Date'],
                filtered.map(o => [o.orderNo, o.partyName, o.stage, String(o.items.reduce((s,i)=>s+i.quantity,0)), o.deliveryDate]),
                'production_report.csv'
              )} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1 rounded-lg"><Download className="w-3 h-3" /> CSV</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  {['Order','Party','Type','Thickness','Qty','Due Date','Stage'].map(h => <th key={h} className="p-3 table-head-cell">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.sort((a,b) => ALL_STAGES.indexOf(a.stage) - ALL_STAGES.indexOf(b.stage)).map(o => (
                    <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="p-3 text-sm font-bold font-mono text-slate-700 dark:text-slate-200">{o.orderNo}</td>
                      <td className="p-3 text-sm font-medium text-slate-800 dark:text-slate-100">{o.partyName}</td>
                      <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{o.items[0]?.cuttingType}</td>
                      <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{o.items[0]?.thickness}</td>
                      <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{o.items.reduce((s,i)=>s+i.quantity,0)}</td>
                      <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{o.deliveryDate || '-'}</td>
                      <td className="p-3"><span className="text-2xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-1 rounded-full">{o.stage}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Material ── */}
      {activeTab === 'Material' && (
        <div className="space-y-5 slide-up">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Initial (Kg)', value: totalInitial, color: 'slate' },
              { label: 'Total Used (Kg)', value: totalUsed, color: 'blue' },
              { label: 'Total Scrap (Kg)', value: totalScrap, color: 'red' },
              { label: 'Balance (Kg)', value: totalBalance, color: 'emerald' },
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{s.label}</p>
                <h3 className={`text-2xl font-bold text-${s.color}-600`}>{s.value.toLocaleString()}</h3>
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Plate Consumption</h3>
              <button onClick={() => exportCSV(
                ['Plate ID','Source','Order','Used Kg','Scrap Kg','Scrap Owner'],
                usages.map(u => {const p=plates.find(x=>x.id===u.plateId); return [u.plateId, p?.source||'', u.orderNo, String(u.usedWeight), String(u.scrapQuantity), u.scrapOwner]}),
                'material_report.csv'
              )} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1 rounded-lg"><Download className="w-3 h-3" /> CSV</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  {['Plate ID','Source','Order','Used (Kg)','Scrap (Kg)','Scrap Owner'].map(h => <th key={h} className="p-3 table-head-cell">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {usages.map((u, i) => {
                    const plate = plates.find(p => p.id === u.plateId);
                    return (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="p-3 text-sm font-bold text-slate-800 dark:text-slate-100 font-mono">{u.plateId}</td>
                        <td className="p-3"><span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${plate?.source === 'Customer' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'}`}>{plate?.source || '-'}</span></td>
                        <td className="p-3 text-sm font-mono text-slate-700 dark:text-slate-200">{u.orderNo}</td>
                        <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{u.usedWeight}</td>
                        <td className="p-3 text-sm text-red-600 dark:text-red-400 font-medium">{u.scrapQuantity}</td>
                        <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{u.scrapOwner}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {/* Customer Material Pending */}
          {customerPlates.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
              <div className="p-4 border-b border-purple-100 bg-purple-50/50">
                <h3 className="text-sm font-semibold text-purple-800">Customer Material Pending</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Plate ID','Grade','Thickness','Initial (Kg)','Balance (Kg)'].map(h => <th key={h} className="p-3 table-head-cell">{h}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerPlates.map(p => {
                      const pu = usages.filter(u => u.plateId === p.id);
                      const bal = p.initialWeight - pu.reduce((s,u) => s+u.usedWeight+u.scrapQuantity, 0);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="p-3 text-sm font-bold font-mono text-slate-800 dark:text-slate-100">{p.id}</td>
                          <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{p.grade}</td>
                          <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{p.thickness}</td>
                          <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{p.initialWeight}</td>
                          <td className="p-3 text-sm font-bold text-emerald-600 dark:text-emerald-400">{bal}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
