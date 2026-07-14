import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, RotateCcw, FileSpreadsheet, Printer, ClipboardList, Clock, PackageCheck, Percent,
} from 'lucide-react';
import { useAppContext, type CNCQuotationRecord } from '../store/AppContext';
import {
  getCNCInquiryNo, getCNCQuotationStatus, getCNCDaysPending, getCNCOrderQty, fmtCNCDate, cncInr, toCNCISODate,
} from '../utils/cncQuotationHelpers';
import { ErpPageHeader, ErpScreenActions, ErpStatCard, ErpTableCaption } from '../components/ErpPageShell';
import toast from 'react-hot-toast';

export const PendingCNCQuotation: React.FC = () => {
  const navigate = useNavigate();
  const { cncQuotations } = useAppContext();

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [party, setParty] = useState('All');
  const [status, setStatus] = useState('All');
  const [applied, setApplied] = useState({ fromDate: '', toDate: '', party: 'All', status: 'All' });

  const partyOptions = useMemo(() =>
    Array.from(new Set(cncQuotations.map(q => q.partyName).filter(Boolean))).sort(),
  [cncQuotations]);

  const allRows = useMemo(() =>
    cncQuotations.map(q => ({
      q,
      inquiryNo: getCNCInquiryNo(q),
      status: getCNCQuotationStatus(q),
      daysPending: getCNCDaysPending(q),
      orderQty: getCNCOrderQty(q),
    })),
  [cncQuotations]);

  const rows = useMemo(() => allRows.filter(r => {
    const iso = toCNCISODate(r.q.date);
    if (applied.fromDate && iso < applied.fromDate) return false;
    if (applied.toDate && iso > applied.toDate) return false;
    if (applied.party !== 'All' && r.q.partyName !== applied.party) return false;
    if (applied.status !== 'All' && r.status !== applied.status) return false;
    return true;
  }), [allRows, applied]);

  const stats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter(r => r.status === 'Pending');
    const received = rows.filter(r => r.status === 'Order Received');
    const conversion = total ? (received.length / total) * 100 : 0;
    const pendingAmt = pending.reduce((s, r) => s + r.q.grandTotal, 0);
    const orderAmt = received.reduce((s, r) => s + r.q.grandTotal, 0);
    return {
      total,
      pendingCount: pending.length,
      receivedCount: received.length,
      conversion,
      pendingAmt,
      orderAmt,
    };
  }, [rows]);

  const handleSearch = () => setApplied({ fromDate, toDate, party, status });
  const handleClear = () => {
    setFromDate(''); setToDate(''); setParty('All'); setStatus('All');
    setApplied({ fromDate: '', toDate: '', party: 'All', status: 'All' });
  };

  const handleExport = () => {
    const header = 'Sr,Inquiry No,Inquiry Date,Party,Amount,Status,PO No,PO Date,Order Qty,Delivery Date,Days Pending';
    const lines = rows.map((r, i) =>
      `${i + 1},${r.inquiryNo},${fmtCNCDate(r.q.date)},${r.q.partyName},${r.q.grandTotal},${r.status},${r.q.poNo || ''},${fmtCNCDate(r.q.poDate || '')},${r.orderQty || ''},${fmtCNCDate(r.q.deliveryDate || '')},${r.daysPending}`,
    );
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pending_cnc_quotation.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Excel file downloaded');
  };

  const openConvert = (id: string) => navigate(`/cnc-quotation-convert?id=${id}`);

  return (
    <div className="max-w-[1680px] mx-auto p-3 sm:p-4 space-y-4 fade-in pb-8">
      <ErpPageHeader
        title="Pending CNC Quotation"
        extra={
          <ErpScreenActions>
            <button type="button" onClick={handleExport} className="erp-btn erp-btn-green"><FileSpreadsheet className="w-4 h-4" /> Export to Excel</button>
            <button type="button" onClick={() => window.print()} className="erp-btn erp-btn-navy"><Printer className="w-4 h-4" /> Print</button>
          </ErpScreenActions>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ErpStatCard icon={ClipboardList} label="Total Inquiry" value={String(stats.total)} ring="bg-brand-blue" />
        <ErpStatCard icon={Clock} label="Pending Quotation" value={String(stats.pendingCount)} ring="bg-orange-500" />
        <ErpStatCard icon={PackageCheck} label="Order Received" value={String(stats.receivedCount)} ring="bg-green-600" />
        <ErpStatCard icon={Percent} label="Conversion %" value={`${stats.conversion.toFixed(2)}%`} ring="bg-violet-600" />
      </div>

      <div className="erp-card p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div><label className="tc-mgmt-label">From Date</label><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="tc-mgmt-input" /></div>
          <div><label className="tc-mgmt-label">To Date</label><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="tc-mgmt-input" /></div>
          <div><label className="tc-mgmt-label">Party Name</label><select value={party} onChange={e => setParty(e.target.value)} className="tc-mgmt-input"><option value="All">All</option>{partyOptions.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
          <div><label className="tc-mgmt-label">Status</label><select value={status} onChange={e => setStatus(e.target.value)} className="tc-mgmt-input"><option value="All">All</option><option value="Pending">Pending</option><option value="Order Received">Order Received</option></select></div>
          <div className="flex gap-2">
            <button type="button" onClick={handleSearch} className="erp-btn erp-btn-navy flex-1 justify-center"><Search className="w-4 h-4" /> Search</button>
            <button type="button" onClick={handleClear} className="erp-btn erp-btn-ghost"><RotateCcw className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="erp-card overflow-hidden">
        <ErpTableCaption title="Pending CNC Quotation" meta={<span className="text-xs font-bold text-brand-blue">{rows.length} records</span>} />
        <div className="overflow-x-auto">
          <table className="w-full erp-report-table">
            <thead>
              <tr>
                <th>Sr.</th><th>Inquiry No</th><th>Inquiry Date</th><th>Party Name</th>
                <th className="text-right">Amount (₹)</th><th>Status</th><th>PO No</th><th>PO Date</th>
                <th className="text-right">Order Qty / Nos</th><th>Delivery Date</th><th className="text-right">Days Pending</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-10 text-slate-400 italic">No CNC quotations found</td></tr>
              ) : rows.map((r, i) => (
                <tr
                  key={r.q.id}
                  className={r.status === 'Pending' ? 'cursor-pointer hover:bg-blue-50/50' : ''}
                  onClick={() => r.status === 'Pending' && openConvert(r.q.id)}
                  title={r.status === 'Pending' ? 'Click to convert to order' : undefined}
                >
                  <td>{i + 1}</td>
                  <td className="font-semibold text-brand-blue">{r.inquiryNo}</td>
                  <td>{fmtCNCDate(r.q.date)}</td>
                  <td>{r.q.partyName}</td>
                  <td className="text-right font-semibold">{cncInr(r.q.grandTotal)}</td>
                  <td>
                    <span className={r.status === 'Order Received' ? 'erp-billed-badge' : 'erp-pending-badge'}>
                      {r.status}
                    </span>
                  </td>
                  <td>{r.q.poNo || '—'}</td>
                  <td>{r.q.poDate ? fmtCNCDate(r.q.poDate) : '—'}</td>
                  <td className="text-right">{r.status === 'Order Received' ? r.orderQty : '—'}</td>
                  <td>{r.q.deliveryDate ? fmtCNCDate(r.q.deliveryDate) : '—'}</td>
                  <td className="text-right font-bold text-orange-600">{r.status === 'Pending' ? r.daysPending : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <div className="erp-summary-tile"><div className="erp-summary-tile-label">Total Inquiry</div><div className="erp-summary-tile-value tone-blue">{stats.total}</div></div>
        <div className="erp-summary-tile"><div className="erp-summary-tile-label">Pending Quotation</div><div className="erp-summary-tile-value tone-orange">{stats.pendingCount}</div></div>
        <div className="erp-summary-tile"><div className="erp-summary-tile-label">Order Received</div><div className="erp-summary-tile-value tone-green">{stats.receivedCount}</div></div>
        <div className="erp-summary-tile"><div className="erp-summary-tile-label">Conversion %</div><div className="erp-summary-tile-value">{stats.conversion.toFixed(2)}%</div></div>
        <div className="erp-summary-tile"><div className="erp-summary-tile-label">Pending Amount (₹)</div><div className="erp-summary-tile-value tone-orange">{cncInr(stats.pendingAmt)}</div></div>
        <div className="erp-summary-tile"><div className="erp-summary-tile-label">Order Amount (₹)</div><div className="erp-summary-tile-value tone-green">{cncInr(stats.orderAmt)}</div></div>
      </div>
    </div>
  );
};
