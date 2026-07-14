import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { TransportReportHead, TransportReportShell, TransportSearchButtons } from '../components/TransportReportShell';
import { exportToExcel } from '../utils/excel';
import { computeTransportSummary, fmtKg } from '../utils/transportReports';

const emptyFilters = { fromDate: '', toDate: '', transportName: 'All' };

export const TransportWiseSummaryReport: React.FC = () => {
  const { transportBills } = useAppContext();
  const [draft, setDraft] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [shown, setShown] = useState(false);

  const transportOptions = useMemo(
    () => ['All', ...Array.from(new Set(transportBills.map(b => b.transportName).filter(Boolean))).sort()],
    [transportBills],
  );

  const rows = useMemo(
    () => (shown ? computeTransportSummary(transportBills, applied) : []),
    [transportBills, applied, shown],
  );

  const totals = useMemo(() => ({
    trips: rows.reduce((s, r) => s + r.totalTrips, 0),
    grn: rows.reduce((s, r) => s + r.totalGrn, 0),
    weight: rows.reduce((s, r) => s + r.totalWeightKg, 0),
  }), [rows]);

  const handleSearch = () => {
    setApplied({ ...draft });
    setShown(true);
    toast.success('Report generated');
  };

  const handleClear = () => {
    setDraft(emptyFilters);
    setApplied(emptyFilters);
    setShown(false);
  };

  const handleExcel = () => {
    if (!rows.length) { toast.error('Generate report first'); return; }
    exportToExcel(
      rows.map((r, i) => ({
        'Sr No': i + 1,
        'Transport Name': r.transportName,
        'Total Trips (Bills)': r.totalTrips,
        'Total GRN': r.totalGrn,
        'Total Weight (Kg)': r.totalWeightKg,
        'Average Weight Per Trip (Kg)': r.avgWeightPerTrip,
      })),
      'Transport Wise Summary',
      'Transport_Wise_Summary.xlsx',
    );
    toast.success('Excel downloaded');
  };

  const filters = (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
      </div>
      <TransportSearchButtons onSearch={handleSearch} onClear={handleClear} />
    </>
  );

  return (
    <TransportReportShell title="Transport Wise Summary Report" filters={filters} onExcel={handleExcel}>
      <TransportReportHead
        title="TRANSPORT WISE SUMMARY REPORT"
        dateRange={{ from: applied.fromDate, to: applied.toDate }}
      />

      <div className="overflow-x-auto">
        <table className="jw-pending-table w-full">
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th className="text-left">Transport Name</th>
              <th>Total Trips (Bills)</th>
              <th>Total GRN</th>
              <th>Total Weight (Kg)</th>
              <th>Average Weight Per Trip (Kg)</th>
            </tr>
          </thead>
          <tbody>
            {!shown ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400 italic">Set filters and click Search</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400 italic">No data for selected filters</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.transportName}>
                <td>{i + 1}</td>
                <td className="text-left font-semibold">{r.transportName}</td>
                <td className="text-center">{r.totalTrips}</td>
                <td className="text-center">{r.totalGrn}</td>
                <td className="text-right font-semibold">{fmtKg(r.totalWeightKg)}</td>
                <td className="text-right">{fmtKg(r.avgWeightPerTrip)}</td>
              </tr>
            ))}
          </tbody>
          {shown && rows.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={2} className="text-center font-extrabold">Total</td>
                <td className="text-center font-extrabold">{totals.trips}</td>
                <td className="text-center font-extrabold">{totals.grn}</td>
                <td className="text-right font-extrabold text-brand-blue">{fmtKg(totals.weight)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {shown && rows.length > 0 && (
        <div className="jw-pending-footer mt-4">
          <p className="jw-pending-note">Note : Summary is based on Transport Bills in selected date range.</p>
        </div>
      )}
    </TransportReportShell>
  );
};
