import React, { useState, useMemo } from 'react';

import {

  Search, RotateCcw, FileSpreadsheet, FileText, Printer, ChevronDown, ChevronRight,

  Users, ClipboardList, Package, Scale, IndianRupee, PackageCheck,

} from 'lucide-react';

import { useAppContext, type PurchaseOrder } from '../store/AppContext';

import toast from 'react-hot-toast';

import { downloadMaterialPendingReportPDF } from '../utils/listExport';

import { ErpPageHeader, ErpScreenActions, ErpStatCard, ErpTableCaption } from '../components/ErpPageShell';

import { erpHotkeyProps } from '../utils/erpHotkeys';

import { computePOPendingRows } from '../utils/poPending';



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



function fmtPoDate(s: string) {

  const d = parseDate(s);

  return d ? d.toLocaleDateString('en-GB') : s;

}



export const MaterialPendingReport: React.FC = () => {

  const { purchaseOrders, purchaseReceipts } = useAppContext();



  const today = new Date();

  const asOn = today.toLocaleDateString('en-GB');



  const [supplier, setSupplier] = useState('All');

  const [fromDate, setFromDate] = useState('');

  const [toDate, setToDate] = useState('');

  const [poNo, setPoNo] = useState('');

  const [itemGrade, setItemGrade] = useState('');

  const [thickness, setThickness] = useState('');

  const [width, setWidth] = useState('');

  const [length, setLength] = useState('');

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const [applied, setApplied] = useState({

    supplier: 'All', fromDate: '', toDate: '',

    poNo: '', itemGrade: '', thickness: '', width: '', length: '',

  });



  const supplierOptions = useMemo(

    () => Array.from(new Set(purchaseOrders.map(p => p.supplierName))).sort(),

    [purchaseOrders],

  );



  const matchesFilter = (po: PurchaseOrder, item: PurchaseOrder['items'][0]) => {

    if (applied.supplier !== 'All' && po.supplierName !== applied.supplier) return false;

    const d = parseDate(po.date);

    const iso = d ? toISO(d) : po.date;

    if (applied.fromDate && iso < applied.fromDate) return false;

    if (applied.toDate && iso > applied.toDate) return false;

    if (applied.poNo && !po.poNumber.toLowerCase().includes(applied.poNo.toLowerCase())) return false;

    if (applied.itemGrade && !item.grade.toLowerCase().includes(applied.itemGrade.toLowerCase())) return false;

    if (applied.thickness && item.thickness !== applied.thickness) return false;

    if (applied.width && item.width !== applied.width) return false;

    if (applied.length && item.length !== applied.length) return false;

    return true;

  };



  const rows = useMemo(() => {

    const raw = computePOPendingRows(purchaseOrders, purchaseReceipts, matchesFilter);

    return raw.map(r => ({ ...r, poDate: fmtPoDate(r.poDate) }));

  }, [purchaseOrders, purchaseReceipts, applied]);



  const grouped = useMemo(() => {

    const map = new Map<string, typeof rows>();

    rows.forEach(r => {

      if (!map.has(r.supplier)) map.set(r.supplier, []);

      map.get(r.supplier)!.push(r);

    });

    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));

  }, [rows]);



  const totals = useMemo(() => ({

    poNos: rows.reduce((s, r) => s + r.poNos, 0),

    receivedNos: rows.reduce((s, r) => s + r.receivedNos, 0),

    pendingNos: rows.reduce((s, r) => s + r.pendingNos, 0),

    pendingWeight: rows.reduce((s, r) => s + r.pendingKg, 0),

    pendingAmount: rows.reduce((s, r) => s + r.pendingAmount, 0),

  }), [rows]);



  const dimOptions = useMemo(() => {

    const thk = new Set<string>();

    const w = new Set<string>();

    const len = new Set<string>();

    purchaseOrders.forEach(po => po.items.forEach(i => {

      thk.add(i.thickness); w.add(i.width); len.add(i.length);

    }));

    return {

      thicknesses: Array.from(thk).sort(),

      widths: Array.from(w).sort(),

      lengths: Array.from(len).sort(),

    };

  }, [purchaseOrders]);



  const handleSearch = () => setApplied({ supplier, fromDate, toDate, poNo, itemGrade, thickness, width, length });

  const handleClear = () => {

    setSupplier('All'); setFromDate(''); setToDate('');

    setPoNo(''); setItemGrade(''); setThickness(''); setWidth(''); setLength('');

    setApplied({ supplier: 'All', fromDate: '', toDate: '', poNo: '', itemGrade: '', thickness: '', width: '', length: '' });

  };



  const handleExportExcel = () => {

    const header = 'Sr No,Supplier,PO No,PO Date,Grade,Thickness,Width,Length,PO Nos,Received Nos,Pending Nos,Pending Kg,Rate,Pending Amount';

    const lines = rows.map((r, i) =>

      `${i + 1},${r.supplier},${r.poNumber},${r.poDate},${r.grade},${r.thickness},${r.width},${r.length},${r.poNos},${r.receivedNos},${r.pendingNos},${r.pendingKg.toFixed(2)},${r.rate.toFixed(2)},${r.pendingAmount.toFixed(2)}`,

    );

    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;

    a.download = `po_pending_report_${toISO(today)}.csv`;

    a.click();

    URL.revokeObjectURL(url);

    toast.success('Excel file downloaded');

  };



  const handleExportPDF = () => {

    if (rows.length === 0) { toast.error('No pending material to export'); return; }

    downloadMaterialPendingReportPDF(rows.map(r => ({

      poId: r.poId, poNumber: r.poNumber, poDate: r.poDate, supplier: r.supplier,

      grade: r.grade, spec: `${r.thickness} MM x ${r.width} MM x ${r.length} MM`,

      orderedNos: r.poNos, receivedNos: r.receivedNos, pendingNos: r.pendingNos,

      pendingWeightKg: r.pendingKg, rate: r.rate, pendingAmount: r.pendingAmount, expectedDate: '-',

    })), { ...totals, orderedNos: totals.poNos });

    toast.success('PDF downloaded');

  };



  const toggleGroup = (name: string) => setCollapsed(prev => ({ ...prev, [name]: !prev[name] }));



  let sr = 0;



  return (

    <div className="max-w-[1680px] mx-auto p-3 sm:p-4 space-y-4 fade-in pb-8">

      <ErpPageHeader

        title="Purchase Order Pending Report"

        subtitle="Pending = PO Nos − GRN Received Nos (per line item)"

        extra={

          <ErpScreenActions>

            <button type="button" onClick={handleExportPDF} className="erp-btn erp-btn-ghost"><FileText className="w-4 h-4 text-red-600" /> Export PDF</button>

            <button type="button" onClick={handleExportExcel} className="erp-btn erp-btn-ghost"><FileSpreadsheet className="w-4 h-4 text-green-600" /> Export Excel</button>

            <button type="button" {...erpHotkeyProps('print')} onClick={() => window.print()} className="erp-btn erp-btn-ghost"><Printer className="w-4 h-4" /> Print</button>

          </ErpScreenActions>

        }

      />



      <div className="erp-card p-4">

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 items-end">

          <div><label className="tc-mgmt-label">Supplier</label><select value={supplier} onChange={e => setSupplier(e.target.value)} className="tc-mgmt-input"><option value="All">All</option>{supplierOptions.map(s => <option key={s} value={s}>{s}</option>)}</select></div>

          <div><label className="tc-mgmt-label">PO No.</label><input value={poNo} onChange={e => setPoNo(e.target.value)} className="tc-mgmt-input no-uppercase" placeholder="All" /></div>

          <div><label className="tc-mgmt-label">PO Date From</label><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="tc-mgmt-input" /></div>

          <div><label className="tc-mgmt-label">PO Date To</label><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="tc-mgmt-input" /></div>

          <div><label className="tc-mgmt-label">Grade</label><input value={itemGrade} onChange={e => setItemGrade(e.target.value)} className="tc-mgmt-input no-uppercase" placeholder="All" /></div>

          <div><label className="tc-mgmt-label">Thickness</label><select value={thickness} onChange={e => setThickness(e.target.value)} className="tc-mgmt-input"><option value="">All</option>{dimOptions.thicknesses.map(v => <option key={v} value={v}>{v}</option>)}</select></div>

          <div><label className="tc-mgmt-label">Width</label><select value={width} onChange={e => setWidth(e.target.value)} className="tc-mgmt-input"><option value="">All</option>{dimOptions.widths.map(v => <option key={v} value={v}>{v}</option>)}</select></div>

          <div><label className="tc-mgmt-label">Length</label><select value={length} onChange={e => setLength(e.target.value)} className="tc-mgmt-input"><option value="">All</option>{dimOptions.lengths.map(v => <option key={v} value={v}>{v}</option>)}</select></div>

        </div>

        <div className="flex justify-end gap-2 mt-3">

          <button type="button" onClick={handleSearch} className="erp-btn erp-btn-navy"><Search className="w-4 h-4" /> Search</button>

          <button type="button" onClick={handleClear} className="erp-btn erp-btn-ghost"><RotateCcw className="w-4 h-4" /> Clear</button>

        </div>

      </div>



      <div className="erp-card overflow-hidden">

        <ErpTableCaption

          title={`Purchase Order Pending Details (As on ${asOn})`}

          meta={<span className="text-xs font-bold text-brand-blue">Total Suppliers: {grouped.length} · Pending Lines: {rows.length}</span>}

        />

        <div className="overflow-x-auto">

          <table className="w-full erp-report-table">

            <thead>

              <tr>

                <th>Sr.</th><th>Supplier</th><th>PO No.</th><th>PO Date</th><th>Grade</th>

                <th>Thk</th><th>Width</th><th>Length</th>

                <th className="text-right">PO Nos</th>

                <th className="text-right">GRN Recd</th>

                <th className="text-right">Pending Nos</th>

                <th className="text-right">Pending Kg</th>

                <th className="text-right">Rate</th>

                <th className="text-right">Pending ₹</th>

              </tr>

            </thead>

            <tbody>

              {grouped.length === 0 ? (

                <tr><td colSpan={14} className="text-center py-10 text-slate-400 italic">No pending material — all PO lines fully received via GRN, or no PO matches filters</td></tr>

              ) : grouped.map(([sup, items]) => {

                const subPo = items.reduce((s, r) => s + r.poNos, 0);

                const subRecd = items.reduce((s, r) => s + r.receivedNos, 0);

                const subPending = items.reduce((s, r) => s + r.pendingNos, 0);

                const subKg = items.reduce((s, r) => s + r.pendingKg, 0);

                const subAmt = items.reduce((s, r) => s + r.pendingAmount, 0);

                const isCollapsed = collapsed[sup];

                return (

                  <React.Fragment key={sup}>

                    <tr className="supplier-group">

                      <td colSpan={8}>

                        <button type="button" onClick={() => toggleGroup(sup)} className="inline-flex items-center gap-1">

                          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}

                          {sup}

                        </button>

                      </td>

                      <td className="text-right">{subPo}</td>

                      <td className="text-right text-green-700">{subRecd}</td>

                      <td className="text-right">{subPending}</td>

                      <td className="text-right">{kg(subKg)}</td>

                      <td />

                      <td className="text-right">{inr(subAmt)}</td>

                    </tr>

                    {!isCollapsed && items.map(r => {

                      sr += 1;

                      return (

                        <tr key={`${r.poId}-${r.itemId}`}>

                          <td>{sr}</td>

                          <td>{r.supplier}</td>

                          <td className="font-semibold text-brand-blue">{r.poNumber}</td>

                          <td>{r.poDate}</td>

                          <td>{r.grade}</td>

                          <td>{r.thickness}</td><td>{r.width}</td><td>{r.length}</td>

                          <td className="text-right">{r.poNos}</td>

                          <td className="text-right text-green-600 font-semibold">{r.receivedNos}</td>

                          <td className="text-right font-bold text-brand-blue">{r.pendingNos}</td>

                          <td className="text-right">{kg(r.pendingKg)}</td>

                          <td className="text-right">{inr(r.rate)}</td>

                          <td className="text-right font-semibold">{inr(r.pendingAmount)}</td>

                        </tr>

                      );

                    })}

                  </React.Fragment>

                );

              })}

            </tbody>

            {rows.length > 0 && (

              <tfoot>

                <tr className="grand-total">

                  <td colSpan={8} className="px-2.5 py-2.5 uppercase">Grand Total</td>

                  <td className="text-right px-2.5 py-2.5">{totals.poNos}</td>

                  <td className="text-right px-2.5 py-2.5">{totals.receivedNos}</td>

                  <td className="text-right px-2.5 py-2.5">{totals.pendingNos}</td>

                  <td className="text-right px-2.5 py-2.5">{kg(totals.pendingWeight)}</td>

                  <td />

                  <td className="text-right px-2.5 py-2.5">{inr(totals.pendingAmount)}</td>

                </tr>

              </tfoot>

            )}

          </table>

        </div>

      </div>



      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">

        <ErpStatCard icon={Users} label="Suppliers" value={String(grouped.length)} ring="bg-brand-blue" />

        <ErpStatCard icon={ClipboardList} label="PO Lines Pending" value={String(rows.length)} ring="bg-orange-500" />

        <ErpStatCard icon={Package} label="PO Nos" value={String(totals.poNos)} ring="bg-violet-600" />

        <ErpStatCard icon={PackageCheck} label="GRN Received" value={String(totals.receivedNos)} ring="bg-cyan-600" />

        <ErpStatCard icon={Scale} label="Pending Kg" value={kg(totals.pendingWeight)} ring="bg-green-600" />

        <ErpStatCard icon={IndianRupee} label="Pending Amount" value={`₹${inr(totals.pendingAmount)}`} ring="bg-amber-500" />

      </div>



      <p className="text-center text-xs text-brand-blue font-medium">

        Pending Nos = PO Nos − GRN Received Nos. Only lines with balance pending are listed. Fully received PO lines are hidden.

      </p>

    </div>

  );

};


