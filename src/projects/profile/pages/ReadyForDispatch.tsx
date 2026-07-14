import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileSpreadsheet, Boxes, PackageCheck, Scale, Truck, Printer, FileDown, Download, RotateCcw, List, Save, MessageSquare, X } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { buildReadyForDispatchRows } from '../utils/erpListHelpers';
import { downloadPlainRow } from '../utils/listExport';
import toast from 'react-hot-toast';
import { ErpEntryPage, ErpMockupTitleBar, ErpIconStatCards, ErpListPagination, paginateRows, ErpEntryToolbar } from '../components/ErpPageShell';
import { NumericInput } from '../components/NumericInput';

export const ReadyForDispatch: React.FC = () => {
  const nav = useNavigate();
  const { orders, transports } = useAppContext();
  const [sel, setSel] = useState<string[]>([]);
  const [partyFilter, setPartyFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [soFilter, setSoFilter] = useState('');
  const [itemFilter, setItemFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [actualWt, setActualWt] = useState<Record<string, string>>({});

  const [challanDate, setChallanDate] = useState(new Date().toISOString().split('T')[0]);
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [challanParty, setChallanParty] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [challanRemark, setChallanRemark] = useState('');

  const allRows = useMemo(() => buildReadyForDispatchRows(orders).map(r => {
    const order = orders.find(o => o.id === r.orderId);
    const item = order?.items.find(i => i.id === r.itemId);
    return {
      ...r,
      partyPO: order?.customerPONo || '—',
      partyPODate: order?.customerPODate || '—',
      soNo: order?.orderNo || '—',
      itemName: item?.partName || item?.cuttingType || '—',
      width: item?.width || item?.outerDiameter || '—',
      length: item?.length || item?.innerDiameter || item?.plateSize || '—',
      calcWt: r.wt,
    };
  }), [orders]);

  const parties = useMemo(() => [...new Set(allRows.map(r => r.party))].sort(), [allRows]);

  const DATA = useMemo(() => allRows.filter(r => {
    if (partyFilter && r.party !== partyFilter) return false;
    if (soFilter && !r.soNo.toLowerCase().includes(soFilter.toLowerCase())) return false;
    if (itemFilter && !r.itemName.toLowerCase().includes(itemFilter.toLowerCase())) return false;
    return true;
  }), [allRows, partyFilter, soFilter, itemFilter]);

  const paged = useMemo(() => paginateRows(DATA, page, pageSize), [DATA, page, pageSize]);
  const selectedRows = useMemo(() => DATA.filter(r => sel.includes(r.id)), [DATA, sel]);

  const toggle = (id: string) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const allOn = sel.length === DATA.length && DATA.length > 0;

  const totals = useMemo(() => ({
    items: DATA.length,
    nos: DATA.reduce((s, r) => s + r.nos, 0),
    wt: DATA.reduce((s, r) => s + parseFloat(String(r.wt).replace(/,/g, '') || '0'), 0),
    parties: new Set(DATA.map(r => r.party)).size,
  }), [DATA]);

  const downloadRow = (r: typeof DATA[number]) => {
    downloadPlainRow('Ready For Dispatch', {
      Party: r.party, 'Drawing No': r.drawing, 'Part Name': r.part, Grade: r.grade,
      'Ready Nos': r.nos, 'Ready Wt (Kg)': r.wt, Karigar: r.karigar,
    }, `ready_dispatch_${r.drawing.replace(/\s+/g, '_')}`);
    toast.success('PDF downloaded');
  };

  const fillChallanFromSelection = () => {
    if (selectedRows.length === 0) { toast.error('Select at least one row'); return; }
    const first = selectedRows[0];
    setChallanParty(first.party);
    const order = orders.find(o => o.id === first.orderId);
    setDeliveryAddress(order?.deliveryAddress || '');
    toast.success('Challan form filled from selection');
  };

  return (
    <ErpEntryPage>
      <ErpMockupTitleBar
        title="Ready For Dispatch Report"
        subtitle="List of materials ready for dispatch"
        icon={<PackageCheck className="w-4 h-4" />}
        actions={
          <>
            <button type="button" onClick={() => window.print()} className="erp-entry-btn erp-entry-btn-navy text-[10px] py-1"><Printer className="w-3.5 h-3.5" /> Print</button>
            <button type="button" onClick={() => toast.success('Excel export')} className="erp-entry-btn erp-entry-btn-green text-[10px] py-1"><FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel</button>
          </>
        }
      />

      <div className="erp-list-filter-bar">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
          <div><label className="tc-mgmt-label">Vehicle No.</label><select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)} className="tc-mgmt-input"><option value="">All</option>{transports.map(t => <option key={t.id} value={t.code}>{t.name}</option>)}</select></div>
          <div><label className="tc-mgmt-label">Party Name</label><select value={partyFilter} onChange={e => setPartyFilter(e.target.value)} className="tc-mgmt-input"><option value="">All Parties</option>{parties.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
          <div><label className="tc-mgmt-label">Sales Order No.</label><input value={soFilter} onChange={e => setSoFilter(e.target.value)} className="tc-mgmt-input" /></div>
          <div><label className="tc-mgmt-label">Item Name</label><input value={itemFilter} onChange={e => setItemFilter(e.target.value)} className="tc-mgmt-input" /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => toast.success('Filters applied')} className="erp-entry-btn erp-entry-btn-blue"><Search className="w-4 h-4" /> Search</button>
          <button type="button" onClick={() => { setPartyFilter(''); setVehicleFilter(''); setSoFilter(''); setItemFilter(''); }} className="erp-entry-btn erp-entry-btn-ghost"><RotateCcw className="w-4 h-4" /> Refresh</button>
        </div>
      </div>

      <div className="tc-mgmt-panel">
        <div className="tc-mgmt-panel-head flex items-center gap-2"><List className="w-4 h-4" /> Ready For Dispatch List</div>
        <div className="overflow-x-auto">
          <table className="tc-mgmt-table w-full min-w-[1200px]">
            <thead>
              <tr>
                <th><input type="checkbox" checked={allOn} onChange={() => setSel(allOn ? [] : DATA.map(d => d.id))} /></th>
                <th>Sr</th><th>Party Name</th><th>Party PO No.</th><th>Party PO Date</th><th>SO No.</th>
                <th>Item Name</th><th>Grade</th><th>Thk (mm)</th><th>Width / OD</th><th>Length / ID</th>
                <th>Ready Nos</th><th>Calc Wt</th><th>Actual Wt</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={15} className="text-center py-10 text-slate-400 italic">No ready items — complete production / worker cutting first</td></tr>
              ) : paged.map((r, i) => (
                <tr key={r.id}>
                  <td className="text-center"><input type="checkbox" checked={sel.includes(r.id)} onChange={() => toggle(r.id)} /></td>
                  <td>{(page - 1) * pageSize + i + 1}</td>
                  <td>{r.party}</td>
                  <td>{r.partyPO}</td>
                  <td>{r.partyPODate}</td>
                  <td className="font-bold text-brand-blue">{r.soNo}</td>
                  <td>{r.itemName}</td>
                  <td>{r.grade}</td>
                  <td className="text-center">{r.thk}</td>
                  <td className="text-center">{r.width}</td>
                  <td className="text-center">{r.length}</td>
                  <td className="text-center font-bold">{r.nos}</td>
                  <td className="text-right">{r.calcWt}</td>
                  <td className="text-center">
                    <NumericInput value={actualWt[r.id] || ''} onChange={v => setActualWt(p => ({ ...p, [r.id]: v }))} className="w-20 mx-auto tc-mgmt-input text-center" />
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button type="button" onClick={fillChallanFromSelection} className="erp-entry-btn erp-entry-btn-blue text-[9px] py-0.5 px-1.5">Challan</button>
                      <button type="button" onClick={() => downloadRow(r)} className="p-1 text-purple-600"><Download className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ErpListPagination page={page} pageSize={pageSize} total={DATA.length} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1); }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        <ErpIconStatCards items={[
          { icon: Boxes, label: 'Total Orders Ready', value: String(totals.items), ring: 'ring-blue' },
          { icon: PackageCheck, label: 'Total Ready Qty (Nos)', value: String(totals.nos), ring: 'ring-green' },
          { icon: Scale, label: 'Total Ready Weight (Kg)', value: totals.wt.toFixed(3), ring: 'ring-purple' },
        ]} />
        <div className="lg:col-span-2 erp-info-note text-red-700 bg-red-50 border-red-200">
          Note: Please enter Actual Weight before creating Challan.
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <div className="xl:col-span-2 tc-mgmt-panel">
          <div className="tc-mgmt-panel-head">Delivery Challan Entry</div>
          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div><label className="tc-mgmt-label">Challan No. (Auto)</label><input readOnly value="DC/AUTO" className="tc-mgmt-input bg-slate-100 font-mono" /></div>
            <div><label className="tc-mgmt-label">Challan Date</label><input type="date" value={challanDate} onChange={e => setChallanDate(e.target.value)} className="tc-mgmt-input" /></div>
            <div><label className="tc-mgmt-label">Vehicle No.</label><select value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} className="tc-mgmt-input"><option value="">Select</option>{transports.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select></div>
            <div><label className="tc-mgmt-label">Driver Name</label><input value={driverName} onChange={e => setDriverName(e.target.value)} className="tc-mgmt-input" /></div>
            <div><label className="tc-mgmt-label">Driver Mobile No.</label><input value={driverMobile} onChange={e => setDriverMobile(e.target.value)} className="tc-mgmt-input" /></div>
            <div><label className="tc-mgmt-label">Party Name</label><input value={challanParty} onChange={e => setChallanParty(e.target.value)} className="tc-mgmt-input" /></div>
            <div className="col-span-2 sm:col-span-3"><label className="tc-mgmt-label">Delivery Address</label><textarea value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} rows={2} className="tc-mgmt-input" /></div>
            <div className="col-span-2 sm:col-span-3"><label className="tc-mgmt-label">Remark</label><input value={challanRemark} onChange={e => setChallanRemark(e.target.value)} className="tc-mgmt-input" /></div>
          </div>
          <ErpEntryToolbar buttons={[
            { label: 'Save', tone: 'green', icon: <Save className="w-4 h-4" />, hotkey: 'save', onClick: () => nav('/dispatch') },
            { label: 'Print', tone: 'blue', icon: <Printer className="w-4 h-4" />, hotkey: 'print', onClick: () => window.print() },
            { label: 'WhatsApp PDF', tone: 'teal', icon: <MessageSquare className="w-4 h-4" />, hotkey: 'whatsapp', onClick: () => toast('WhatsApp PDF') },
            { label: 'Cancel', tone: 'ghost', icon: <X className="w-4 h-4" />, onClick: () => { setChallanParty(''); setDeliveryAddress(''); setChallanRemark(''); } },
          ]} />
        </div>

        <div className="tc-mgmt-panel">
          <div className="tc-mgmt-panel-head green">Selected Items</div>
          <div className="overflow-x-auto p-2">
            <table className="tc-mgmt-table w-full text-[10px]">
              <thead><tr><th>Sr</th><th>Item</th><th>Nos</th><th>Wt</th></tr></thead>
              <tbody>
                {selectedRows.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-4 text-slate-400 italic">Select rows from list</td></tr>
                ) : selectedRows.map((r, i) => (
                  <tr key={r.id}><td>{i + 1}</td><td>{r.itemName}</td><td className="text-center">{r.nos}</td><td className="text-right">{actualWt[r.id] || r.calcWt}</td></tr>
                ))}
              </tbody>
              {selectedRows.length > 0 && (
                <tfoot><tr className="font-bold"><td colSpan={2}>Total</td><td className="text-center">{selectedRows.reduce((s, r) => s + r.nos, 0)}</td><td></td></tr></tfoot>
              )}
            </table>
          </div>
          <div className="erp-info-note m-2 text-red-700 bg-red-50 border-red-200 text-[10px]">
            Verify items, quantities and Actual Weight before Save / Print.
          </div>
        </div>
      </div>

      <div className="erp-entry-toolbar">
        <button type="button" onClick={() => nav('/dispatch')} className="erp-entry-btn erp-entry-btn-green"><Truck className="w-4 h-4" /> Create Dispatch</button>
      </div>
    </ErpEntryPage>
  );
};
