import React, { useMemo, useState } from 'react';
import { Search, RotateCcw, X, Eye, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, type PurchaseOrder, type PurchaseReceipt, type TransportBillRecord } from '../store/AppContext';
import { ErpPageHeader, ErpNumberedSection, ErpInfoNote } from '../components/ErpPageShell';
import toast from 'react-hot-toast';
import { upper } from '../utils/textCase';

const kg = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function receiptWeightKg(
  receiptId: string,
  purchaseReceipts: PurchaseReceipt[],
  purchaseOrders: PurchaseOrder[],
) {
  const pr = purchaseReceipts.find(r => r.id === receiptId);
  if (!pr) return 0;
  const po = purchaseOrders.find(p => p.id === pr.poId);
  if (!po) return 0;
  if (pr.items?.length) {
    return pr.items.reduce((sum, ri) => {
      const item = po.items.find(i => i.id === ri.itemId);
      if (!item) return sum;
      const perPiece = item.nos ? item.kg / item.nos : 0;
      return sum + perPiece * ri.receivedQty;
    }, 0);
  }
  return po.totalKg ? (po.totalKg / Math.max(1, po.items.reduce((s, i) => s + (i.nos || 0), 0))) * pr.receivedQty : 0;
}

export const TransportBillEntry: React.FC = () => {
  const navigate = useNavigate();
  const { purchaseOrders, purchaseReceipts, setPurchaseReceipts, transportBills, addTransportBill, transports, persistErpNow } = useAppContext();

  const [transportName, setTransportName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [applied, setApplied] = useState({ transportName: '', vehicleNo: '', fromDate: '', toDate: '' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [billNo, setBillNo] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [billAgainst, setBillAgainst] = useState('Freight');
  const [remark, setRemark] = useState('');

  const transportOptions = useMemo(() => {
    const fromMaster = transports.map(t => t.name);
    const fromReceipts = purchaseReceipts.map(r => r.transporterName).filter(Boolean) as string[];
    return Array.from(new Set([...fromMaster, ...fromReceipts])).sort();
  }, [transports, purchaseReceipts]);

  const vehicleOptions = useMemo(() =>
    Array.from(new Set(purchaseReceipts.map(r => r.vehicleNo).filter(Boolean) as string[])).sort(),
  [purchaseReceipts]);

  const enrichedReceipts = useMemo(() =>
    purchaseReceipts.map(pr => {
      const po = purchaseOrders.find(p => p.id === pr.poId);
      const weight = receiptWeightKg(pr.id, purchaseReceipts, purchaseOrders);
      return {
        ...pr,
        po,
        grnLabel: pr.grnNumber || po?.poNumber || pr.id.slice(-6),
        supplier: po?.supplierName || '-',
        location: po?.location || '-',
        weight,
        billed: Boolean(pr.transportBillId),
      };
    }),
  [purchaseOrders, purchaseReceipts]);

  const pendingRows = useMemo(() => enrichedReceipts.filter(r => {
    if (r.billed) return false;
    if (applied.transportName && (r.transporterName || '').toUpperCase() !== applied.transportName.toUpperCase()) return false;
    if (applied.vehicleNo && (r.vehicleNo || '').toUpperCase() !== applied.vehicleNo.toUpperCase()) return false;
    const iso = r.date?.slice(0, 10) || '';
    if (applied.fromDate && iso < applied.fromDate) return false;
    if (applied.toDate && iso > applied.toDate) return false;
    if (!applied.transportName && !applied.vehicleNo && !applied.fromDate && !applied.toDate) {
      return true;
    }
    return applied.transportName || applied.vehicleNo || applied.fromDate || applied.toDate;
  }), [enrichedReceipts, applied]);

  const filteredHistory = useMemo(() => {
    let bills = [...transportBills];
    if (applied.transportName) bills = bills.filter(b => b.transportName.toUpperCase() === applied.transportName.toUpperCase());
    if (applied.vehicleNo) bills = bills.filter(b => b.vehicleNo.toUpperCase() === applied.vehicleNo.toUpperCase());
    return bills.sort((a, b) => (b.billDate > a.billDate ? 1 : -1));
  }, [transportBills, applied]);

  const selectedWeight = useMemo(() =>
    pendingRows.filter(r => selectedIds.has(r.id)).reduce((s, r) => s + r.weight, 0),
  [pendingRows, selectedIds]);

  const totalPendingWeight = useMemo(() => pendingRows.reduce((s, r) => s + r.weight, 0), [pendingRows]);

  const summaryTransport = applied.transportName || transportName || '—';
  const summaryVehicle = applied.vehicleNo || vehicleNo || '—';

  const summaryStats = useMemo(() => {
    const all = enrichedReceipts.filter(r => {
      if (applied.transportName && (r.transporterName || '').toUpperCase() !== applied.transportName.toUpperCase()) return false;
      if (applied.vehicleNo && (r.vehicleNo || '').toUpperCase() !== applied.vehicleNo.toUpperCase()) return false;
      return true;
    });
    const billed = all.filter(r => r.billed);
    const pending = all.filter(r => !r.billed);
    return {
      totalGrn: all.length,
      totalWeight: all.reduce((s, r) => s + r.weight, 0),
      billedWeight: billed.reduce((s, r) => s + r.weight, 0),
      pendingWeight: pending.reduce((s, r) => s + r.weight, 0),
    };
  }, [enrichedReceipts, applied]);

  const toggleRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSearch = () => {
    setApplied({ transportName, vehicleNo, fromDate, toDate });
    setSelectedIds(new Set());
  };

  const handleClear = () => {
    setTransportName(''); setVehicleNo(''); setFromDate(''); setToDate('');
    setApplied({ transportName: '', vehicleNo: '', fromDate: '', toDate: '' });
    setSelectedIds(new Set());
  };

  const handleSaveBill = async () => {
    if (selectedIds.size === 0) { toast.error('Select at least one GRN'); return; }
    if (!billNo.trim()) { toast.error('Enter Bill No.'); return; }
    const ids = Array.from(selectedIds);
    const first = pendingRows.find(r => selectedIds.has(r.id));
    const bill: TransportBillRecord = {
      id: Date.now().toString(),
      billNo: billNo.trim(),
      billDate,
      transportName: first?.transporterName || applied.transportName || transportName,
      vehicleNo: first?.vehicleNo || applied.vehicleNo || vehicleNo,
      billAgainst,
      remark: remark.trim(),
      receiptIds: ids,
      totalWeightKg: selectedWeight,
    };
    const nextBills = [bill, ...transportBills];
    const nextReceipts = purchaseReceipts.map(r => ids.includes(r.id) ? { ...r, transportBillId: bill.id } : r);
    addTransportBill(bill);
    setPurchaseReceipts(nextReceipts);
    try {
      await persistErpNow({ transportBills: nextBills, purchaseReceipts: nextReceipts });
      toast.success('Transport bill saved & GRNs marked as billed');
      setSelectedIds(new Set());
      setBillNo('');
      setRemark('');
    } catch {
      toast.error('Saved locally but server sync failed — retry Save');
    }
  };

  return (
    <div className="max-w-[1680px] mx-auto p-3 sm:p-4 space-y-4 fade-in pb-8">
      <ErpPageHeader
        title="Transport Bill Entry"
        subtitle="Bill pending GRNs against transport / vehicle"
        extra={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate('/transport-pending-report')} className="erp-btn erp-btn-ghost"><FileText className="w-4 h-4" /> Transport Pending Report</button>
            <button type="button" onClick={() => navigate('/transport-bill-register')} className="erp-btn erp-btn-ghost"><FileText className="w-4 h-4" /> Bill Register</button>
            <button type="button" onClick={() => navigate(-1)} className="erp-btn erp-btn-ghost text-red-600 border-red-200"><X className="w-4 h-4" /> Close</button>
          </div>
        }
      />

      <ErpNumberedSection number={1} title="SEARCH TRANSPORT / VEHICLE">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
          <div className="col-span-2"><label className="tc-mgmt-label">Transport Name</label><select value={transportName} onChange={e => setTransportName(e.target.value)} className="tc-mgmt-input"><option value="">Select</option>{transportOptions.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div className="flex items-center justify-center text-green-600 font-extrabold text-sm py-2">OR</div>
          <div className="col-span-2"><label className="tc-mgmt-label">Vehicle Number</label><select value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} className="tc-mgmt-input"><option value="">Select</option>{vehicleOptions.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
          <div><label className="tc-mgmt-label">From Date</label><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="tc-mgmt-input" /></div>
          <div><label className="tc-mgmt-label">To Date</label><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="tc-mgmt-input" /></div>
          <div className="col-span-2 md:col-span-6 flex justify-end gap-2">
            <button type="button" onClick={handleSearch} className="erp-btn erp-btn-navy"><Search className="w-4 h-4" /> Search</button>
            <button type="button" onClick={handleClear} className="erp-btn erp-btn-ghost"><RotateCcw className="w-4 h-4" /> Clear</button>
          </div>
        </div>
      </ErpNumberedSection>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-8 space-y-4">
          <ErpNumberedSection number={2} title="PENDING GRN LIST" subtitle="Not Billed">
            <div className="overflow-x-auto">
              <table className="w-full erp-report-table">
                <thead>
                  <tr>
                    <th className="w-10" /><th>GRN Date</th><th>GRN No</th><th>Supplier Name</th>
                    <th>From Location</th><th>Vehicle No</th><th>Transport Name</th>
                    <th className="text-right">Net Weight (Kg)</th><th>Bill Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRows.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-8 text-slate-400 italic">No pending GRNs for search criteria</td></tr>
                  ) : pendingRows.map(r => (
                    <tr key={r.id}>
                      <td><input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleRow(r.id)} /></td>
                      <td>{r.date}</td>
                      <td className="font-semibold text-brand-blue">{r.grnLabel}</td>
                      <td>{r.supplier}</td>
                      <td>{r.location}</td>
                      <td>{r.vehicleNo || '-'}</td>
                      <td>{r.transporterName || '-'}</td>
                      <td className="text-right font-semibold">{kg(r.weight)}</td>
                      <td><span className="erp-pending-badge">Pending</span></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-extrabold text-brand-blue bg-blue-50/50">
                    <td colSpan={7} className="px-2.5 py-2">Total Pending Weight</td>
                    <td className="text-right px-2.5 py-2">{kg(totalPendingWeight)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </ErpNumberedSection>

          <ErpNumberedSection number={4} title="BILL HISTORY" subtitle="Already Billed">
            <div className="overflow-x-auto">
              <table className="w-full erp-report-table">
                <thead>
                  <tr>
                    <th>Bill No</th><th>Bill Date</th><th>Transport Name</th><th>Vehicle No</th>
                    <th className="text-center">Total GRN</th><th className="text-right">Total Weight (Kg)</th><th>Remarks</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-slate-400 italic">No bills recorded yet</td></tr>
                  ) : filteredHistory.map(b => (
                    <tr key={b.id}>
                      <td className="font-semibold">{b.billNo}</td>
                      <td>{b.billDate}</td>
                      <td>{b.transportName}</td>
                      <td>{b.vehicleNo || '-'}</td>
                      <td className="text-center">{b.receiptIds.length}</td>
                      <td className="text-right">{kg(b.totalWeightKg)}</td>
                      <td className="max-w-[120px] truncate">{b.remark || '-'}</td>
                      <td>
                        <button type="button" onClick={() => navigate(`/transport-bill-detail?billId=${b.id}`)} className="erp-btn erp-btn-ghost py-1 px-2 text-xs"><Eye className="w-3.5 h-3.5" /> View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ErpNumberedSection>
        </div>

        <div className="xl:col-span-4 space-y-4">
          <ErpNumberedSection number={3} title="ENTER BILL DETAILS">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-2 border border-blue-100">
                  <div className="text-slate-500">Selected GRN(s)</div>
                  <div className="font-extrabold text-brand-blue">{selectedIds.size} GRN Selected</div>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-2 border border-slate-200">
                  <div className="text-slate-500">Total Weight</div>
                  <div className="font-extrabold">{kg(selectedWeight)} Kg</div>
                </div>
              </div>
              <div><label className="tc-mgmt-label">Bill No.</label><input value={billNo} onChange={e => setBillNo(upper(e.target.value))} className="tc-mgmt-input" /></div>
              <div><label className="tc-mgmt-label">Bill Date</label><input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} className="tc-mgmt-input" /></div>
              <div><label className="tc-mgmt-label">Bill Against</label><select value={billAgainst} onChange={e => setBillAgainst(e.target.value)} className="tc-mgmt-input"><option>Freight</option><option>Loading</option><option>Other</option></select></div>
              <div><label className="tc-mgmt-label">Remark (Optional)</label><textarea value={remark} onChange={e => setRemark(e.target.value)} rows={3} className="tc-mgmt-input resize-y" /></div>
              <button type="button" onClick={handleSaveBill} disabled={selectedIds.size === 0} className="erp-btn erp-btn-green w-full justify-center">SAVE BILL & MARK SELECTED GRN AS BILLED</button>
            </div>
          </ErpNumberedSection>

          <ErpNumberedSection number={5} title="TRANSPORT PENDING SUMMARY" headClass="green">
            <div className="space-y-3 text-sm">
              <p className="font-extrabold text-green-700 dark:text-green-400">{summaryTransport} · {summaryVehicle}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-blue-50 p-3 text-center border border-blue-100">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Total GRN</div>
                  <div className="text-2xl font-extrabold text-brand-blue">{summaryStats.totalGrn}</div>
                </div>
                <div className="rounded-lg bg-orange-50 p-3 text-center border border-orange-100">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Total Weight (Kg)</div>
                  <div className="text-xl font-extrabold text-orange-700">{kg(summaryStats.totalWeight)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs font-extrabold">
                <div className="rounded-lg bg-green-50 p-2 border border-green-100 text-green-700">
                  <div className="opacity-70">Billed Weight (Kg)</div>
                  <div className="text-lg">{kg(summaryStats.billedWeight)}</div>
                </div>
                <div className="rounded-lg bg-red-50 p-2 border border-red-100 text-red-600">
                  <div className="opacity-70">Pending Weight (Kg)</div>
                  <div className="text-lg">{kg(summaryStats.pendingWeight)}</div>
                </div>
              </div>
            </div>
          </ErpNumberedSection>
        </div>
      </div>

      <ErpInfoNote>
        Select transport or vehicle, search pending GRNs, tick rows to bill, enter bill details and save. Billed GRNs move to Bill History.
      </ErpInfoNote>
    </div>
  );
};
