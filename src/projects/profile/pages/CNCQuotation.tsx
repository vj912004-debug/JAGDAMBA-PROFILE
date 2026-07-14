import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, Trash2, Printer, RotateCcw, Search, List, Download, Save, FileDown,
  MessageSquare, Mail, Pencil,
} from 'lucide-react';
import { generateCNCQuotationPDF } from '../utils/cncQuotationDownload';
import { useAppContext, type CNCQuotationRecord } from '../store/AppContext';
import toast from 'react-hot-toast';
import { PartyAutocomplete } from '../components/PartyAutocomplete';
import { NumericInput, parseNum } from '../components/NumericInput';
import { upper } from '../utils/textCase';
import type { PartyMaster } from '../store/AppContext';
import { CNCQuotationPrint } from '../components/CNCQuotationPrint';
import { erpHotkeyProps } from '../utils/erpHotkeys';
import { ErpHotkeyLabel } from '../components/ErpHotkeyLabel';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface CNCItem {
  id: string;
  shape: 'CNC Profile' | 'Square';
  drawingNo: string;
  grade: string;
  thickness: number;
  width: number;
  length: number;
  plateNos: number;
  plateRate: number;
  partOfNos: number;
  scrapPerNos?: number;
  finishGoodWeight: number;
  mtr: number;
  piercing: number;
  piercingType: 'Full' | 'Half' | 'Manual';
  burningLossFactor: number;
  scrapRate: number;
  meterFactor: number;
  piercingRate: number;
  amount: number;
  finalRate: number;
  plateWeight: number;
}

const fmtNum = (n: number, dec = 2) =>
  (isFinite(n) ? n : 0).toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const req = <span className="text-red-500">*</span>;

const getFinancialYear = (dateStr: string) => {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = m >= 3 ? y : y - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
};

const nextInquiryNo = (dateStr: string) => {
  const fy = getFinancialYear(dateStr);
  const [a, b] = fy.split('-');
  const seq = String(Math.floor(Math.random() * 900) + 100).padStart(3, '0');
  return `JP${a.slice(-2)}/${b}/${seq}`;
};

const defaultItem = (id = '1'): CNCItem => ({
  id,
  shape: 'CNC Profile',
  drawingNo: '',
  grade: 'IS 2062',
  thickness: 0,
  width: 0,
  length: 0,
  plateNos: 1,
  plateRate: 0,
  partOfNos: 1,
  scrapPerNos: 0,
  finishGoodWeight: 0,
  mtr: 0,
  piercing: 0,
  piercingType: 'Full',
  burningLossFactor: 3,
  scrapRate: 0,
  meterFactor: 1.5,
  piercingRate: 0,
  amount: 0,
  finalRate: 0,
  plateWeight: 0,
});

const calcDisplay = (item: CNCItem) => {
  const t = parseNum(item.thickness);
  const w = parseNum(item.width);
  const l = parseNum(item.length);
  const plateRate = parseNum(item.plateRate);
  const scrapPerNos = parseNum(item.scrapPerNos ?? 0);
  const scrapRate = parseNum(item.scrapRate);
  const nos = parseNum(item.partOfNos) || 1;
  const weightPerNos = (t * w * l * 8) / 1_000_000;
  const ratePerNos = weightPerNos * plateRate;
  const scrapAmtPerNos = scrapPerNos * scrapRate;
  const finalRatePerNos = Math.max(0, ratePerNos - scrapAmtPerNos);
  const lineTotal = Math.ceil(finalRatePerNos * nos);
  return { weightPerNos, ratePerNos, scrapAmtPerNos, finalRatePerNos, lineTotal, nos };
};

const SectionHead: React.FC<{ num: number; title: string; variant: 'blue' | 'green' | 'purple' | 'orange' }> = ({ num, title, variant }) => (
  <div className={`cnc-quote-section-head ${variant}`}>
    <span className="cnc-quote-section-num">{num}</span>
    <span>{title}</span>
  </div>
);

export const CNCQuotation: React.FC = () => {
  const { cncQuotations, addCNCQuotation, updateCNCQuotation, deleteCNCQuotation, user, persistErpNow } = useAppContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('edit');
  const [editingId, setEditingId] = useState<string | null>(editId);

  const [viewMode, setViewMode] = useState<'create' | 'list'>('create');
  const [search, setSearch] = useState('');

  const [partyName, setPartyName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [inquiryNo, setInquiryNo] = useState(() => nextInquiryNo(new Date().toISOString().split('T')[0]));
  const [quoteNo, setQuoteNo] = useState(`CNC-${Date.now().toString().slice(-6)}`);
  const [quoteRemarks, setQuoteRemarks] = useState('');

  const [items, setItems] = useState<CNCItem[]>([defaultItem()]);
  const [activeItemId, setActiveItemId] = useState('1');

  const [loadingCharges, setLoadingCharges] = useState(0);
  const [transportCharges, setTransportCharges] = useState(0);
  const [gstRate, setGstRate] = useState(18);

  const [revisionOldRate, setRevisionOldRate] = useState('');
  const [revisionType, setRevisionType] = useState<'Increase' | 'Decrease'>('Increase');
  const [revisionValue, setRevisionValue] = useState('');
  const [revisionNewRate, setRevisionNewRate] = useState('');
  const [revisionEffectiveFrom, setRevisionEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [revisionReason, setRevisionReason] = useState('');

  const activeItem = useMemo(
    () => items.find(i => i.id === activeItemId) ?? items[0],
    [items, activeItemId],
  );

  const activeCalc = useMemo(() => (activeItem ? calcDisplay(activeItem) : null), [activeItem]);

  const updateItem = (id: string, field: keyof CNCItem, value: unknown) => {
    const enumFields: (keyof CNCItem)[] = ['shape', 'piercingType'];
    const numericFields = new Set([
      'thickness', 'width', 'length', 'plateNos', 'plateRate', 'partOfNos', 'scrapPerNos', 'finishGoodWeight',
      'mtr', 'piercing', 'burningLossFactor', 'scrapRate', 'meterFactor', 'piercingRate',
      'amount', 'finalRate', 'plateWeight',
    ]);
    const normalized = typeof value === 'string' && !enumFields.includes(field) && !numericFields.has(field) ? upper(value) : value;
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: normalized } as CNCItem;
      const { finalRatePerNos, lineTotal, weightPerNos } = calcDisplay(updated);
      updated.finalRate = Math.ceil(finalRatePerNos);
      updated.amount = lineTotal;
      updated.plateWeight = parseFloat(weightPerNos.toFixed(3));
      return updated;
    }));
  };

  const addItem = () => {
    const id = Date.now().toString();
    setItems(prev => [...prev, defaultItem(id)]);
    setActiveItemId(id);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
    if (activeItemId === id) {
      const remaining = items.filter(i => i.id !== id);
      setActiveItemId(remaining[0]?.id ?? '1');
    }
  };

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);
  const totalNos = useMemo(() => items.reduce((sum, item) => sum + (parseNum(item.partOfNos) || 0), 0), [items]);

  const handleReset = () => {
    const today = new Date().toISOString().split('T')[0];
    setEditingId(null);
    setPartyName('');
    setMobileNo('');
    setDate(today);
    setInquiryNo(nextInquiryNo(today));
    setQuoteNo(`CNC-${Date.now().toString().slice(-6)}`);
    setQuoteRemarks('');
    setItems([defaultItem()]);
    setActiveItemId('1');
    setLoadingCharges(0);
    setTransportCharges(0);
    setGstRate(18);
    setRevisionOldRate('');
    setRevisionValue('');
    setRevisionNewRate('');
    setRevisionReason('');
    toast.success('CNC Quotation reset');
  };

  const handleSave = async () => {
    if (!partyName) { toast.error('Enter party name'); return; }

    const grandTotal = Math.ceil((totalAmount + loadingCharges + transportCharges) * (1 + gstRate / 100));

    const record: CNCQuotationRecord = {
      id: editingId || Date.now().toString(),
      quoteNo,
      inquiryNo,
      date,
      partyName,
      mobileNo,
      items,
      loadingCharges,
      transportCharges,
      gstRate,
      totalAmount,
      grandTotal,
      status: editingId ? (cncQuotations.find(q => q.id === editingId)?.status || 'Pending') : 'Pending',
    };

    try {
      if (editingId) {
        updateCNCQuotation(record);
        await persistErpNow({
          cncQuotations: cncQuotations.map(q => q.id === record.id ? record : q),
        });
        toast.success('CNC Quotation updated successfully');
      } else {
        addCNCQuotation(record);
        await persistErpNow({ cncQuotations: [record, ...cncQuotations] });
        toast.success('CNC Quotation saved successfully');
      }
      setEditingId(record.id);
    } catch {
      toast.error('Saved locally but server sync failed — retry Save');
    }
  };

  const handleDeleteCNC = async (id: string) => {
    if (!window.confirm('Delete this CNC Quotation 2?')) return;
    const next = cncQuotations.filter(q => q.id !== id);
    deleteCNCQuotation(id);
    if (editingId === id) setEditingId(null);
    try {
      await persistErpNow({ cncQuotations: next });
      toast.success('CNC Quotation 2 deleted');
    } catch {
      toast.error('Deleted locally but server sync failed');
    }
  };

  const filteredQuotations = useMemo(() => {
    if (!search) return cncQuotations;
    const q = search.toLowerCase();
    return cncQuotations.filter((r: CNCQuotationRecord) => 
      r.quoteNo.toLowerCase().includes(q) || 
      r.partyName.toLowerCase().includes(q) || 
      r.mobileNo.toLowerCase().includes(q)
    );
  }, [cncQuotations, search]);

  const loadQuotation = (q: CNCQuotationRecord) => {
    setEditingId(q.id);
    setQuoteNo(q.quoteNo);
    setInquiryNo(q.inquiryNo || q.quoteNo);
    setDate(q.date);
    setPartyName(q.partyName);
    setMobileNo(q.mobileNo);
    setItems(q.items.map(it => ({ ...defaultItem(it.id), ...it, scrapPerNos: (it as CNCItem).scrapPerNos ?? 0 })));
    setActiveItemId(q.items[0]?.id ?? '1');
    setLoadingCharges(q.loadingCharges);
    setTransportCharges(q.transportCharges);
    setGstRate(q.gstRate);
    setViewMode('create');
    toast.success('CNC Quotation loaded');
  };

  useEffect(() => {
    if (!editId) return;
    const existing = cncQuotations.find(q => q.id === editId);
    if (existing) loadQuotation(existing);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, cncQuotations]);

  const taxableBase = totalAmount + loadingCharges + transportCharges;
  const gstAmount = Math.ceil(taxableBase * gstRate / 100);
  const grandTotal = Math.ceil(taxableBase * (1 + gstRate / 100));

  const buildCurrentQuote = (): CNCQuotationRecord => ({
    id: editingId || 'preview',
    quoteNo,
    inquiryNo,
    date,
    partyName,
    mobileNo,
    items,
    loadingCharges,
    transportCharges,
    gstRate,
    totalAmount,
    grandTotal,
  });

  const handlePrint = () => window.print();

  const handlePdf = async (quote: CNCQuotationRecord) => {
    toast.loading('Generating PDF...', { id: 'cnc-quote-pdf' });
    try {
      await generateCNCQuotationPDF(quote, user?.displayName || user?.username);
      toast.success(`PDF downloaded: ${quote.quoteNo}`, { id: 'cnc-quote-pdf' });
    } catch {
      toast.error('PDF generation failed', { id: 'cnc-quote-pdf' });
    }
  };

  const handleSelectParty = (party: PartyMaster) => {
    setPartyName(party.partyName);
    if (party.mobileNumber) setMobileNo(party.mobileNumber);
    toast.success('Details auto-filled from Party Master', { icon: '✨' });
  };

  const handleApplyRevision = () => {
    if (!activeItem) return;
    const base = parseNum(revisionOldRate) || parseNum(activeItem.plateRate);
    const delta = parseNum(revisionValue);
    if (!delta) { toast.error('Enter revision value'); return; }
    const newRate = Math.max(0, revisionType === 'Increase' ? base + delta : base - delta);
    updateItem(activeItem.id, 'plateRate', newRate);
    setRevisionNewRate(String(newRate));
    toast.success('Plate rate revision applied');
  };

  const handleConvert = async () => {
    if (!partyName) { toast.error('Enter party name'); return; }
    if (!editingId) {
      toast.error('Save quotation first, then convert to order');
      return;
    }
    navigate(`/cnc-quotation-convert?id=${editingId}`);
  };

  useEffect(() => {
    if (!activeItem) return;
    setRevisionOldRate(String(activeItem.plateRate || ''));
    setRevisionNewRate(String(activeItem.plateRate || ''));
  }, [activeItem?.id, activeItem?.plateRate]);

  if (viewMode === 'list') {
    return (
      <div className="max-w-[1200px] mx-auto space-y-6 fade-in pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Saved CNC Quotation 2</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{cncQuotations.length} records found</p>
          </div>
          <button onClick={() => setViewMode('create')} className="erp-btn erp-btn-orange">
            <Plus className="w-4 h-4" /> New CNC Quotation 2
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Quote No, Party, Mobile..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-brand-blue outline-none shadow-sm"
          />
        </div>

        <div className="erp-card">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-2xs uppercase font-black text-slate-500 dark:text-slate-400">
                <th className="p-4">Quote No</th>
                <th className="p-4">Party Name</th>
                <th className="p-4">Date</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredQuotations.map((q: CNCQuotationRecord) => (
                <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                  <td className="p-4 font-mono font-bold text-brand-blue">{q.quoteNo}</td>
                  <td className="p-4">
                    <p className="font-bold text-slate-800 dark:text-slate-100">{q.partyName}</p>
                    <p className="text-2xs text-slate-400">{q.mobileNo}</p>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{q.date}</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{q.items.length} Parts</td>
                  <td className="p-4 font-bold text-slate-800 dark:text-slate-100">₹{q.grandTotal.toLocaleString()}</td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => handlePdf(q)} title="Download PDF" className="text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 px-2 py-1 rounded text-xs font-bold transition-all inline-flex items-center gap-1"><Download className="w-3.5 h-3.5" /> PDF</button>
                    <button onClick={() => loadQuotation(q)} className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1 rounded text-xs font-bold transition-all">Edit</button>
                    <button onClick={() => void handleDeleteCNC(q.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 rounded text-xs font-bold transition-all">Delete</button>
                  </td>
                </tr>
              ))}
              {filteredQuotations.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400 italic">No CNC Quotation 2 records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <>
    <style>{`
      @media print {
        body * { visibility: hidden !important; }
        #cnc-quotation-print-area, #cnc-quotation-print-area * { visibility: visible !important; }
        #cnc-quotation-print-area {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 210mm !important;
          height: 297mm !important;
          max-width: 210mm !important;
          margin: 0 !important;
          padding: 0 !important;
          z-index: 99999 !important;
        }
      }
    `}</style>
    <div className="cnc-quote-page fade-in print:hidden">
      <div className="cnc-quote-page-toolbar">
        <button type="button" onClick={() => setViewMode('list')} className="cnc-quote-saved-link">
          <List className="w-3.5 h-3.5" /> Saved Quotations
        </button>
      </div>

      {/* §1 Entry + §2 Auto Calculation */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-3">
        <div className="cnc-quote-panel">
          <SectionHead num={1} title="Entry Section (Fill Below Details)" variant="blue" />
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            <div>
              <label className="cnc-quote-label">Party Name {req}</label>
              <PartyAutocomplete
                value={partyName}
                onChange={setPartyName}
                onSelectParty={handleSelectParty}
                placeholder="Select party..."
                className="cnc-quote-input"
              />
            </div>
            <div>
              <label className="cnc-quote-label">Width (mm) {req}</label>
              <NumericInput
                value={activeItem?.width ?? 0}
                onChange={(v) => activeItem && updateItem(activeItem.id, 'width', v)}
                className="cnc-quote-input"
              />
            </div>
            <div>
              <label className="cnc-quote-label">Inquiry No {req}</label>
              <input
                type="text"
                value={inquiryNo}
                onChange={(e) => setInquiryNo(upper(e.target.value))}
                className="cnc-quote-input font-mono"
              />
            </div>
            <div>
              <label className="cnc-quote-label">Nos (Quantity) {req}</label>
              <NumericInput
                value={activeItem?.partOfNos ?? 0}
                onChange={(v) => activeItem && updateItem(activeItem.id, 'partOfNos', v)}
                className="cnc-quote-input"
              />
            </div>
            <div>
              <label className="cnc-quote-label">Inquiry Date {req}</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="cnc-quote-input" />
            </div>
            <div>
              <label className="cnc-quote-label">Plate Rate (₹/Kg) {req}</label>
              <NumericInput
                value={activeItem?.plateRate ?? 0}
                onChange={(v) => activeItem && updateItem(activeItem.id, 'plateRate', v)}
                className="cnc-quote-input"
              />
            </div>
            <div>
              <label className="cnc-quote-label">Drawing / Part No {req}</label>
              <input
                type="text"
                value={activeItem?.drawingNo ?? ''}
                onChange={(e) => activeItem && updateItem(activeItem.id, 'drawingNo', e.target.value)}
                className="cnc-quote-input"
              />
            </div>
            <div>
              <label className="cnc-quote-label">Scrap Per Nos (Kg) {req}</label>
              <NumericInput
                value={activeItem?.scrapPerNos ?? 0}
                onChange={(v) => activeItem && updateItem(activeItem.id, 'scrapPerNos', v)}
                className="cnc-quote-input"
              />
            </div>
            <div>
              <label className="cnc-quote-label">Thickness (mm) {req}</label>
              <NumericInput
                value={activeItem?.thickness ?? 0}
                onChange={(v) => activeItem && updateItem(activeItem.id, 'thickness', v)}
                className="cnc-quote-input"
              />
            </div>
            <div>
              <label className="cnc-quote-label">Scrap Rate (₹/Kg) {req}</label>
              <NumericInput
                value={activeItem?.scrapRate ?? 0}
                onChange={(v) => activeItem && updateItem(activeItem.id, 'scrapRate', v)}
                className="cnc-quote-input"
              />
            </div>
            <div>
              <label className="cnc-quote-label">Length (mm) {req}</label>
              <NumericInput
                value={activeItem?.length ?? 0}
                onChange={(v) => activeItem && updateItem(activeItem.id, 'length', v)}
                className="cnc-quote-input"
              />
            </div>
            <div className="md:row-span-2">
              <label className="cnc-quote-label">Remarks</label>
              <textarea
                value={quoteRemarks}
                onChange={(e) => setQuoteRemarks(e.target.value)}
                placeholder="Enter remarks (optional)"
                rows={4}
                className="cnc-quote-input cnc-quote-textarea resize-none"
              />
            </div>
          </div>
        </div>

        <div className="cnc-quote-panel cnc-quote-calc-panel">
          <SectionHead num={2} title="Auto Calculation (Auto Generated)" variant="green" />
          <div className="cnc-quote-calc-body p-4">
            <div className="cnc-quote-calc-row">
              <span className="cnc-quote-calc-label">Weight Per Nos (Kg)</span>
              <span className="cnc-quote-calc-val">{fmtNum(activeCalc?.weightPerNos ?? 0, 3)}</span>
            </div>
            <div className="cnc-quote-calc-row">
              <span className="cnc-quote-calc-label">Rate Per Nos (₹)</span>
              <span className="cnc-quote-calc-val-green">{fmtNum(activeCalc?.ratePerNos ?? 0)}</span>
            </div>
            <div className="cnc-quote-calc-row">
              <span className="cnc-quote-calc-label">Scrap Amount Per Nos (₹)</span>
              <span className="cnc-quote-calc-val-orange">{fmtNum(activeCalc?.scrapAmtPerNos ?? 0)}</span>
            </div>
            <div className="cnc-quote-calc-row border-b-0">
              <span className="cnc-quote-calc-label">Final Rate Per Nos (₹)</span>
              <span className="cnc-quote-calc-val-blue">{fmtNum(activeCalc?.finalRatePerNos ?? 0)}</span>
            </div>
            <div className="cnc-quote-total-box">
              <div className="cnc-quote-total-box-label">Total Amount (₹)</div>
              <div className="cnc-quote-total-box-val">{fmtNum(activeCalc?.lineTotal ?? 0)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* §3 Item Details */}
      <div className="cnc-quote-panel">
        <div className="flex items-center justify-between">
          <SectionHead num={3} title="Item Details" variant="blue" />
          <button type="button" onClick={addItem} className="cnc-quote-add-row mr-3 shrink-0">
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="cnc-quote-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Drawing / Part No</th>
                <th>Thickness (mm)</th>
                <th>Length (mm)</th>
                <th>Width (mm)</th>
                <th>Nos (Qty)</th>
                <th>Final Rate Per Nos (₹)</th>
                <th>Total Amount (₹)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const row = calcDisplay(item);
                const isActive = item.id === activeItemId;
                return (
                  <tr key={item.id} className={isActive ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''}>
                    <td>{idx + 1}</td>
                    <td className="text-left">{item.drawingNo || '—'}</td>
                    <td>{item.thickness || '—'}</td>
                    <td>{item.length || '—'}</td>
                    <td>{item.width || '—'}</td>
                    <td>{item.partOfNos || '—'}</td>
                    <td className="text-brand-blue">{fmtNum(row.finalRatePerNos)}</td>
                    <td className="font-bold">{fmtNum(row.lineTotal)}</td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setActiveItemId(item.id)}
                          className="p-1 rounded text-brand-blue hover:bg-blue-100 dark:hover:bg-blue-900/40"
                          title="Edit row"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-30"
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} className="text-left font-bold">Total Nos (Qty) : {totalNos}</td>
                <td colSpan={4} className="text-right font-bold text-brand-blue">Grand Total (₹) : {fmtNum(totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* §4 Rate Revision + §5 Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="cnc-quote-panel">
          <SectionHead num={4} title="Rate Revision" variant="purple" />
          <div className="p-4">
            <div className="cnc-quote-revision-row">
              <div className="cnc-quote-revision-field">
                <label className="cnc-quote-label">Old Rate (₹/Kg)</label>
                <NumericInput value={revisionOldRate} onChange={setRevisionOldRate} className="cnc-quote-input" />
              </div>
              <div className="cnc-quote-revision-field">
                <label className="cnc-quote-label">Revision Type</label>
                <select
                  value={revisionType}
                  onChange={(e) => setRevisionType(e.target.value as 'Increase' | 'Decrease')}
                  className="cnc-quote-input"
                >
                  <option value="Increase">Increase (+)</option>
                  <option value="Decrease">Decrease (−)</option>
                </select>
              </div>
              <div className="cnc-quote-revision-field">
                <label className="cnc-quote-label">Revision Value (₹/Kg)</label>
                <NumericInput value={revisionValue} onChange={setRevisionValue} className="cnc-quote-input" />
              </div>
              <div className="cnc-quote-revision-field">
                <label className="cnc-quote-label">New Rate (₹/Kg)</label>
                <input type="text" readOnly value={revisionNewRate} className="cnc-quote-input cnc-quote-input-readonly" />
              </div>
              <div className="cnc-quote-revision-field">
                <label className="cnc-quote-label">Effective From</label>
                <input type="date" value={revisionEffectiveFrom} onChange={(e) => setRevisionEffectiveFrom(e.target.value)} className="cnc-quote-input" />
              </div>
              <div className="cnc-quote-revision-field cnc-quote-revision-field-wide">
                <label className="cnc-quote-label">Reason / Remark</label>
                <input type="text" value={revisionReason} onChange={(e) => setRevisionReason(e.target.value)} className="cnc-quote-input" placeholder="Optional" />
              </div>
              <div className="cnc-quote-revision-field cnc-quote-revision-btn-wrap">
                <button type="button" onClick={handleApplyRevision} className="cnc-quote-apply-revision">
                  Apply Revision
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="cnc-quote-panel">
          <SectionHead num={5} title="Summary (Auto Generated)" variant="orange" />
          <div className="cnc-quote-summary-grid">
            <div className="cnc-quote-summary-cell">
              <div className="cnc-quote-summary-cell-label">Total Amount (₹)</div>
              <div className="cnc-quote-summary-cell-val">{fmtNum(totalAmount)}</div>
            </div>
            <div className="cnc-quote-summary-cell">
              <div className="cnc-quote-summary-cell-label">Total Nos (Qty)</div>
              <div className="cnc-quote-summary-cell-val">{totalNos}</div>
            </div>
            <div className="cnc-quote-summary-cell">
              <div className="cnc-quote-summary-cell-label">Grand Total (₹)</div>
              <div className="cnc-quote-summary-cell-val blue">{fmtNum(totalAmount)}</div>
            </div>
            <div className="cnc-quote-summary-cell">
              <div className="cnc-quote-summary-cell-label">GST %</div>
              <select value={gstRate} onChange={(e) => setGstRate(parseInt(e.target.value))} className="cnc-quote-gst-select">
                <option value={0}>0 %</option>
                <option value={5}>5 %</option>
                <option value={12}>12 %</option>
                <option value={18}>18 %</option>
                <option value={28}>28 %</option>
              </select>
            </div>
            <div className="cnc-quote-summary-cell">
              <div className="cnc-quote-summary-cell-label">GST Amount (₹)</div>
              <div className="cnc-quote-summary-cell-val">{fmtNum(gstAmount)}</div>
            </div>
            <div className="cnc-quote-summary-cell highlight-red">
              <div className="cnc-quote-summary-cell-label">Grand Total With GST (₹)</div>
              <div className="cnc-quote-summary-cell-val red">{fmtNum(grandTotal)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="cnc-quote-footer-actions">
        <button type="button" {...erpHotkeyProps('save')} onClick={() => void handleSave()} className="cnc-quote-foot-btn bg-emerald-600">
          <Save className="w-4 h-4" /> Save <ErpHotkeyLabel action="save" />
        </button>
        <button type="button" {...erpHotkeyProps('print')} onClick={handlePrint} className="cnc-quote-foot-btn bg-blue-600">
          <Printer className="w-4 h-4" /> Print <ErpHotkeyLabel action="print" />
        </button>
        <button type="button" {...erpHotkeyProps('pdf')} onClick={() => void handlePdf(buildCurrentQuote())} className="cnc-quote-foot-btn bg-red-600">
          <FileDown className="w-4 h-4" /> PDF <ErpHotkeyLabel action="pdf" />
        </button>
        <button type="button" onClick={() => toast('WhatsApp share coming soon')} className="cnc-quote-foot-btn bg-green-600">
          <MessageSquare className="w-4 h-4" /> WhatsApp
        </button>
        <button type="button" onClick={() => toast('Email share coming soon')} className="cnc-quote-foot-btn bg-sky-600">
          <Mail className="w-4 h-4" /> Email
        </button>
        <button type="button" onClick={() => void handleConvert()} className="cnc-quote-foot-btn bg-orange-600">
          Convert to Order <span className="erp-hotkey-label">(F5)</span>
        </button>
        <button type="button" onClick={handleReset} className="cnc-quote-foot-btn bg-slate-600">
          <RotateCcw className="w-4 h-4" /> Clear
        </button>
      </div>
    </div>

    <div className="hidden print:block">
      <CNCQuotationPrint quote={buildCurrentQuote()} userName={user?.displayName || user?.username} />
    </div>
    </>
  );
};
