import React, { useMemo, useState } from 'react';
import { Truck, Search, RotateCcw, FileSpreadsheet, Printer, FileDown, Package, Scale, PieChart } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { fmtDate } from '../utils/erpListHelpers';
import toast from 'react-hot-toast';
import {
  ErpEntryPage, ErpMockupTitleBar, ErpReportTitleBlock, ErpIconStatCards,
  ErpListPagination, paginateRows,
} from '../components/ErpPageShell';

export const DespatchReport: React.FC = () => {
  const { dispatches, orders } = useAppContext();
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(today);
  const [party, setParty] = useState('All');
  const [vehicle, setVehicle] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [applied, setApplied] = useState({ fromDate: '', toDate: today, party: 'All', vehicle: '', keyword: '' });

  const parties = useMemo(() => ['All', ...Array.from(new Set(dispatches.map(d => d.partyName))).sort()], [dispatches]);

  const rows = useMemo(() => dispatches
    .filter(d => {
      if (applied.fromDate && d.dispatchDate < applied.fromDate) return false;
      if (applied.toDate && d.dispatchDate > applied.toDate) return false;
      if (applied.party !== 'All' && d.partyName !== applied.party) return false;
      if (applied.vehicle && !d.vehicleNo.toLowerCase().includes(applied.vehicle.toLowerCase())) return false;
      if (applied.keyword) {
        const hay = `${d.partyName} ${d.deliveryNote} ${d.vehicleNo} ${d.orderNo}`.toLowerCase();
        if (!hay.includes(applied.keyword.toLowerCase())) return false;
      }
      return true;
    })
    .sort((a, b) => (b.dispatchDate || '').localeCompare(a.dispatchDate || ''))
    .map((d, i) => {
      const order = orders.find(o => o.id === d.orderId);
      const item = order?.items[0];
      return {
        id: d.id,
        sr: i + 1,
        date: fmtDate(d.dispatchDate),
        dcNo: d.deliveryNote || '—',
        party: d.partyName,
        grade: item?.materialGrade || '—',
        thk: item?.thickness || '—',
        length: item?.length || item?.plateSize || '—',
        nos: d.dispatchQty,
        kg: order?.items.reduce((s, it) => s + (it.totalWeight || 0), 0) || 0,
        vehicle: d.vehicleNo,
        type: d.pendingQty > 0 ? 'Part Despatch' : 'Full Despatch',
        remark: d.remark || '—',
      };
    }), [dispatches, orders, applied]);

  const paged = useMemo(() => paginateRows(rows, page, pageSize), [rows, page, pageSize]);

  const totals = useMemo(() => ({
    dc: rows.length,
    nos: rows.reduce((s, r) => s + r.nos, 0),
    kg: rows.reduce((s, r) => s + r.kg, 0),
    full: rows.filter(r => r.type === 'Full Despatch').length,
    part: rows.filter(r => r.type === 'Part Despatch').length,
  }), [rows]);

  const ts = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <ErpEntryPage>
      <ErpMockupTitleBar
        title="Despatch Report"
        icon={<Truck className="w-4 h-4" />}
        actions={
          <>
            <button type="button" onClick={() => toast.success('Excel export')} className="erp-entry-btn erp-entry-btn-green text-[10px] py-1"><FileSpreadsheet className="w-3.5 h-3.5" /> Excel</button>
            <button type="button" onClick={() => toast('PDF...')} className="erp-entry-btn erp-entry-btn-red text-[10px] py-1"><FileDown className="w-3.5 h-3.5" /> PDF</button>
            <button type="button" onClick={() => window.print()} className="erp-entry-btn erp-entry-btn-ghost text-[10px] py-1"><Printer className="w-3.5 h-3.5" /> Print</button>
          </>
        }
      />

      <div className="erp-list-filter-bar">
        <div className="erp-list-filter-grid mb-2">
          <div><label className="tc-mgmt-label">From Date</label><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="tc-mgmt-input" /></div>
          <div><label className="tc-mgmt-label">To Date</label><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="tc-mgmt-input" /></div>
          <div><label className="tc-mgmt-label">Party</label><select value={party} onChange={e => setParty(e.target.value)} className="tc-mgmt-input">{parties.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
          <div><label className="tc-mgmt-label">Vehicle No.</label><input value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="All Vehicle" className="tc-mgmt-input" /></div>
          <div className="col-span-2"><label className="tc-mgmt-label">Search</label><input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Party / DC No / Vehicle No" className="tc-mgmt-input" /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setApplied({ fromDate, toDate, party, vehicle, keyword }); setPage(1); }} className="erp-entry-btn erp-entry-btn-blue"><Search className="w-4 h-4" /> Show Report</button>
          <button type="button" onClick={() => { setFromDate(''); setToDate(today); setParty('All'); setVehicle(''); setKeyword(''); setApplied({ fromDate: '', toDate: today, party: 'All', vehicle: '', keyword: '' }); setPage(1); }} className="erp-entry-btn erp-entry-btn-ghost"><RotateCcw className="w-4 h-4" /> Clear</button>
        </div>
      </div>

      <ErpReportTitleBlock title="Despatch Report" from={applied.fromDate ? fmtDate(applied.fromDate) : '—'} to={applied.toDate ? fmtDate(applied.toDate) : '—'} timestamp={ts} />

      <div className="tc-mgmt-panel">
        <div className="overflow-x-auto p-2">
          <table className="erp-report-table w-full min-w-[1000px]">
            <thead>
              <tr>
                <th>Sr No</th><th>Despatch Date</th><th>Delivery Challan No.</th><th>Party Name</th><th>Grade</th>
                <th>Thickness (mm)</th><th>Length (mm)</th><th>Nos</th><th>KG</th><th>Vehicle No.</th><th>Despatch Type</th><th>Remark</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={12} className="text-center py-8 text-slate-400 italic">No dispatch records for selected filters</td></tr>
              ) : paged.map((r, i) => (
                <tr key={r.id}>
                  <td className="text-center">{(page - 1) * pageSize + i + 1}</td>
                  <td>{r.date}</td>
                  <td className="font-bold text-brand-blue">{r.dcNo}</td>
                  <td>{r.party}</td>
                  <td>{r.grade}</td>
                  <td className="text-center">{r.thk}</td>
                  <td className="text-center">{r.length}</td>
                  <td className="text-center font-bold">{r.nos}</td>
                  <td className="text-right">{r.kg.toFixed(3)}</td>
                  <td>{r.vehicle}</td>
                  <td>{r.type}</td>
                  <td className="text-slate-500 italic">{r.remark}</td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={7} className="text-right">TOTAL</td>
                  <td className="text-center">{totals.nos}</td>
                  <td className="text-right">{totals.kg.toFixed(3)}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <ErpListPagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1); }} />
      </div>

      <ErpIconStatCards items={[
        { icon: Truck, label: 'Total Despatch', value: `${totals.dc} DC`, ring: 'ring-blue' },
        { icon: Package, label: 'Total Nos', value: `${totals.nos} Nos`, ring: 'ring-green' },
        { icon: Scale, label: 'Total KG', value: `${totals.kg.toLocaleString('en-IN', { minimumFractionDigits: 3 })} KG`, ring: 'ring-purple' },
        { icon: Truck, label: 'Full Despatch', value: `${totals.full} DC`, ring: 'ring-orange' },
        { icon: PieChart, label: 'Part Despatch', value: `${totals.part} DC`, ring: 'ring-red' },
      ]} />
    </ErpEntryPage>
  );
};
