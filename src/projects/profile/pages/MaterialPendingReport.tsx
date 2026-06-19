import React, { useState, useMemo } from 'react';
import { Search, RotateCcw, FileSpreadsheet, FileText, Printer, Filter, ClipboardList, PackageCheck, Clock, Scale, IndianRupee, Download } from 'lucide-react';
import { useAppContext, type PurchaseOrder } from '../store/AppContext';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { downloadMaterialPendingReportPDF } from '../utils/listExport';
import { generatePurchaseOrderPDF } from '../utils/pdfGenerator';

interface PendingRow {
  poId: string;
  poNumber: string;
  poDate: string;
  supplier: string;
  grade: string;
  spec: string;
  orderedNos: number;
  receivedNos: number;
  pendingNos: number;
  pendingWeightKg: number;
  rate: number;
  pendingAmount: number;
  expectedDate: string;
}

const inr = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const kg = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function parseDate(s: string): Date | null {
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function toISO(d: Date) { return d.toISOString().split('T')[0]; }

export const MaterialPendingReport: React.FC = () => {
  const { purchaseOrders, purchaseReceipts } = useAppContext();

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [supplier, setSupplier] = useState('All');
  const [fromDate, setFromDate] = useState(toISO(firstOfMonth));
  const [toDate, setToDate] = useState(toISO(today));
  const [poNo, setPoNo] = useState('');
  const [itemGrade, setItemGrade] = useState('');
  const [applied, setApplied] = useState({ supplier: 'All', fromDate: toISO(firstOfMonth), toDate: toISO(today), poNo: '', itemGrade: '' });

  const supplierOptions = useMemo(
    () => Array.from(new Set(purchaseOrders.map(p => p.supplierName))).sort(),
    [purchaseOrders]
  );

  // Received Nos per individual PO item id
  const receivedByItem = useMemo(() => {
    const map = new Map<string, number>();
    purchaseReceipts.forEach(r => {
      const po = purchaseOrders.find(p => p.id === r.poId);
      if (!po) return;
      if (r.items && r.items.length > 0) {
        r.items.forEach(ri => map.set(ri.itemId, (map.get(ri.itemId) || 0) + ri.receivedQty));
      } else if (po.items.length === 1) {
        const id = po.items[0].id;
        map.set(id, (map.get(id) || 0) + r.receivedQty);
      }
    });
    return map;
  }, [purchaseOrders, purchaseReceipts]);

  const matchesPO = (po: PurchaseOrder) => {
    if (applied.supplier !== 'All' && po.supplierName !== applied.supplier) return false;
    const d = parseDate(po.date);
    const iso = d ? toISO(d) : po.date;
    if (applied.fromDate && iso < applied.fromDate) return false;
    if (applied.toDate && iso > applied.toDate) return false;
    if (applied.poNo && !po.poNumber.toLowerCase().includes(applied.poNo.toLowerCase())) return false;
    return true;
  };

  const filteredPOs = useMemo(() => purchaseOrders.filter(matchesPO), [purchaseOrders, applied]);

  const rows = useMemo<PendingRow[]>(() => {
    const out: PendingRow[] = [];
    filteredPOs.forEach(po => {
      if (po.status === 'Complete') return; // pending report: only open POs
      const d = parseDate(po.date);
      const expected = d ? new Date(d.getTime() + 14 * 86400000) : null;
      po.items.forEach(item => {
        if (applied.itemGrade && !item.grade.toLowerCase().includes(applied.itemGrade.toLowerCase())) return;
        const ordered = item.nos || 0;
        const received = Math.min(ordered, receivedByItem.get(item.id) || 0);
        const pending = Math.max(0, ordered - received);
        const perPieceKg = ordered ? item.kg / ordered : 0;
        const pendingWeightKg = perPieceKg * pending;
        out.push({
          poId: po.id,
          poNumber: po.poNumber,
          poDate: d ? d.toLocaleDateString('en-GB') : po.date,
          supplier: po.supplierName,
          grade: item.grade,
          spec: `${item.thickness} MM x ${item.width} MM x ${item.length} MM`,
          orderedNos: ordered,
          receivedNos: received,
          pendingNos: pending,
          pendingWeightKg,
          rate: item.rate || 0,
          pendingAmount: pendingWeightKg * (item.rate || 0),
          expectedDate: expected ? expected.toLocaleDateString('en-GB') : '-',
        });
      });
    });
    return out;
  }, [filteredPOs, receivedByItem, applied.itemGrade]);

  const totals = useMemo(() => ({
    orderedNos: rows.reduce((s, r) => s + r.orderedNos, 0),
    receivedNos: rows.reduce((s, r) => s + r.receivedNos, 0),
    pendingNos: rows.reduce((s, r) => s + r.pendingNos, 0),
    pendingWeight: rows.reduce((s, r) => s + r.pendingWeightKg, 0),
    pendingAmount: rows.reduce((s, r) => s + r.pendingAmount, 0),
  }), [rows]);

  // Summary stat cards
  const stats = useMemo(() => {
    const poValue = filteredPOs.reduce((s, p) => s + (p.totalAmount || 0), 0);
    let receivedCount = 0;
    let receivedValue = 0;
    let pendingCount = 0;
    filteredPOs.forEach(po => {
      let poReceived = 0;
      let poPendingAmt = 0;
      po.items.forEach(item => {
        const ordered = item.nos || 0;
        const received = Math.min(ordered, receivedByItem.get(item.id) || 0);
        const pending = Math.max(0, ordered - received);
        const perPieceKg = ordered ? item.kg / ordered : 0;
        poReceived += received;
        receivedValue += perPieceKg * received * (item.rate || 0);
        poPendingAmt += perPieceKg * pending * (item.rate || 0);
      });
      if (poReceived > 0) receivedCount++;
      if (poPendingAmt > 0) pendingCount++;
    });
    return {
      totalPO: filteredPOs.length,
      poValue,
      receivedCount,
      receivedValue,
      pendingCount,
      pendingValue: totals.pendingAmount,
    };
  }, [filteredPOs, receivedByItem, totals.pendingAmount]);

  const handleSearch = () => setApplied({ supplier, fromDate, toDate, poNo, itemGrade });
  const handleClear = () => {
    setSupplier('All'); setFromDate(toISO(firstOfMonth)); setToDate(toISO(today)); setPoNo(''); setItemGrade('');
    setApplied({ supplier: 'All', fromDate: toISO(firstOfMonth), toDate: toISO(today), poNo: '', itemGrade: '' });
  };

  const handleExportExcel = () => {
    const header = 'Sr No,PO No,PO Date,Supplier,Item/Grade,Specification,PO Nos,Nos Received,Nos Pending,Pending Weight (KG),Rate,Pending Amount,Expected Date';
    const lines = rows.map((r, i) =>
      `${i + 1},${r.poNumber},${r.poDate},${r.supplier},${r.grade},"${r.spec}",${r.orderedNos},${r.receivedNos},${r.pendingNos},${r.pendingWeightKg.toFixed(2)},${r.rate.toFixed(2)},${r.pendingAmount.toFixed(2)},${r.expectedDate}`
    );
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `material_pending_report_${toISO(today)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Excel file downloaded');
  };

  const handleExportPDF = () => {
    if (rows.length === 0) {
      toast.error('No pending material to export');
      return;
    }
    downloadMaterialPendingReportPDF(rows, totals);
    toast.success('Pending material report PDF downloaded');
  };

  const handleDownloadPO = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) {
      toast.error('Purchase order not found');
      return;
    }
    generatePurchaseOrderPDF(po);
    toast.success(`PO ${po.poNumber} downloaded`);
  };

  return (
    <div className="max-w-[1500px] mx-auto space-y-4 fade-in">
      {/* Top actions */}
      <div className="flex justify-end gap-2">
        <button onClick={handleExportExcel} className="erp-btn erp-btn-primary">
          <FileSpreadsheet className="w-4 h-4" /> Export to Excel
        </button>
        <button onClick={handleExportPDF} className="erp-btn erp-btn-primary">
          <FileText className="w-4 h-4" /> Export to PDF
        </button>
        <button onClick={() => window.print()} className="erp-btn erp-btn-ghost">
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      {/* Filters */}
      <div className="erp-card p-4">
        <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          <Filter className="w-3.5 h-3.5" /> Filters
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div>
            <label className="field-label mb-1">Supplier</label>
            <select value={supplier} onChange={e => setSupplier(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="All">All Suppliers</option>
              {supplierOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
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
            <label className="field-label mb-1">PO No.</label>
            <input type="text" value={poNo} onChange={e => setPoNo(e.target.value)} placeholder="All"
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none no-uppercase" />
          </div>
          <div>
            <label className="field-label mb-1">Item / Grade</label>
            <input type="text" value={itemGrade} onChange={e => setItemGrade(e.target.value)} placeholder="All"
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none no-uppercase" />
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={handleSearch} className="erp-btn erp-btn-primary justify-center">
              <Search className="w-4 h-4" /> Search
            </button>
            <button onClick={handleClear} className="erp-btn erp-btn-ghost justify-center">
              <RotateCcw className="w-4 h-4" /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={ClipboardList} ring="bg-blue-600" label="Total PO" value={String(stats.totalPO)} sub={`Total Value`} subValue={`₹ ${inr(stats.poValue)}`} />
        <StatCard icon={PackageCheck} ring="bg-cyan-600" label="Total Received" value={String(stats.receivedCount)} sub="Total Value" subValue={`₹ ${inr(stats.receivedValue)}`} />
        <StatCard icon={Clock} ring="bg-indigo-600" label="Total Pending" value={String(stats.pendingCount)} sub="Pending Value" subValue={`₹ ${inr(stats.pendingValue)}`} danger />
        <StatCard icon={Scale} ring="bg-sky-600" label="Total Weight Pending" value={`${kg(totals.pendingWeight)} KG`} danger />
        <StatCard icon={IndianRupee} ring="bg-blue-700" label="Total Amount Pending" value={`₹ ${inr(totals.pendingAmount)}`} danger />
      </div>

      {/* Pending details table */}
      <div className="erp-card">
        <div className="erp-section-header justify-between">
          <span className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Pending Material Details
          </span>
          <span className="flex items-center gap-2 normal-case tracking-normal font-semibold">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white text-xs transition-colors"
              title="Download full report as Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white text-xs transition-colors"
              title="Download full report as PDF"
            >
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
                <th className="px-2.5 py-2.5 text-left text-xs font-bold">Sr No</th>
                <th className="px-2.5 py-2.5 text-left text-xs font-bold">PO No.</th>
                <th className="px-2.5 py-2.5 text-left text-xs font-bold">PO Date</th>
                <th className="px-2.5 py-2.5 text-left text-xs font-bold">Supplier Name</th>
                <th className="px-2.5 py-2.5 text-left text-xs font-bold">Item Name / Grade</th>
                <th className="px-2.5 py-2.5 text-left text-xs font-bold">Specification</th>
                <th className="px-2.5 py-2.5 text-right text-xs font-bold">Pending Nos (PO)</th>
                <th className="px-2.5 py-2.5 text-right text-xs font-bold">Nos Received</th>
                <th className="px-2.5 py-2.5 text-right text-xs font-bold">Nos Pending</th>
                <th className="px-2.5 py-2.5 text-right text-xs font-bold">Pending Weight (KG)</th>
                <th className="px-2.5 py-2.5 text-right text-xs font-bold">Rate (₹)</th>
                <th className="px-2.5 py-2.5 text-right text-xs font-bold">Pending Amount (₹)</th>
                <th className="px-2.5 py-2.5 text-left text-xs font-bold">Expected Date</th>
                <th className="px-2.5 py-2.5 text-center text-xs font-bold">PO PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.length === 0 ? (
                <tr><td colSpan={14} className="px-3 py-10 text-center text-slate-400 italic">No pending material for the selected filters</td></tr>
              ) : rows.map((r, i) => (
                <tr key={`${r.poId}-${i}`} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-2.5 py-2.5 text-slate-600 dark:text-slate-400">{i + 1}</td>
                  <td className="px-2.5 py-2.5 font-semibold">
                    <button
                      type="button"
                      onClick={() => handleDownloadPO(r.poId)}
                      className="text-brand-blue hover:underline"
                      title={`Download PO ${r.poNumber}`}
                    >
                      {r.poNumber}
                    </button>
                  </td>
                  <td className="px-2.5 py-2.5 text-slate-700 dark:text-slate-200">{r.poDate}</td>
                  <td className="px-2.5 py-2.5 text-slate-700 dark:text-slate-200">{r.supplier}</td>
                  <td className="px-2.5 py-2.5 text-slate-700 dark:text-slate-200">{r.grade}</td>
                  <td className="px-2.5 py-2.5 text-slate-600 dark:text-slate-300 text-xs">{r.spec}</td>
                  <td className="px-2.5 py-2.5 text-right text-slate-700 dark:text-slate-200">{r.orderedNos}</td>
                  <td className="px-2.5 py-2.5 text-right text-slate-700 dark:text-slate-200">{r.receivedNos}</td>
                  <td className={clsx("px-2.5 py-2.5 text-right font-bold", r.pendingNos > 0 ? "text-red-500" : "text-emerald-600")}>{r.pendingNos}</td>
                  <td className="px-2.5 py-2.5 text-right text-slate-700 dark:text-slate-200">{kg(r.pendingWeightKg)}</td>
                  <td className="px-2.5 py-2.5 text-right text-slate-700 dark:text-slate-200">{r.rate.toFixed(2)}</td>
                  <td className="px-2.5 py-2.5 text-right font-semibold text-slate-800 dark:text-slate-100">{inr(r.pendingAmount)}</td>
                  <td className="px-2.5 py-2.5 text-slate-700 dark:text-slate-200">{r.expectedDate}</td>
                  <td className="px-2.5 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleDownloadPO(r.poId)}
                      className="inline-flex items-center justify-center p-1.5 rounded-lg text-brand-blue hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      title={`Download PO ${r.poNumber}`}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 dark:bg-slate-800/40 font-bold text-brand-blue border-t-2 border-slate-200 dark:border-slate-700">
                  <td className="px-2.5 py-2.5" colSpan={6}>Total</td>
                  <td className="px-2.5 py-2.5 text-right">{totals.orderedNos}</td>
                  <td className="px-2.5 py-2.5 text-right">{totals.receivedNos}</td>
                  <td className="px-2.5 py-2.5 text-right text-red-500">{totals.pendingNos}</td>
                  <td className="px-2.5 py-2.5 text-right">{kg(totals.pendingWeight)}</td>
                  <td className="px-2.5 py-2.5"></td>
                  <td className="px-2.5 py-2.5 text-right">{inr(totals.pendingAmount)}</td>
                  <td className="px-2.5 py-2.5"></td>
                  <td className="px-2.5 py-2.5"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <p className="text-center text-xs text-brand-blue font-medium">
        Note : Pending quantity and amount are calculated based on GRN received.
      </p>
    </div>
  );
};

const StatCard: React.FC<{ icon: any; ring: string; label: string; value: string; sub?: string; subValue?: string; danger?: boolean }> =
  ({ icon: Icon, ring, label, value, sub, subValue, danger }) => (
    <div className="erp-card p-4 flex items-center gap-3">
      <span className={clsx('w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white', ring)}>
        <Icon className="w-6 h-6" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">{label}</p>
        <p className={clsx('text-lg font-black', danger ? 'text-red-500' : 'text-slate-800 dark:text-slate-100')}>{value}</p>
        {sub && <p className="text-[10px] font-medium text-slate-400">{sub} <span className="font-bold text-slate-600 dark:text-slate-300">{subValue}</span></p>}
      </div>
    </div>
  );
