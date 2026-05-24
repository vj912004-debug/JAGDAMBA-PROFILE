import React, { useState, useMemo } from 'react';
import { useAppContext, type Plate, type PlateSource, MATERIAL_GRADES } from '../store/AppContext';
import { Database, Link2, Search, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { EditableSelect } from '../components/EditableSelect';

export const PlateTracking: React.FC = () => {
  const { t, plates, setPlates, usages, setUsages, orders } = useAppContext();
  const [search, setSearch] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [showUsage, setShowUsage] = useState(false);

  // Register form
  const [newPlate, setNewPlate] = useState({ id: '', grade: '', thickness: '', size: '', weight: 0, heatNumber: '', source: 'Stock' as PlateSource, initialWeight: 0 });

  // Usage form
  const [newUsage, setNewUsage] = useState({ plateId: '', orderId: '', orderNo: '', usedWeight: 0, scrapQuantity: 0, scrapOwner: 'Our Company' as 'Customer' | 'Our Company' });

  const filteredPlates = useMemo(() => {
    if (!search) return plates;
    const q = search.toLowerCase();
    return plates.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.grade.toLowerCase().includes(q) ||
      p.thickness.toLowerCase().includes(q) ||
      p.heatNumber.toLowerCase().includes(q)
    );
  }, [plates, search]);

  const registerPlate = () => {
    if (!newPlate.id.trim()) { toast.error('Plate ID is required'); return; }
    if (!newPlate.thickness) { toast.error('Thickness is required'); return; }
    if (newPlate.initialWeight <= 0) { toast.error('Weight must be > 0'); return; }
    if (plates.some(p => p.id === newPlate.id.trim())) { toast.error('Plate ID already exists'); return; }

    setPlates(prev => [...prev, { ...newPlate, id: newPlate.id.trim(), weight: newPlate.initialWeight }]);
    setNewPlate({ id: '', grade: '', thickness: '', size: '', weight: 0, heatNumber: '', source: 'Stock', initialWeight: 0 });
    setShowRegister(false);
    toast.success('Plate registered successfully');
  };

  const addUsage = () => {
    if (!newUsage.plateId) { toast.error('Select a plate'); return; }
    if (!newUsage.orderNo) { toast.error('Enter order number'); return; }
    if (newUsage.usedWeight <= 0) { toast.error('Used weight must be > 0'); return; }

    const order = orders.find(o => o.orderNo === newUsage.orderNo);
    setUsages(prev => [...prev, {
      ...newUsage,
      id: Date.now().toString(),
      orderId: order?.id || '',
    }]);
    setNewUsage({ plateId: '', orderId: '', orderNo: '', usedWeight: 0, scrapQuantity: 0, scrapOwner: 'Our Company' });
    setShowUsage(false);
    toast.success('Usage recorded');
  };

  const getPlateStats = (plate: Plate) => {
    const plateUsages = usages.filter(u => u.plateId === plate.id);
    const totalUsed = plateUsages.reduce((acc, u) => acc + u.usedWeight, 0);
    const totalScrap = plateUsages.reduce((acc, u) => acc + u.scrapQuantity, 0);
    const balance = plate.initialWeight - totalUsed - totalScrap;
    return { totalUsed, totalScrap, balance, usageCount: plateUsages.length, usageRecords: plateUsages };
  };

  // Summary stats
  const totalInitial = plates.reduce((acc, p) => acc + p.initialWeight, 0);
  const totalUsedAll = usages.reduce((acc, u) => acc + u.usedWeight, 0);
  const totalScrapAll = usages.reduce((acc, u) => acc + u.scrapQuantity, 0);
  const totalBalance = totalInitial - totalUsedAll - totalScrapAll;

  return (
    <div className="max-w-7xl mx-auto space-y-5 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('plateTracking')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{plates.length} plates registered</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowRegister(true); setShowUsage(false); }} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Register Plate
          </button>
          <button onClick={() => { setShowUsage(true); setShowRegister(false); }} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Link2 className="w-4 h-4" /> Link Usage
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Total Initial</p>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{totalInitial.toLocaleString()} Kg</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Total Used</p>
          <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalUsedAll.toLocaleString()} Kg</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Total Scrap</p>
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400">{totalScrapAll.toLocaleString()} Kg</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Balance</p>
          <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{totalBalance.toLocaleString()} Kg</h3>
        </div>
      </div>

      {/* Register Plate Modal */}
      {showRegister && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-blue-100 dark:border-blue-800 slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Register New Plate
            </h2>
            <button onClick={() => setShowRegister(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Plate ID *</label>
              <input type="text" value={newPlate.id} onChange={e => setNewPlate({ ...newPlate, id: e.target.value })} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="PLT-1005" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Material Grade</label>
              <EditableSelect 
                value={newPlate.grade} 
                onChange={v => setNewPlate({ ...newPlate, grade: v })} 
                options={MATERIAL_GRADES}
                placeholder="Select Grade"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Thickness *</label>
              <input type="text" value={newPlate.thickness} onChange={e => setNewPlate({ ...newPlate, thickness: e.target.value })} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="10mm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Size (W x L)</label>
              <input type="text" value={newPlate.size} onChange={e => setNewPlate({ ...newPlate, size: e.target.value })} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="1250 x 2500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Heat/TC Number</label>
              <input type="text" value={newPlate.heatNumber} onChange={e => setNewPlate({ ...newPlate, heatNumber: e.target.value })} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="TC-89238" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Source</label>
              <EditableSelect 
                value={newPlate.source} 
                onChange={v => setNewPlate({ ...newPlate, source: v as PlateSource })} 
                options={['Stock', 'Customer', 'Other']}
                displayTransform={(o) => o === 'Stock' ? 'Our Stock' : o === 'Customer' ? 'Customer Material' : o}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Initial Weight (Kg) *</label>
              <input type="number" min="0" value={newPlate.initialWeight || ''} onChange={e => setNewPlate({ ...newPlate, initialWeight: Number(e.target.value) })} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex items-end">
              <button onClick={registerPlate} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors">Register</button>
            </div>
          </div>
        </div>
      )}

      {/* Link Usage Modal */}
      {showUsage && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-emerald-100 dark:border-emerald-800 slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Link Usage to Order
            </h2>
            <button onClick={() => setShowUsage(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Select Plate *</label>
              <select value={newUsage.plateId} onChange={e => setNewUsage({ ...newUsage, plateId: e.target.value })} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Choose Plate</option>
                {plates.map(p => <option key={p.id} value={p.id}>{p.id} • {p.grade} {p.thickness}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Order No *</label>
              <select value={newUsage.orderNo} onChange={e => setNewUsage({ ...newUsage, orderNo: e.target.value })} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Choose Order</option>
                {orders.map(o => <option key={o.id} value={o.orderNo}>{o.orderNo} • {o.partyName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Used Wt (Kg) *</label>
              <input type="number" min="0" value={newUsage.usedWeight || ''} onChange={e => setNewUsage({ ...newUsage, usedWeight: Number(e.target.value) })} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Scrap Qty (Kg)</label>
              <input type="number" min="0" value={newUsage.scrapQuantity || ''} onChange={e => setNewUsage({ ...newUsage, scrapQuantity: Number(e.target.value) })} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Scrap Owner</label>
              <EditableSelect 
                value={newUsage.scrapOwner} 
                onChange={v => setNewUsage({ ...newUsage, scrapOwner: v as any })} 
                options={['Our Company', 'Customer']}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex items-end">
              <button onClick={addUsage} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors">Record</button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by plate ID, grade, thickness, heat no..." className="w-full sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
      </div>

      {/* Plates Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Plate Inventory & Usage</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="p-3 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Plate ID</th>
                <th className="p-3 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Grade / Thickness</th>
                <th className="p-3 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Size</th>
                <th className="p-3 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Heat/TC No</th>
                <th className="p-3 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Source</th>
                <th className="p-3 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Initial (Kg)</th>
                <th className="p-3 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Used (Kg)</th>
                <th className="p-3 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase text-red-600 dark:text-red-400">Scrap (Kg)</th>
                <th className="p-3 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase text-emerald-600 dark:text-emerald-400">Balance (Kg)</th>
                <th className="p-3 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlates.map(plate => {
                const stats = getPlateStats(plate);
                const balancePct = plate.initialWeight > 0 ? (stats.balance / plate.initialWeight) * 100 : 0;
                return (
                  <tr key={plate.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-100 font-mono text-sm">{plate.id}</td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{plate.grade} • {plate.thickness}</td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{plate.size || '-'}</td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-300 font-mono">{plate.heatNumber || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${plate.source === 'Customer' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'}`}>
                        {plate.source}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-200 text-sm">{plate.initialWeight.toLocaleString()}</td>
                    <td className="p-3 text-sm text-slate-700 dark:text-slate-200">{stats.totalUsed.toLocaleString()}</td>
                    <td className="p-3 text-sm text-red-600 dark:text-red-400 font-medium">{stats.totalScrap.toLocaleString()}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${stats.balance > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{stats.balance.toLocaleString()}</span>
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden hidden sm:block">
                          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.max(0, balancePct)}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                      {stats.usageRecords.map(u => (
                        <span key={u.id} className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1">{u.orderNo}</span>
                      ))}
                      {stats.usageCount === 0 && <span className="text-slate-400 text-xs">Unused</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
