import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext, type PurchaseOrder } from '../store/AppContext';
import { computePOPendingRows } from '../utils/poPending';
import { downloadCustomPendingMaterialPDF } from '../utils/listExport';
import { Printer } from 'lucide-react';

const kg = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qty = (n: number) => (isFinite(n) ? n.toLocaleString('en-IN') : '0');

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
  return d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : s;
}

export const PendingMaterialReport: React.FC = () => {
  const { purchaseOrders, purchaseReceipts } = useAppContext();

  const [supplier, setSupplier] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [poNo, setPoNo] = useState('');
  const [itemGrade, setItemGrade] = useState('');
  const [make, setMake] = useState('');

  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDate(`${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`);
      
      let hours = now.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${String(hours).padStart(2, '0')}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const supplierOptions = useMemo(
    () => Array.from(new Set(purchaseOrders.map(p => p.supplierName))).sort(),
    [purchaseOrders],
  );

  const gradeOptions = useMemo(() => {
    const grades = new Set<string>();
    purchaseOrders.forEach(po => po.items.forEach(i => { if (i.grade) grades.add(i.grade); }));
    return Array.from(grades).sort();
  }, [purchaseOrders]);

  const makeOptions = useMemo(() => {
    const makes = new Set<string>();
    purchaseOrders.forEach(po => po.items.forEach(i => { if (i.make) makes.add(i.make); }));
    return Array.from(makes).sort();
  }, [purchaseOrders]);

  const matchesFilter = (po: PurchaseOrder, item: PurchaseOrder['items'][0]) => {
    if (supplier && po.supplierName !== supplier) return false;
    const d = parseDate(po.date);
    const iso = d ? toISO(d) : po.date;
    if (fromDate && iso < fromDate) return false;
    if (toDate && iso > toDate) return false;
    if (poNo && !po.poNumber.toLowerCase().includes(poNo.toLowerCase())) return false;
    if (itemGrade && item.grade !== itemGrade) return false;
    if (make && item.make !== make) return false;
    return true;
  };

  const rows = useMemo(() => {
    const raw = computePOPendingRows(purchaseOrders, purchaseReceipts, matchesFilter);
    return raw.map(r => ({ ...r, poDateFmt: fmtPoDate(r.poDate) }));
  }, [purchaseOrders, purchaseReceipts, supplier, fromDate, toDate, poNo, itemGrade, make]);

  const totals = useMemo(() => {
    const uniquePos = new Set(rows.map(r => r.poId));
    return {
      totalPos: uniquePos.size,
      totalItems: rows.length,
      totalNos: rows.reduce((s, r) => s + (Number(r.pendingNos) || 0), 0),
      totalPoWeight: rows.reduce((s, r) => s + (Number(r.pendingKg) || 0), 0),
      totalPendingNos: rows.reduce((s, r) => s + (Number(r.pendingNos) || 0), 0),
      totalPendingWeight: rows.reduce((s, r) => s + (Number(r.pendingKg) || 0), 0),
    };
  }, [rows]);

  return (
    <div className="bg-white min-h-screen text-slate-800 p-2 sm:p-4 print:p-0">
      
      {/* Download PDF Button */}
      <div className="flex justify-end mb-4">
        <button type="button" onClick={() => downloadCustomPendingMaterialPDF(rows, totals, { supplier, fromDate, toDate, poNo, itemGrade, make }, currentDate, currentTime)} className="erp-btn erp-btn-navy flex items-center gap-2">
          <Printer className="w-4 h-4" /> Download PDF
        </button>
      </div>

      {/* --- ON-SCREEN LAYOUT --- */}
      <div className="max-w-full mx-auto bg-white border-2 border-[#f39c12] p-4 shadow-sm" style={{ maxWidth: '1400px' }}>
        
        {/* Header Section */}
        <div className="relative mb-6 text-center pt-2">
          <h1 className="text-[26px] font-bold text-[#1a2f6c] tracking-wide inline-block uppercase m-0">Pending Material Report</h1>
          
          <div className="absolute right-0 top-0 text-[11px] font-medium text-slate-700 flex flex-col items-end gap-1">
            <div><span className="font-semibold text-slate-900 mr-2">Date :</span>{currentDate}</div>
            <div><span className="font-semibold text-slate-900 mr-2">Time :</span>{currentTime}</div>
          </div>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 gap-x-4 border border-[#e65100] p-3 mb-4 text-[11px] font-medium w-full bg-white">
          
          <div className="flex items-center">
            <div className="text-[#1a2f6c] font-bold w-[90px]">PARTY NAME</div>
            <div className="text-[#1a2f6c] font-bold px-2">:</div>
            <select value={supplier} onChange={e => setSupplier(e.target.value)} className="flex-1 px-2 py-1 outline-none bg-white text-slate-700 cursor-pointer border-b border-transparent hover:border-slate-200">
              <option value="">All Suppliers</option>
              {supplierOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center">
            <div className="text-[#1a2f6c] font-bold w-[90px]">PO DATE TO</div>
            <div className="text-[#1a2f6c] font-bold px-2">:</div>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="flex-1 px-2 py-1 outline-none bg-white text-slate-700 border-b border-transparent hover:border-slate-200" />
          </div>

          <div className="flex items-center">
            <div className="text-[#1a2f6c] font-bold w-[60px]">GRADE</div>
            <div className="text-[#1a2f6c] font-bold px-2">:</div>
            <select value={itemGrade} onChange={e => setItemGrade(e.target.value)} className="flex-1 px-2 py-1 outline-none bg-white text-slate-700 cursor-pointer border-b border-transparent hover:border-slate-200">
              <option value="">All Grades</option>
              {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="flex items-center">
            <div className="text-[#1a2f6c] font-bold w-[90px]">PO DATE FROM</div>
            <div className="text-[#1a2f6c] font-bold px-2">:</div>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="flex-1 px-2 py-1 outline-none bg-white text-slate-700 border-b border-transparent hover:border-slate-200" />
          </div>

          <div className="flex items-center">
            <div className="text-[#1a2f6c] font-bold w-[90px]">PO NO.</div>
            <div className="text-[#1a2f6c] font-bold px-2">:</div>
            <input type="text" value={poNo} onChange={e => setPoNo(e.target.value)} placeholder="All PO" className="flex-1 px-2 py-1 outline-none bg-white text-slate-700 border-b border-transparent hover:border-slate-200" />
          </div>

          <div className="flex items-center">
            <div className="text-[#1a2f6c] font-bold w-[60px]">MAKE</div>
            <div className="text-[#1a2f6c] font-bold px-2">:</div>
            <select value={make} onChange={e => setMake(e.target.value)} className="flex-1 px-2 py-1 outline-none bg-white text-slate-700 cursor-pointer border-b border-transparent hover:border-slate-200">
              <option value="">All Makes</option>
              {makeOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

        </div>

        <div className="hidden print:flex mb-4 text-[11px] font-semibold gap-4 text-slate-800 border-b border-slate-300 pb-2">
          <span>Party: {supplier || 'All Suppliers'}</span>
          <span>Date From: {fromDate ? fmtPoDate(fromDate) : 'All'}</span>
          <span>Date To: {toDate ? fmtPoDate(toDate) : 'All'}</span>
          <span>PO No: {poNo || 'All PO'}</span>
          <span>Grade: {itemGrade || 'All Grades'}</span>
          <span>Make: {make || 'All Makes'}</span>
        </div>

        <div className="w-full mb-4 overflow-x-auto">
          <table className="w-full min-w-max text-[11px] text-left border-collapse border-2 border-[#e65100] whitespace-nowrap">
            <thead>
              <tr className="bg-[#e65100] text-white uppercase font-semibold leading-tight">
                <th className="py-2.5 px-2 border border-slate-300 text-center">Sr.</th>
                <th className="py-2.5 px-3 border border-slate-300 text-center">Party Name</th>
                <th className="py-2.5 px-3 border border-slate-300 text-center">PO Date</th>
                <th className="py-2.5 px-3 border border-slate-300 text-center">PO No.</th>
                <th className="py-2.5 px-2 border border-slate-300 text-center">Grade</th>
                <th className="py-2.5 px-3 border border-slate-300 text-center">Size</th>
                <th className="py-2.5 px-2 border border-slate-300 text-center">Thick<br />(MM)</th>
                <th className="py-2.5 px-2 border border-slate-300 text-center">Width<br />(MM)</th>
                <th className="py-2.5 px-2 border border-slate-300 text-center">Length<br />(MM)</th>
                <th className="py-2.5 px-2 border border-slate-300 text-center">Pending<br />Nos</th>
                <th className="py-2.5 px-3 border border-slate-300 text-center">Pending<br />Kg</th>
              </tr>
            </thead>
            <tbody className="bg-white text-slate-800 font-medium">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-6 text-center text-slate-500 text-sm border border-slate-300">No pending material found matching criteria</td>
                </tr>
              ) : rows.map((r, i) => (
                <tr key={`${r.poId}-${r.itemId}`} className="hover:bg-slate-50">
                  <td className="py-2.5 px-2 border border-slate-300 text-center">{i + 1}</td>
                  <td className="py-2.5 px-3 border border-slate-300 text-center font-bold">{r.supplier}</td>
                  <td className="py-2.5 px-3 border border-slate-300 text-center">{r.poDateFmt}</td>
                  <td className="py-2.5 px-3 border border-slate-300 text-center">{r.poNumber}</td>
                  <td className="py-2.5 px-2 border border-slate-300 text-center">{r.grade}</td>
                  <td className="py-2.5 px-3 border border-slate-300 text-center">{r.sizeSection || '-'}</td>
                  <td className="py-2.5 px-2 border border-slate-300 text-center">{r.thickness || '-'}</td>
                  <td className="py-2.5 px-2 border border-slate-300 text-center">{r.width || '-'}</td>
                  <td className="py-2.5 px-2 border border-slate-300 text-center">{r.length || '-'}</td>
                  <td className="py-2.5 px-2 border border-slate-300 text-center">{r.pendingNos}</td>
                  <td className="py-2.5 px-3 border border-slate-300 text-center">{kg(r.pendingKg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        {rows.length > 0 && (
          <div className="w-full mb-4 overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-center border-2 border-[#e65100]">
              <tbody>
                <tr>
                  <td className="border border-[#e65100] py-3 w-1/6">
                    <div className="text-[11px] font-bold text-[#1a2f6c] uppercase mb-1">TOTAL PO'S</div>
                    <div className="text-[15px] font-extrabold text-[#1a2f6c]">{totals.totalPos}</div>
                  </td>
                  <td className="border border-[#e65100] py-3 w-1/6">
                    <div className="text-[11px] font-bold text-[#1a2f6c] uppercase mb-1">TOTAL ITEMS</div>
                    <div className="text-[15px] font-extrabold text-[#1a2f6c]">{totals.totalItems}</div>
                  </td>
                  <td className="border border-[#e65100] py-3 w-1/6">
                    <div className="text-[11px] font-bold text-[#1a2f6c] uppercase mb-1">TOTAL NOS</div>
                    <div className="text-[15px] font-extrabold text-[#1a2f6c]">{qty(totals.totalNos)}</div>
                  </td>
                  <td className="border border-[#e65100] py-3 w-1/6">
                    <div className="text-[11px] font-bold text-[#1a2f6c] uppercase mb-1">TOTAL PENDING KG</div>
                    <div className="text-[15px] font-extrabold text-[#1a2f6c]">{kg(totals.totalPendingWeight)}</div>
                  </td>
                  <td className="border border-[#e65100] py-3 w-1/6">
                    <div className="text-[11px] font-bold text-[#1a2f6c] uppercase mb-1">TOTAL PENDING NOS</div>
                    <div className="text-[15px] font-extrabold text-[#1a2f6c]">{qty(totals.totalPendingNos)}</div>
                  </td>
                  <td className="border border-[#e65100] py-3 w-1/6">
                    <div className="text-[11px] font-bold text-[#1a2f6c] uppercase mb-1">TOTAL PO WEIGHT (KG)</div>
                    <div className="text-[15px] font-extrabold text-[#1a2f6c]">{kg(totals.totalPoWeight)}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Notes */}
        <div className="text-[11px] text-slate-800 font-medium flex items-center gap-6 pb-2">
          <span className="font-bold uppercase text-[#e65100]">NOTE :</span>
          <span>1. Pending Nos = PO Nos - Received Nos</span>
          <span>2. Pending Kg = PO Kg - Received Kg</span>
          <div className="ml-auto flex flex-col items-center mt-4">
            <div className="w-48 border-t border-slate-800 mb-1"></div>
            <span className="font-bold text-slate-900">Authorised Signatory</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingMaterialReport;
