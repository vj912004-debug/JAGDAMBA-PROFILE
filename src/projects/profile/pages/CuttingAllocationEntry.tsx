import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Save, RotateCcw, Edit, Trash, Printer, FileDown, FileSpreadsheet } from 'lucide-react';
import { useAppContext, EMPLOYEES, MATERIAL_GRADES } from '../store/AppContext';
import { NumericInput, parseNum } from '../components/NumericInput';
import toast from 'react-hot-toast';
import {
  ErpEntryPage, ErpEntryToolbar, ErpMaterialSection, ErpSummaryTiles, ErpMockupTitleBar, ErpNumberedSection, ErpIconStatCards,
} from '../components/ErpPageShell';
import { Scissors, Users } from 'lucide-react';

const ITEM_TYPES = ['Square / Rectangle', 'Circle (OD / ID)', 'CNC (Profile Cutting)'];

interface AllocRow {
  id: string;
  itemType: string;
  grade: string;
  thickness: string;
  widthOd: string;
  lengthId: string;
  drawingNo: string;
  nos: string;
  karigar: string;
}

const emptyRow = (): AllocRow => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2),
  itemType: '', grade: '', thickness: '', widthOd: '', lengthId: '', drawingNo: '', nos: '', karigar: '',
});

const lbl = 'tc-mgmt-label';
const inp = 'tc-mgmt-input';
const cellInp = 'tc-mgmt-input text-xs py-1';

export const CuttingAllocationEntry: React.FC = () => {
  const { orders, cuttingAllocations, setCuttingAllocations, persistErpNow } = useAppContext();
  const today = new Date().toISOString().split('T')[0];

  const nextEntryNo = () => {
    const max = cuttingAllocations.reduce((m, a) => {
      const n = parseInt(a.entryNo.replace(/\D/g, '').slice(-5), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return `CA/2627/${String(max + 1).padStart(5, '0')}`;
  };

  const [entryNo, setEntryNo] = useState(nextEntryNo());
  const [entryDate, setEntryDate] = useState(today);
  const [orderNo, setOrderNo] = useState('');
  const [remark, setRemark] = useState('');
  const [rows, setRows] = useState<AllocRow[]>([emptyRow(), emptyRow(), emptyRow()]);

  const partyName = useMemo(() => orders.find(o => o.orderNo === orderNo)?.partyName || '', [orders, orderNo]);

  const setField = (id: string, field: keyof AllocRow, value: string | number) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));

  const addRow = () => setRows(prev => [...prev, emptyRow()]);
  const removeRow = (id: string) => setRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);

  const filled = rows.filter(r => r.karigar && parseNum(r.nos) > 0);
  const karigarSummary = useMemo(() => {
    const map = new Map<string, { items: number; nos: number }>();
    filled.forEach(r => {
      const e = map.get(r.karigar) || { items: 0, nos: 0 };
      e.items += 1; e.nos += parseNum(r.nos); map.set(r.karigar, e);
    });
    return Array.from(map.entries());
  }, [filled]);

  const totalItems = filled.length;
  const totalNos = filled.reduce((s, r) => s + parseNum(r.nos), 0);

  const handleSave = async () => {
    if (!orderNo) { toast.error('Select an Order No'); return; }
    if (filled.length === 0) { toast.error('Add at least one allocation row'); return; }

    const record = {
      id: Date.now().toString(),
      entryNo,
      entryDate,
      orderNo,
      partyName,
      remark: remark.trim(),
      rows: filled.map(r => ({
        id: r.id,
        itemType: r.itemType,
        grade: r.grade,
        thickness: r.thickness,
        widthOd: r.widthOd,
        lengthId: r.lengthId,
        drawingNo: r.drawingNo,
        nos: parseNum(r.nos),
        karigar: r.karigar,
        readyQty: 0,
      })),
    };

    const next = [record, ...cuttingAllocations];
    setCuttingAllocations(next);
    try {
      await persistErpNow({ cuttingAllocations: next });
      toast.success(`Cutting allocation ${entryNo} saved`);
      setEntryNo(nextEntryNo());
      handleClear();
    } catch {
      toast.error('Saved locally but server sync failed — retry Save');
    }
  };

  const handleClear = () => { setRows([emptyRow(), emptyRow(), emptyRow()]); setOrderNo(''); setRemark(''); toast('Form cleared'); };

  return (
    <ErpEntryPage>
      <ErpMockupTitleBar title="Worker Cutting Allocation" subtitle="Allocate sales order items to worker for cutting" icon={<Scissors className="w-4 h-4" />} />

      <ErpEntryToolbar
        buttons={[
          { label: 'Save', tone: 'green', icon: <Save className="w-4 h-4" />, hotkey: 'save', onClick: handleSave },
          { label: 'Clear', tone: 'ghost', icon: <RotateCcw className="w-4 h-4" />, hotkey: 'new', onClick: handleClear },
          { label: 'Edit', tone: 'orange', icon: <Edit className="w-4 h-4" />, onClick: () => toast('Select a record to edit') },
          { label: 'Delete', tone: 'red', icon: <Trash className="w-4 h-4" />, onClick: () => toast('Select a record to delete') },
          { label: 'Print', tone: 'navy', icon: <Printer className="w-4 h-4" />, hotkey: 'print', onClick: () => window.print() },
          { label: 'PDF', tone: 'purple', icon: <FileDown className="w-4 h-4" />, hotkey: 'pdf', onClick: () => toast('Generating PDF...') },
          { label: 'Excel', tone: 'teal', icon: <FileSpreadsheet className="w-4 h-4" />, onClick: () => toast('Export to Excel') },
        ]}
      />

      <div className="tc-mgmt-panel">
        <div className="tc-mgmt-panel-head flex items-center gap-2"><Users className="w-4 h-4" /> Allocation Details</div>
        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <div><label className={lbl}>Entry No (Auto)</label><input value={entryNo} readOnly className="tc-mgmt-input bg-slate-100 dark:bg-slate-800 font-mono" /></div>
          <div><label className={lbl}>Entry Date *</label><input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className={inp} /></div>
          <div>
            <label className={lbl}>Order No *</label>
            <select value={orderNo} onChange={e => setOrderNo(e.target.value)} className={inp}>
              <option value="">Select Order</option>
              {orders.map(o => <option key={o.id} value={o.orderNo}>{o.orderNo}</option>)}
            </select>
          </div>
          <div><label className={lbl}>Party Name</label><input value={partyName} readOnly placeholder="Auto from order" className="tc-mgmt-input bg-blue-50 dark:bg-blue-900/30 font-bold text-brand-blue" /></div>
          <div><label className={lbl}>Remark</label><input value={remark} onChange={e => setRemark(e.target.value)} placeholder="Karigar wise allocate" className={inp} /></div>
        </div>
      </div>

      <ErpMaterialSection
        title="Material Allocation Entry"
        actions={
          <button type="button" onClick={addRow} className="erp-entry-btn erp-entry-btn-blue text-[10px] py-1 px-2">
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
        }
      >
        <table className="tc-mgmt-table w-full min-w-[1100px]">
          <thead>
            <tr>
              <th>Sr</th>
              <th>Item Type *</th>
              <th>Grade *</th>
              <th>Thk (mm) *</th>
              <th>Width / OD</th>
              <th>Length / ID</th>
              <th>Drawing No</th>
              <th>Nos *</th>
              <th>Karigar *</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td>{i + 1}</td>
                <td>
                  <select value={r.itemType} onChange={e => setField(r.id, 'itemType', e.target.value)} className={`w-36 ${cellInp}`}>
                    <option value="">Select</option>
                    {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td>
                  <select value={r.grade} onChange={e => setField(r.id, 'grade', e.target.value)} className={`w-28 ${cellInp}`}>
                    <option value="">Select</option>
                    {MATERIAL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </td>
                <td><NumericInput value={r.thickness} onChange={v => setField(r.id, 'thickness', v)} className={`text-right w-20 ${cellInp}`} /></td>
                <td><NumericInput value={r.widthOd} onChange={v => setField(r.id, 'widthOd', v)} className={`text-right w-20 ${cellInp}`} /></td>
                <td><NumericInput value={r.lengthId} onChange={v => setField(r.id, 'lengthId', v)} className={`text-right w-20 ${cellInp}`} /></td>
                <td><input value={r.drawingNo} onChange={e => setField(r.id, 'drawingNo', e.target.value)} placeholder="-" className={cellInp} /></td>
                <td><NumericInput value={r.nos} onChange={v => setField(r.id, 'nos', v)} className={`text-right w-16 ${cellInp}`} /></td>
                <td>
                  <select value={r.karigar} onChange={e => setField(r.id, 'karigar', e.target.value)} className={`w-28 ${cellInp}`}>
                    <option value="">Select</option>
                    {EMPLOYEES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </td>
                <td className="text-center">
                  <button type="button" onClick={() => removeRow(r.id)} disabled={rows.length === 1} className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-30">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ErpMaterialSection>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="tc-mgmt-panel lg:col-span-2">
          <div className="tc-mgmt-panel-head green">Karigar Summary</div>
          <div className="p-3">
            {karigarSummary.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Assign karigars to see the summary</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {karigarSummary.map(([name, s]) => (
                  <div key={name} className="erp-list-summary-card">
                    <div className="label">{name}</div>
                    <div className="value text-base">{s.items} items · {s.nos} nos</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="tc-mgmt-panel">
          <div className="tc-mgmt-panel-head">Total Summary</div>
          <div className="p-3">
            <ErpSummaryTiles items={[
              { label: 'Total Items', value: totalItems, tone: 'blue' },
              { label: 'Total Nos', value: totalNos, tone: 'green' },
            ]} />
          </div>
        </div>
      </div>
    </ErpEntryPage>
  );
};
