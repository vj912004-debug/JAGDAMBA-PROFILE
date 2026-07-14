import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { PackageCheck, Save, Printer, FileDown, MessageSquare, FileText, ReceiptText, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { upper } from '../utils/textCase';
import { NumericInput, parseNum } from '../components/NumericInput';
import { ErpEntryPage, ErpEntryToolbar, ErpNumberedSection, ErpSummaryTiles, ErpInfoNote, ErpMockupTitleBar } from '../components/ErpPageShell';

const rowKey = (orderId: string, itemId: string) => `${orderId}|${itemId}`;
const num3 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

export const DispatchPage: React.FC = () => {
  const { role, dispatches, orders, dispatchItems, parties, persistErpNow } = useAppContext();
  const canEdit = role === 'Admin' || role === 'Dispatch';

  const today = new Date().toISOString().split('T')[0];
  const [dcNo] = useState(`DC/2627/${String(Math.floor(Math.random() * 90000) + 10000)}`);
  const [dispatchDate, setDispatchDate] = useState(today);
  const [partyName, setPartyName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [transportName, setTransportName] = useState('');
  const [freight, setFreight] = useState('');
  const [ewayBillNo, setEwayBillNo] = useState('');
  const [remark, setRemark] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [dispatchQty, setDispatchQty] = useState<Record<string, number>>({});

  // Flatten every ready material line across orders
  const readyRows = useMemo(() => {
    const rows: { key: string; orderId: string; party: string; item: any; perPiece: number; readyNos: number; deliveryAddress: string }[] = [];
    orders.forEach(o => {
      o.items.forEach(item => {
        const readyNos = (item.completedQty || 0) - (item.dispatchedQty || 0);
        if (readyNos > 0) {
          const perPiece = item.quantity ? (item.totalWeight || 0) / item.quantity : 0;
          rows.push({ key: rowKey(o.id, item.id), orderId: o.id, party: o.partyName, item, perPiece, readyNos, deliveryAddress: o.deliveryAddress });
        }
      });
    });
    return rows;
  }, [orders]);

  const partyOptions = useMemo(() => Array.from(new Set(readyRows.map(r => r.party))), [readyRows]);
  const visibleRows = useMemo(() => partyName ? readyRows.filter(r => r.party === partyName) : readyRows, [readyRows, partyName]);
  const selectedRows = useMemo(() => visibleRows.filter(r => selected[r.key]), [visibleRows, selected]);

  const allChecked = visibleRows.length > 0 && visibleRows.every(r => selected[r.key]);
  const toggleAll = () => {
    const next = { ...selected };
    visibleRows.forEach(r => { next[r.key] = !allChecked; });
    setSelected(next);
  };

  const totals = useMemo(() => {
    let nos = 0, weight = 0;
    selectedRows.forEach(r => {
      const q = dispatchQty[r.key] ?? r.readyNos;
      nos += q; weight += r.perPiece * q;
    });
    return { nos, weight };
  }, [selectedRows, dispatchQty]);

  const handleParty = (name: string) => {
    setPartyName(name);
    setSelected({});
    const addr = readyRows.find(r => r.party === name)?.deliveryAddress || '';
    // prefill delivery address from party master if available
    const pm = parties.find(p => p.partyName.trim().toUpperCase() === name.trim().toUpperCase());
    setRemarkDeliveryAddress(pm?.deliveryAddress || pm?.address || addr);
  };
  const [deliveryAddress, setRemarkDeliveryAddress] = useState('');

  const handleSave = async () => {
    if (!canEdit) { toast.error('You do not have permission to dispatch'); return; }
    if (!vehicleNo.trim()) { toast.error('Vehicle Number is required'); return; }
    if (selectedRows.length === 0) { toast.error('Select at least one ready material row'); return; }

    // Group by order and preserve existing dispatch logic
    const byOrder = new Map<string, { itemId: string; qty: number }[]>();
    selectedRows.forEach(r => {
      const qty = dispatchQty[r.key] ?? r.readyNos;
      if (qty <= 0) return;
      const arr = byOrder.get(r.orderId) || [];
      arr.push({ itemId: r.item.id, qty });
      byOrder.set(r.orderId, arr);
    });

    const fullRemark = [remark, driverName && `Driver: ${driverName}`, mobileNo && `Mob: ${mobileNo}`, transportName && `Transport: ${transportName}`]
      .filter(Boolean).join(' | ');

    for (const [orderId, payload] of byOrder.entries()) {
      await dispatchItems(orderId, payload, vehicleNo, fullRemark);
    }
    try {
      await persistErpNow();
      toast.success('Dispatch saved successfully!');
      setSelected({}); setDispatchQty({}); setVehicleNo(''); setDriverName(''); setMobileNo('');
      setFreight(''); setEwayBillNo(''); setRemark('');
    } catch {
      toast.error('Dispatch saved locally but server sync failed — retry Save');
    }
  };

  const completedDispatches = [...dispatches].sort((a, b) => (b.dispatchDate || '').localeCompare(a.dispatchDate || ''));
  const inp = 'tc-mgmt-input';
  const lbl = 'tc-mgmt-label';

  return (
    <ErpEntryPage>
      <ErpMockupTitleBar title="Despatch Entry" subtitle="Create delivery challan from ready material" icon={<PackageCheck className="w-4 h-4" />} />

      <ErpEntryToolbar
        buttons={[
          { label: 'Save Dispatch', tone: 'green', icon: <Save className="w-4 h-4" />, hotkey: 'save', onClick: handleSave, disabled: !canEdit },
          { label: 'Print DC', tone: 'navy', icon: <Printer className="w-4 h-4" />, hotkey: 'print', onClick: () => window.print() },
          { label: 'PDF', tone: 'purple', icon: <FileDown className="w-4 h-4" />, hotkey: 'pdf', onClick: () => toast('Generating PDF...') },
          { label: 'WhatsApp', tone: 'teal', icon: <MessageSquare className="w-4 h-4" />, hotkey: 'whatsapp', onClick: () => toast('Share on WhatsApp') },
          { label: 'E-Way Bill', tone: 'orange', icon: <FileText className="w-4 h-4" />, onClick: () => toast('E-Way Bill') },
          { label: 'Invoice', tone: 'blue', icon: <ReceiptText className="w-4 h-4" />, onClick: () => toast('Generate Invoice') },
          { label: 'Cancel', tone: 'ghost', icon: <X className="w-4 h-4" />, onClick: () => { setSelected({}); setDispatchQty({}); } },
        ]}
      />

      <div className="tc-mgmt-panel">
        <div className="tc-mgmt-panel-head">Despatch Report — Dispatch Details</div>
        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <div><label className={lbl}>DC No (Auto)</label><input value={dcNo} readOnly className="tc-mgmt-input bg-slate-100 dark:bg-slate-800 font-mono" /></div>
          <div><label className={lbl}>Dispatch Date *</label><input type="date" value={dispatchDate} onChange={e => setDispatchDate(e.target.value)} className={inp} /></div>
          <div>
            <label className={lbl}>Party Name *</label>
            <select value={partyName} onChange={e => handleParty(e.target.value)} className={inp}>
              <option value="">All ready parties</option>
              {partyOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div><label className={lbl}>Vehicle No</label><input value={vehicleNo} onChange={e => setVehicleNo(upper(e.target.value))} placeholder="GJ 05 AB 1234" className={inp} /></div>
          <div><label className={lbl}>Driver Name</label><input value={driverName} onChange={e => setDriverName(upper(e.target.value))} className={inp} /></div>
          <div><label className={lbl}>Mobile No</label><input value={mobileNo} onChange={e => setMobileNo(e.target.value)} className={inp} /></div>
        </div>
      </div>

      <ErpNumberedSection number={1} title="Select Ready Material" subtitle="Ready for Dispatch">
        <div className="overflow-x-auto -mx-3 px-3">
          <table className="tc-mgmt-table w-full min-w-[1000px]">
            <thead>
              <tr>
                <th><input type="checkbox" checked={allChecked} onChange={toggleAll} /></th>
                <th>Sr</th>
                <th>Drawing No</th>
                <th>Part Name</th>
                <th>Grade</th>
                <th>Thk (mm)</th>
                <th>Size / OD - ID</th>
                <th>Ready Nos</th>
                <th>Ready Wt (Kg)</th>
                <th>Karigar</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8 text-slate-400 italic">No ready material awaiting dispatch</td></tr>
              ) : visibleRows.map((r, i) => (
                <tr key={r.key} className={selected[r.key] ? 'bg-blue-50/60 dark:bg-slate-800/60' : ''}>
                  <td className="text-center">
                    <input type="checkbox" checked={!!selected[r.key]} onChange={() => {
                      setSelected(prev => ({ ...prev, [r.key]: !prev[r.key] }));
                      setDispatchQty(prev => ({ ...prev, [r.key]: prev[r.key] ?? r.readyNos }));
                    }} />
                  </td>
                  <td>{i + 1}</td>
                  <td>{r.item.drawingNumber || '-'}</td>
                  <td className="font-semibold">{r.item.partName || r.item.cuttingType}</td>
                  <td>{r.item.materialGrade}</td>
                  <td className="text-right">{r.item.thickness}</td>
                  <td>{r.item.plateSize || [r.item.length, r.item.width].filter(Boolean).join(' x ') || (r.item.outerDiameter ? `${r.item.outerDiameter}(OD) x ${r.item.innerDiameter}(ID)` : '-')}</td>
                  <td className="text-right font-bold text-brand-blue">{r.readyNos}</td>
                  <td className="text-right">{num3(r.perPiece * r.readyNos)}</td>
                  <td>{r.item.assignedWorker || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ErpNumberedSection>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <ErpNumberedSection number={2} title="Dispatch Qty Entry" subtitle="Enter Dispatch Quantity">
            <div className="overflow-x-auto -mx-3 px-3">
              <table className="tc-mgmt-table w-full min-w-[900px]">
                <thead>
                  <tr>
                    <th>Sr</th>
                    <th>Drawing No</th>
                    <th>Part Name</th>
                    <th>Thk (mm)</th>
                    <th>Ready Nos</th>
                    <th>Ready Wt (Kg)</th>
                    <th>Dispatch Nos</th>
                    <th>Dispatch Wt</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRows.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-6 text-slate-400 italic">Tick rows above to enter dispatch quantity</td></tr>
                  ) : selectedRows.map((r, i) => {
                    const q = dispatchQty[r.key] ?? r.readyNos;
                    return (
                      <tr key={r.key}>
                        <td>{i + 1}</td>
                        <td>{r.item.drawingNumber || '-'}</td>
                        <td>{r.item.partName || r.item.cuttingType}</td>
                        <td className="text-right">{r.item.thickness}</td>
                        <td className="text-right">{r.readyNos}</td>
                        <td className="text-right">{num3(r.perPiece * r.readyNos)}</td>
                        <td className="text-center">
                          <NumericInput value={q} min={0} max={r.readyNos}
                            onChange={v => setDispatchQty(prev => ({ ...prev, [r.key]: Math.max(0, Math.min(r.readyNos, parseNum(v))) }))}
                            className="w-20 mx-auto text-center tc-mgmt-input font-bold text-brand-blue" />
                        </td>
                        <td className="text-right text-emerald-600 font-semibold">{num3(r.perPiece * q)}</td>
                        <td className="text-right text-red-500 font-bold">{r.readyNos - q}</td>
                      </tr>
                    );
                  })}
                </tbody>
                {selectedRows.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 font-bold text-brand-blue">
                      <td colSpan={6}>Total Dispatch</td>
                      <td className="text-center">{totals.nos}</td>
                      <td className="text-right">{num3(totals.weight)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </ErpNumberedSection>
        </div>

        <ErpNumberedSection number={3} title="Delivery / Transport Details">
          <div className="space-y-2">
            <div><label className={lbl}>Delivery Address *</label><textarea value={deliveryAddress} onChange={e => setRemarkDeliveryAddress(e.target.value)} rows={3} className={inp} /></div>
            <div><label className={lbl}>Transport Name</label><input value={transportName} onChange={e => setTransportName(e.target.value)} className={inp} /></div>
            <div><label className={lbl}>Freight (₹)</label><NumericInput value={freight} onChange={setFreight} className={inp} /></div>
            <div><label className={lbl}>E-Way Bill No</label><input value={ewayBillNo} onChange={e => setEwayBillNo(e.target.value)} className={inp} /></div>
            <div><label className={lbl}>Remark</label><textarea value={remark} onChange={e => setRemark(upper(e.target.value))} rows={2} className={inp} /></div>
          </div>
        </ErpNumberedSection>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start min-w-0">
        <ErpNumberedSection number={4} title="Summary">
          <ErpSummaryTiles
            layout="stack"
            items={[
              { label: 'Dispatch Nos', value: totals.nos, tone: 'blue' },
              { label: 'Dispatch Wt (Kg)', value: num3(totals.weight), tone: 'green' },
            ]}
          />
        </ErpNumberedSection>
        <ErpInfoNote>
            <ul className="space-y-1.5 text-xs">
              <li className="flex gap-2"><PackageCheck className="w-4 h-4 text-emerald-500 shrink-0" /> Dispatch quantity will be deducted from Ready For Dispatch list.</li>
              <li className="flex gap-2"><PackageCheck className="w-4 h-4 text-emerald-500 shrink-0" /> Balance will remain in Ready For Dispatch list.</li>
              <li className="flex gap-2"><PackageCheck className="w-4 h-4 text-emerald-500 shrink-0" /> You can print Delivery Challan after saving.</li>
            </ul>
          </ErpInfoNote>
      </div>

      <div className="tc-mgmt-panel">
        <div className="tc-mgmt-panel-head">Dispatch History ({completedDispatches.length})</div>
        <div className="overflow-x-auto p-2">
          <table className="tc-mgmt-table w-full min-w-[700px]">
            <thead>
              <tr>
                <th>Dispatch Date</th>
                <th>Order / Party</th>
                <th>Qty</th>
                <th>Vehicle No</th>
                <th>DN Number</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              {completedDispatches.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400 italic">No previous dispatch records</td></tr>
              ) : completedDispatches.map(item => (
                <tr key={item.id}>
                  <td>{item.dispatchDate}</td>
                  <td><span className="font-mono font-bold">{item.orderNo}</span> <span className="text-slate-400">{item.partyName}</span></td>
                  <td className="text-center font-bold text-emerald-600">{item.dispatchQty}</td>
                  <td className="uppercase">{item.vehicleNo}</td>
                  <td className="font-mono text-brand-blue font-bold">{item.deliveryNote}</td>
                  <td className="text-slate-500 italic">{item.remark || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ErpEntryPage>
  );
};
