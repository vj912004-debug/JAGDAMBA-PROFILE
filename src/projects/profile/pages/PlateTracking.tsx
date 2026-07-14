import React, { useState, useMemo } from 'react';
import { useAppContext, type Plate, type PlateSource, MATERIAL_GRADES } from '../store/AppContext';
import { Database, Link2, Plus, RotateCcw, Scale, Package, Trash2, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { EditableSelect } from '../components/EditableSelect';
import { upper } from '../utils/textCase';
import { NumericInput, parseNum } from '../components/NumericInput';
import { ErpPageHeader, ErpSidePanel } from '../components/ErpPageShell';

const emptyPlate = () => ({
  id: '', grade: '', thickness: '', size: '', weight: 0, heatNumber: '', source: 'Stock' as PlateSource, initialWeight: 0,
});

const emptyUsage = () => ({
  plateId: '', orderId: '', orderNo: '', usedWeight: 0, scrapQuantity: 0, scrapOwner: 'Our Company' as 'Customer' | 'Our Company',
});

const StatCard: React.FC<{ icon: React.ElementType; label: string; value: string; color: string }> = ({ icon: Icon, label, value, color }) => (
  <div className={`tc-mgmt-stat ${color}`}>
    <Icon className="w-5 h-5 shrink-0 opacity-90" />
    <div className="min-w-0">
      <div className="stat-lbl">{label}</div>
      <div className="stat-num text-base sm:text-xl">{value}</div>
    </div>
  </div>
);

export const PlateTracking: React.FC = () => {
  const { plates, setPlates, usages, setUsages, orders, persistErpNow } = useAppContext();
  const [search, setSearch] = useState('');
  const [newPlate, setNewPlate] = useState(emptyPlate);
  const [newUsage, setNewUsage] = useState(emptyUsage);

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

  const registerPlate = async () => {
    if (!newPlate.id.trim()) { toast.error('Plate ID is required'); return; }
    if (!newPlate.thickness) { toast.error('Thickness is required'); return; }
    if (newPlate.initialWeight <= 0) { toast.error('Weight must be > 0'); return; }
    if (plates.some(p => p.id === newPlate.id.trim())) { toast.error('Plate ID already exists'); return; }

    const plate = { ...newPlate, id: newPlate.id.trim(), weight: newPlate.initialWeight };
    const next = [...plates, plate];
    setPlates(next);
    try {
      await persistErpNow({ plates: next });
      setNewPlate(emptyPlate());
      toast.success('Plate registered successfully');
    } catch {
      toast.error('Saved locally but server sync failed — retry Save');
    }
  };

  const addUsage = async () => {
    if (!newUsage.plateId) { toast.error('Select a plate'); return; }
    if (!newUsage.orderNo) { toast.error('Enter order number'); return; }
    if (newUsage.usedWeight <= 0) { toast.error('Used weight must be > 0'); return; }

    const order = orders.find(o => o.orderNo === newUsage.orderNo);
    const usage = {
      ...newUsage,
      id: Date.now().toString(),
      orderId: order?.id || '',
    };
    const next = [...usages, usage];
    setUsages(next);
    try {
      await persistErpNow({ usages: next });
      setNewUsage(emptyUsage());
      toast.success('Usage recorded');
    } catch {
      toast.error('Saved locally but server sync failed — retry Save');
    }
  };

  const getPlateStats = (plate: Plate) => {
    const plateUsages = usages.filter(u => u.plateId === plate.id);
    const totalUsed = plateUsages.reduce((acc, u) => acc + u.usedWeight, 0);
    const totalScrap = plateUsages.reduce((acc, u) => acc + u.scrapQuantity, 0);
    const balance = plate.initialWeight - totalUsed - totalScrap;
    return { totalUsed, totalScrap, balance, usageCount: plateUsages.length, usageRecords: plateUsages };
  };

  const totalInitial = plates.reduce((acc, p) => acc + p.initialWeight, 0);
  const totalUsedAll = usages.reduce((acc, u) => acc + u.usedWeight, 0);
  const totalScrapAll = usages.reduce((acc, u) => acc + u.scrapQuantity, 0);
  const totalBalance = totalInitial - totalUsedAll - totalScrapAll;

  const fmtKg = (n: number) => `${n.toLocaleString()} Kg`;

  return (
    <div className="max-w-[1680px] mx-auto p-3 sm:p-4 space-y-4 fade-in pb-8 min-w-0">
      <ErpPageHeader
        title="Plate Tracking"
        subtitle={`${plates.length} plates registered`}
        extra={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setNewPlate(emptyPlate())} className="erp-btn erp-btn-ghost">
              <RotateCcw className="w-4 h-4" /> Clear Register
            </button>
            <button type="button" onClick={() => setNewUsage(emptyUsage())} className="erp-btn erp-btn-ghost">
              <RotateCcw className="w-4 h-4" /> Clear Usage
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Layers} label="Total Initial" value={fmtKg(totalInitial)} color="bg-brand-navy" />
        <StatCard icon={Package} label="Total Used" value={fmtKg(totalUsedAll)} color="bg-blue-600" />
        <StatCard icon={Trash2} label="Total Scrap" value={fmtKg(totalScrapAll)} color="bg-red-600" />
        <StatCard icon={Scale} label="Balance" value={fmtKg(totalBalance)} color="bg-green-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start min-w-0">
        <div className="xl:col-span-9 space-y-4 min-w-0">
          <div className="tc-mgmt-panel">
            <div className="tc-mgmt-panel-head flex items-center justify-between">
              <span className="flex items-center gap-2"><Database className="w-3.5 h-3.5" /> Register New Plate</span>
            </div>
            <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-2">
              <div><label className="tc-mgmt-label">Plate ID *</label><input type="text" value={newPlate.id} onChange={e => setNewPlate({ ...newPlate, id: upper(e.target.value) })} className="tc-mgmt-input font-mono" placeholder="PLT-1005" /></div>
              <div><label className="tc-mgmt-label">Grade</label><EditableSelect value={newPlate.grade} onChange={v => setNewPlate({ ...newPlate, grade: v })} options={MATERIAL_GRADES} placeholder="Grade" className="tc-mgmt-input" /></div>
              <div><label className="tc-mgmt-label">Thickness *</label><NumericInput value={newPlate.thickness} onChange={v => setNewPlate({ ...newPlate, thickness: v })} className="tc-mgmt-input" placeholder="10" /></div>
              <div><label className="tc-mgmt-label">Size (W × L)</label><input type="text" value={newPlate.size} onChange={e => setNewPlate({ ...newPlate, size: upper(e.target.value) })} className="tc-mgmt-input" placeholder="1250 × 2500" /></div>
              <div><label className="tc-mgmt-label">Heat / TC No</label><input type="text" value={newPlate.heatNumber} onChange={e => setNewPlate({ ...newPlate, heatNumber: upper(e.target.value) })} className="tc-mgmt-input" placeholder="TC-89238" /></div>
              <div>
                <label className="tc-mgmt-label">Source</label>
                <EditableSelect value={newPlate.source} onChange={v => setNewPlate({ ...newPlate, source: v as PlateSource })} options={['Stock', 'Customer', 'Other']} displayTransform={(o) => o === 'Stock' ? 'Our Stock' : o === 'Customer' ? 'Customer Material' : o} className="tc-mgmt-input" />
              </div>
              <div><label className="tc-mgmt-label">Initial Wt (Kg) *</label><NumericInput value={newPlate.initialWeight} onChange={v => setNewPlate({ ...newPlate, initialWeight: parseNum(v) })} className="tc-mgmt-input" /></div>
              <div className="flex items-end">
                <button type="button" onClick={registerPlate} className="erp-btn erp-btn-navy w-full"><Plus className="w-4 h-4" /> Register</button>
              </div>
            </div>
          </div>

          <div className="tc-mgmt-panel">
            <div className="tc-mgmt-panel-head green flex items-center justify-between">
              <span className="flex items-center gap-2"><Link2 className="w-3.5 h-3.5" /> Link Usage to Order</span>
            </div>
            <div className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              <div className="col-span-2">
                <label className="tc-mgmt-label">Plate *</label>
                <select value={newUsage.plateId} onChange={e => setNewUsage({ ...newUsage, plateId: e.target.value })} className="tc-mgmt-input">
                  <option value="">Choose Plate</option>
                  {plates.map(p => <option key={p.id} value={p.id}>{p.id} — {p.grade} {p.thickness}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="tc-mgmt-label">Order No *</label>
                <select value={newUsage.orderNo} onChange={e => setNewUsage({ ...newUsage, orderNo: e.target.value })} className="tc-mgmt-input">
                  <option value="">Choose Order</option>
                  {orders.map(o => <option key={o.id} value={o.orderNo}>{o.orderNo} — {o.partyName}</option>)}
                </select>
              </div>
              <div><label className="tc-mgmt-label">Used Wt</label><NumericInput value={newUsage.usedWeight} onChange={v => setNewUsage({ ...newUsage, usedWeight: parseNum(v) })} className="tc-mgmt-input" /></div>
              <div><label className="tc-mgmt-label">Scrap Wt</label><NumericInput value={newUsage.scrapQuantity} onChange={v => setNewUsage({ ...newUsage, scrapQuantity: parseNum(v) })} className="tc-mgmt-input" /></div>
              <div><label className="tc-mgmt-label">Scrap Owner</label><EditableSelect value={newUsage.scrapOwner} onChange={v => setNewUsage({ ...newUsage, scrapOwner: v as 'Customer' | 'Our Company' })} options={['Our Company', 'Customer']} className="tc-mgmt-input" /></div>
              <div className="flex items-end">
                <button type="button" onClick={addUsage} className="erp-btn erp-btn-green w-full"><Link2 className="w-4 h-4" /> Record</button>
              </div>
            </div>
          </div>

          <div className="tc-mgmt-panel min-w-0">
            <div className="tc-mgmt-panel-head">Plate Inventory & Usage</div>
            <div className="min-w-0 overflow-x-auto">
              <table className="w-full tc-mgmt-table">
                <thead>
                  <tr>
                    <th>Plate ID</th>
                    <th>Grade</th>
                    <th>Thk</th>
                    <th>Size</th>
                    <th>Heat/TC</th>
                    <th>Source</th>
                    <th>Initial</th>
                    <th>Used</th>
                    <th>Scrap</th>
                    <th>Balance</th>
                    <th>Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlates.map(plate => {
                    const stats = getPlateStats(plate);
                    const balancePct = plate.initialWeight > 0 ? (stats.balance / plate.initialWeight) * 100 : 0;
                    return (
                      <tr key={plate.id}>
                        <td className="font-mono font-bold text-brand-blue">{plate.id}</td>
                        <td>{plate.grade || '-'}</td>
                        <td>{plate.thickness}</td>
                        <td>{plate.size || '-'}</td>
                        <td className="font-mono text-[11px]">{plate.heatNumber || '-'}</td>
                        <td>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${plate.source === 'Customer' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                            {plate.source}
                          </span>
                        </td>
                        <td className="font-semibold">{plate.initialWeight.toLocaleString()}</td>
                        <td>{stats.totalUsed.toLocaleString()}</td>
                        <td className="text-red-600 dark:text-red-400 font-semibold">{stats.totalScrap.toLocaleString()}</td>
                        <td>
                          <div className="flex items-center gap-1.5 min-w-[4rem]">
                            <span className={`font-bold ${stats.balance > 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>{stats.balance.toLocaleString()}</span>
                            <div className="hidden sm:block w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.max(0, balancePct)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-0.5 max-w-[120px]">
                            {stats.usageRecords.map(u => (
                              <span key={u.id} className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{u.orderNo}</span>
                            ))}
                            {stats.usageCount === 0 && <span className="text-slate-400 text-[10px]">—</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPlates.length === 0 && (
                    <tr><td colSpan={11} className="text-center py-8 text-slate-400 italic">No plates found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 min-w-0">
          <ErpSidePanel title="Search Plates">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Plate ID, grade, heat no..." className="tc-mgmt-input" />
            <div className="pt-2 space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <p><strong className="text-slate-700 dark:text-slate-200">{filteredPlates.length}</strong> of {plates.length} plates shown</p>
              <p className="text-[10px] leading-relaxed">Register plates from stock or customer material, then link usage to sales orders.</p>
            </div>
          </ErpSidePanel>

          <div className="tc-mgmt-panel mt-4 bg-brand-navy text-white p-4">
            <p className="text-[10px] font-bold uppercase opacity-80">Quick Summary</p>
            <div className="space-y-1.5 mt-2 text-sm">
              <div className="flex justify-between gap-2"><span className="opacity-80">Plates</span><span className="font-bold">{plates.length}</span></div>
              <div className="flex justify-between gap-2"><span className="opacity-80">Usage Records</span><span className="font-bold">{usages.length}</span></div>
              <div className="flex justify-between gap-2"><span className="opacity-80">Customer Material</span><span className="font-bold">{plates.filter(p => p.source === 'Customer').length}</span></div>
              <div className="flex justify-between gap-2 border-t border-white/20 pt-2 mt-2"><span className="font-bold">Balance Wt</span><span className="font-black">{fmtKg(totalBalance)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
