import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Printer, X, RefreshCw, Save, Trash2 } from 'lucide-react';
import { useAppContext, EMPLOYEES, type PurchaseReceipt, type PurchaseOrder } from '../store/AppContext';
import toast from 'react-hot-toast';
import { upper } from '../utils/textCase';
import { ErpPageHeader, ErpNumberedSection, ErpSummaryTiles } from '../components/ErpPageShell';
import { NumericInput, parseNum } from '../components/NumericInput';
import { erpHotkeyProps } from '../utils/erpHotkeys';
import { nextGRNNumberFromExisting } from '../utils/grnNumber';

const kg = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const rs = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const itemAmt = (weightKg: number, rate: string | number | null | undefined) => weightKg * parseNum(rate);
const poLineItems = (po?: PurchaseOrder | null) => po?.items ?? [];

export const MaterialReceipt: React.FC = () => {
  const { purchaseOrders, setPurchaseOrders, purchaseReceipts, setPurchaseReceipts, role, persistErpNow } = useAppContext();

  const [supplierName, setSupplierName] = useState('');
  const [selectedPOId, setSelectedPOId] = useState('');
  const [grnNumber, setGrnNumber] = useState('');
  const [itemQuantities, setItemQuantities] = useState<Record<string, string>>({});
  const [remark, setRemark] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [transporterName, setTransporterName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [tcAvailable] = useState<'Yes' | 'No'>('No');

  // Inspection Fields
  const [conditionOfGoods, setConditionOfGoods] = useState<'Accepted' | 'Rejected' | 'Partial'>('Accepted');
  const [inspectedBy, setInspectedBy] = useState('');
  const [inspectionRemark, setInspectionRemark] = useState('');

  const activePOs = useMemo(() => (purchaseOrders ?? []).filter(po => po.status !== 'Complete'), [purchaseOrders]);

  const supplierOptions = useMemo(() =>
    Array.from(new Set(activePOs.map(po => po.supplierName))).sort(),
  [activePOs]);

  const supplierPOs = useMemo(() =>
    supplierName ? activePOs.filter(po => po.supplierName === supplierName) : [],
  [activePOs, supplierName]);

  const selectedPO = useMemo(() =>
    (purchaseOrders ?? []).find(po => po.id === selectedPOId),
  [selectedPOId, purchaseOrders]);

  const getItemReceivedBefore = useCallback((itemId: string, poId = selectedPOId) =>
    (purchaseReceipts ?? [])
      .filter(pr => pr.poId === poId)
      .reduce((sum, pr) => {
        if (pr.items) {
          const matchingItem = pr.items.find(i => i.itemId === itemId);
          return sum + (matchingItem ? matchingItem.receivedQty : 0);
        }
        return sum;
      }, 0),
  [selectedPOId, purchaseReceipts]);

  const pendingOrderRows = useMemo(() => {
    const rows: { po: PurchaseOrder; item: PurchaseOrder['items'][0]; pendingNos: number; pendingKg: number }[] = [];
    supplierPOs.forEach(po => {
      poLineItems(po).forEach(item => {
        const prev = getItemReceivedBefore(item.id, po.id);
        const pendingNos = Math.max(0, (item.nos || 0) - prev);
        if (pendingNos <= 0) return;
        const perPiece = item.nos ? item.kg / item.nos : 0;
        rows.push({ po, item, pendingNos, pendingKg: perPiece * pendingNos });
      });
    });
    return rows;
  }, [supplierPOs, getItemReceivedBefore]);

  useEffect(() => {
    if (supplierPOs.length === 1 && !selectedPOId) {
      setSelectedPOId(supplierPOs[0].id);
    }
  }, [supplierPOs, selectedPOId]);

  useEffect(() => {
    if (selectedPO) {
      setTransporterName(selectedPO.transportName || transporterName);
      setVehicleNo(selectedPO.transportNumber || vehicleNo);
    }
  }, [selectedPOId]);

  useEffect(() => {
    if (selectedPO) {
      const initial: Record<string, string> = {};
      poLineItems(selectedPO).forEach(item => {
        initial[item.id] = '';
      });
      setItemQuantities(initial);
    } else {
      setItemQuantities({});
    }
  }, [selectedPOId]);

  const totals = useMemo(() => {
    let pendingNos = 0;
    let receivedNos = 0;
    let pendingKg = 0;
    let receivedKg = 0;
    let pendingAmt = 0;
    let receivedAmt = 0;
    if (!selectedPO) {
      return {
        pendingNos, receivedNos, balanceNos: 0,
        pendingKg, receivedKg, balanceKg: 0,
        pendingAmt, receivedAmt, balanceAmt: 0,
      };
    }
    poLineItems(selectedPO).forEach(item => {
      const prev = getItemReceivedBefore(item.id);
      const pending = Math.max(0, (item.nos || 0) - prev);
      const perPiece = item.nos ? item.kg / item.nos : 0;
      const cur = parseNum(itemQuantities[item.id] ?? '');
      const pKg = perPiece * pending;
      const rKg = perPiece * cur;
      pendingNos += pending;
      receivedNos += cur;
      pendingKg += pKg;
      receivedKg += rKg;
      pendingAmt += itemAmt(pKg, item.rate);
      receivedAmt += itemAmt(rKg, item.rate);
    });
    return {
      pendingNos,
      receivedNos,
      balanceNos: pendingNos - receivedNos,
      pendingKg,
      receivedKg,
      balanceKg: pendingKg - receivedKg,
      pendingAmt,
      receivedAmt,
      balanceAmt: pendingAmt - receivedAmt,
    };
  }, [selectedPO, itemQuantities, getItemReceivedBefore]);

  const handleNewGrn = () => {
    setSupplierName('');
    setSelectedPOId('');
    setRemark('');
    setInvoiceNo('');
    setTransporterName('');
    setVehicleNo('');
    setDate(new Date().toISOString().split('T')[0]);
    setGrnNumber(nextGRNNumberFromExisting(purchaseReceipts));
    setItemQuantities({});
    setConditionOfGoods('Accepted');
    setInspectedBy('');
    setInspectionRemark('');
  };

  useEffect(() => {
    if (!grnNumber) setGrnNumber(nextGRNNumberFromExisting(purchaseReceipts));
  }, []);

  const handleAutoMatch = () => {
    if (!selectedPO) return;
    const next: Record<string, string> = {};
    poLineItems(selectedPO).forEach(item => {
      const prev = getItemReceivedBefore(item.id);
      const pending = Math.max(0, (item.nos || 0) - prev);
      next[item.id] = pending > 0 ? String(pending) : '';
    });
    setItemQuantities(next);
    toast.success('Auto matched pending quantities');
  };

  const handleSave = async (andPrint = false) => {
    if (!selectedPOId) { toast.error('Select supplier and PO'); return; }
    const totalCurrentReceived = Object.values(itemQuantities).reduce((sum, qty) => sum + parseNum(qty), 0);
    if (totalCurrentReceived <= 0) {
      toast.error('Total received quantity must be greater than 0');
      return;
    }

    const newReceipt: PurchaseReceipt = {
      id: Date.now().toString(),
      poId: selectedPOId,
      receivedQty: totalCurrentReceived,
      date,
      remark: remark.trim(),
      grnNumber: grnNumber.trim() || nextGRNNumberFromExisting(purchaseReceipts),
      invoiceNo: invoiceNo.trim(),
      transporterName: transporterName.trim(),
      vehicleNo: vehicleNo.trim(),
      tcAvailable,
      conditionOfGoods,
      inspectedBy: inspectedBy.trim(),
      inspectionRemark: inspectionRemark.trim(),
      invoiceStatus: 'Pending',
      items: Object.entries(itemQuantities)
        .filter(([, qty]) => parseNum(qty) > 0)
        .map(([itemId, qty]) => ({ itemId, receivedQty: parseNum(qty) })),
    };

    const totalOrdered = poLineItems(selectedPO).reduce((sum, item) => sum + (item.nos || 0), 0);
    const totalReceivedBefore = (purchaseReceipts ?? [])
      .filter(pr => pr.poId === selectedPOId)
      .reduce((sum, pr) => sum + pr.receivedQty, 0);
    const totalNow = totalReceivedBefore + totalCurrentReceived;
    const newStatus: PurchaseOrder['status'] = totalNow >= totalOrdered ? 'Complete' : 'Partial';

    const nextReceipts = [...(purchaseReceipts ?? []), newReceipt];
    const nextPOs = (purchaseOrders ?? []).map(po =>
      po.id === selectedPOId ? { ...po, status: newStatus } : po,
    );

    setPurchaseReceipts(nextReceipts);
    setPurchaseOrders(nextPOs);

    try {
      await persistErpNow({ purchaseReceipts: nextReceipts, purchaseOrders: nextPOs });
      toast.success('GRN saved successfully!', { icon: '✅' });
      if (andPrint) window.print();
      handleNewGrn();
    } catch {
      toast.error('Saved locally but server sync failed — retry Save');
    }
  };

  const canEntry = role === 'Admin' || role === 'Office Entry';

  return (
    <div className="max-w-[1680px] mx-auto p-3 sm:p-4 space-y-4 fade-in pb-8">
      <ErpPageHeader
        title="GRN Entry (Against Purchase Order)"
        extra={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleNewGrn} className="erp-btn erp-btn-ghost"><Plus className="w-4 h-4" /> New GRN</button>
            <button type="button" onClick={() => window.print()} className="erp-btn erp-btn-ghost"><Printer className="w-4 h-4" /> Print</button>
          </div>
        }
      />

      {!canEntry && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-800 font-medium">
          Only Admin or Office Entry role can record GRNs.
        </div>
      )}

      <div className="tc-mgmt-panel">
        <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="tc-mgmt-label">Supplier Name *</label>
            <select value={supplierName} onChange={e => { setSupplierName(e.target.value); setSelectedPOId(''); }} className="tc-mgmt-input">
              <option value="">Select Supplier...</option>
              {supplierOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="tc-mgmt-label">GRN No *</label>
            <input value={grnNumber} onChange={e => setGrnNumber(upper(e.target.value))} className="tc-mgmt-input font-mono" />
          </div>
          <div>
            <label className="tc-mgmt-label">GRN Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="tc-mgmt-input" />
          </div>
          <div>
            <label className="tc-mgmt-label">Vehicle No</label>
            <input value={vehicleNo} onChange={e => setVehicleNo(upper(e.target.value))} className="tc-mgmt-input" placeholder="GJ01AB1234" />
          </div>
          <div>
            <label className="tc-mgmt-label">Transport Name</label>
            <input value={transporterName} onChange={e => setTransporterName(upper(e.target.value))} className="tc-mgmt-input" />
          </div>
          <div>
            <label className="tc-mgmt-label">Invoice No.</label>
            <input value={invoiceNo} onChange={e => setInvoiceNo(upper(e.target.value))} className="tc-mgmt-input" placeholder="INV/1245/25-26" />
          </div>
          <div>
            <label className="tc-mgmt-label">Condition of Goods</label>
            <select value={conditionOfGoods} onChange={e => setConditionOfGoods(e.target.value as any)} className="tc-mgmt-input">
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Partial">Partial</option>
            </select>
          </div>
          <div>
            <label className="tc-mgmt-label">Inspected By</label>
            <select value={inspectedBy} onChange={e => setInspectedBy(e.target.value)} className="tc-mgmt-input">
              <option value="">Select Inspector...</option>
              {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="tc-mgmt-label">Inspection Remark</label>
            <textarea value={inspectionRemark} onChange={e => setInspectionRemark(e.target.value)} rows={2} className="tc-mgmt-input resize-y min-h-[38px]" placeholder="Inspection findings..." />
          </div>
          <div className="col-span-2 md:col-span-4">
            <label className="tc-mgmt-label">Remark / Note</label>
            <textarea value={remark} onChange={e => setRemark(e.target.value)} rows={2} className="tc-mgmt-input resize-y min-h-[38px]" placeholder="Enter general note here..." />
          </div>
          {supplierPOs.length > 1 && (
            <div className="col-span-2 md:col-span-4">
              <label className="tc-mgmt-label">Purchase Order *</label>
              <select value={selectedPOId} onChange={e => setSelectedPOId(e.target.value)} className="tc-mgmt-input">
                <option value="">Select PO</option>
                {supplierPOs.map(po => <option key={po.id} value={po.id}>{po.poNumber} — {po.date}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      <ErpNumberedSection number={1} title="PENDING ORDERS">
        <div className="overflow-x-auto">
          <table className="w-full erp-report-table text-xs">
            <thead>
              <tr>
                <th>PO No</th><th>PO Date</th><th>Grade</th><th>Thickness (mm)</th><th>Width (mm)</th><th>Length (mm)</th>
                <th className="text-right">PO Nos</th><th className="text-right">Pending Nos</th><th className="text-right">Pending Kg</th>
                <th className="text-right">PO Rate</th><th className="text-right">Pending Amount</th>
              </tr>
            </thead>
            <tbody>
              {!supplierName ? (
                <tr><td colSpan={11} className="text-center py-8 text-slate-400 italic">Select supplier to view pending orders</td></tr>
              ) : pendingOrderRows.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-8 text-slate-400 italic">No pending orders for this supplier</td></tr>
              ) : pendingOrderRows.map(({ po, item, pendingNos, pendingKg }) => (
                <tr
                  key={`${po.id}-${item.id}`}
                  className={selectedPOId === po.id ? 'bg-blue-50/60 dark:bg-blue-900/30 cursor-pointer' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                  onClick={() => setSelectedPOId(po.id)}
                >
                  <td className="font-semibold text-brand-blue">{po.poNumber}</td>
                  <td>{po.date}</td>
                  <td>{item.grade}</td>
                  <td>{item.thickness}</td><td>{item.width}</td><td>{item.length}</td>
                  <td className="text-right">{item.nos}</td>
                  <td className="text-right font-bold text-brand-blue">{pendingNos}</td>
                  <td className="text-right">{kg(pendingKg)}</td>
                  <td className="text-right font-semibold text-orange-600">{parseNum(item.rate).toFixed(2)}</td>
                  <td className="text-right">{rs(itemAmt(pendingKg, item.rate))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ErpNumberedSection>

      <ErpNumberedSection
        number={2}
        title="RECEIVE QUANTITY"
        actions={
          <button type="button" onClick={handleAutoMatch} disabled={!selectedPO} className="erp-btn erp-btn-ghost py-1 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Auto Match
          </button>
        }
      >
        {selectedPO ? (
          <div className="overflow-x-auto">
            <table className="w-full erp-report-table text-xs">
              <thead>
                <tr>
                  <th>Sr No.</th><th>Grade</th><th>Thickness (mm)</th><th>Width (mm)</th><th>Length (mm)</th>
                  <th className="text-right">Pending Nos</th><th className="text-right">Pending Kg</th>
                  <th className="text-right">Rate</th>
                  <th className="text-right">Received Nos *</th><th className="text-right">Received Kg (Auto)</th>
                  <th className="text-right">Received Amount</th>
                  <th className="text-right">Balance Nos</th><th className="text-right">Balance Kg</th>
                  <th className="text-right">Balance Amount</th>
                  <th className="text-center w-10">Action</th>
                </tr>
              </thead>
              <tbody>
                {poLineItems(selectedPO).filter(item => {
                  const prev = getItemReceivedBefore(item.id);
                  return Math.max(0, (item.nos || 0) - prev) > 0;
                }).map((item, idx) => {
                  const prev = getItemReceivedBefore(item.id);
                  const pendingNos = Math.max(0, (item.nos || 0) - prev);
                  const perPiece = item.nos ? item.kg / item.nos : 0;
                  const received = parseNum(itemQuantities[item.id] ?? '');
                  const pendingKg = perPiece * pendingNos;
                  const receivedKg = perPiece * received;
                  const balanceNos = pendingNos - received;
                  const balanceKg = perPiece * balanceNos;
                  return (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td className="whitespace-nowrap font-medium text-slate-700 dark:text-slate-200">{item.grade}</td>
                      <td className="text-center font-medium">{item.thickness}</td>
                      <td>{item.width}</td><td>{item.length}</td>
                      <td className="text-right">{pendingNos}</td>
                      <td className="text-right">{kg(pendingKg)}</td>
                      <td className="text-right font-semibold text-orange-600">{parseNum(item.rate).toFixed(2)}</td>
                      <td className="text-right">
                        <NumericInput
                          value={itemQuantities[item.id] ?? ''}
                          onChange={v => setItemQuantities(prev => ({ ...prev, [item.id]: v }))}
                          className="tc-mgmt-input w-16 text-center ml-auto py-1"
                          placeholder="0"
                        />
                      </td>
                      <td className="text-right text-green-600 font-semibold">{kg(receivedKg)}</td>
                      <td className="text-right font-semibold text-green-600">{rs(itemAmt(receivedKg, item.rate))}</td>
                      <td className="text-right font-bold text-brand-blue">{balanceNos}</td>
                      <td className="text-right">{kg(balanceKg)}</td>
                      <td className="text-right text-orange-600">{rs(itemAmt(balanceKg, item.rate))}</td>
                      <td className="text-center">
                        <button
                          type="button"
                          title="Clear row"
                          onClick={() => setItemQuantities(prev => ({ ...prev, [item.id]: '' }))}
                          className="p-1 rounded text-red-500 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-8 text-slate-400 italic">Select a PO from pending orders</p>
        )}
      </ErpNumberedSection>

      <div className="tc-mgmt-panel">
        <div className="p-3 space-y-3 overflow-x-auto">
          <ErpSummaryTiles
            columns={9}
            items={[
              { label: 'Total Pending Nos', value: totals.pendingNos, tone: 'blue' },
              { label: 'Total Received Nos', value: totals.receivedNos, tone: 'green' },
              { label: 'Total Balance Nos', value: totals.balanceNos, tone: 'orange' },
              { label: 'Total Pending Kg', value: kg(totals.pendingKg), tone: 'blue' },
              { label: 'Total Received Kg', value: kg(totals.receivedKg), tone: 'green' },
              { label: 'Total Balance Kg', value: kg(totals.balanceKg), tone: 'orange' },
              { label: 'Pending Amount', value: rs(totals.pendingAmt), tone: 'blue' },
              { label: 'Received Amount', value: rs(totals.receivedAmt), tone: 'green' },
              { label: 'Balance Amount', value: rs(totals.balanceAmt), tone: 'orange' },
            ]}
          />
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button type="button" {...erpHotkeyProps('save')} onClick={() => handleSave(false)} disabled={!canEntry || !selectedPO || totals.receivedNos <= 0} className="erp-btn erp-btn-navy uppercase tracking-wide"><Save className="w-4 h-4" /> Save</button>
            <button type="button" onClick={() => handleSave(true)} disabled={!canEntry || !selectedPO || totals.receivedNos <= 0} className="erp-btn erp-btn-green uppercase tracking-wide"><Printer className="w-4 h-4" /> Save & Print</button>
            <button type="button" onClick={handleNewGrn} className="erp-btn erp-btn-ghost uppercase tracking-wide"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};
