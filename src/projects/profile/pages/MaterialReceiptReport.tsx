import React, { useState, useMemo } from 'react';
import { Search, RotateCcw, FileSpreadsheet, Printer, Eye, X, Layers, Truck, FileText } from 'lucide-react';
import { useAppContext, MATERIAL_GRADES } from '../store/AppContext';
import { PoToolbarActions } from '../components/PoToolbarActions';
import { erpHotkeyProps } from '../utils/erpHotkeys';
import { clsx } from 'clsx';

interface ReceivedLine {
  grade: string;
  thickness: string;
  width: string;
  length: string;
  make: string;
  supplier: string;
  poNumber: string;
  date: string;
  nos: number;
  weightMT: number;
  mtc: string;
}

const numMT = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

export const MaterialReceiptReport: React.FC = () => {
  const { purchaseOrders, purchaseReceipts } = useAppContext();

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const toISO = (d: Date) => d.toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(toISO(firstOfMonth));
  const [toDate, setToDate] = useState(toISO(today));
  const [gradeFilter, setGradeFilter] = useState('All');
  const [makeFilter, setMakeFilter] = useState('All');
  const [appliedSearch, setAppliedSearch] = useState({ fromDate: toISO(firstOfMonth), toDate: toISO(today), grade: 'All', make: 'All' });
  const [detailGrade, setDetailGrade] = useState<string | null>(null);
  const [selectedPoNumber, setSelectedPoNumber] = useState<string | null>(null);

  const selectedPo = useMemo(
    () => (selectedPoNumber
      ? purchaseOrders.find(p => p.poNumber.toUpperCase() === selectedPoNumber.toUpperCase()) ?? null
      : null),
    [selectedPoNumber, purchaseOrders],
  );

  // Flatten every received line from receipts back to its PO item
  const allLines = useMemo<ReceivedLine[]>(() => {
    const lines: ReceivedLine[] = [];
    purchaseReceipts.forEach(receipt => {
      const po = purchaseOrders.find(p => p.id === receipt.poId);
      if (!po) return;

      const pushLine = (itemId: string, qty: number) => {
        const item = po.items.find(i => i.id === itemId);
        if (!item || qty <= 0) return;
        const perPieceKg = item.nos ? item.kg / item.nos : 0;
        lines.push({
          grade: item.grade,
          thickness: item.thickness,
          width: item.width,
          length: item.length,
          make: po.make || '-',
          supplier: po.supplierName,
          poNumber: po.poNumber,
          date: receipt.date,
          nos: qty,
          weightMT: (perPieceKg * qty) / 1000,
          mtc: receipt.tcAvailable || 'No',
        });
      };

      if (receipt.items && receipt.items.length > 0) {
        receipt.items.forEach(ri => pushLine(ri.itemId, ri.receivedQty));
      } else if (po.items.length === 1) {
        pushLine(po.items[0].id, receipt.receivedQty);
      }
    });
    return lines;
  }, [purchaseOrders, purchaseReceipts]);

  const makeOptions = useMemo(
    () => Array.from(new Set(allLines.map(l => l.make).filter(m => m && m !== '-'))).sort(),
    [allLines]
  );

  // Lines after applying the (searched) filters
  const filteredLines = useMemo(() => {
    return allLines.filter(l => {
      if (appliedSearch.fromDate && l.date < appliedSearch.fromDate) return false;
      if (appliedSearch.toDate && l.date > appliedSearch.toDate) return false;
      if (appliedSearch.grade !== 'All' && l.grade !== appliedSearch.grade) return false;
      if (appliedSearch.make !== 'All' && l.make !== appliedSearch.make) return false;
      return true;
    });
  }, [allLines, appliedSearch]);

  // Group filtered lines by grade + dimensions + make
  const groupedRows = useMemo(() => {
    const map = new Map<string, ReceivedLine & { lastDate: string }>();
    filteredLines.forEach(l => {
      const key = `${l.grade}|${l.thickness}|${l.width}|${l.length}|${l.make}`;
      const existing = map.get(key);
      if (existing) {
        existing.nos += l.nos;
        existing.weightMT += l.weightMT;
        if (l.date > existing.lastDate) existing.lastDate = l.date;
      } else {
        map.set(key, { ...l, lastDate: l.date });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.lastDate.localeCompare(a.lastDate));
  }, [filteredLines]);

  const tableTotals = useMemo(() => ({
    nos: groupedRows.reduce((s, r) => s + r.nos, 0),
    weight: groupedRows.reduce((s, r) => s + r.weightMT, 0),
  }), [groupedRows]);

  // Summary cards use the full dataset (overall position)
  const summary = useMemo(() => {
    const distinctGrades = new Set(allLines.map(l => l.grade)).size;
    const totalReceivedMT = allLines.reduce((s, l) => s + l.weightMT, 0);
    const orderedMT = purchaseOrders.reduce((s, p) => s + (p.totalKg || 0), 0) / 1000;
    return {
      grades: distinctGrades || MATERIAL_GRADES.length,
      received: totalReceivedMT,
      pending: Math.max(0, orderedMT - totalReceivedMT),
    };
  }, [allLines, purchaseOrders]);

  const detailLines = useMemo(() => {
    if (!detailGrade) return [];
    return filteredLines
      .filter(l => l.grade === detailGrade)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [detailGrade, filteredLines]);

  const detailTotals = useMemo(() => ({
    nos: detailLines.reduce((s, l) => s + l.nos, 0),
    weight: detailLines.reduce((s, l) => s + l.weightMT, 0),
  }), [detailLines]);

  const handleSearch = () => {
    setAppliedSearch({ fromDate, toDate, grade: gradeFilter, make: makeFilter });
    setDetailGrade(null);
  };

  const handleReset = () => {
    setFromDate(toISO(firstOfMonth));
    setToDate(toISO(today));
    setGradeFilter('All');
    setMakeFilter('All');
    setAppliedSearch({ fromDate: toISO(firstOfMonth), toDate: toISO(today), grade: 'All', make: 'All' });
    setDetailGrade(null);
  };

  const handleExport = () => {
    const header = 'Sr No,Grade,Thickness (MM),Width (MM),Length (MM),Total Nos Received,Total Weight (MT),Make,Last Received Date';
    const rows = groupedRows.map((r, i) =>
      `${i + 1},${r.grade},${r.thickness},${r.width},${r.length},${r.nos},${r.weightMT.toFixed(3)},${r.make},${r.lastDate}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grade_wise_material_receipt_${toISO(today)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1500px] mx-auto space-y-4 fade-in">
      {/* Top action bar */}
      <div className="flex flex-wrap justify-end gap-2">
        <button onClick={handleExport} className="erp-btn erp-btn-primary">
          <FileSpreadsheet className="w-4 h-4" /> Export Excel
        </button>
        <button {...erpHotkeyProps('pdf')} onClick={() => window.print()} className="erp-btn erp-btn-purple">
          <Printer className="w-4 h-4" /> PDF Download
        </button>
        <PoToolbarActions purchaseOrder={selectedPo} />
      </div>

      {/* Filters */}
      <div className="erp-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="field-label mb-1">From Date</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="field-label mb-1">To Date</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="field-label mb-1">Grade</label>
            <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="All">All</option>
              {MATERIAL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label mb-1">Make</label>
            <select value={makeFilter} onChange={e => setMakeFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="All">All</option>
              {makeOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSearch} className="erp-btn erp-btn-primary flex-1 justify-center">
              <Search className="w-4 h-4" /> Search
            </button>
            <button onClick={handleReset} className="erp-btn erp-btn-ghost flex-1 justify-center">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main report table */}
      <div className="erp-card">
        <div className="erp-section-header">
          <Layers className="w-4 h-4" /> Grade Wise Material Receipt Report
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
                <th className="px-3 py-2.5 text-left text-xs font-bold">Sr No</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Grade</th>
                <th className="px-3 py-2.5 text-right text-xs font-bold">Thickness (MM)</th>
                <th className="px-3 py-2.5 text-right text-xs font-bold">Width (MM)</th>
                <th className="px-3 py-2.5 text-right text-xs font-bold">Length (MM)</th>
                <th className="px-3 py-2.5 text-right text-xs font-bold">Total Nos Received</th>
                <th className="px-3 py-2.5 text-right text-xs font-bold">Total Weight (MT)</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Make</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Last Received Date</th>
                <th className="px-3 py-2.5 text-center text-xs font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {groupedRows.length === 0 ? (
                <tr><td colSpan={10} className="px-3 py-10 text-center text-slate-400 italic">No material receipts found for the selected filters</td></tr>
              ) : groupedRows.map((r, i) => (
                <tr key={`${r.grade}-${r.thickness}-${r.width}-${r.length}-${r.make}`} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2.5 font-semibold text-brand-blue">{r.grade}</td>
                  <td className="px-3 py-2.5 text-right text-slate-700 dark:text-slate-200">{r.thickness}</td>
                  <td className="px-3 py-2.5 text-right text-slate-700 dark:text-slate-200">{r.width}</td>
                  <td className="px-3 py-2.5 text-right text-slate-700 dark:text-slate-200">{r.length}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-brand-blue">{r.nos}</td>
                  <td className="px-3 py-2.5 text-right text-slate-700 dark:text-slate-200">{numMT(r.weightMT)}</td>
                  <td className="px-3 py-2.5 text-slate-700 dark:text-slate-200">{r.make}</td>
                  <td className="px-3 py-2.5 text-slate-700 dark:text-slate-200">{r.lastDate}</td>
                  <td className="px-3 py-2.5 text-center">
                    <button onClick={() => setDetailGrade(r.grade)} title="View details"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-blue text-white hover:brightness-110 transition">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {groupedRows.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 dark:bg-slate-800/40 font-bold text-brand-blue border-t-2 border-slate-200 dark:border-slate-700">
                  <td className="px-3 py-2.5" colSpan={5}>Total</td>
                  <td className="px-3 py-2.5 text-right">{tableTotals.nos}</td>
                  <td className="px-3 py-2.5 text-right">{numMT(tableTotals.weight)}</td>
                  <td className="px-3 py-2.5" colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard icon={Layers} iconBg="bg-blue-100 text-blue-600" label="Total Grades" value={String(summary.grades)} />
        <SummaryCard icon={Truck} iconBg="bg-emerald-100 text-emerald-600" label="Total Material Received" value={`${numMT(summary.received)} MT`} />
        <SummaryCard icon={FileText} iconBg="bg-orange-100 text-orange-600" label="Total Pending (As per PO)" value={`${numMT(summary.pending)} MT`} />
      </div>

      {/* Detail panel */}
      {detailGrade && (
        <div className="erp-card">
          <div className="erp-section-header justify-between">
            <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Details for Grade: {detailGrade}</span>
            <button onClick={() => setDetailGrade(null)} className="text-white/90 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
                  <th className="px-3 py-2.5 text-left text-xs font-bold">Date</th>
                  <th className="px-3 py-2.5 text-left text-xs font-bold">PO No</th>
                  <th className="px-3 py-2.5 text-left text-xs font-bold">Supplier</th>
                  <th className="px-3 py-2.5 text-right text-xs font-bold">Thickness (MM)</th>
                  <th className="px-3 py-2.5 text-right text-xs font-bold">Width (MM)</th>
                  <th className="px-3 py-2.5 text-right text-xs font-bold">Length (MM)</th>
                  <th className="px-3 py-2.5 text-right text-xs font-bold">Nos Received (Nos)</th>
                  <th className="px-3 py-2.5 text-right text-xs font-bold">Weight (MT)</th>
                  <th className="px-3 py-2.5 text-center text-xs font-bold">MTC (Yes/No)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {detailLines.length === 0 ? (
                  <tr><td colSpan={9} className="px-3 py-8 text-center text-slate-400 italic">No receipt lines</td></tr>
                ) : detailLines.map((l, i) => (
                  <tr
                    key={i}
                    onClick={() => setSelectedPoNumber(l.poNumber)}
                    className={clsx(
                      'hover:bg-blue-50/40 dark:hover:bg-slate-800/40 cursor-pointer transition-colors',
                      selectedPoNumber === l.poNumber && 'ring-2 ring-inset ring-brand-blue bg-blue-50/60 dark:bg-blue-900/20',
                    )}
                  >
                    <td className="px-3 py-2.5 text-slate-700 dark:text-slate-200">{l.date}</td>
                    <td className="px-3 py-2.5 font-semibold text-brand-blue">{l.poNumber}</td>
                    <td className="px-3 py-2.5 text-slate-700 dark:text-slate-200">{l.supplier}</td>
                    <td className="px-3 py-2.5 text-right text-slate-700 dark:text-slate-200">{l.thickness}</td>
                    <td className="px-3 py-2.5 text-right text-slate-700 dark:text-slate-200">{l.width}</td>
                    <td className="px-3 py-2.5 text-right text-slate-700 dark:text-slate-200">{l.length}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-800 dark:text-slate-100">{l.nos}</td>
                    <td className="px-3 py-2.5 text-right text-slate-700 dark:text-slate-200">{numMT(l.weightMT)}</td>
                    <td className={clsx("px-3 py-2.5 text-center font-semibold", l.mtc === 'Yes' ? 'text-emerald-600' : 'text-slate-400')}>{l.mtc}</td>
                  </tr>
                ))}
              </tbody>
              {detailLines.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 font-bold text-brand-blue border-t-2 border-slate-200 dark:border-slate-700">
                    <td className="px-3 py-2.5" colSpan={6}>Total</td>
                    <td className="px-3 py-2.5 text-right">{detailTotals.nos}</td>
                    <td className="px-3 py-2.5 text-right">{numMT(detailTotals.weight)}</td>
                    <td className="px-3 py-2.5"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard: React.FC<{ icon: any; iconBg: string; label: string; value: string }> = ({ icon: Icon, iconBg, label, value }) => (
  <div className="erp-card p-4 flex items-center gap-4">
    <span className={clsx('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
      <Icon className="w-6 h-6" />
    </span>
    <div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-xl font-black text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  </div>
);
