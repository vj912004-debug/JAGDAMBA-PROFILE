import React, { useMemo, useState } from 'react';
import {
  Search, RotateCcw, FileSpreadsheet, Printer, Package, Scale, IndianRupee, CalendarDays, ClipboardList,
} from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { ErpPageHeader, ErpScreenActions, ErpStatCard, ErpTableCaption, ErpInfoNote } from '../components/ErpPageShell';
import toast from 'react-hot-toast';

interface StockRow {
  id: string;
  grnDate: string;
  supplier: string;
  grade: string;
  thickness: string;
  width: string;
  length: string;
  nos: number;
  kg: number;
  rate: number;
  make: string;
}

const kg = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const inr = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function parseISO(s: string) {
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return s;
}

function fmtDate(s: string) {
  const iso = parseISO(s);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return s;
  const [y, mo, d] = iso.split('-');
  return `${d}/${mo}/${y}`;
}

export const StockRegister: React.FC = () => {
  const { purchaseOrders, purchaseReceipts } = useAppContext();
  const today = new Date();
  const asOn = today.toLocaleDateString('en-GB');

  const [grade, setGrade] = useState('');
  const [thickness, setThickness] = useState('');
  const [width, setWidth] = useState('');
  const [length, setLength] = useState('');
  const [supplier, setSupplier] = useState('');
  const [make, setMake] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [applied, setApplied] = useState({ grade: '', thickness: '', width: '', length: '', supplier: '', make: '', fromDate: '', toDate: '' });

  const allRows = useMemo<StockRow[]>(() => {
    const out: StockRow[] = [];
    purchaseReceipts.forEach((pr) => {
      const po = purchaseOrders.find(p => p.id === pr.poId);
      if (!po) return;
      const poMake = po.make || '-';
      if (pr.items?.length) {
        pr.items.forEach((ri) => {
          const item = po.items.find(i => i.id === ri.itemId);
          if (!item || ri.receivedQty <= 0) return;
          const perPiece = item.nos ? item.kg / item.nos : 0;
          out.push({
            id: `${pr.id}-${item.id}`,
            grnDate: pr.date,
            supplier: po.supplierName,
            grade: item.grade,
            thickness: item.thickness,
            width: item.width,
            length: item.length,
            nos: ri.receivedQty,
            kg: perPiece * ri.receivedQty,
            rate: item.rate || 0,
            make: poMake,
          });
        });
      } else {
        po.items.forEach((item) => {
          const perPiece = item.nos ? item.kg / item.nos : 0;
          const share = po.items.length === 1 ? pr.receivedQty : 0;
          if (share <= 0) return;
          out.push({
            id: `${pr.id}-${item.id}`,
            grnDate: pr.date,
            supplier: po.supplierName,
            grade: item.grade,
            thickness: item.thickness,
            width: item.width,
            length: item.length,
            nos: share,
            kg: perPiece * share,
            rate: item.rate || 0,
            make: poMake,
          });
        });
      }
    });
    return out.sort((a, b) => parseISO(b.grnDate).localeCompare(parseISO(a.grnDate)));
  }, [purchaseOrders, purchaseReceipts]);

  const options = useMemo(() => ({
    grades: Array.from(new Set(allRows.map(r => r.grade))).sort(),
    thicknesses: Array.from(new Set(allRows.map(r => r.thickness))).sort(),
    widths: Array.from(new Set(allRows.map(r => r.width))).sort(),
    lengths: Array.from(new Set(allRows.map(r => r.length))).sort(),
    suppliers: Array.from(new Set(allRows.map(r => r.supplier))).sort(),
    makes: Array.from(new Set(allRows.map(r => r.make).filter(m => m !== '-'))).sort(),
  }), [allRows]);

  const rows = useMemo(() => allRows.filter(r => {
    if (applied.grade && r.grade !== applied.grade) return false;
    if (applied.thickness && r.thickness !== applied.thickness) return false;
    if (applied.width && r.width !== applied.width) return false;
    if (applied.length && r.length !== applied.length) return false;
    if (applied.supplier && r.supplier !== applied.supplier) return false;
    if (applied.make && r.make !== applied.make) return false;
    const iso = parseISO(r.grnDate);
    if (applied.fromDate && iso < applied.fromDate) return false;
    if (applied.toDate && iso > applied.toDate) return false;
    return true;
  }), [allRows, applied]);

  const totals = useMemo(() => ({
    nos: rows.reduce((s, r) => s + r.nos, 0),
    kg: rows.reduce((s, r) => s + r.kg, 0),
  }), [rows]);

  const avgRate = useMemo(() => {
    const weighted = rows.reduce((s, r) => s + r.kg * r.rate, 0);
    return totals.kg ? weighted / totals.kg : 0;
  }, [rows, totals.kg]);

  const lastPurchase = rows[0] ?? null;

  const handleSearch = () => setApplied({ grade, thickness, width, length, supplier, make, fromDate, toDate });
  const handleClear = () => {
    setGrade(''); setThickness(''); setWidth(''); setLength('');
    setSupplier(''); setMake(''); setFromDate(''); setToDate('');
    setApplied({ grade: '', thickness: '', width: '', length: '', supplier: '', make: '', fromDate: '', toDate: '' });
  };

  const handleExport = () => {
    const header = 'Sr No,GRN Date,Supplier,Grade,Thickness,Width,Length,Nos,Kg,Rate,Make';
    const lines = rows.map((r, i) =>
      `${i + 1},${fmtDate(r.grnDate)},${r.supplier},${r.grade},${r.thickness},${r.width},${r.length},${r.nos},${r.kg.toFixed(3)},${r.rate},${r.make}`,
    );
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_register_${asOn.replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Excel file downloaded');
  };

  return (
    <div className="max-w-[1680px] mx-auto p-3 sm:p-4 space-y-4 fade-in pb-8">
      <ErpPageHeader
        title="Stock Register"
        subtitle="GRN (Inward) history as per filters"
        extra={
          <ErpScreenActions>
            <button type="button" onClick={handleExport} className="erp-btn erp-btn-ghost"><FileSpreadsheet className="w-4 h-4 text-green-600" /> Export Excel</button>
            <button type="button" onClick={() => window.print()} className="erp-btn erp-btn-ghost"><Printer className="w-4 h-4 text-brand-blue" /> Print</button>
          </ErpScreenActions>
        }
      />

      <div className="erp-card p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 items-end">
          <div><label className="tc-mgmt-label">Grade</label><select value={grade} onChange={e => setGrade(e.target.value)} className="tc-mgmt-input"><option value="">All</option>{options.grades.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
          <div><label className="tc-mgmt-label">Thickness (mm)</label><select value={thickness} onChange={e => setThickness(e.target.value)} className="tc-mgmt-input"><option value="">All</option>{options.thicknesses.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
          <div><label className="tc-mgmt-label">Width (mm)</label><select value={width} onChange={e => setWidth(e.target.value)} className="tc-mgmt-input"><option value="">All</option>{options.widths.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
          <div><label className="tc-mgmt-label">Length (mm)</label><select value={length} onChange={e => setLength(e.target.value)} className="tc-mgmt-input"><option value="">All</option>{options.lengths.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
          <div><label className="tc-mgmt-label">Supplier</label><select value={supplier} onChange={e => setSupplier(e.target.value)} className="tc-mgmt-input"><option value="">All</option>{options.suppliers.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          <div><label className="tc-mgmt-label">Make</label><select value={make} onChange={e => setMake(e.target.value)} className="tc-mgmt-input"><option value="">All</option>{options.makes.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
          <div><label className="tc-mgmt-label">GRN Date From</label><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="tc-mgmt-input" /></div>
          <div><label className="tc-mgmt-label">GRN Date To</label><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="tc-mgmt-input" /></div>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button type="button" onClick={handleSearch} className="erp-btn erp-btn-navy"><Search className="w-4 h-4" /> Search</button>
          <button type="button" onClick={handleClear} className="erp-btn erp-btn-ghost"><RotateCcw className="w-4 h-4" /> Clear</button>
        </div>
      </div>

      <div className="erp-card overflow-hidden">
        <ErpTableCaption
          title={`Stock Register Details (As on ${asOn})`}
          meta={<span className="text-xs font-bold text-brand-blue">Total Records: {rows.length}</span>}
        />
        <div className="overflow-x-auto">
          <table className="w-full erp-report-table">
            <thead>
              <tr>
                <th>Sr. No.</th><th>GRN Date</th><th>Supplier Name</th><th>Grade</th>
                <th>Thickness (mm)</th><th>Width (mm)</th><th>Length (mm)</th>
                <th className="text-right">Nos</th><th className="text-right">Kg</th><th className="text-right">Rate (₹/Kg)</th><th>Make</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-10 text-slate-400 italic">No stock register records for selected filters</td></tr>
              ) : rows.map((r, i) => (
                <tr key={r.id} className={i % 2 ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}>
                  <td>{i + 1}</td>
                  <td>{fmtDate(r.grnDate)}</td>
                  <td>{r.supplier}</td>
                  <td className="font-semibold">{r.grade}</td>
                  <td>{r.thickness}</td><td>{r.width}</td><td>{r.length}</td>
                  <td className="text-right">{r.nos}</td>
                  <td className="text-right">{kg(r.kg)}</td>
                  <td className="text-right">{inr(r.rate)}</td>
                  <td>{r.make}</td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-blue-50/80 dark:bg-slate-800/60 font-extrabold text-brand-blue">
                  <td colSpan={7} className="px-2.5 py-2.5">TOTAL</td>
                  <td className="text-right px-2.5 py-2.5">{totals.nos}</td>
                  <td className="text-right px-2.5 py-2.5">{kg(totals.kg)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-7">
          <div className="tc-mgmt-panel">
            <div className="tc-mgmt-panel-head">Summary (As per Filter)</div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ErpStatCard icon={Package} label="Total Nos" value={String(totals.nos)} ring="bg-violet-600" />
              <ErpStatCard icon={Scale} label="Total Kg" value={kg(totals.kg)} ring="bg-green-600" />
              <ErpStatCard icon={IndianRupee} label="Average Rate" value={inr(avgRate)} sub="₹/Kg" ring="bg-brand-blue" />
              <ErpStatCard icon={CalendarDays} label="Last GRN Date" value={lastPurchase ? fmtDate(lastPurchase.grnDate) : '-'} ring="bg-orange-500" />
            </div>
          </div>
        </div>
        <div className="xl:col-span-5">
          <div className="tc-mgmt-panel">
            <div className="tc-mgmt-panel-head green">Last Purchase Information (As per Filter)</div>
            <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {lastPurchase ? (
                <>
                  <div><span className="text-slate-500">Last GRN Date</span><p className="font-bold">{fmtDate(lastPurchase.grnDate)}</p></div>
                  <div><span className="text-slate-500">Supplier Name</span><p className="font-bold">{lastPurchase.supplier}</p></div>
                  <div><span className="text-slate-500">Grade</span><p className="font-bold">{lastPurchase.grade}</p></div>
                  <div><span className="text-slate-500">Thickness</span><p className="font-bold">{lastPurchase.thickness} mm</p></div>
                  <div><span className="text-slate-500">Size</span><p className="font-bold">{lastPurchase.width} × {lastPurchase.length}</p></div>
                  <div><span className="text-slate-500">Nos / Kg</span><p className="font-bold">{lastPurchase.nos} / {kg(lastPurchase.kg)}</p></div>
                  <div><span className="text-slate-500">Rate</span><p className="font-bold">{inr(lastPurchase.rate)} ₹/Kg</p></div>
                  <div><span className="text-slate-500">Make</span><p className="font-bold">{lastPurchase.make}</p></div>
                </>
              ) : (
                <p className="col-span-2 text-slate-400 italic py-4 text-center">No purchase data for current filters</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ErpInfoNote>
        <strong>Note:</strong> Stock Register shows GRN (Inward) history. For current stock balance, refer Stock Summary.
      </ErpInfoNote>
    </div>
  );
};
