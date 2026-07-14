import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Trash2, Save, FilePlus, Edit, Trash, FileUp, FileSpreadsheet, Printer, FileDown, MessageSquare, Mail, Disc3, Calculator } from 'lucide-react';
import { MATERIAL_GRADES, useAppContext, type PartyMaster, type RingQuotationRecord } from '../store/AppContext';
import { PartyAutocomplete } from '../components/PartyAutocomplete';
import { NumericInput, parseNum } from '../components/NumericInput';
import toast from 'react-hot-toast';
import { erpHotkeyProps } from '../utils/erpHotkeys';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { RingQuotationPrint, RING_QUOTATION_PRINT_AREA_ID, type RingQuotationPrintData } from '../components/RingQuotationPrint';
import { generateRingQuotationPDF } from '../utils/ringQuotationDownload';

const WEIGHT_FACTOR = 0.00000625; // D²·T/160000 — matches company Excel sheet
const RING_OD_CALC_EXTRA_MM = 5;
const RING_ID_CALC_REDUCE_MM = 10;

/** W = D² × T × 0.00000625 (e.g. OD 1005, T 100 → 631 kg) */
const calcWeight = (d: number, thickness: number) =>
  d > 0 && thickness > 0 ? d * d * thickness * WEIGHT_FACTOR : 0;

interface RingRow {
  id: string;
  grade: string;
  thickness: string;
  od: string;
  id_: string;
  odRate: string;
  idRate: string;
  nos: string;
}

const emptyRow = (): RingRow => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2),
  grade: '', thickness: '', od: '', id_: '', odRate: '', idRate: '', nos: '',
});

/** Total Cost = (OD Weight × OD Rate) − (ID Weight × ID Less Rate) */
const calcRingRow = (r: RingRow) => {
  const thickness = parseNum(r.thickness);
  const finishedOd = parseNum(r.od);
  const finishedId = parseNum(r.id_);
  const hasOd = r.od.trim() !== '';
  const hasId = r.id_.trim() !== '';
  const ratePerKg = parseNum(r.odRate);

  const odCal = hasOd ? finishedOd + RING_OD_CALC_EXTRA_MM : 0;
  const idCal = hasId ? finishedId - RING_ID_CALC_REDUCE_MM : 0;

  const odWeight = hasOd ? calcWeight(odCal, thickness) : 0;
  const idLessWeight = hasId && idCal > 0 ? calcWeight(idCal, thickness) : 0;
  const ringW = Math.max(0, odWeight - idLessWeight);
  const totalCost = odWeight * ratePerKg - idLessWeight * parseNum(r.idRate);
  const ringRateKg = ringW > 0 ? totalCost / ringW : 0;
  const ringRateNos = ringW * ringRateKg;
  const amount = ringRateNos * parseNum(r.nos);

  return {
    odWeight,
    idLessWeight,
    totalCost,
    ringW,
    odW: odWeight,
    idW: idLessWeight,
    ringRateKg,
    ringRateNos,
    amount,
  };
};

const num2 = (n: number) => (isFinite(n) ? n : 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function financialYearSuffix(d = new Date()) {
  const year = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${String(year).slice(-2)}-${String(year + 1).slice(-2)}`;
}

function newDocNo(prefix: string) {
  const fy = financialYearSuffix();
  return `${prefix}/${fy}/${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`;
}

export const RingRateEntry: React.FC = () => {
  const { ringQuotations, setRingQuotations, persistErpNow } = useAppContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('edit');

  const today = new Date().toISOString().split('T')[0];

  const [editingId, setEditingId] = useState<string | null>(editId);
  const [partyName, setPartyName] = useState('');
  const [partyAddress, setPartyAddress] = useState('');
  const [partyAddressLine2, setPartyAddressLine2] = useState('');
  const [partyGst, setPartyGst] = useState('');
  const [partyEmail, setPartyEmail] = useState('');
  const [partyPhone, setPartyPhone] = useState('');
  const [date, setDate] = useState(today);
  const [quoteNo, setQuoteNo] = useState(() => newDocNo('RQ'));
  const [inquiryNo, setInquiryNo] = useState(() => newDocNo('INQ'));
  const [remark, setRemark] = useState('');
  const [gstPct, setGstPct] = useState(18);
  const [rows, setRows] = useState<RingRow[]>([emptyRow()]);

  const calc = useMemo(() => rows.map(calcRingRow), [rows]);

  const totals = useMemo(() => {
    const totalNos = rows.reduce((s, r) => s + parseNum(r.nos), 0);
    const totalRingWeight = rows.reduce((s, r, i) => s + calc[i].ringW * parseNum(r.nos), 0);
    const totalODWeight = rows.reduce((s, r, i) => s + calc[i].odWeight * parseNum(r.nos), 0);
    const totalIDWeight = rows.reduce((s, r, i) => s + calc[i].idW * parseNum(r.nos), 0);
    const totalAmount = rows.reduce((s, _r, i) => s + calc[i].amount, 0);
    const avgRate = totalRingWeight > 0 ? totalAmount / totalRingWeight : 0;
    const gstAmount = (totalAmount * gstPct) / 100;
    return { totalNos, totalRingWeight, totalODWeight, totalIDWeight, totalAmount, avgRate, gstAmount, grandTotal: totalAmount + gstAmount };
  }, [rows, calc, gstPct]);

  const setField = (id: string, field: keyof RingRow, value: string | number) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addRow = () => setRows(prev => [...prev, emptyRow()]);
  const removeRow = (id: string) => setRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);
  const handleNew = () => {
    setEditingId(null);
    setRows([emptyRow()]);
    setPartyName('');
    setPartyAddress('');
    setPartyAddressLine2('');
    setPartyGst('');
    setPartyEmail('');
    setPartyPhone('');
    setRemark('');
    setQuoteNo(newDocNo('RQ'));
    setInquiryNo(newDocNo('INQ'));
    setDate(today);
    toast('New ring rate entry');
  };

  const loadRingQuotation = useCallback((q: RingQuotationRecord) => {
    setEditingId(q.id);
    setQuoteNo(q.quoteNo);
    setInquiryNo(q.inquiryNo);
    setDate(q.date);
    setPartyName(q.partyName);
    setPartyAddress(q.partyAddress || '');
    setPartyAddressLine2(q.partyAddressLine2 || '');
    setPartyGst(q.partyGst || '');
    setPartyEmail(q.partyEmail || '');
    setPartyPhone(q.partyPhone || '');
    setRemark(q.remark || '');
    setGstPct(q.gstRate);
    setRows(q.items.length ? q.items.map(it => ({
      id: it.id,
      grade: it.grade,
      thickness: it.thickness,
      od: it.od,
      id_: it.id_,
      odRate: it.odRate,
      idRate: it.idRate,
      nos: it.nos,
    })) : [emptyRow()]);
    toast.success('Ring quotation loaded');
  }, []);

  useEffect(() => {
    if (!editId) return;
    const existing = ringQuotations.find(q => q.id === editId);
    if (existing) loadRingQuotation(existing);
  }, [editId, ringQuotations, loadRingQuotation]);

  const handleSelectParty = (party: PartyMaster) => {
    setPartyName(party.partyName);
    const addr = party.address || party.deliveryAddress || '';
    const parts = addr.split(/\n|, /).map(s => s.trim()).filter(Boolean);
    setPartyAddress(parts[0] || '');
    setPartyAddressLine2(parts.slice(1).join(', '));
    setPartyGst(party.gstNumber || '');
    setPartyEmail(party.email || '');
    setPartyPhone(party.mobileNumber || party.mobile2 || '');
    toast.success('Party selected from Party Master', { icon: '✨' });
  };

  const buildPrintData = useCallback((): RingQuotationPrintData => ({
    partyName,
    address: partyAddress,
    addressLine2: partyAddressLine2,
    gstNo: partyGst,
    email: partyEmail,
    phone: partyPhone,
    quoteNo,
    date,
    inquiryNo,
    items: rows.map((r, i) => ({
      grade: r.grade,
      od: r.od,
      id: r.id_,
      nos: r.nos,
      odWeight: calc[i].odWeight,
      idLessWeight: calc[i].idLessWeight,
      ratePerNos: calc[i].ringRateNos,
      amount: calc[i].amount,
    })),
    totalNos: totals.totalNos,
    totalAmount: totals.totalAmount,
    gstRate: gstPct,
    gstAmount: totals.gstAmount,
    grandTotal: totals.grandTotal,
  }), [partyName, partyAddress, partyAddressLine2, partyGst, partyEmail, partyPhone, quoteNo, date, inquiryNo, rows, calc, totals, gstPct]);

  const buildRecord = (): RingQuotationRecord => ({
    id: editingId || Date.now().toString(),
    quoteNo,
    inquiryNo,
    date,
    partyName,
    partyAddress,
    partyAddressLine2,
    partyGst,
    partyEmail,
    partyPhone,
    remark,
    gstRate: gstPct,
    items: rows.map((r, i) => ({
      id: r.id,
      grade: r.grade,
      thickness: r.thickness,
      od: r.od,
      id_: r.id_,
      odRate: r.odRate,
      idRate: r.idRate,
      nos: r.nos,
      ringWeight: calc[i].ringW,
      ringRateKg: calc[i].ringRateKg,
      ringRateNos: calc[i].ringRateNos,
      amount: calc[i].amount,
    })),
    totalNos: totals.totalNos,
    totalAmount: totals.totalAmount,
    gstAmount: totals.gstAmount,
    grandTotal: totals.grandTotal,
  });

  const handleSave = async () => {
    if (!partyName.trim()) { toast.error('Party Name is required'); return; }
    const record = buildRecord();
    const isUpdate = Boolean(editingId);
    const next = isUpdate
      ? ringQuotations.map(q => q.id === record.id ? record : q)
      : [record, ...ringQuotations.filter(q => q.id !== record.id)];

    setRingQuotations(next);
    setEditingId(record.id);
    try {
      await persistErpNow({ ringQuotations: next });
      toast.success(isUpdate ? 'Ring quotation updated' : 'Ring quotation saved');
      navigate('/ring-rate-list');
    } catch {
      toast.error('Saved locally but server sync failed — retry Save');
    }
  };

  const handleDelete = async () => {
    if (!editingId) { toast.error('Save or load a quotation first'); return; }
    if (!window.confirm('Delete this ring quotation?')) return;
    const next = ringQuotations.filter(q => q.id !== editingId);
    setRingQuotations(next);
    try {
      await persistErpNow({ ringQuotations: next });
      handleNew();
      navigate('/ring-rate-list');
      toast.success('Ring quotation deleted');
    } catch {
      toast.error('Deleted locally but server sync failed');
    }
  };

  const handlePdf = async () => {
    if (!partyName.trim()) { toast.error('Party Name is required'); return; }
    toast.loading('Generating PDF...', { id: 'ring-quote-pdf' });
    try {
      await generateRingQuotationPDF(buildPrintData());
      toast.success(`PDF downloaded: ${quoteNo}`, { id: 'ring-quote-pdf' });
    } catch {
      toast.error('PDF generation failed', { id: 'ring-quote-pdf' });
    }
  };
  const handleExport = () => {
    const header = 'Sr,Grade,Thickness,OD,ID,OD Rate,ID Less Rate,OD Weight,ID Less Weight,Ring Rate/KG,Ring Rate/Nos,Nos,Amount';
    const lines = rows.map((r, i) => `${i + 1},${r.grade},${r.thickness},${r.od},${r.id_},${r.odRate},${r.idRate},${calc[i].odWeight.toFixed(2)},${calc[i].idLessWeight.toFixed(2)},${calc[i].ringRateKg.toFixed(2)},${calc[i].ringRateNos.toFixed(2)},${r.nos},${calc[i].amount.toFixed(2)}`);
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ring_rate_${today}.csv`; a.click();
  };

  const inputCls = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 text-xs text-right focus:ring-2 focus:ring-orange-500 outline-none";

  return (
    <div className="max-w-[1500px] mx-auto space-y-4 fade-in print:p-0">
      {/* Action toolbar */}
      <div className="flex flex-wrap justify-center gap-2 print:hidden">
        <button {...erpHotkeyProps('new')} onClick={handleNew} className="erp-btn erp-btn-green"><FilePlus className="w-4 h-4" /> New</button>
        <button {...erpHotkeyProps('save')} onClick={handleSave} className="erp-btn erp-btn-primary"><Save className="w-4 h-4" /> Save</button>
        <button onClick={() => editingId ? toast('Already editing — use Save') : toast('Open from Ring Rate List to edit')} className="erp-btn erp-btn-orange"><Edit className="w-4 h-4" /> Edit</button>
        <button onClick={handleDelete} className="erp-btn erp-btn-red"><Trash className="w-4 h-4" /> Delete</button>
        <button onClick={() => toast('Import from Excel')} className="erp-btn erp-btn-purple"><FileUp className="w-4 h-4" /> Import Excel</button>
        <button onClick={handleExport} className="erp-btn erp-btn-navy"><FileSpreadsheet className="w-4 h-4" /> Export Excel</button>
        <button {...erpHotkeyProps('print')} onClick={() => window.print()} className="erp-btn erp-btn-navy"><Printer className="w-4 h-4" /> Print Quotation</button>
        <button {...erpHotkeyProps('pdf')} onClick={handlePdf} className="erp-btn erp-btn-purple"><FileDown className="w-4 h-4" /> PDF Download</button>
        <button {...erpHotkeyProps('whatsapp')} onClick={() => toast('Share on WhatsApp')} className="erp-btn erp-btn-green"><MessageSquare className="w-4 h-4" /> WhatsApp</button>
        <button onClick={() => toast('Email quotation')} className="erp-btn erp-btn-primary"><Mail className="w-4 h-4" /> Email</button>
      </div>

      {/* Entry details */}
      <div className="erp-card print:hidden">
        <div className="erp-section-header"><Disc3 className="w-4 h-4" /> Ring Rate Entry Details</div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="field-label mb-1">Party Name *</label>
            <PartyAutocomplete value={partyName} onChange={setPartyName} onSelectParty={handleSelectParty} placeholder="Search party master..." />
          </div>
          <div>
            <label className="field-label mb-1">Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          <div>
            <label className="field-label mb-1">Ring Quotation No.</label>
            <input type="text" value={quoteNo} readOnly
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <label className="field-label mb-1">Inquiry No.</label>
            <input type="text" value={inquiryNo} readOnly
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <label className="field-label mb-1">Remark</label>
            <input type="text" value={remark} onChange={e => setRemark(e.target.value)} placeholder="Material as per quality"
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
        </div>

        {/* Items table */}
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
                <th className="px-2 py-2 text-left font-bold">Sr. No.</th>
                <th className="px-2 py-2 text-left font-bold">Grade</th>
                <th className="px-2 py-2 text-right font-bold">Thickness (MM)</th>
                <th className="px-2 py-2 text-right font-bold">OD (MM)</th>
                <th className="px-2 py-2 text-right font-bold">ID (MM)</th>
                <th className="px-2 py-2 text-right font-bold">OD Rate (₹/KG)</th>
                <th className="px-2 py-2 text-right font-bold">ID Less Rate (₹/KG)</th>
                <th className="px-2 py-2 text-right font-bold">OD Weight (KG)</th>
                <th className="px-2 py-2 text-right font-bold">ID Less Weight (KG)</th>
                <th className="px-2 py-2 text-right font-bold">Ring Rate / KG (₹)</th>
                <th className="px-2 py-2 text-right font-bold">Ring Rate / Nos (₹)</th>
                <th className="px-2 py-2 text-right font-bold">Nos</th>
                <th className="px-2 py-2 text-right font-bold">Amount (₹)</th>
                <th className="px-2 py-2 text-center font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r, i) => (
                <tr key={r.id} className="hover:bg-orange-50/40 dark:hover:bg-slate-800/40">
                  <td className="px-2 py-1.5 text-slate-500">{i + 1}</td>
                  <td className="px-2 py-1.5">
                    <select value={r.grade} onChange={e => setField(r.id, 'grade', e.target.value)}
                      className="w-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 text-xs focus:ring-2 focus:ring-orange-500 outline-none">
                      <option value="">Select Grade</option>
                      {MATERIAL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5"><NumericInput value={r.thickness} onChange={v => setField(r.id, 'thickness', v)} className={inputCls} /></td>
                  <td className="px-2 py-1.5"><NumericInput value={r.od} onChange={v => setField(r.id, 'od', v)} className={inputCls} /></td>
                  <td className="px-2 py-1.5"><NumericInput value={r.id_} onChange={v => setField(r.id, 'id_', v)} className={inputCls} /></td>
                  <td className="px-2 py-1.5"><NumericInput value={r.odRate} onChange={v => setField(r.id, 'odRate', v)} className={inputCls} /></td>
                  <td className="px-2 py-1.5"><NumericInput value={r.idRate} onChange={v => setField(r.id, 'idRate', v)} className={inputCls} /></td>
                  <td className="px-2 py-1.5 text-right font-semibold text-slate-700 dark:text-slate-200">{num2(calc[i].odWeight)}</td>
                  <td className="px-2 py-1.5 text-right font-semibold text-slate-700 dark:text-slate-200">{num2(calc[i].idLessWeight)}</td>
                  <td className="px-2 py-1.5 text-right font-semibold text-brand-orange">{num2(calc[i].ringRateKg)}</td>
                  <td className="px-2 py-1.5 text-right font-semibold text-brand-orange">{num2(calc[i].ringRateNos)}</td>
                  <td className="px-2 py-1.5"><NumericInput value={r.nos} onChange={v => setField(r.id, 'nos', v)} className={inputCls} /></td>
                  <td className="px-2 py-1.5 text-right font-bold text-slate-800 dark:text-slate-100">{num2(calc[i].amount)}</td>
                  <td className="px-2 py-1.5 text-center">
                    <button onClick={() => removeRow(r.id)} disabled={rows.length === 1} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded disabled:opacity-30">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addRow} className="mt-2 flex items-center gap-1.5 text-brand-orange hover:underline text-sm font-semibold">
            <Plus className="w-4 h-4" /> Add Row
          </button>
        </div>

        {/* Totals bar */}
        <div className="bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-700 px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 text-center">
          <Total label="Total Nos" value={String(totals.totalNos)} />
          <Total label="Total Net Weight (KG)" value={num2(totals.totalRingWeight)} />
          <Total label="Average Ring Rate / KG (₹)" value={num2(totals.avgRate)} />
          <Total label="Total Amount (₹)" value={num2(totals.totalAmount)} />
          <div>
            <p className="field-label mb-1">GST (%)</p>
            <select value={gstPct} onChange={e => setGstPct(Number(e.target.value))}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-sm text-center focus:ring-2 focus:ring-orange-500 outline-none">
              {[0, 5, 12, 18, 28].map(g => <option key={g} value={g}>{g}%</option>)}
            </select>
          </div>
          <Total label="GST Amount (₹)" value={num2(totals.gstAmount)} />
          <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg py-1.5 px-2 border border-emerald-200 dark:border-emerald-800">
            <p className="field-label mb-0.5 text-emerald-700 dark:text-emerald-300">Grand Total (₹)</p>
            <p className="text-base font-black text-emerald-700 dark:text-emerald-300">{num2(totals.grandTotal)}</p>
          </div>
        </div>
      </div>

      {/* Ring weight details (auto) */}
      <div className="erp-card print:hidden">
        <div className="erp-section-header"><Calculator className="w-4 h-4" /> Ring Weight Details (Auto Calculated)</div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AutoCard label="Total OD Weight (KG)" value={num2(totals.totalODWeight)} />
          <AutoCard label="Total ID Less Weight (KG)" value={num2(totals.totalIDWeight)} />
          <AutoCard label="Total Net Weight (KG)" value={num2(totals.totalRingWeight)} />
          <AutoCard label="Ring Per KG Rate (₹)" value={num2(totals.avgRate)} />
        </div>
      </div>

      <div className="hidden print:block">
        <RingQuotationPrint data={buildPrintData()} />
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #${RING_QUOTATION_PRINT_AREA_ID}, #${RING_QUOTATION_PRINT_AREA_ID} * { visibility: visible !important; }
          #${RING_QUOTATION_PRINT_AREA_ID} { position: fixed !important; inset: 0 !important; z-index: 99999 !important; background: #fff !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
};

const Total: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="field-label mb-0.5">{label}</p>
    <p className="text-base font-black text-brand-blue">{value}</p>
  </div>
);

const AutoCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-blue-50/60 dark:bg-slate-800/50 rounded-xl p-4 border border-blue-100 dark:border-slate-700 text-center">
    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
    <p className="text-2xl font-black text-brand-blue mt-1">{value}</p>
  </div>
);
