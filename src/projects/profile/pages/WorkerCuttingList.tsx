import React, { useState, useMemo } from 'react';
import { Save, ArrowRight, Scissors, Search, RotateCcw, Printer, List, CheckCircle, Clock, Scale } from 'lucide-react';
import { useAppContext, EMPLOYEES, type CuttingAllocationRecord } from '../store/AppContext';
import toast from 'react-hot-toast';
import { NumericInput, parseNum } from '../components/NumericInput';
import {
  ErpEntryPage, ErpEntryToolbar, ErpMockupTitleBar, ErpNumberedSection, ErpIconStatCards, ErpInfoNote,
} from '../components/ErpPageShell';
import { WorkerCuttingListPrint } from '../components/WorkerCuttingListPrint';
import { buildWorkerCuttingListPrintData } from '../utils/workerCuttingListHelpers';
import { erpHotkeyProps } from '../utils/erpHotkeys';

interface WorkerRow {
  allocId: string;
  rowId: string;
  orderNo: string;
  karigar: string;
  party: string;
  grade: string;
  shape: string;
  thickness: string;
  odWidth: string;
  idLength: string;
  drawingNo: string;
  partName: string;
  allocated: number;
  readyTillDate: number;
  readyNow: number;
}

function flattenAllocations(allocs: CuttingAllocationRecord[]): WorkerRow[] {
  const rows: WorkerRow[] = [];
  for (const a of allocs) {
    for (const r of a.rows) {
      if (!r.karigar || r.nos <= 0) continue;
      const balance = r.nos - (r.readyQty || 0);
      if (balance <= 0) continue;
      rows.push({
        allocId: a.id,
        rowId: r.id,
        orderNo: a.orderNo,
        karigar: r.karigar,
        party: a.partyName,
        grade: r.grade,
        shape: r.itemType,
        thickness: r.thickness,
        odWidth: r.widthOd,
        idLength: r.lengthId,
        drawingNo: r.drawingNo,
        partName: r.drawingNo || r.itemType,
        allocated: r.nos,
        readyTillDate: r.readyQty || 0,
        readyNow: 0,
      });
    }
  }
  return rows;
}

export const WorkerCuttingList: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const { cuttingAllocations, setCuttingAllocations, orders, setOrders, persistErpNow } = useAppContext();
  const [worker, setWorker] = useState(EMPLOYEES[0] || '');
  const [machine, setMachine] = useState('CNC-1');
  const [priority, setPriority] = useState('Normal');
  const [asOnDate, setAsOnDate] = useState(today);
  const [itemSearch, setItemSearch] = useState('');
  const [pendingOnly, setPendingOnly] = useState(true);
  const [readyNowMap, setReadyNowMap] = useState<Record<string, number>>({});
  const [savedToday, setSavedToday] = useState<{ key: string; qty: number; time: string; row: WorkerRow }[]>([]);

  const baseItems = useMemo(() => flattenAllocations(cuttingAllocations), [cuttingAllocations]);

  const workerItems = useMemo(() => baseItems
    .filter(i => i.karigar === worker)
    .filter(i => !itemSearch || `${i.partName} ${i.drawingNo} ${i.orderNo}`.toLowerCase().includes(itemSearch.toLowerCase()))
    .map(i => ({ ...i, readyNow: readyNowMap[`${i.allocId}-${i.rowId}`] ?? 0 })),
  [baseItems, worker, itemSearch, readyNowMap]);

  const setReadyNow = (key: string, val: number, max: number) =>
    setReadyNowMap(prev => ({ ...prev, [key]: Math.max(0, Math.min(val, max)) }));

  const persistReady = async (updates: { allocId: string; rowId: string; addQty: number; orderNo: string; drawingNo: string }[]) => {
    if (updates.length === 0) return;
    const nextAllocs = cuttingAllocations.map(a => ({
      ...a,
      rows: a.rows.map(r => {
        const u = updates.find(x => x.allocId === a.id && x.rowId === r.id);
        if (!u) return r;
        return { ...r, readyQty: (r.readyQty || 0) + u.addQty };
      }),
    }));
    let nextOrders = orders;
    for (const u of updates) {
      const order = nextOrders.find(o => o.orderNo === u.orderNo);
      if (!order) continue;
      nextOrders = nextOrders.map(o => {
        if (o.id !== order.id) return o;
        return {
          ...o,
          items: o.items.map(item => {
            const match = u.drawingNo && u.drawingNo !== '-' && item.drawingNumber === u.drawingNo;
            if (!match && u.drawingNo && u.drawingNo !== '-') return item;
            const completedQty = Math.min(item.quantity, (item.completedQty || 0) + u.addQty);
            const itemStatus = completedQty >= item.quantity ? 'Completed' as const : completedQty > 0 ? 'In Progress' as const : item.itemStatus;
            return { ...item, completedQty, itemStatus, assignedWorker: worker, completedAt: completedQty > 0 ? new Date().toISOString() : item.completedAt };
          }),
          stage: o.stage === 'Order Received' || o.stage === 'Production Pending' ? 'Cutting In Process' as const : o.stage,
        };
      });
    }
    setCuttingAllocations(nextAllocs);
    setOrders(nextOrders);
    await persistErpNow({ cuttingAllocations: nextAllocs, orders: nextOrders });
  };

  const saveEntries = async (rows: WorkerRow[]) => {
    const toSave = rows.filter(i => i.readyNow > 0);
    if (toSave.length === 0) { toast.error('Enter Ready Now quantity'); return; }
    await persistReady(toSave.map(i => ({ allocId: i.allocId, rowId: i.rowId, addQty: i.readyNow, orderNo: i.orderNo, drawingNo: i.drawingNo })));
    const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    setSavedToday(prev => [...toSave.map(i => ({ key: `${i.allocId}-${i.rowId}`, qty: i.readyNow, time: now, row: i })), ...prev]);
    setReadyNowMap(prev => {
      const next = { ...prev };
      toSave.forEach(i => delete next[`${i.allocId}-${i.rowId}`]);
      return next;
    });
    toast.success(`${toSave.reduce((s, i) => s + i.readyNow, 0)} Nos moved to Ready For Dispatch`);
  };

  const totals = useMemo(() => ({
    assignedItems: workerItems.length,
    assignedNos: workerItems.reduce((s, i) => s + (i.allocated - i.readyTillDate), 0),
    readyToday: savedToday.reduce((s, x) => s + x.qty, 0),
    pendingNos: workerItems.reduce((s, i) => s + (i.allocated - i.readyTillDate - i.readyNow), 0),
  }), [workerItems, savedToday]);

  const printData = useMemo(() => {
    let data = buildWorkerCuttingListPrintData(cuttingAllocations, worker, machine, priority, asOnDate, { pendingOnly: true });
    if (!data) {
      data = buildWorkerCuttingListPrintData(cuttingAllocations, worker, machine, priority, asOnDate, { pendingOnly: false });
    }
    return data;
  }, [cuttingAllocations, worker, machine, priority, asOnDate]);

  const handlePrint = () => {
    if (!printData || printData.rows.length === 0) {
      toast.error('No cutting allocation items to print for this worker');
      return;
    }
    window.print();
  };

  return (
    <ErpEntryPage>
      <ErpMockupTitleBar title="Cutting Ready Entry" subtitle="Mark completed cutting qty per karigar" icon={<Scissors className="w-4 h-4" />} />

      <div className="erp-list-filter-bar">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 items-end">
          <div><label className="tc-mgmt-label">Worker Name *</label><select value={worker} onChange={e => setWorker(e.target.value)} className="tc-mgmt-input">{EMPLOYEES.map(e => <option key={e} value={e}>{e}</option>)}</select></div>
          <div><label className="tc-mgmt-label">Machine No.</label><select value={machine} onChange={e => setMachine(e.target.value)} className="tc-mgmt-input"><option>CNC-1</option><option>CNC-2</option><option>Manual</option></select></div>
          <div><label className="tc-mgmt-label">Priority</label><select value={priority} onChange={e => setPriority(e.target.value)} className="tc-mgmt-input"><option>Normal</option><option>High</option><option>Urgent</option></select></div>
          <div><label className="tc-mgmt-label">Entry Date</label><input type="date" value={asOnDate} onChange={e => setAsOnDate(e.target.value)} className="tc-mgmt-input" /></div>
          <div className="flex gap-2 col-span-2 justify-end">
            <button type="button" onClick={() => toast('Refreshed')} className="erp-entry-btn erp-entry-btn-green"><RotateCcw className="w-4 h-4" /> Refresh</button>
            <button type="button" {...erpHotkeyProps('print')} onClick={handlePrint} className="erp-entry-btn erp-entry-btn-blue"><Printer className="w-4 h-4" /> Print</button>
          </div>
        </div>
      </div>

      <div className="erp-mockup-section-grid">
        <ErpNumberedSection number={1} title="Assigned Cutting Items" subtitle="Not Yet Ready">
          <div className="flex flex-wrap gap-2 mb-2 items-center">
            <div className="relative flex-1 min-w-[180px]"><Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input value={itemSearch} onChange={e => setItemSearch(e.target.value)} placeholder="Search Item / Part Name..." className="tc-mgmt-input pl-8" /></div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold"><input type="checkbox" checked={pendingOnly} onChange={e => setPendingOnly(e.target.checked)} /> Show Pending Only</label>
          </div>
          <div className="overflow-x-auto max-h-[320px]">
            <table className="tc-mgmt-table w-full text-[10px]">
              <thead><tr><th>Sr</th><th>SO No.</th><th>Item / Part</th><th>Grade</th><th>Thk</th><th>Pending Nos</th><th>Ready Now</th><th>Action</th></tr></thead>
              <tbody>
                {workerItems.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-6 text-slate-400 italic">No pending allocation for {worker}</td></tr>
                ) : workerItems.map((item, i) => {
                  const key = `${item.allocId}-${item.rowId}`;
                  const pending = item.allocated - item.readyTillDate;
                  return (
                    <tr key={key}>
                      <td>{i + 1}</td>
                      <td className="font-bold text-brand-blue">{item.orderNo}</td>
                      <td>{item.partName}</td>
                      <td>{item.grade}</td>
                      <td>{item.thickness}</td>
                      <td className="text-center font-bold text-amber-600">{pending}</td>
                      <td className="text-center"><NumericInput value={String(item.readyNow || '')} onChange={v => setReadyNow(key, parseNum(v), pending)} className="w-16 mx-auto tc-mgmt-input text-center" /></td>
                      <td><button type="button" onClick={() => void saveEntries([item])} className="erp-entry-btn erp-entry-btn-green text-[9px] py-0.5 px-1.5">Ready To Nos</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Total Items: {totals.assignedItems} · Total Pending Nos: {totals.assignedNos}</p>
        </ErpNumberedSection>

        <div className="space-y-3">
          <ErpNumberedSection number={2} title="Mark Item(s) Ready To" subtitle="Quick Entry">
            <div className="space-y-2">
              <div><label className="tc-mgmt-label">Ready To Nos</label><NumericInput value={String(workerItems.reduce((s, i) => s + i.readyNow, 0) || '')} onChange={() => {}} className="tc-mgmt-input" /></div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button type="button" onClick={() => void saveEntries(workerItems)} className="erp-entry-btn erp-entry-btn-green flex-1 justify-center"><Save className="w-4 h-4" /> Save Ready To (F5)</button>
                <button type="button" onClick={() => { void saveEntries(workerItems); handlePrint(); }} className="erp-entry-btn erp-entry-btn-blue flex-1 justify-center"><Printer className="w-4 h-4" /> Save & Print Slip (F6)</button>
              </div>
            </div>
          </ErpNumberedSection>

          <ErpNumberedSection number={3} title={`Today Summary (${worker} - ${machine})`}>
            <ErpIconStatCards items={[
              { icon: List, label: 'Total Assigned', value: `${totals.assignedItems} Items / ${totals.assignedNos} Nos`, ring: 'ring-blue' },
              { icon: CheckCircle, label: 'Ready To Today', value: `${savedToday.length} Items / ${totals.readyToday} Nos`, ring: 'ring-green' },
              { icon: Clock, label: 'Still Pending', value: `${totals.assignedItems} Items / ${totals.pendingNos} Nos`, ring: 'ring-orange' },
              { icon: Scale, label: 'Ready Weight', value: `${(totals.readyToday * 25).toFixed(3)} KG`, ring: 'ring-purple' },
            ]} />
          </ErpNumberedSection>
        </div>
      </div>

      <ErpNumberedSection number={4} title="Today Ready To Items" subtitle="Moved To Ready For Dispatch">
        <div className="overflow-x-auto">
          <table className="tc-mgmt-table w-full text-[10px]">
            <thead><tr><th>Sr</th><th>SO No.</th><th>Part</th><th>Ready To Nos</th><th>Time</th><th>Action</th></tr></thead>
            <tbody>
              {savedToday.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-6 text-slate-400 italic">No items marked ready today</td></tr>
              ) : savedToday.map((s, i) => (
                <tr key={`${s.key}-${i}`}>
                  <td>{i + 1}</td>
                  <td className="font-bold text-brand-blue">{s.row.orderNo}</td>
                  <td>{s.row.partName}</td>
                  <td className="text-center font-bold text-green-600">{s.qty}</td>
                  <td className="text-center">{s.time}</td>
                  <td><button type="button" onClick={() => setSavedToday(prev => prev.filter((_, j) => j !== i))} className="text-red-500 text-[10px] font-bold">Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ErpInfoNote>
          Items with balance pending qty remain in Section 1. Fully ready items are removed automatically.
        </ErpInfoNote>
      </ErpNumberedSection>

      <ErpEntryToolbar buttons={[
        { label: 'Save All', tone: 'green', icon: <Save className="w-4 h-4" />, hotkey: 'save', onClick: () => void saveEntries(workerItems) },
        { label: 'Print List', tone: 'purple', icon: <Printer className="w-4 h-4" />, hotkey: 'print', onClick: handlePrint },
        { label: 'Save & Next', tone: 'blue', icon: <ArrowRight className="w-4 h-4" />, onClick: () => void saveEntries(workerItems) },
      ]} />

      {printData && (
        <div className="fixed left-[-9999px] top-0 -z-10 pointer-events-none" aria-hidden="true">
          <WorkerCuttingListPrint data={printData} />
        </div>
      )}
    </ErpEntryPage>
  );
};
