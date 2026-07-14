import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { TransportReportShell, TransportSearchButtons } from '../components/TransportReportShell';
import { exportToExcel } from '../utils/excel';
import {
  computePendingBillRows, enrichReceipts, fmtKg, type PendingFilters,
} from '../utils/transportReports';

const emptyFilters: PendingFilters = {
  fromDate: '',
  toDate: '',
  transportName: 'All',
  vehicleNo: 'All',
  supplierName: 'All',
};

export const TransportPendingBillReport: React.FC = () => {
  const { purchaseReceipts, purchaseOrders } = useAppContext();
  const [draft, setDraft] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [shown, setShown] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const enriched = useMemo(
    () => enrichReceipts(purchaseReceipts, purchaseOrders),
    [purchaseReceipts, purchaseOrders],
  );

  const transportOptions = useMemo(
    () => ['All', ...Array.from(new Set(enriched.map(r => r.transportName).filter(Boolean))).sort()],
    [enriched],
  );
  const vehicleOptions = useMemo(
    () => ['All', ...Array.from(new Set(enriched.map(r => r.vehicleNo).filter(Boolean))).sort()],
    [enriched],
  );
  const supplierOptions = useMemo(
    () => ['All', ...Array.from(new Set(enriched.map(r => r.supplierName).filter(Boolean))).sort()],
    [enriched],
  );

  const rows = useMemo(
    () => (shown ? computePendingBillRows(enriched, applied) : []),
    [enriched, applied, shown],
  );

  const totalPendingWeight = useMemo(
    () => rows.reduce((s, r) => s + r.netWeightKg, 0),
    [rows],
  );

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
        'GRN No': r.grnNo,
        'GRN Date': r.grnDate,
        'Supplier Name': r.supplierName,
        'From Location': r.fromLocation,
        'Vehicle No': r.vehicleNo,
        'Transport Name': r.transportName,
        'Net Weight (Kg)': r.netWeightKg,
        'Pending Days': r.pendingDays,
      })),
      'Transport Pending Bill',
      'Transport_Pending_Bill_Report.xlsx',
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
          <label className="jw-label">Supplier Name</label>
          <select value={draft.supplierName} onChange={e => setDraft(p => ({ ...p, supplierName: e.target.value }))} className="jw-input">
            {supplierOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <TransportSearchButtons onSearch={handleSearch} onClear={handleClear} />
    </>
  );

  return (
    <TransportReportShell title="Transport Pending Bill Report" filters={filters} onExcel={handleExcel}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div className="flex-1" />
        <div className="text-center flex-[2]">
          <h2 className="jw-pending-report-title">TRANSPORT PENDING BILL REPORT</h2>
        </div>
        <div className="flex-1 text-right text-sm">
          <p className="font-extrabold text-red-600">Pending GRN (Not Billed)</p>
          {(applied.fromDate || applied.toDate) && (
            <p className="text-xs mt-1 text-slate-600">
              From Date : {applied.fromDate ? new Date(applied.fromDate + 'T12:00:00').toLocaleDateString('en-GB') : '—'}
              {' '}To Date : {applied.toDate ? new Date(applied.toDate + 'T12:00:00').toLocaleDateString('en-GB') : '—'}
            </p>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="jw-pending-table w-full">
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>GRN No.</th>
              <th>GRN Date</th>
              <th className="text-left">Supplier Name</th>
              <th>From Location</th>
              <th>Vehicle No.</th>
              <th className="text-left">Transport Name</th>
              <th>Net Weight (Kg)</th>
              <th className="jw-pending-th-red">Pending Days</th>
            </tr>
          </thead>
          <tbody>
            {!shown ? (
              <tr><td colSpan={9} className="text-center py-8 text-slate-400 italic">Set filters and click Search</td></tr>
            ) : pageRows.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-slate-400 italic">No pending GRNs found</td></tr>
            ) : pageRows.map((r, i) => (
              <tr key={r.id}>
                <td>{(page - 1) * pageSize + i + 1}</td>
                <td className="font-bold text-brand-blue">{r.grnNo}</td>
                <td>{r.grnDate}</td>
                <td className="text-left">{r.supplierName}</td>
                <td>{r.fromLocation}</td>
                <td>{r.vehicleNo}</td>
                <td className="text-left">{r.transportName}</td>
                <td className="text-right font-semibold">{fmtKg(r.netWeightKg)}</td>
                <td className="text-right font-bold jw-pending-red">{r.pendingDays}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {shown && rows.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            <p className="text-sm font-semibold text-slate-600">Total Records : {rows.length}</p>
            <p className="jw-pending-grand text-base">
              Total Pending Weight (Kg) : <span>{fmtKg(totalPendingWeight)}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 mt-2 no-print">
            <div />
            <div className="flex items-center gap-2 text-sm">
              <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="jw-pending-clear-btn py-1 px-3">‹</button>
              <span className="font-bold">{page} / {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="jw-pending-clear-btn py-1 px-3">›</button>
            </div>
          </div>
          <div className="jw-pending-footer mt-4">
            <p className="jw-pending-note">Note : Above GRN are not billed yet. Please create Transport Bill to clear pending.</p>
          </div>
        </>
      )}
    </TransportReportShell>
  );
};
