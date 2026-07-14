import React, { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { TransportReportHead, TransportReportShell, TransportSearchButtons } from '../components/TransportReportShell';
import { exportToExcel } from '../utils/excel';
import {
  billDetailLines, enrichReceipts, filterTransportBills, fmtDisplayDate, fmtKg,
} from '../utils/transportReports';

export const TransportBillDetailReport: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { transportBills, purchaseReceipts, purchaseOrders } = useAppContext();

  const billOptions = useMemo(
    () => [...transportBills].sort((a, b) => (b.billDate > a.billDate ? 1 : -1)),
    [transportBills],
  );

  const initialBillId = params.get('billId') || billOptions[0]?.id || '';

  const [billId, setBillId] = useState(initialBillId);
  const [billDate, setBillDate] = useState('');
  const [transportName, setTransportName] = useState('All');
  const [vehicleNo, setVehicleNo] = useState('All');
  const [applied, setApplied] = useState({ billId: initialBillId, billDate: '', transportName: 'All', vehicleNo: 'All' });
  const [shown, setShown] = useState(Boolean(initialBillId));

  const enriched = useMemo(
    () => enrichReceipts(purchaseReceipts, purchaseOrders),
    [purchaseReceipts, purchaseOrders],
  );

  const transportOptions = useMemo(
    () => ['All', ...Array.from(new Set(transportBills.map(b => b.transportName).filter(Boolean))).sort()],
    [transportBills],
  );
  const vehicleOptions = useMemo(
    () => ['All', ...Array.from(new Set(transportBills.map(b => b.vehicleNo).filter(Boolean))).sort()],
    [transportBills],
  );

  const bill = useMemo(() => {
    if (!shown) return null;
    let list = [...transportBills];
    if (applied.billId) list = list.filter(b => b.id === applied.billId);
    if (applied.billDate) list = list.filter(b => b.billDate.slice(0, 10) === applied.billDate);
    if (applied.transportName !== 'All') list = list.filter(b => b.transportName === applied.transportName);
    if (applied.vehicleNo !== 'All') list = list.filter(b => b.vehicleNo === applied.vehicleNo);
    return list[0] ?? null;
  }, [transportBills, applied, shown]);

  const lines = useMemo(() => (bill ? billDetailLines(bill, enriched) : []), [bill, enriched]);
  const totalWeight = lines.reduce((s, l) => s + l.netWeightKg, 0);

  const handleSearch = () => {
    setApplied({ billId, billDate, transportName, vehicleNo });
    setShown(true);
    toast.success('Report loaded');
  };

  const handleClear = () => {
    setBillId('');
    setBillDate('');
    setTransportName('All');
    setVehicleNo('All');
    setApplied({ billId: '', billDate: '', transportName: 'All', vehicleNo: 'All' });
    setShown(false);
  };

  const handleExcel = () => {
    if (!bill) { toast.error('Load a bill first'); return; }
    exportToExcel(
      lines.map(l => ({
        'Sr No': l.sr,
        'GRN No': l.grnNo,
        'GRN Date': l.grnDate,
        'Supplier Name': l.supplierName,
        'From Location': l.fromLocation,
        'Material / Grade': l.materialGrade,
        'Net Weight (Kg)': l.netWeightKg,
      })),
      `Transport Bill ${bill.billNo}`,
      `Transport_Bill_Detail_${bill.billNo.replace(/\//g, '_')}.xlsx`,
    );
    toast.success('Excel downloaded');
  };

  const filters = (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="jw-label">Bill No.</label>
          <select value={billId} onChange={e => setBillId(e.target.value)} className="jw-input">
            <option value="">Select</option>
            {billOptions.map(b => <option key={b.id} value={b.id}>{b.billNo}</option>)}
          </select>
        </div>
        <div>
          <label className="jw-label">Bill Date</label>
          <input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} className="jw-input" />
        </div>
        <div>
          <label className="jw-label">Transport Name</label>
          <select value={transportName} onChange={e => setTransportName(e.target.value)} className="jw-input">
            {transportOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="jw-label">Vehicle No.</label>
          <select value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} className="jw-input">
            {vehicleOptions.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>
      <TransportSearchButtons onSearch={handleSearch} onClear={handleClear} />
    </>
  );

  return (
    <TransportReportShell title="Transport Bill Detail Report" filters={filters} onExcel={handleExcel}>
      <TransportReportHead title="TRANSPORT BILL DETAIL REPORT" />

      {!shown || !bill ? (
        <p className="text-center py-10 text-slate-400 italic">Select bill and click Search</p>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 p-4 border border-slate-200 rounded-xl bg-white">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <p><span className="font-bold text-slate-600">Bill No. :</span> <span className="font-extrabold text-brand-blue">{bill.billNo}</span></p>
              <p><span className="font-bold text-slate-600">Bill Date :</span> {fmtDisplayDate(bill.billDate)}</p>
              <p><span className="font-bold text-slate-600">Bill Against :</span> {bill.billAgainst || '—'}</p>
              <p><span className="font-bold text-slate-600">Transport Name :</span> <span className="font-extrabold">{bill.transportName}</span></p>
              <p><span className="font-bold text-slate-600">Vehicle No. :</span> <span className="font-extrabold">{bill.vehicleNo || '—'}</span></p>
              <p className="sm:col-span-2"><span className="font-bold text-slate-600">Remark :</span> {bill.remark || '—'}</p>
            </div>
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50/40 p-4 flex flex-col justify-center gap-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600">Total GRN</span>
                <span className="text-2xl font-extrabold text-brand-blue">{bill.receiptIds.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600">Total Weight (Kg)</span>
                <span className="text-2xl font-extrabold text-brand-blue">{fmtKg(bill.totalWeightKg)}</span>
              </div>
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
                  <th>Material / Grade</th>
                  <th>Net Weight (Kg)</th>
                </tr>
              </thead>
              <tbody>
                {lines.map(l => (
                  <tr key={l.sr}>
                    <td>{l.sr}</td>
                    <td className="font-bold text-brand-blue">{l.grnNo}</td>
                    <td>{l.grnDate}</td>
                    <td className="text-left">{l.supplierName}</td>
                    <td>{l.fromLocation}</td>
                    <td>{l.materialGrade}</td>
                    <td className="text-right font-semibold">{fmtKg(l.netWeightKg)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} className="text-right font-extrabold">Total Weight (Kg) :</td>
                  <td className="text-right font-extrabold text-brand-blue">{fmtKg(totalWeight)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 no-print">
            <p className="text-sm font-semibold text-slate-600">Total Records : {lines.length}</p>
            <button type="button" onClick={() => navigate('/transport-bill-register')} className="jw-pending-show-btn">
              <ArrowLeft className="w-4 h-4" /> Back to List
            </button>
          </div>
        </>
      )}
    </TransportReportShell>
  );
};
