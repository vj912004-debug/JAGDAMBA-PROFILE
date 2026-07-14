import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, FileText, Printer, X } from 'lucide-react';
import { ListView } from '../components/ListView';
import { PurchaseOrderPreviewModal } from '../components/PurchaseOrderPreviewModal';
import { PurchaseOrderPrint, PO_PRINT_WIDTH_PX, PO_BLANK_PRINT_AREA_ID, type PoCompanyBrand } from '../components/PurchaseOrderPrint';
import { useAppContext, type PurchaseOrder } from '../store/AppContext';
import { downloadListRow } from '../utils/listExport';
import { generatePlateQuotationPDF } from '../utils/plateQuotationDownload';
import { downloadPurchaseOrderPDF, generateBlankPurchaseOrderPDF } from '../utils/pdfGenerator';
import { openPurchaseOrderPrintWindow } from '../utils/purchaseOrderPrintWindow';
import { buildSupplierLedgerRows, filterSupplierParties } from '../utils/masterHelpers';
import toast from 'react-hot-toast';

export const PurchaseReturn: React.FC = () => {
  const rows = [
    { id: '1', no: 'PR/2627/0008', date: '16/06/2026', supplier: 'Jindal Steel', reason: 'Thickness mismatch', nos: 2, amt: '18,400' },
    { id: '2', no: 'PR/2627/0007', date: '12/06/2026', supplier: 'SAIL Dealer', reason: 'Surface defect', nos: 1, amt: '9,200' },
  ];
  return (
    <ListView title="Purchase Return" rows={rows} getId={r => r.id} onNew={() => toast('New return')} onDelete={() => toast.success('Deleted')}
      dateAccessor={r => r.date}
      columns={[
        { header: 'Return No', render: r => <span className="font-semibold">{r.no}</span> },
        { header: 'Date', render: r => r.date },
        { header: 'Supplier', render: r => r.supplier },
        { header: 'Reason', render: r => r.reason },
        { header: 'Nos', render: r => r.nos, align: 'center' },
        { header: 'Amount (₹)', render: r => r.amt, align: 'right' },
      ]} />
  );
};

export const SupplierLedger: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { parties, purchaseOrders } = useAppContext();
  const suppliers = useMemo(() => filterSupplierParties(parties), [parties]);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    const supplierId = (location.state as { supplierId?: string } | null)?.supplierId;
    if (!supplierId) return;
    const found = suppliers.find(s => s.id === supplierId);
    if (found) setSelectedId(found.id);
  }, [location.state, suppliers]);

  const selectedSupplier = useMemo(
    () => suppliers.find(s => s.id === selectedId) ?? null,
    [suppliers, selectedId],
  );

  const ledgerRows = useMemo(
    () => (selectedSupplier ? buildSupplierLedgerRows(selectedSupplier.partyName, purchaseOrders) : []),
    [selectedSupplier, purchaseOrders],
  );

  const supplierSummaryRows = useMemo(
    () => suppliers.map(s => {
      const pos = purchaseOrders.filter(
        po => po.supplierName.trim().toUpperCase() === s.partyName.trim().toUpperCase(),
      );
      const total = pos.reduce((sum, po) => sum + po.totalAmount, 0);
      return {
        id: s.id,
        code: s.partyCode || '—',
        name: s.partyName,
        contact: s.contactPerson || '—',
        mobile: s.mobileNumber || '—',
        poCount: pos.length,
        total: total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      };
    }),
    [suppliers, purchaseOrders],
  );

  const fmtDate = (iso: string) => {
    if (!iso) return '—';
    const d = new Date(iso.includes('/') ? iso.split('/').reverse().join('-') : iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB');
  };

  if (!selectedSupplier) {
    return (
      <div className="max-w-[1300px] mx-auto space-y-4 fade-in">
        <div className="erp-card p-4">
          <label className="field-label mb-1">Select Supplier</label>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="w-full max-w-md bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">— Choose supplier from Party Master —</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.partyName}{s.partyCode ? ` (${s.partyCode})` : ''}</option>
            ))}
          </select>
          {suppliers.length === 0 && (
            <p className="text-sm text-slate-500 mt-2">
              No suppliers found. Add parties in Party Master with Category = Supplier or Both.
            </p>
          )}
        </div>
        <ListView
          title="Supplier Ledger — All Suppliers"
          rows={supplierSummaryRows}
          getId={r => r.id}
          showFilters={false}
          showRowDownload={false}
          onNew={() => navigate('/party-master')}
          emptyText="No supplier parties in Party Master. Set Category to Supplier or Both."
          searchAccessor={r => `${r.code} ${r.name} ${r.contact} ${r.mobile}`}
          onRowClick={row => setSelectedId(row.id)}
          columns={[
            { header: 'Code', render: r => r.code },
            { header: 'Supplier Name', render: r => <span className="font-semibold text-brand-blue">{r.name}</span> },
            { header: 'Contact', render: r => r.contact },
            { header: 'Mobile', render: r => r.mobile },
            { header: 'PO Count', render: r => r.poCount, align: 'center' },
            { header: 'Total Purchase (₹)', render: r => r.total, align: 'right' },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1300px] mx-auto space-y-4 fade-in">
      <div className="erp-card p-4 flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1 max-w-md">
          <label className="field-label mb-1">Supplier</label>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.partyName}{s.partyCode ? ` (${s.partyCode})` : ''}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => navigate('/party-master', { state: { masterId: selectedSupplier.id } })}
          className="erp-btn erp-btn-navy"
        >
          Open in Party Master
        </button>
        <button type="button" onClick={() => setSelectedId('')} className="erp-btn erp-btn-ghost">
          All Suppliers
        </button>
      </div>
      <ListView
        title={`Supplier Ledger — ${selectedSupplier.partyName}`}
        rows={ledgerRows}
        getId={r => r.id}
        showRowDownload={false}
        onNew={() => navigate('/purchase-order')}
        emptyText="No purchase orders for this supplier yet."
        dateAccessor={r => r.date}
        columns={[
          { header: 'Date', render: r => fmtDate(r.date) },
          { header: 'Particulars', render: r => r.part },
          { header: 'Debit (₹)', render: r => r.debit, align: 'right' },
          { header: 'Credit (₹)', render: r => r.credit, align: 'right' },
          { header: 'Balance (₹)', render: r => <span className="font-semibold">{r.bal}</span>, align: 'right' },
        ]}
      />
    </div>
  );
};

export const RingRateList: React.FC = () => {
  const nav = useNavigate();
  const { ringQuotations, setRingQuotations, persistErpNow } = useAppContext();
  const rows = useMemo(() => [...ringQuotations]
    .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0))
    .map(q => ({
      id: q.id,
      no: q.inquiryNo,
      quoteNo: q.quoteNo,
      date: q.date,
      party: q.partyName,
      items: q.items?.length ?? 0,
      nos: q.totalNos ?? 0,
      total: (q.grandTotal ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    })), [ringQuotations]);

  return (
    <ListView title="Ring Rate List" rows={rows} getId={r => r.id} onNew={() => nav('/ring-rate')}
      onDelete={async (row) => {
        if (!window.confirm('Delete this ring quotation?')) return;
        const next = ringQuotations.filter(q => q.id !== row.id);
        setRingQuotations(next);
        try {
          await persistErpNow({ ringQuotations: next });
          toast.success('Deleted');
        } catch {
          toast.error('Deleted locally but server sync failed');
        }
      }}
      showRowDownload={false}
      dateAccessor={r => r.date}
      columns={[
        { header: 'Inquiry No', render: r => <span className="font-semibold">{r.no}</span> },
        { header: 'Quote No', render: r => r.quoteNo },
        { header: 'Date', render: r => r.date },
        { header: 'Party', render: r => r.party },
        { header: 'Items', render: r => r.items, align: 'center' },
        { header: 'Total Nos', render: r => r.nos, align: 'center' },
        { header: 'Grand Total (₹)', render: r => <span className="font-semibold">{r.total}</span>, align: 'right' },
        { header: 'Edit', render: r => (
          <button type="button" onClick={() => nav(`/ring-rate?edit=${r.id}`)} className="text-blue-600 text-xs font-bold hover:underline">Open</button>
        ), align: 'center' },
      ]} />
  );
};

export const PlateQuotationList: React.FC = () => {
  const nav = useNavigate();
  const { quotations, parties, deleteQuotation, persistErpNow } = useAppContext();
  const demoRows = [
    { id: 'demo-1', no: 'Q/26-27/000125', date: '17/06/2026', party: 'Shree Ram Hardware', wt: '6,746.52', total: '5,57,211', valid: '27/06/2026' },
    { id: 'demo-2', no: 'Q/26-27/000124', date: '14/06/2026', party: 'Galaxy Steel', wt: '3,120.00', total: '2,68,400', valid: '24/06/2026' },
  ];
  const rows = quotations.length > 0
    ? quotations.map(q => ({
        id: q.id,
        no: q.quoteNo,
        date: q.date,
        party: q.partyName,
        wt: q.items.reduce((s, i) => s + (i.weight || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        total: q.grandTotal.toLocaleString('en-IN'),
        valid: q.validUntil,
      }))
    : demoRows;

  const columns = [
    { header: 'Inquiry No', render: (r: typeof rows[number]) => <span className="font-semibold">{r.no}</span> },
    { header: 'Date', render: (r: typeof rows[number]) => r.date },
    { header: 'Party', render: (r: typeof rows[number]) => r.party },
    { header: 'Total Weight (Kg)', render: (r: typeof rows[number]) => r.wt, align: 'right' as const },
    { header: 'Grand Total (₹)', render: (r: typeof rows[number]) => r.total, align: 'right' as const },
    { header: 'Valid Till', render: (r: typeof rows[number]) => r.valid, align: 'center' as const },
  ];

  const handleDownload = async (row: typeof rows[number], idx: number) => {
    const record = quotations.find(q => q.id === row.id);
    if (record) {
      toast.loading('Generating PDF...', { id: 'plate-quote-pdf' });
      try {
        await generatePlateQuotationPDF(record, parties);
        toast.success(`PDF downloaded: ${record.quoteNo}`, { id: 'plate-quote-pdf' });
      } catch {
        toast.error('PDF generation failed', { id: 'plate-quote-pdf' });
      }
      return;
    }
    downloadListRow({ title: 'Plate Quotation List', columns, row, rowIndex: idx, getLabel: r => r.no.replace(/\//g, '_') });
    toast.success(`PDF downloaded: ${row.no}`);
  };

  return (
    <ListView title="Plate Quotation List" rows={rows} getId={r => r.id} onNew={() => nav('/quotation')}
      onDelete={async (row) => {
        if (row.id.startsWith('demo-')) { toast.error('Demo row — save a real quotation first'); return; }
        if (!window.confirm('Delete this quotation?')) return;
        const next = quotations.filter(q => q.id !== row.id);
        deleteQuotation(row.id);
        try {
          await persistErpNow({ quotations: next });
          toast.success('Deleted');
        } catch {
          toast.error('Deleted locally but server sync failed');
        }
      }}
      onDownload={handleDownload}
      downloadLabel={r => r.no.replace(/\//g, '_')}
      dateAccessor={r => r.date}
      columns={columns} />
  );
};

export const PurchaseReportsList: React.FC = () => {
  const { purchaseOrders, deletePurchaseOrder, role } = useAppContext();
  const nav = useNavigate();
  const [previewPO, setPreviewPO] = useState<PurchaseOrder | null>(null);
  const [blankPoBrand, setBlankPoBrand] = useState<PoCompanyBrand | null>(null);
  const canEdit = role === 'Admin' || role === 'Office Entry';

  const openEdit = (po: PurchaseOrder) => {
    setPreviewPO(null);
    nav(`/purchase-order?edit=${po.id}`);
  };

  const handleDownload = async (po: PurchaseOrder) => {
    const ok = await downloadPurchaseOrderPDF(po);
    if (ok) toast.success(`PDF downloaded: ${po.poNumber}`);
  };

  const blankPoTitle = blankPoBrand === 'shree'
    ? 'Shree Jagdamba Steel Profile PO'
    : 'Jagdamba Profile PO';

  return (
    <>
      <ListView
        title="Purchase Orders"
        rows={purchaseOrders}
        getId={r => r.id}
        onNew={() => nav('/purchase-order')}
        extraToolbar={(
          <>
            <button
              type="button"
              onClick={() => setBlankPoBrand('jagdamba')}
              className="erp-btn erp-btn-navy"
            >
              <FileText className="w-4 h-4" /> Jagdamba Profile PO
            </button>
            <button
              type="button"
              onClick={() => setBlankPoBrand('shree')}
              className="erp-btn erp-btn-orange"
            >
              <FileText className="w-4 h-4" /> Shree Jagdamba Steel Profile PO
            </button>
          </>
        )}
        onDelete={async (po) => {
          if (!window.confirm(`Delete PO ${po.poNumber}?`)) return;
          await deletePurchaseOrder(po.id);
        }}
        onEdit={canEdit ? openEdit : undefined}
        onDownload={(po) => { void handleDownload(po); }}
        downloadLabel={r => r.poNumber.replace(/\//g, '_')}
        dateAccessor={r => r.date}
        searchAccessor={r => `${r.poNumber} ${r.supplierName} ${r.status}`}
        poActions={{ resolvePurchaseOrder: (row) => row }}
        onRowClick={(po) => setPreviewPO(po)}
        columns={[
          {
            header: 'PO No',
            render: r => (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPreviewPO(r); }}
                className="font-semibold text-brand-blue hover:underline text-left"
              >
                {r.poNumber}
              </button>
            ),
          },
          { header: 'Date', render: r => r.date },
          { header: 'Supplier', render: r => r.supplierName },
          { header: 'Items', render: r => r.items.length, align: 'center' },
          { header: 'Total (₹)', render: r => r.totalAmount.toLocaleString('en-IN'), align: 'right' },
          { header: 'Status', render: r => r.status, align: 'center' },
        ]}
      />
      {previewPO && (
        <PurchaseOrderPreviewModal
          po={previewPO}
          onClose={() => setPreviewPO(null)}
          onEdit={canEdit ? openEdit : undefined}
        />
      )}
      {blankPoBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[95vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-t-3xl">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {blankPoTitle}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await generateBlankPurchaseOrderPDF(blankPoBrand);
                    toast.success('PO PDF downloaded');
                  }}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!openPurchaseOrderPrintWindow(blankPoTitle, PO_BLANK_PRINT_AREA_ID, blankPoBrand)) {
                      toast.error('Print area not ready');
                    }
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button type="button" onClick={() => setBlankPoBrand(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="grow overflow-auto p-4 sm:p-8 bg-slate-200 dark:bg-slate-700/50">
              <div className="mx-auto shrink-0" style={{ width: PO_PRINT_WIDTH_PX, minWidth: PO_PRINT_WIDTH_PX }}>
                <PurchaseOrderPrint blank brand={blankPoBrand} printAreaId={PO_BLANK_PRINT_AREA_ID} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
