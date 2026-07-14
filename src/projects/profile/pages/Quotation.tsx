import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, Trash2, Printer, List, Save,
  MessageSquare, Mail, FileDown, X, Truck, UserCircle, CalendarClock,
} from 'lucide-react';
import {
  useAppContext, type QuotationRecord, type QuotationItem,
  MATERIAL_GRADES, EMPLOYEES,
} from '../store/AppContext';
import toast from 'react-hot-toast';
import { EditableSelect } from '../components/EditableSelect';
import { upper } from '../utils/textCase';
import { ErpPageHeader } from '../components/ErpPageShell';
import { PartyAutocomplete } from '../components/PartyAutocomplete';
import { NumericInput } from '../components/NumericInput';
import type { PartyMaster } from '../store/AppContext';
import { erpHotkeyProps } from '../utils/erpHotkeys';
import {
  PlateQuotationPrint,
  PLATE_QUOTATION_PRINT_AREA_ID,
  buildPlateQuotationPrintData,
  type PlateQuotationPrintData,
} from '../components/PlateQuotationPrint';
import { generatePlateQuotationPDF } from '../utils/plateQuotationDownload';

const MAKES = ['Jindal', 'SAIL', 'AM/NS', 'Posco', 'Other'];
const PAYMENT_TERMS = ['30 Days', '15 Days', 'Advance', 'Against Delivery', 'Credit'];

const inp = 'pq-input';

function financialYearSuffix(d = new Date()) {
  const year = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${String(year).slice(-2)}-${String(year + 1).slice(-2)}`;
}

function nextQuoteNo(quotations: QuotationRecord[]) {
  const fy = financialYearSuffix();
  const prefix = `QT/${fy}/`;
  const nums = quotations
    .filter(q => q.quoteNo.startsWith(prefix))
    .map(q => parseInt(q.quoteNo.split('/').pop() || '0', 10))
    .filter(n => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
}

function blankItem(): QuotationItem {
  return {
    id: Date.now().toString(),
    shape: 'Square',
    grade: MATERIAL_GRADES[0],
    make: MAKES[0],
    thickness: 0,
    width: 0,
    length: 0,
    od: 0,
    id_dim: 0,
    nos: 1,
    weight: 0,
    rate: 0,
    odRate: 0,
    idRate: 0,
    amount: 0,
    remark: '',
  };
}

function calcPlateWeight(item: QuotationItem): number {
  const t = parseFloat(String(item.thickness)) || 0;
  const w = parseFloat(String(item.width)) || 0;
  const l = parseFloat(String(item.length)) || 0;
  const n = parseInt(String(item.nos), 10) || 0;
  return parseFloat(((t * w * l * n * 8) / 1_000_000).toFixed(2));
}

function calcPlateAmount(weight: number, rate: number) {
  return parseFloat((weight * rate).toFixed(2));
}

function fmt(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function addDays(isoDate: string, days: number) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export const Quotation: React.FC = () => {
  const { quotations, addQuotation, updateQuotation, deleteQuotation, parties, persistErpNow } = useAppContext();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [viewMode, setViewMode] = useState<'create' | 'list'>('create');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(editId);

  const [partyName, setPartyName] = useState('');
  const [partyAddress, setPartyAddress] = useState('');
  const [partyAddressLine2, setPartyAddressLine2] = useState('');
  const [partyMobile, setPartyMobile] = useState('');
  const [partyEmail, setPartyEmail] = useState('');
  const [partyGst, setPartyGst] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quoteNo, setQuoteNo] = useState('');

  useEffect(() => {
    if (!quoteNo) setQuoteNo(nextQuoteNo(quotations));
  }, [quotations, quoteNo]);

  const [paymentTerms, setPaymentTerms] = useState('30 Days');
  const [loadingChargeNote, setLoadingChargeNote] = useState('Extra');
  const [transportChargeNote, setTransportChargeNote] = useState('Extra');
  const [validityDays, setValidityDays] = useState('7');
  const [utLevel, setUtLevel] = useState('');
  const [salesPerson, setSalesPerson] = useState(EMPLOYEES[0] || '');

  const [items, setItems] = useState<QuotationItem[]>([blankItem()]);
  const [gstRate, setGstRate] = useState(18);

  const updateItem = useCallback((id: string, field: keyof QuotationItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'grade' || field === 'make') {
        (updated as any)[field] = typeof value === 'string' ? upper(value) : String(value);
      }
      if (['thickness', 'width', 'length', 'nos', 'rate'].includes(field)) {
        updated.weight = calcPlateWeight(updated);
        updated.amount = calcPlateAmount(updated.weight, parseFloat(String(updated.rate)) || 0);
      }
      return updated;
    }));
  }, []);

  const addItem = () => setItems(prev => [...prev, { ...blankItem(), id: Date.now().toString() }]);

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const totalAmount = useMemo(
    () => parseFloat(items.reduce((s, i) => s + (i.amount || 0), 0).toFixed(2)),
    [items],
  );
  const totalNos = useMemo(
    () => items.reduce((s, i) => s + (parseInt(String(i.nos), 10) || 0), 0),
    [items],
  );
  const totalKg = useMemo(
    () => parseFloat(items.reduce((s, i) => s + (i.weight || 0), 0).toFixed(2)),
    [items],
  );
  const gstAmount = useMemo(
    () => parseFloat((totalAmount * gstRate / 100).toFixed(2)),
    [totalAmount, gstRate],
  );
  const finalAmount = useMemo(
    () => parseFloat((totalAmount + gstAmount).toFixed(2)),
    [totalAmount, gstAmount],
  );


  const handleReset = () => {
    setEditingId(null);
    setPartyName('');
    setPartyAddress('');
    setPartyAddressLine2('');
    setPartyMobile('');
    setPartyEmail('');
    setPartyGst('');
    setDate(new Date().toISOString().split('T')[0]);
    setQuoteNo(nextQuoteNo(quotations));
    setPaymentTerms('30 Days');
    setLoadingChargeNote('Extra');
    setTransportChargeNote('Extra');
    setValidityDays('7');
    setUtLevel('');
    setSalesPerson(EMPLOYEES[0] || '');
    setItems([blankItem()]);
    setGstRate(18);
    toast.success('Quotation cleared');
  };

  const buildRecord = (): QuotationRecord => ({
    id: editingId || Date.now().toString(),
    quoteNo,
    date,
    validUntil: addDays(date, parseInt(validityDays, 10) || 7),
    partyName,
    contactPerson: '',
    mobileNo: partyMobile,
    address: [partyAddress, partyAddressLine2].filter(Boolean).join(', '),
    paymentTerms,
    loadingChargeNote,
    transportChargeNote,
    validityDays: parseInt(validityDays, 10) || 7,
    utLevel,
    salesPerson,
    items,
    loadingCharges: 0,
    transportCharges: 0,
    gstRate,
    totalAmount,
    grandTotal: finalAmount,
  });

  const buildPrintData = useCallback((): PlateQuotationPrintData => {
    const base = buildPlateQuotationPrintData(buildRecord(), parties);
    return {
      ...base,
      address: partyAddress || base.address,
      addressLine2: partyAddressLine2 || base.addressLine2,
      mobileNo: partyMobile || base.mobileNo,
      email: partyEmail || base.email,
      gstNo: partyGst || base.gstNo,
    };
  }, [parties, partyAddress, partyAddressLine2, partyMobile, partyEmail, partyGst, quoteNo, date, partyName, paymentTerms, loadingChargeNote, transportChargeNote, validityDays, utLevel, salesPerson, items, gstRate, totalAmount, finalAmount]);

  const handlePdf = async () => {
    if (!partyName.trim()) {
      toast.error('Party Name is required');
      return;
    }
    toast.loading('Generating PDF...', { id: 'plate-quote-pdf' });
    try {
      await generatePlateQuotationPDF(buildRecord(), parties);
      toast.success(`PDF downloaded: ${quoteNo}`, { id: 'plate-quote-pdf' });
    } catch {
      toast.error('PDF generation failed', { id: 'plate-quote-pdf' });
    }
  };

  const handleSave = async () => {
    if (!partyName.trim()) {
      toast.error('Party Name is required');
      return;
    }
    const record = buildRecord();
    try {
      if (editingId) {
        updateQuotation(record);
        await persistErpNow({
          quotations: quotations.map(q => q.id === record.id ? record : q),
        });
        toast.success('Quotation updated');
      } else {
        addQuotation(record);
        setEditingId(record.id);
        await persistErpNow({ quotations: [record, ...quotations] });
        toast.success('Quotation saved');
      }
    } catch {
      toast.error('Saved locally but server sync failed — retry Save');
    }
  };

  const handleSaveAndPrint = async () => {
    if (!partyName.trim()) {
      toast.error('Party Name is required');
      return;
    }
    const record = buildRecord();
    try {
      if (editingId) {
        updateQuotation(record);
        await persistErpNow({
          quotations: quotations.map(q => q.id === record.id ? record : q),
        });
      } else {
        addQuotation(record);
        setEditingId(record.id);
        await persistErpNow({ quotations: [record, ...quotations] });
      }
      toast.success('Quotation saved');
      setTimeout(() => window.print(), 300);
    } catch {
      toast.error('Saved locally but server sync failed — retry Save');
    }
  };

  const handleDeleteQuotation = async (id: string) => {
    if (!window.confirm('Delete this quotation?')) return;
    const next = quotations.filter(q => q.id !== id);
    deleteQuotation(id);
    if (editingId === id) setEditingId(null);
    try {
      await persistErpNow({ quotations: next });
      toast.success('Quotation deleted');
    } catch {
      toast.error('Deleted locally but server sync failed');
    }
  };

  const filteredQuotations = useMemo(() => {
    if (!search) return quotations;
    const q = search.toLowerCase();
    return quotations.filter(r =>
      r.quoteNo.toLowerCase().includes(q) ||
      r.partyName.toLowerCase().includes(q),
    );
  }, [quotations, search]);

  const loadQuotation = (q: QuotationRecord, showToast = true) => {
    setEditingId(q.id);
    setQuoteNo(q.quoteNo);
    setDate(q.date);
    setPartyName(q.partyName);
    const party = parties.find(p => p.partyName === q.partyName);
    const addr = q.address || party?.address || party?.deliveryAddress || '';
    const parts = addr.split(/\n|, /).map(s => s.trim()).filter(Boolean);
    setPartyAddress(parts[0] || '');
    setPartyAddressLine2(parts.slice(1).join(', '));
    setPartyMobile(q.mobileNo || party?.mobileNumber || '');
    setPartyEmail(party?.email || '');
    setPartyGst(party?.gstNumber || '');
    setPaymentTerms(q.paymentTerms || '30 Days');
    setLoadingChargeNote(q.loadingChargeNote || 'Extra');
    setTransportChargeNote(q.transportChargeNote || 'Extra');
    setValidityDays(String(q.validityDays ?? 7));
    setUtLevel(q.utLevel || '');
    setSalesPerson(q.salesPerson || EMPLOYEES[0] || '');
    setItems(q.items.length ? q.items : [blankItem()]);
    setGstRate(q.gstRate);
    setViewMode('create');
    if (showToast) toast.success('Quotation loaded');
  };

  useEffect(() => {
    if (!editId || !quotations.length) return;
    const q = quotations.find(r => r.id === editId);
    if (q) loadQuotation(q, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, quotations.length]);

  const handleSelectParty = (party: PartyMaster) => {
    setPartyName(party.partyName);
    const addr = party.address || party.deliveryAddress || '';
    const parts = addr.split(/\n|, /).map(s => s.trim()).filter(Boolean);
    setPartyAddress(parts[0] || '');
    setPartyAddressLine2(parts.slice(1).join(', '));
    setPartyMobile(party.mobileNumber || party.mobile2 || '');
    setPartyEmail(party.email || '');
    setPartyGst(party.gstNumber || '');
    if (party.salesPerson) setSalesPerson(party.salesPerson);
    toast.success('Party selected from master');
  };

  if (viewMode === 'list') {
    return (
      <div className="quotation-page max-w-[1680px] mx-auto p-3 sm:p-4 space-y-4 fade-in pb-8">
        <ErpPageHeader
          title="Plate Quotation List"
          subtitle={`${quotations.length} saved quotations`}
          extra={
            <button type="button" {...erpHotkeyProps('new')} onClick={() => setViewMode('create')} className="erp-btn erp-btn-green">
              <Plus className="w-4 h-4" /> New Quote
            </button>
          }
        />
        <div className="tc-mgmt-panel xl:max-w-md">
          <div className="tc-mgmt-panel-head">Search</div>
          <div className="p-3">
            <input type="text" placeholder="Quote No, Party..." value={search} onChange={e => setSearch(e.target.value)} className="tc-mgmt-input" />
          </div>
        </div>
        <div className="tc-mgmt-panel min-w-0">
          <div className="tc-mgmt-panel-head">Saved Quotations</div>
          <table className="w-full tc-mgmt-table quotation-items-table">
            <thead>
              <tr>
                <th>Quote No</th>
                <th>Party</th>
                <th>Date</th>
                <th>Items</th>
                <th>Final Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotations.map(q => (
                <tr key={q.id}>
                  <td className="font-mono font-bold text-brand-blue">{q.quoteNo}</td>
                  <td className="font-semibold">{q.partyName}</td>
                  <td>{q.date}</td>
                  <td>{q.items.length}</td>
                  <td className="font-bold">₹{q.grandTotal.toLocaleString('en-IN')}</td>
                  <td>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => loadQuotation(q)} className="text-blue-600 text-xs font-bold px-2 py-1">Edit</button>
                      <button type="button" onClick={() => void handleDeleteQuotation(q.id)} className="text-red-500 text-xs font-bold px-2 py-1">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredQuotations.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400 italic">No quotations found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="pq-entry-page fade-in print:p-0">
      {/* Top row — Quotation No, Date, Party */}
      <div className="erp-card p-4 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3">
            <label className="pq-field-label">Quotation No.</label>
            <div className="relative">
              <input type="text" value={quoteNo} readOnly className={`${inp} font-mono font-bold pr-16 bg-slate-50`} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-blue">(Auto)</span>
            </div>
          </div>
          <div className="md:col-span-3">
            <label className="pq-field-label">Quotation Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inp} />
          </div>
          <div className="md:col-span-6">
            <label className="pq-field-label">Party Name</label>
            <PartyAutocomplete
              value={partyName}
              onChange={setPartyName}
              onSelectParty={handleSelectParty}
              placeholder="Select party..."
              className={inp}
            />
          </div>
        </div>
      </div>

      {/* Commercial Terms + Technical Requirement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:hidden">
        <div className="erp-card overflow-hidden">
          <div className="pq-section-head">Commercial Terms</div>
          <div className="p-4 grid grid-cols-2 gap-4">
            <div>
              <label className="pq-field-label">Payment Terms</label>
              <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className={inp}>
                {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="pq-field-label">Loading Charge</label>
              <input type="text" value={loadingChargeNote} onChange={e => setLoadingChargeNote(e.target.value)} className={inp} placeholder="Extra" />
            </div>
            <div>
              <label className="pq-field-label">Transport Charge</label>
              <input type="text" value={transportChargeNote} onChange={e => setTransportChargeNote(e.target.value)} className={inp} placeholder="Extra" />
            </div>
            <div>
              <label className="pq-field-label">Validity of Quotation (Days)</label>
              <div className="flex items-center gap-2">
                <NumericInput value={validityDays} onChange={setValidityDays} className={inp} />
                <span className="text-xs font-semibold text-slate-500 shrink-0">Days</span>
              </div>
            </div>
          </div>
        </div>

        <div className="erp-card overflow-hidden">
          <div className="pq-section-head">Technical Requirement</div>
          <div className="p-4">
            <label className="pq-field-label">UT Level (Manual Entry)</label>
            <input
              type="text"
              value={utLevel}
              onChange={e => setUtLevel(e.target.value)}
              className={inp}
              placeholder="e.g. S1, E1, UT 578 Level B, IMP2, Pass, Fail etc."
            />
          </div>
        </div>
      </div>

      {/* Material Details table */}
      <div className="erp-card overflow-hidden print:border-none">
        <div className="pq-section-head flex items-center justify-between print:hidden">
          <span>Material Details</span>
          <button type="button" onClick={addItem} className="flex items-center gap-1 text-[11px] font-bold text-brand-blue border border-brand-blue rounded-lg px-3 py-1 hover:bg-blue-50 dark:hover:bg-blue-950/30">
            <Plus className="w-3.5 h-3.5" /> Add New Row
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full pq-material-table text-sm">
            <thead>
              <tr>
                <th className="w-10">Sr No.</th>
                <th>Grade</th>
                <th>Make</th>
                <th>Thickness (mm)</th>
                <th>Width (mm)</th>
                <th>Length (mm)</th>
                <th className="w-14">Nos</th>
                <th>Kg (Auto)</th>
                <th>Rate (₹/Kg)</th>
                <th>Amount (₹)</th>
                <th className="w-10 print:hidden"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="text-center text-xs font-bold text-slate-500">{idx + 1}</td>
                  <td>
                    <EditableSelect
                      value={item.grade}
                      onChange={v => updateItem(item.id, 'grade', v)}
                      options={MATERIAL_GRADES}
                      placeholder="Grade"
                      className="pq-input text-xs py-1.5"
                    />
                  </td>
                  <td>
                    <select
                      value={item.make || MAKES[0]}
                      onChange={e => updateItem(item.id, 'make', e.target.value)}
                      className="pq-input text-xs py-1.5"
                    >
                      {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </td>
                  <td>
                    <NumericInput value={item.thickness} onChange={v => updateItem(item.id, 'thickness', v)} className="pq-input text-xs py-1.5 text-center" placeholder="0" />
                  </td>
                  <td>
                    <NumericInput value={item.width} onChange={v => updateItem(item.id, 'width', v)} className="pq-input text-xs py-1.5 text-center" placeholder="0" />
                  </td>
                  <td>
                    <NumericInput value={item.length} onChange={v => updateItem(item.id, 'length', v)} className="pq-input text-xs py-1.5 text-center" placeholder="0" />
                  </td>
                  <td>
                    <NumericInput value={item.nos} onChange={v => updateItem(item.id, 'nos', v)} className="pq-input text-xs py-1.5 text-center" placeholder="1" />
                  </td>
                  <td><div className="pq-readonly">{fmt(item.weight)}</div></td>
                  <td>
                    <NumericInput value={item.rate} onChange={v => updateItem(item.id, 'rate', v)} className="pq-input text-xs py-1.5 text-center" placeholder="0" />
                  </td>
                  <td><div className="pq-readonly">{fmt(item.amount)}</div></td>
                  <td className="text-center print:hidden">
                    <button type="button" onClick={() => removeItem(item.id)} className="p-1 text-red-400 hover:text-red-600 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-2 text-xs font-semibold text-brand-blue print:hidden">
          Note : Kg is calculated as per Thickness, Width, Length &amp; Nos.
        </p>
      </div>

      {/* Footer summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:hidden">
        <div className="erp-card p-4 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Truck className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-500 w-36 shrink-0">Loading Charge</span>
            <span className="font-semibold">{loadingChargeNote || '—'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Truck className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-500 w-36 shrink-0">Transport Charge</span>
            <span className="font-semibold">{transportChargeNote || '—'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CalendarClock className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-500 w-36 shrink-0">Validity of Quotation</span>
            <div className="flex items-center gap-2">
              <NumericInput value={validityDays} onChange={setValidityDays} className="pq-input w-16 py-1 text-sm" />
              <span className="text-xs font-semibold text-slate-500">Days</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <UserCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-500 w-36 shrink-0">Sales Person</span>
            <select value={salesPerson} onChange={e => setSalesPerson(e.target.value)} className="pq-input flex-1 py-1.5 text-sm">
              {EMPLOYEES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        <div className="pq-totals-box">
          <div className="pq-totals-row"><span>Total Nos</span><span>{totalNos}</span></div>
          <div className="pq-totals-row"><span>Total Kg</span><span>{fmt(totalKg)}</span></div>
          <div className="pq-totals-row"><span>Amount (Before GST)</span><span>{fmt(totalAmount)}</span></div>
          <div className="pq-totals-row items-center">
            <span className="flex items-center gap-2">
              GST %
              <select value={gstRate} onChange={e => setGstRate(parseInt(e.target.value, 10))} className="pq-input w-16 py-0.5 text-xs">
                <option value={0}>0%</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </span>
            <span>{fmt(gstAmount)}</span>
          </div>
          <div className="pq-totals-row border-t border-slate-300 dark:border-slate-600 pt-3 mt-1">
            <span className="font-bold text-slate-700 dark:text-slate-200">FINAL AMOUNT (₹)</span>
            <span className="pq-final-amount">{fmt(finalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Fixed action toolbar */}
      <div className="pq-action-bar print:hidden">
        <button type="button" onClick={handleSaveAndPrint} className="erp-btn erp-btn-green">
          <Printer className="w-4 h-4" /> Save &amp; Print <span className="text-[10px] opacity-80">(F9)</span>
        </button>
        <button type="button" {...erpHotkeyProps('save')} onClick={handleSave} className="erp-btn erp-btn-navy">
          <Save className="w-4 h-4" /> Save <span className="text-[10px] opacity-80">(F10)</span>
        </button>
        <button type="button" {...erpHotkeyProps('whatsapp')} onClick={() => toast('WhatsApp share coming soon')} className="erp-btn erp-btn-orange">
          <MessageSquare className="w-4 h-4" /> WhatsApp
        </button>
        <button type="button" onClick={() => toast('Email share coming soon')} className="erp-btn erp-btn-teal">
          <Mail className="w-4 h-4" /> Email
        </button>
        <button type="button" {...erpHotkeyProps('print')} onClick={handlePdf} className="erp-btn erp-btn-red">
          <FileDown className="w-4 h-4" /> PDF
        </button>
        <button type="button" onClick={handleReset} className="erp-btn erp-btn-ghost border border-slate-300">
          <X className="w-4 h-4" /> Clear
        </button>
        <button type="button" onClick={() => setViewMode('list')} className="erp-btn erp-btn-ghost">
          <List className="w-4 h-4" /> Saved List
        </button>
      </div>

      {/* Print area */}
      <div className="hidden print:block">
        <PlateQuotationPrint data={buildPrintData()} />
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #${PLATE_QUOTATION_PRINT_AREA_ID}, #${PLATE_QUOTATION_PRINT_AREA_ID} * { visibility: visible !important; }
          #${PLATE_QUOTATION_PRINT_AREA_ID} { position: fixed !important; inset: 0 !important; z-index: 99999 !important; background: #fff !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
};
