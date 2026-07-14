import React, { useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { ListView } from '../components/ListView';

import { useAppContext, type CNCQuotationRecord } from '../store/AppContext';

import toast from 'react-hot-toast';

import { generateCNCQuotationPDF } from '../utils/cncQuotationDownload';

import {
  getCNCInquiryNo, getCNCQuotationStatus, getCNCOrderQty, fmtCNCDate, cncInr,
} from '../utils/cncQuotationHelpers';

import {
  orderTotalAmount, orderTotalNos, formatOrderListStatus, daysBetween, fmtDate, fmtINR,
} from '../utils/erpListHelpers';

import { ErpEntryPage, ErpMockupTitleBar, ErpIconStatCards, ErpListPagination, paginateRows } from '../components/ErpPageShell';

import { Plus, Search, RotateCcw, FileSpreadsheet, Printer, Trash2, Pencil, Eye, FileDown, MessageSquare, ClipboardList, Package, Scale, Clock, CheckCircle, RefreshCw } from 'lucide-react';



const Badge: React.FC<{ status: string }> = ({ status }) => {

  const map: Record<string, string> = {

    'In Production': 'bg-blue-100 text-blue-700',

    'Pending': 'bg-amber-100 text-amber-700',

    'Dispatched': 'bg-green-100 text-green-700',

    'Ready': 'bg-emerald-100 text-emerald-700',

  };

  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>{status}</span>;

};



const CNCStatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
    status === 'Order Received' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
  }`}>{status}</span>
);



export const CNCQuotationList: React.FC = () => {
  const nav = useNavigate();
  const { cncQuotations, deleteCNCQuotation, persistErpNow, user } = useAppContext();

  const rows = useMemo(() => cncQuotations.map(q => ({
    id: q.id,
    inquiryNo: getCNCInquiryNo(q),
    quoteNo: q.quoteNo,
    date: fmtCNCDate(q.date),
    party: q.partyName,
    mobile: q.mobileNo || '—',
    items: q.items.length,
    qty: getCNCOrderQty(q),
    total: cncInr(q.grandTotal),
    status: getCNCQuotationStatus(q),
    raw: q,
  })), [cncQuotations]);

  const handleDownload = async (row: typeof rows[number]) => {
    toast.loading('Generating PDF...', { id: 'cnc-list-pdf' });
    try {
      await generateCNCQuotationPDF(row.raw, user?.displayName || user?.username);
      toast.success(`PDF downloaded: ${row.quoteNo}`, { id: 'cnc-list-pdf' });
    } catch {
      toast.error('PDF generation failed', { id: 'cnc-list-pdf' });
    }
  };

  return (
    <ListView
      title="CNC Quotation List"
      rows={rows}
      getId={r => r.id}
      onNew={() => nav('/cnc-quotation')}
      onDelete={async (row) => {
        if (!window.confirm(`Delete CNC quotation ${row.inquiryNo}?`)) return;
        const next = cncQuotations.filter((q: CNCQuotationRecord) => q.id !== row.id);
        deleteCNCQuotation(row.id);
        try {
          await persistErpNow({ cncQuotations: next });
          toast.success('Deleted');
        } catch {
          toast.error('Deleted locally but server sync failed');
        }
      }}
      onDownload={(row) => { void handleDownload(row); }}
      downloadLabel={r => (r.inquiryNo || r.quoteNo).replace(/\//g, '_')}
      dateAccessor={r => r.date}
      searchAccessor={r => `${r.inquiryNo} ${r.quoteNo} ${r.party} ${r.mobile} ${r.status}`}
      emptyText="No saved CNC quotations yet. Create one from CNC Quotation 2."
      columns={[
        { header: 'Inquiry No', render: r => <span className="font-semibold text-brand-blue">{r.inquiryNo}</span> },
        { header: 'Quote No', render: r => r.quoteNo },
        { header: 'Date', render: r => r.date },
        { header: 'Party', render: r => r.party },
        { header: 'Mobile', render: r => r.mobile },
        { header: 'Items', render: r => r.items, align: 'center' },
        { header: 'Order Qty', render: r => r.qty, align: 'center' },
        { header: 'Grand Total (₹)', render: r => <span className="font-semibold">{r.total}</span>, align: 'right' },
        { header: 'Status', render: r => <CNCStatusBadge status={r.status} />, align: 'center' },
        { header: 'Edit', render: r => (
          <button type="button" onClick={() => nav(`/cnc-quotation?edit=${r.id}`)} className="text-blue-600 text-xs font-bold hover:underline">Open</button>
        ), align: 'center' },
      ]}
    />
  );
};



const OrderStatusPill: React.FC<{ status: string }> = ({ status }) => {
  const cls: Record<string, string> = {
    Pending: 'erp-status-pending',
    'In Production': 'erp-status-production',
    Ready: 'erp-status-ready',
    'Partial Dispatch': 'erp-status-partial',
    Completed: 'erp-status-completed',
    Dispatched: 'erp-status-completed',
    Cancelled: 'erp-status-cancelled',
  };
  return <span className={`erp-status-pill ${cls[status] ?? 'erp-status-pending'}`}>{status}</span>;
};

export const OrderList: React.FC = () => {
  const nav = useNavigate();
  const { orders, deleteOrder } = useAppContext();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [party, setParty] = useState('All');
  const [status, setStatus] = useState('All');
  const [orderNo, setOrderNo] = useState('');
  const [customerPO, setCustomerPO] = useState('');
  const [grade, setGrade] = useState('All');
  const [drawingNo, setDrawingNo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [applied, setApplied] = useState({ fromDate: '', toDate: '', party: 'All', status: 'All', orderNo: '', customerPO: '', grade: 'All', drawingNo: '' });

  const partyOptions = useMemo(() => ['All', ...Array.from(new Set(orders.map(o => o.partyName))).sort()], [orders]);
  const gradeOptions = useMemo(() => ['All', ...Array.from(new Set(orders.flatMap(o => o.items.map(i => i.materialGrade).filter(Boolean)))).sort()], [orders]);

  const filtered = useMemo(() => orders.filter(o => {
    const st = formatOrderListStatus(o.stage);
    if (applied.party !== 'All' && o.partyName !== applied.party) return false;
    if (applied.status !== 'All' && st !== applied.status) return false;
    if (applied.orderNo && !o.orderNo.toLowerCase().includes(applied.orderNo.toLowerCase())) return false;
    if (applied.customerPO && !(o.customerPONo || '').toLowerCase().includes(applied.customerPO.toLowerCase())) return false;
    if (applied.grade !== 'All' && !o.items.some(i => i.materialGrade === applied.grade)) return false;
    if (applied.drawingNo && !o.items.some(i => (i.drawingNumber || '').toLowerCase().includes(applied.drawingNo.toLowerCase()))) return false;
    if (applied.fromDate && o.orderDate < applied.fromDate) return false;
    if (applied.toDate && o.orderDate > applied.toDate) return false;
    return true;
  }), [orders, applied]);

  const paged = useMemo(() => paginateRows(filtered, page, pageSize), [filtered, page, pageSize]);

  const totals = useMemo(() => ({
    count: filtered.length,
    qty: filtered.reduce((s, o) => s + orderTotalNos(o), 0),
    weight: filtered.reduce((s, o) => s + o.items.reduce((a, i) => a + (i.totalWeight || 0), 0), 0),
    pending: filtered.filter(o => formatOrderListStatus(o.stage) === 'Pending').length,
    completed: filtered.filter(o => ['Completed', 'Dispatched'].includes(formatOrderListStatus(o.stage))).length,
  }), [filtered]);

  const doSearch = () => { setApplied({ fromDate, toDate, party, status, orderNo, customerPO, grade, drawingNo }); setPage(1); };
  const doClear = () => {
    setFromDate(''); setToDate(''); setParty('All'); setStatus('All'); setOrderNo(''); setCustomerPO(''); setGrade('All'); setDrawingNo('');
    setApplied({ fromDate: '', toDate: '', party: 'All', status: 'All', orderNo: '', customerPO: '', grade: 'All', drawingNo: '' });
    setPage(1);
  };

  return (
    <ErpEntryPage>
      <ErpMockupTitleBar title="Sales Order List" subtitle="View and manage all sales orders" icon={<ClipboardList className="w-4 h-4" />} />

      <div className="erp-list-filter-bar">
        <div className="erp-list-filter-grid mb-2">
          <div><label className="tc-mgmt-label">From Date</label><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="tc-mgmt-input" /></div>
          <div><label className="tc-mgmt-label">To Date</label><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="tc-mgmt-input" /></div>
          <div><label className="tc-mgmt-label">Party Name</label><select value={party} onChange={e => setParty(e.target.value)} className="tc-mgmt-input">{partyOptions.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
          <div><label className="tc-mgmt-label">Internal Order No.</label><input value={orderNo} onChange={e => setOrderNo(e.target.value)} placeholder="SO/..." className="tc-mgmt-input" /></div>
          <div><label className="tc-mgmt-label">Customer PO No.</label><input value={customerPO} onChange={e => setCustomerPO(e.target.value)} className="tc-mgmt-input" /></div>
          <div><label className="tc-mgmt-label">Material Grade</label><select value={grade} onChange={e => setGrade(e.target.value)} className="tc-mgmt-input">{gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
          <div><label className="tc-mgmt-label">Drawing No.</label><input value={drawingNo} onChange={e => setDrawingNo(e.target.value)} className="tc-mgmt-input" /></div>
          <div><label className="tc-mgmt-label">Status</label><select value={status} onChange={e => setStatus(e.target.value)} className="tc-mgmt-input"><option value="All">All</option><option>Pending</option><option>In Production</option><option>Ready</option><option>Partial Dispatch</option><option>Completed</option><option>Cancelled</option></select></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={doSearch} className="erp-entry-btn erp-entry-btn-blue"><Search className="w-4 h-4" /> Search</button>
          <button type="button" onClick={doSearch} className="erp-entry-btn erp-entry-btn-green"><RefreshCw className="w-4 h-4" /> Refresh</button>
          <button type="button" onClick={doClear} className="erp-entry-btn erp-entry-btn-ghost"><RotateCcw className="w-4 h-4" /> Clear</button>
          <button type="button" onClick={() => toast.success('Export ready')} className="erp-entry-btn erp-entry-btn-green"><FileSpreadsheet className="w-4 h-4" /> Export Excel</button>
          <button type="button" onClick={() => window.print()} className="erp-entry-btn erp-entry-btn-navy"><Printer className="w-4 h-4" /> Print</button>
          <button type="button" onClick={() => nav('/order-entry')} className="erp-entry-btn erp-entry-btn-orange"><Plus className="w-4 h-4" /> New Order</button>
        </div>
      </div>

      <div className="tc-mgmt-panel">
        <div className="overflow-x-auto">
          <table className="tc-mgmt-table w-full min-w-[1000px]">
            <thead>
              <tr>
                <th>Sr No.</th><th>Internal Order No.</th><th>Order Date</th><th>Party Name</th><th>Customer PO No.</th>
                <th>PO Date</th><th>Total Qty</th><th>Total Weight (KG)</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8 text-slate-400 italic">No orders found</td></tr>
              ) : paged.map((o, i) => {
                const st = formatOrderListStatus(o.stage);
                const wt = o.items.reduce((s, it) => s + (it.totalWeight || 0), 0);
                return (
                  <tr key={o.id} onDoubleClick={() => nav('/order-entry')} className="cursor-pointer">
                    <td>{(page - 1) * pageSize + i + 1}</td>
                    <td><button type="button" onClick={() => nav('/order-entry')} className="font-bold text-brand-blue hover:underline">{o.orderNo}</button></td>
                    <td>{fmtDate(o.orderDate)}</td>
                    <td>{o.partyName}</td>
                    <td>{o.customerPONo || '—'}</td>
                    <td>{o.customerPODate ? fmtDate(o.customerPODate) : '—'}</td>
                    <td className="text-center">{orderTotalNos(o)}</td>
                    <td className="text-right">{wt.toFixed(3)}</td>
                    <td className="text-center"><OrderStatusPill status={st} /></td>
                    <td>
                      <div className="flex items-center justify-center gap-0.5">
                        <button type="button" title="View" className="p-1 text-brand-blue"><Eye className="w-3.5 h-3.5" /></button>
                        <button type="button" title="Edit" onClick={() => nav('/order-entry')} className="p-1 text-orange-500"><Pencil className="w-3.5 h-3.5" /></button>
                        <button type="button" title="PDF" onClick={() => toast('PDF download')} className="p-1 text-red-500"><FileDown className="w-3.5 h-3.5" /></button>
                        <button type="button" title="WhatsApp" onClick={() => toast('WhatsApp share')} className="p-1 text-green-600"><MessageSquare className="w-3.5 h-3.5" /></button>
                        <button type="button" title="Delete" onClick={() => { if (window.confirm(`Delete ${o.orderNo}?`)) void deleteOrder(o.id); }} className="p-1 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ErpListPagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1); }} />
        <div className="erp-footer-hint"><Eye className="w-3 h-3" /> Double click on any order to view full details.</div>
      </div>

      <ErpIconStatCards items={[
        { icon: ClipboardList, label: 'Total Orders', value: String(totals.count), ring: 'ring-blue' },
        { icon: Package, label: 'Total Qty', value: totals.qty.toLocaleString('en-IN'), ring: 'ring-orange' },
        { icon: Scale, label: 'Total Weight (KG)', value: totals.weight.toFixed(3), ring: 'ring-purple' },
        { icon: Clock, label: 'Pending Orders', value: String(totals.pending), ring: 'ring-red' },
        { icon: CheckCircle, label: 'Completed Orders', value: String(totals.completed), ring: 'ring-green' },
      ]} />
    </ErpEntryPage>
  );
};

export const PendingOrder: React.FC = () => {

  const nav = useNavigate();

  const { orders, deleteOrder } = useAppContext();



  const rows = useMemo(() => orders

    .filter(o => !['Dispatch Done', 'Challan Done', 'Payment Pending', 'Payment Received'].includes(o.stage))

    .map(o => {

      const pendingItems = o.items.filter(i => (i.completedQty || 0) < i.quantity).length || o.items.length;

      const pendingNos = o.items.reduce((s, i) => s + Math.max(0, i.quantity - (i.completedQty || 0)), 0);

      return {

        id: o.id,

        no: o.orderNo,

        date: fmtDate(o.orderDate),

        party: o.partyName,

        items: pendingItems,

        nos: pendingNos,

        days: daysBetween(o.orderDate),

      };

    }), [orders]);



  return (

    <ListView title="Pending Order" rows={rows} getId={r => r.id} onNew={() => nav('/order-entry')}

      onDelete={async (row) => {

        if (!window.confirm(`Delete order ${row.no}?`)) return;

        await deleteOrder(row.id);

      }}

      dateAccessor={r => r.date}

      columns={[

        { header: 'Order No', render: r => <span className="font-semibold">{r.no}</span> },

        { header: 'Date', render: r => r.date },

        { header: 'Party', render: r => r.party },

        { header: 'Pending Items', render: r => r.items, align: 'center' },

        { header: 'Pending Nos', render: r => r.nos, align: 'center' },

        { header: 'Days Pending', render: r => r.days, align: 'center' },

      ]} />

  );

};



export const InvoiceEntry: React.FC = () => {

  const { challans, dispatches } = useAppContext();



  const rows = useMemo(() => challans.map(c => {

    const dispatch = dispatches.find(d => d.orderNo === c.orderNo);

    return {

      id: c.id,

      no: c.challanNo,

      date: fmtDate(c.challanDate),

      party: c.partyName,

      dc: dispatch?.vehicleNo || '-',

      taxable: fmtINR(c.taxableAmount),

      gst: fmtINR(c.gstAmount),

      total: fmtINR(c.totalAmount),

    };

  }), [challans, dispatches]);



  return (

    <ListView title="Invoice Entry" rows={rows} getId={r => r.id}

      onNew={() => toast('Create challan from Dispatch / Challan page')}

      onDelete={() => toast('Delete from Challan page')}

      dateAccessor={r => r.date}

      columns={[

        { header: 'Challan / Invoice No', render: r => <span className="font-semibold">{r.no}</span> },

        { header: 'Date', render: r => r.date },

        { header: 'Party', render: r => r.party },

        { header: 'Vehicle / DC', render: r => r.dc },

        { header: 'Taxable (₹)', render: r => r.taxable, align: 'right' },

        { header: 'GST (₹)', render: r => r.gst, align: 'right' },

        { header: 'Total (₹)', render: r => <span className="font-bold text-green-600">{r.total}</span>, align: 'right' },

      ]} />

  );

};



export const SalesReports: React.FC = () => {

  const { orders } = useAppContext();



  const rows = useMemo(() => {

    const byMonth = new Map<string, { orders: number; nos: number; sales: number }>();

    for (const o of orders) {

      const d = new Date(o.orderDate.includes('T') ? o.orderDate : `${o.orderDate}T12:00:00`);

      const key = d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

      const e = byMonth.get(key) || { orders: 0, nos: 0, sales: 0 };

      e.orders += 1;

      e.nos += orderTotalNos(o);

      e.sales += orderTotalAmount(o);

      byMonth.set(key, e);

    }

    return Array.from(byMonth.entries()).map(([month, v], i) => ({

      id: `sr-${i}`,

      month,

      orders: v.orders,

      nos: v.nos.toLocaleString('en-IN'),

      sales: fmtINR(v.sales),

      out: '-',

    }));

  }, [orders]);



  return (

    <ListView title="Sales Reports" rows={rows} getId={r => r.id}

      columns={[

        { header: 'Month', render: r => <span className="font-semibold">{r.month}</span>, align: 'center' },

        { header: 'Orders', render: r => r.orders, align: 'center' },

        { header: 'Total Nos', render: r => r.nos, align: 'center' },

        { header: 'Sales (₹)', render: r => r.sales, align: 'right' },

        { header: 'Outstanding (₹)', render: r => r.out, align: 'right' },

      ]} />

  );

};

