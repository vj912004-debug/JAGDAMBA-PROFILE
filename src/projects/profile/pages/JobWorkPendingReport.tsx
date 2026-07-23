import React, { useMemo, useState } from 'react';
import {
  FileSpreadsheet, FileDown, Printer, Filter, Search, RotateCcw, ClipboardList,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppContext, MATERIAL_GRADES } from '../store/AppContext';
import {
  computeJobWorkPendingRows, jobWorkPendingTotals, fmtKgReport,
  type JobWorkPendingRow,
} from '../utils/jobWorkPending';
import { exportToExcel } from '../utils/excel';

const emptyFilters: { fromDate: string; toDate: string; party: string; grade: string; showPending: 'pending' | 'all' } = {
  fromDate: '',
  toDate: '',
  party: 'All',
  grade: 'All',
  showPending: 'pending',
};

export const JobWorkPendingReport: React.FC = () => {
  const { jobWorkOutwards, jobWorkInwards } = useAppContext();
  const [showFilters, setShowFilters] = useState(true);
  const [draft, setDraft] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [reportShown, setReportShown] = useState(false);

  const partyOptions = useMemo(
    () => Array.from(new Set(jobWorkOutwards.map(o => o.partyName).filter(Boolean))).sort(),
    [jobWorkOutwards],
  );

  const rows = useMemo(
    () => (reportShown ? computeJobWorkPendingRows(jobWorkOutwards, jobWorkInwards, applied) : []),
    [jobWorkOutwards, jobWorkInwards, applied, reportShown],
  );

  const totals = useMemo(() => jobWorkPendingTotals(rows), [rows]);
  const reportTime = useMemo(
    () => new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    [reportShown, rows],
  );

  const handleShowReport = () => {
    setApplied({ ...draft });
    setReportShown(true);
    toast.success('Report generated');
  };

  const handleClear = () => {
    setDraft(emptyFilters);
    setApplied(emptyFilters);
    setReportShown(false);
  };

  const handleExcel = () => {
    if (!rows.length) { toast.error('Generate report first'); return; }
    exportToExcel(
      rows.map((r, i) => ({
        'Sr No': i + 1,
        'Party Name': r.partyName,
        'Outward No.': r.outwardNo,
        'Outward Date': r.outwardDate,
        Grade: r.grade,
        'Thickness (mm)': r.thickness,
        'Width (mm)': r.width,
        'Length (mm)': r.length,
        Nos: r.nos,
        'Outward KG': r.outwardKg,
        'Received KG': r.receivedKg,
        'Pending KG': r.pendingKg,
      })),
      'Job Work Pending',
      'Job_Work_Pending_Report.xlsx',
    );
    toast.success('Excel downloaded');
  };

  const handlePdf = () => {
    if (!rows.length) { toast.error('Generate report first'); return; }
    window.print();
    toast.success('Use Print dialog → Save as PDF');
  };

  return (
    <div className="jw-pending-page fade-in">
      <div className="jw-pending-topbar">
        <div className="jw-pending-topbar-title">
          <ClipboardList className="w-5 h-5" />
          Job Work Pending Report
        </div>
        <div className="jw-pending-topbar-actions">
          <button type="button" onClick={handleExcel} className="jw-pending-btn jw-pending-btn-green">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button type="button" onClick={handlePdf} className="jw-pending-btn jw-pending-btn-red">
            <FileDown className="w-4 h-4" /> PDF
          </button>
          <button type="button" onClick={() => window.print()} className="jw-pending-btn jw-pending-btn-white">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button type="button" onClick={() => setShowFilters(s => !s)} className="jw-pending-btn jw-pending-btn-blue">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="jw-pending-filters">
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
              <label className="jw-label">Party</label>
              <select value={draft.party} onChange={e => setDraft(p => ({ ...p, party: e.target.value }))} className="jw-input">
                <option value="All">All Parties</option>
                {partyOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="jw-label">Grade</label>
              <select value={draft.grade} onChange={e => setDraft(p => ({ ...p, grade: e.target.value }))} className="jw-input">
                <option value="All">All Grades</option>
                {MATERIAL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="jw-label">Show Pending</label>
              <select
                value={draft.showPending}
                onChange={e => setDraft(p => ({ ...p, showPending: e.target.value as 'pending' | 'all' }))}
                className="jw-input"
              >
                <option value="pending">All (Pending &gt; 0)</option>
                <option value="all">All Records</option>
              </select>
            </div>
          </div>
          <div className="flex justify-center gap-3 mt-4">
            <button type="button" onClick={handleShowReport} className="jw-pending-show-btn">
              <Search className="w-4 h-4" /> Show Report
            </button>
            <button type="button" onClick={handleClear} className="jw-pending-clear-btn">
              <RotateCcw className="w-4 h-4" /> Clear
            </button>
          </div>
        </div>
      )}

      <div className="jw-pending-report print:block" id="jw-pending-print">
        <div className="jw-pending-report-head">
          <div className="flex-1" />
          <div className="text-center flex-[2]">
            <h2 className="jw-pending-report-title">Job Work Pending Report</h2>
            <p className="jw-pending-report-sub">(Material Pending at Party)</p>
          </div>
          <div className="jw-pending-report-date flex-1 text-right">Date : {reportTime}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="jw-pending-table w-full">
            <thead>
              <tr>
                <th>Sr No</th>
                <th className="text-left">Party Name</th>
                <th>Outward No.</th>
                <th>Outward Date</th>
                <th>Grade</th>
                <th>Thickness (mm)</th>
                <th>Width (mm)</th>
                <th>Length (mm)</th>
                <th>Nos</th>
                <th>Outward KG</th>
                <th>Received KG</th>
                <th className="jw-pending-th-red">Pending KG</th>
              </tr>
            </thead>
            <tbody>
              {!reportShown ? (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-slate-400 italic">
                    Set filters and click Show Report
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-slate-400 italic">
                    No pending material found for selected filters
                  </td>
                </tr>
              ) : rows.map((r, i) => (
                <PendingRow key={r.id} row={r} index={i} />
              ))}
            </tbody>
            {reportShown && rows.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={9} className="text-right font-extrabold uppercase">Total</td>
                  <td className="text-right font-bold">{fmtKgReport(totals.outwardKg)}</td>
                  <td className="text-right font-bold">{fmtKgReport(totals.receivedKg)}</td>
                  <td className="text-right font-black jw-pending-red">{fmtKgReport(totals.pendingKg)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {reportShown && rows.length > 0 && (
          <div className="jw-pending-footer">
            <p className="jw-pending-note">Note : Pending KG = Outward KG − Received KG</p>
            <p className="jw-pending-grand">
              Grand Total Pending KG : <span>{fmtKgReport(totals.pendingKg)}</span>
            </p>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #jw-pending-print, #jw-pending-print * { visibility: visible !important; }
          #jw-pending-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .jw-pending-topbar, .jw-pending-filters { display: none !important; }
        }
      `}</style>
    </div>
  );
};

const PendingRow: React.FC<{ row: JobWorkPendingRow; index: number }> = ({ row, index }) => (
  <tr>
    <td>{index + 1}</td>
    <td className="text-left font-semibold">{row.partyName}</td>
    <td className="font-mono text-xs">{row.outwardNo}</td>
    <td>{row.outwardDate}</td>
    <td>{row.grade}</td>
    <td>{row.thickness}</td>
    <td>{row.width}</td>
    <td>{row.length}</td>
    <td>{row.nos}</td>
    <td className="text-right">{fmtKgReport(row.outwardKg)}</td>
    <td className="text-right">{fmtKgReport(row.receivedKg)}</td>
    <td className="text-right font-bold jw-pending-red">{fmtKgReport(row.pendingKg)}</td>
  </tr>
);
