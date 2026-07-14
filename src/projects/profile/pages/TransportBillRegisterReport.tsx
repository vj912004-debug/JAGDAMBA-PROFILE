import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { TransportReportHead, TransportReportShell, TransportSearchButtons } from '../components/TransportReportShell';
import { exportToExcel } from '../utils/excel';
import {
  filterTransportBills, fmtDisplayDate, fmtKg, type RegisterFilters,
} from '../utils/transportReports';

const emptyFilters: RegisterFilters = {
  fromDate: '',
  toDate: '',
  transportName: 'All',
  vehicleNo: 'All',
  billNo: 'All',
};

export const TransportBillRegisterReport: React.FC = () => {
  const { transportBills } = useAppContext();
  const [draft, setDraft] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [shown, setShown] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const transportOptions = useMemo(
    () => ['All', ...Array.from(new Set(transportBills.map(b => b.transportName).filter(Boolean))).sort()],
    [transportBills],
  );
  const vehicleOptions = useMemo(
    () => ['All', ...Array.from(new Set(transportBills.map(b => b.vehicleNo).filter(Boolean))).sort()],
    [transportBills],
  );
  const billNoOptions = useMemo(
    () => ['All', ...Array.from(new Set(transportBills.map(b => b.billNo).filter(Boolean))).sort()],
    [transportBills],
  );

  const rows = useMemo(
    () => (shown ? filterTransportBills(transportBills, applied) : []),
    [transportBills, applied, shown],
  );

  const totals = useMemo(() => ({
    grn: rows.reduce((s, r) => s + r.receiptIds.length, 0),
    weight: rows.reduce((s, r) => s + r.totalWeightKg, 0),
  }), [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);

  const handleSearch = () => {
    setApplied({ ...draft });
    setShown(true);
    setPage(1);
    toast.success('Report generated');
  };

  const handleClear = () => {
    setDraft(emptyFilters);
    setApplied(emptyFilters);
    setShown(false);
    setPage(1);
  };

  const handleExcel = () => {
    if (!rows.length) { toast.error('Generate report first'); return; }
    exportToExcel(
      rows.map((r, i) => ({
        'Sr No': i + 1,
        'Bill No': r.billNo,
        'Bill Date': fmtDisplayDate(r.billDate),
        'Transport Name': r.transportName,
        'Vehicle No': r.vehicleNo,
        'Total GRN': r.receiptIds.length,
        'Total Weight (Kg)': r.totalWeightKg,
      })),
      'Transport Bill Register',
      'Transport_Bill_Register.xlsx',
    );
    toast.success('Excel downloaded');
  };

  const filters = (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="jw-label">From Date</label>
          <input type="date" value={draft.fromDate} onChange={e => setDraft(p => ({ ...p, fromDate: e.target.value }))} className="jw-input" />
        </div>
        <div>
          <label className="jw-label">To Date</label>
          <input type="date" value={draft.toDate} onChange={e => setDraft(p => ({ ...p, toDate: e.target.value }))} className="jw-input" />
        </div>
        <div>
          <label className="jw-label">Transport Name</label>
          <select value={draft.transportName} onChange={e => setDraft(p => ({ ...p, transportName: e.target.value }))} className="jw-input">
            {transportOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="jw-label">Vehicle No.</label>
          <select value={draft.vehicleNo} onChange={e => setDraft(p => ({ ...p, vehicleNo: e.target.value }))} className="jw-input">
            {vehicleOptions.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="jw-label">Bill No.</label>
          <select value={draft.billNo} onChange={e => setDraft(p => ({ ...p, billNo: e.target.value }))} className="jw-input">
            {billNoOptions.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>
      <TransportSearchButtons onSearch={handleSearch} onClear={handleClear} />
    </>
  );

  return (
    <TransportReportShell title="Transport Bill Register Report" filters={filters} onExcel={handleExcel}>
      <TransportReportHead
        title="TRANSPORT BILL REGISTER REPORT"
        dateRange={{ from: applied.fromDate, to: applied.toDate }}
      />

      <div className="overflow-x-auto">
        <table className="jw-pending-table w-full">
          <thead>
            <tr>
              <th>Sr No.</th>
              <th>Bill No.</th>
              <th>Bill Date</th>
              <th className="text-left">Transport Name</th>
              <th>Vehicle No.</th>
              <th>Total GRN</th>
              <th>Total Weight (Kg)</th>
            </tr>
          </thead>
          <tbody>
            {!shown ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-400 italic">Set filters and click Search</td></tr>
            ) : pageRows.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-400 italic">No bills found</td></tr>
            ) : pageRows.map((r, i) => (
              <tr key={r.id}>
                <td>{(page - 1) * pageSize + i + 1}</td>
                <td>
                  <Link to={`/transport-bill-detail?billId=${r.id}`} className="font-bold text-brand-blue hover:underline no-print">
                    {r.billNo}
                  </Link>
                  <span className="hidden print:inline font-bold">{r.billNo}</span>
                </td>
                <td>{fmtDisplayDate(r.billDate)}</td>
                <td className="text-left font-semibold">{r.transportName}</td>
                <td>{r.vehicleNo || '—'}</td>
                <td className="text-center">{r.receiptIds.length}</td>
                <td className="text-right font-semibold">{fmtKg(r.totalWeightKg)}</td>
              </tr>
            ))}
          </tbody>
          {shown && rows.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={5} className="text-center font-extrabold">Total :</td>
                <td className="text-center font-extrabold">{totals.grn}</td>
                <td className="text-right font-extrabold text-brand-blue">{fmtKg(totals.weight)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {shown && rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 no-print">
          <p className="text-sm font-semibold text-slate-600">Total Records : {rows.length}</p>
          <div className="flex items-center gap-2 text-sm">
            <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="jw-pending-clear-btn py-1 px-3">‹</button>
            <span className="font-bold">{page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="jw-pending-clear-btn py-1 px-3">›</button>
            <span className="text-slate-500 ml-2">{pageSize} / page</span>
          </div>
        </div>
      )}
    </TransportReportShell>
  );
};
