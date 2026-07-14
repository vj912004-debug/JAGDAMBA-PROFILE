import React, { useCallback, useMemo, useState } from 'react';
import {
  Copy, Download, Eye, MessageSquare, Plus, Printer, RotateCcw, Save, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../components/Sidebar';
import { NumericInput } from '../components/NumericInput';
import { ErpEntryPage } from '../components/ErpPageShell';
import { AnmsMtcPrint } from '../components/AnmsMtcPrint';
import { useAppContext } from '../store/AppContext';
import { upper } from '../utils/textCase';
import { erpHotkeyProps } from '../utils/erpHotkeys';
import {
  AMNS_MAKES,
  AMNS_SUPPLIERS,
  EQUIVALENT_SPECS,
  PRODUCT_TYPES,
  SPECIFICATIONS,
  emptyAnmsMtc,
  emptyHeatRow,
  emptyMechRow,
  fmtQtyNet,
  sumQtyNet,
  type AnmsHeatAnalysis,
  type AnmsMechanicalProperty,
  type AnmsMtcRecord,
} from '../utils/anmsMtcHelpers';
import { downloadAnmsMtcPdf } from '../utils/anmsMtcDownload';

const MtcLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <label className="anms-mtc-label">
    {children}
    {required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const MtcInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  uppercase?: boolean;
  type?: string;
  className?: string;
}> = ({ value, onChange, uppercase, type = 'text', className = '' }) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(uppercase ? upper(e.target.value) : e.target.value)}
    className={`anms-mtc-input ${className}`.trim()}
  />
);

const CellInput: React.FC<{ value: string; onChange: (v: string) => void; numeric?: boolean }> = ({
  value, onChange, numeric,
}) => numeric ? (
  <NumericInput value={value} onChange={onChange} className="anms-mtc-cell-input" />
) : (
  <input value={value} onChange={e => onChange(upper(e.target.value))} className="anms-mtc-cell-input" />
);

export const MillTestCertificateAnms: React.FC = () => {
  const { anmsMtcRecords, setAnmsMtcRecords, companyProfile, persistErpNow } = useAppContext();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AnmsMtcRecord>(() =>
    emptyAnmsMtc(companyProfile.name, companyProfile.address),
  );
  const [selectedHeatId, setSelectedHeatId] = useState<string>(() => form.heatAnalysis[0]?.id ?? '');
  const [selectedMechId, setSelectedMechId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const activeHeat = useMemo(
    () => form.heatAnalysis.find(h => h.id === selectedHeatId) ?? form.heatAnalysis[0],
    [form.heatAnalysis, selectedHeatId],
  );

  const mechForHeat = useMemo(
    () => form.mechanicalProperties.filter(m => m.heatNo === (activeHeat?.heatNo || '')),
    [form.mechanicalProperties, activeHeat?.heatNo],
  );

  const totalQtyNet = useMemo(() => sumQtyNet(mechForHeat), [mechForHeat]);

  const setField = <K extends keyof AnmsMtcRecord>(key: K, value: AnmsMtcRecord[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const updateHeat = (id: string, patch: Partial<AnmsHeatAnalysis>) => {
    setForm(prev => {
      const oldHeatNo = prev.heatAnalysis.find(x => x.id === id)?.heatNo ?? '';
      const heatAnalysis = prev.heatAnalysis.map(h => h.id === id ? { ...h, ...patch } : h);
      const changed = patch.heatNo !== undefined
        ? {
          mechanicalProperties: prev.mechanicalProperties.map(m =>
            m.heatNo === oldHeatNo || (!m.heatNo && !oldHeatNo)
              ? { ...m, heatNo: patch.heatNo! }
              : m,
          ),
        }
        : {};
      return { ...prev, heatAnalysis, ...changed };
    });
  };

  const updateMech = (id: string, patch: Partial<AnmsMechanicalProperty>) =>
    setForm(prev => ({
      ...prev,
      mechanicalProperties: prev.mechanicalProperties.map(m => m.id === id ? { ...m, ...patch } : m),
    }));

  const addHeat = () => {
    const row = emptyHeatRow();
    setForm(prev => ({ ...prev, heatAnalysis: [...prev.heatAnalysis, row] }));
    setSelectedHeatId(row.id);
    toast.success('Heat analysis row added');
  };

  const copyHeat = () => {
    if (!activeHeat) return;
    const row = { ...activeHeat, id: `${Date.now()}-h`, heatNo: `${activeHeat.heatNo}-COPY` };
    setForm(prev => ({ ...prev, heatAnalysis: [...prev.heatAnalysis, row] }));
    setSelectedHeatId(row.id);
    toast.success('Heat copied');
  };

  const deleteHeat = () => {
    if (form.heatAnalysis.length <= 1) {
      toast.error('At least one heat analysis row is required');
      return;
    }
    if (!activeHeat) return;
    setForm(prev => ({
      ...prev,
      heatAnalysis: prev.heatAnalysis.filter(h => h.id !== activeHeat.id),
      mechanicalProperties: prev.mechanicalProperties.filter(m => m.heatNo !== activeHeat.heatNo),
    }));
    setSelectedHeatId(form.heatAnalysis.find(h => h.id !== activeHeat.id)?.id ?? '');
    toast.success('Heat analysis deleted');
  };

  const addMech = () => {
    const heatNo = activeHeat?.heatNo ?? '';
    const row = emptyMechRow(heatNo);
    setForm(prev => ({ ...prev, mechanicalProperties: [...prev.mechanicalProperties, row] }));
    setSelectedMechId(row.id);
    toast.success('Mechanical property row added');
  };

  const copyMech = () => {
    const src = form.mechanicalProperties.find(m => m.id === selectedMechId) ?? mechForHeat[mechForHeat.length - 1];
    if (!src) {
      toast.error('Select a mechanical row to copy');
      return;
    }
    const row = { ...src, id: `${Date.now()}-m`, batchId: src.batchId ? `${src.batchId}-COPY` : '' };
    setForm(prev => ({ ...prev, mechanicalProperties: [...prev.mechanicalProperties, row] }));
    setSelectedMechId(row.id);
    toast.success('Batch copied');
  };

  const deleteMech = () => {
    const id = selectedMechId ?? mechForHeat[mechForHeat.length - 1]?.id;
    if (!id) return;
    if (mechForHeat.length <= 1 && form.mechanicalProperties.filter(m => m.heatNo === activeHeat?.heatNo).length <= 1) {
      toast.error('At least one mechanical row is required for this heat');
      return;
    }
    setForm(prev => ({
      ...prev,
      mechanicalProperties: prev.mechanicalProperties.filter(m => m.id !== id),
    }));
    setSelectedMechId(null);
    toast.success('Mechanical row deleted');
  };

  const validate = () => {
    if (!form.testCertificateNo.trim()) { toast.error('Test Certificate No is required'); return false; }
    if (!form.saleOrderNo.trim()) { toast.error('Sale Order No is required'); return false; }
    if (!form.testCertificateDate) { toast.error('Test Certificate Date is required'); return false; }
    if (!form.salesOrderDate) { toast.error('Sales Order Date is required'); return false; }
    if (!form.customerTo.trim()) { toast.error('To (Customer) is required'); return false; }
    if (!form.heatAnalysis.some(h => h.heatNo.trim())) { toast.error('Heat No is required in Heat Analysis'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const id = editingId ?? `ANMS-MTC-${Date.now()}`;
    const record: AnmsMtcRecord = { ...form, id };
    const next = editingId
      ? anmsMtcRecords.map(r => r.id === editingId ? record : r)
      : [record, ...anmsMtcRecords];
    setAnmsMtcRecords(next);
    setEditingId(id);
    setForm(record);
    try {
      await persistErpNow({ anmsMtcRecords: next });
      toast.success('MTC saved');
    } catch {
      toast.success('Saved locally — server sync failed');
    }
  };

  const handleNew = () => {
    const blank = emptyAnmsMtc(companyProfile.name, companyProfile.address);
    setForm(blank);
    setEditingId(null);
    setSelectedHeatId(blank.heatAnalysis[0]?.id ?? '');
    setSelectedMechId(null);
    setShowPreview(false);
    toast.success('New MTC entry');
  };

  const loadRecord = (record: AnmsMtcRecord) => {
    setForm(record);
    setEditingId(record.id);
    setSelectedHeatId(record.heatAnalysis[0]?.id ?? '');
    setSelectedMechId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success(`Loaded ${record.testCertificateNo || record.id}`);
  };

  const handlePrint = useCallback(() => {
    setShowPreview(true);
    setTimeout(() => window.print(), 150);
  }, []);

  const handleDownload = useCallback(async () => {
    setShowPreview(true);
    await new Promise((r) => setTimeout(r, 100));
    try {
      await downloadAnmsMtcPdf(form);
      toast.success('MTC downloaded (landscape PDF)');
    } catch {
      toast.error('Failed to generate MTC PDF');
    }
  }, [form]);

  const handleWhatsApp = () => {
    toast('WhatsApp share — attach saved MTC PDF when available', { icon: '📱' });
  };

  const fmtDate = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <ErpEntryPage className="anms-mtc-page">
      <div className="anms-mtc-hero no-print">
        <div className="anms-mtc-brand">
          <img src="/logo.png" alt="Jagdamba Profile" className="anms-mtc-logo" />
          <div>
            <h1 className="anms-mtc-title">MILL TEST CERTIFICATE</h1>
            <p className="anms-mtc-subtitle">FOR HOT ROLLED MEDIUM AND HIGH TENSILE STRUCTURAL STEEL IS: 2062</p>
          </div>
        </div>
        <div className="anms-mtc-toolbar">
          <button type="button" {...erpHotkeyProps('new')} onClick={handleNew} className="anms-mtc-btn anms-mtc-btn-blue">
            <Plus className="w-4 h-4" /> New TC
          </button>
          <button type="button" {...erpHotkeyProps('save')} onClick={handleSave} className="anms-mtc-btn anms-mtc-btn-orange">
            <Save className="w-4 h-4" /> Save TC
          </button>
          <button type="button" onClick={() => setShowPreview(v => !v)} className="anms-mtc-btn anms-mtc-btn-green">
            <Eye className="w-4 h-4" /> Preview / Print
          </button>
          <button type="button" onClick={handlePrint} className="anms-mtc-btn anms-mtc-btn-navy">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button type="button" onClick={() => void handleDownload()} className="anms-mtc-btn anms-mtc-btn-navy">
            <Download className="w-4 h-4" /> Download PDF
          </button>
          <button type="button" onClick={handleWhatsApp} className="anms-mtc-btn anms-mtc-btn-wa">
            <MessageSquare className="w-4 h-4" /> WhatsApp
          </button>
        </div>
      </div>

      <div className="space-y-4 no-print">
        <div className="tc-mgmt-panel">
          <div className="tc-mgmt-panel-head">TC Basic Details</div>
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-3">
            <div className="space-y-3">
              <div>
                <MtcLabel required>Test Certificate No.</MtcLabel>
                <MtcInput value={form.testCertificateNo} onChange={v => setField('testCertificateNo', v)} uppercase />
              </div>
              <div>
                <MtcLabel required>Sale Order No.</MtcLabel>
                <MtcInput value={form.saleOrderNo} onChange={v => setField('saleOrderNo', v)} uppercase />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <MtcLabel required>Test Certificate Date</MtcLabel>
                  <MtcInput type="date" value={form.testCertificateDate} onChange={v => setField('testCertificateDate', v)} />
                </div>
                <div>
                  <MtcLabel required>Sales Order Date</MtcLabel>
                  <MtcInput type="date" value={form.salesOrderDate} onChange={v => setField('salesOrderDate', v)} />
                </div>
              </div>
              <div>
                <MtcLabel>Invoice No.</MtcLabel>
                <MtcInput value={form.invoiceNo} onChange={v => setField('invoiceNo', v)} uppercase />
              </div>
              <div>
                <MtcLabel>Vehicle No.</MtcLabel>
                <MtcInput value={form.vehicleNo} onChange={v => setField('vehicleNo', v)} uppercase />
              </div>
              <div>
                <MtcLabel>Product Type</MtcLabel>
                <select value={form.productType} onChange={e => setField('productType', e.target.value)} className="anms-mtc-input">
                  {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <MtcLabel>Internal Grade</MtcLabel>
                <MtcInput value={form.internalGrade} onChange={v => setField('internalGrade', v)} uppercase />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <MtcLabel>Specification</MtcLabel>
                <select value={form.specification} onChange={e => setField('specification', e.target.value)} className="anms-mtc-input">
                  {SPECIFICATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <MtcLabel>Equivalent Specification</MtcLabel>
                <select value={form.equivalentSpecification} onChange={e => setField('equivalentSpecification', e.target.value)} className="anms-mtc-input">
                  {EQUIVALENT_SPECS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <MtcLabel required>To (Customer)</MtcLabel>
                <textarea
                  value={form.customerTo}
                  onChange={e => setField('customerTo', e.target.value)}
                  rows={5}
                  className="anms-mtc-input resize-y min-h-[110px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <MtcLabel>Supplier / Manufacturer</MtcLabel>
                  <select value={form.supplierManufacturer} onChange={e => setField('supplierManufacturer', e.target.value)} className="anms-mtc-input">
                    <option value="">- Select -</option>
                    {AMNS_SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <MtcLabel>Make</MtcLabel>
                  <select value={form.make} onChange={e => setField('make', e.target.value)} className="anms-mtc-input">
                    <option value="">- Select -</option>
                    {AMNS_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <MtcLabel>Remarks</MtcLabel>
                <MtcInput value={form.remarks} onChange={v => setField('remarks', v)} />
              </div>
            </div>
          </div>
        </div>

        <div className="tc-mgmt-panel">
          <div className="tc-mgmt-panel-head flex flex-wrap items-center justify-between gap-2">
            <span>Heat Analysis (%) {activeHeat?.heatNo ? `of ${activeHeat.heatNo}` : ''}</span>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={addHeat} className="anms-mtc-mini-btn anms-mtc-mini-blue"><Plus className="w-3 h-3" /> Add Heat Analysis</button>
              <button type="button" onClick={copyHeat} className="anms-mtc-mini-btn anms-mtc-mini-orange"><Copy className="w-3 h-3" /> Copy Previous Heat</button>
              <button type="button" onClick={deleteHeat} className="anms-mtc-mini-btn anms-mtc-mini-red"><Trash2 className="w-3 h-3" /> Delete</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full tc-mgmt-table anms-mtc-table">
              <thead>
                <tr>
                  {['Heat No', 'C', 'MN', 'S', 'P', 'SI', 'AL', 'CR', 'CU', 'NI', 'TI', 'V', 'NB', 'MO', 'N', 'MAE', 'CE'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.heatAnalysis.map(row => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedHeatId(row.id)}
                    className={cn('cursor-pointer', selectedHeatId === row.id && 'ring-2 ring-inset ring-brand-blue')}
                  >
                    <td><CellInput value={row.heatNo} onChange={v => updateHeat(row.id, { heatNo: v })} /></td>
                    <td><CellInput value={row.c} onChange={v => updateHeat(row.id, { c: v })} numeric /></td>
                    <td><CellInput value={row.mn} onChange={v => updateHeat(row.id, { mn: v })} numeric /></td>
                    <td><CellInput value={row.s} onChange={v => updateHeat(row.id, { s: v })} numeric /></td>
                    <td><CellInput value={row.p} onChange={v => updateHeat(row.id, { p: v })} numeric /></td>
                    <td><CellInput value={row.si} onChange={v => updateHeat(row.id, { si: v })} numeric /></td>
                    <td><CellInput value={row.al} onChange={v => updateHeat(row.id, { al: v })} numeric /></td>
                    <td><CellInput value={row.cr} onChange={v => updateHeat(row.id, { cr: v })} numeric /></td>
                    <td><CellInput value={row.cu} onChange={v => updateHeat(row.id, { cu: v })} numeric /></td>
                    <td><CellInput value={row.ni} onChange={v => updateHeat(row.id, { ni: v })} numeric /></td>
                    <td><CellInput value={row.ti} onChange={v => updateHeat(row.id, { ti: v })} numeric /></td>
                    <td><CellInput value={row.v} onChange={v => updateHeat(row.id, { v: v })} numeric /></td>
                    <td><CellInput value={row.nb} onChange={v => updateHeat(row.id, { nb: v })} numeric /></td>
                    <td><CellInput value={row.mo} onChange={v => updateHeat(row.id, { mo: v })} numeric /></td>
                    <td><CellInput value={row.n} onChange={v => updateHeat(row.id, { n: v })} numeric /></td>
                    <td><CellInput value={row.mae} onChange={v => updateHeat(row.id, { mae: v })} numeric /></td>
                    <td><CellInput value={row.ce} onChange={v => updateHeat(row.id, { ce: v })} numeric /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="tc-mgmt-panel">
          <div className="tc-mgmt-panel-head flex flex-wrap items-center justify-between gap-2">
            <span>Mechanical Properties for Batches of Heat: {activeHeat?.heatNo || '—'}</span>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={addMech} className="anms-mtc-mini-btn anms-mtc-mini-blue"><Plus className="w-3 h-3" /> Add Mechanical Property</button>
              <button type="button" onClick={copyMech} className="anms-mtc-mini-btn anms-mtc-mini-orange"><Copy className="w-3 h-3" /> Copy Previous Batch</button>
              <button type="button" onClick={deleteMech} className="anms-mtc-mini-btn anms-mtc-mini-red"><Trash2 className="w-3 h-3" /> Delete</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full tc-mgmt-table anms-mtc-table">
              <thead>
                <tr>
                  {['Item No', 'Batch ID', 'Thk', 'Wid', 'Qty Net', 'YS', 'UTS', 'EL', 'BEND'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mechForHeat.map(row => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedMechId(row.id)}
                    className={cn('cursor-pointer', selectedMechId === row.id && 'ring-2 ring-inset ring-brand-blue')}
                  >
                    <td><CellInput value={row.itemNo} onChange={v => updateMech(row.id, { itemNo: v })} /></td>
                    <td><CellInput value={row.batchId} onChange={v => updateMech(row.id, { batchId: v })} /></td>
                    <td><CellInput value={row.thk} onChange={v => updateMech(row.id, { thk: v })} numeric /></td>
                    <td><CellInput value={row.wid} onChange={v => updateMech(row.id, { wid: v })} numeric /></td>
                    <td><CellInput value={row.qtyNet} onChange={v => updateMech(row.id, { qtyNet: v })} numeric /></td>
                    <td><CellInput value={row.ys} onChange={v => updateMech(row.id, { ys: v })} numeric /></td>
                    <td><CellInput value={row.uts} onChange={v => updateMech(row.id, { uts: v })} numeric /></td>
                    <td><CellInput value={row.el} onChange={v => updateMech(row.id, { el: v })} numeric /></td>
                    <td><CellInput value={row.bend} onChange={v => updateMech(row.id, { bend: v })} /></td>
                  </tr>
                ))}
                {mechForHeat.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-6 text-slate-400 italic">No mechanical rows for this heat</td></tr>
                )}
                {mechForHeat.length > 0 && (
                  <tr className="bg-slate-100 dark:bg-slate-800 font-bold">
                    <td colSpan={4} className="text-right pr-3">Total</td>
                    <td>{fmtQtyNet(totalQtyNet)}</td>
                    <td colSpan={4} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {anmsMtcRecords.length > 0 && (
          <div className="tc-mgmt-panel">
            <div className="tc-mgmt-panel-head flex items-center justify-between">
              <span>Saved MTC Records</span>
              <span className="text-[10px] opacity-80">{anmsMtcRecords.length} saved</span>
            </div>
            <div className="overflow-x-auto max-h-48">
              <table className="w-full tc-mgmt-table">
                <thead>
                  <tr>
                    <th>Sr</th><th>TC No</th><th>TC Date</th><th>Sale Order</th><th>Heat</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {anmsMtcRecords.map((r, i) => (
                    <tr key={r.id} className={cn(editingId === r.id && 'ring-2 ring-inset ring-brand-blue')}>
                      <td>{i + 1}</td>
                      <td className="font-bold text-brand-blue">{r.testCertificateNo || '—'}</td>
                      <td>{fmtDate(r.testCertificateDate)}</td>
                      <td>{r.saleOrderNo || '—'}</td>
                      <td>{r.heatAnalysis[0]?.heatNo || '—'}</td>
                      <td>
                        <button type="button" onClick={() => loadRecord(r)} className="erp-btn erp-btn-ghost text-xs py-1 px-2">
                          <RotateCcw className="w-3 h-3" /> Load
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className={cn('anms-mtc-preview-wrap', showPreview ? 'anms-mtc-preview' : 'hidden print:block')}>
        <AnmsMtcPrint data={form} />
      </div>

      <div className="anms-mtc-footer no-print">
        <span>© 2025 Jagdamba Profile — TC Management System</span>
        <span>Version 1.0.0.0</span>
        <span>{new Date().toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </ErpEntryPage>
  );
};
