import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ShoppingCart, Plus, Trash2, Save, Printer, X,
  Mail, FileText, MessageCircle, Edit3, RotateCcw
} from 'lucide-react';
import {
  useAppContext,
  type PurchaseOrder,
  type POItem,
} from '../store/AppContext';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PurchaseOrderPrint } from '../components/PurchaseOrderPrint';
import { downloadPDF } from '../utils/pdfGenerator';

// ─── Constants ────────────────────────────────────────────────
const ITEM_TYPES = [
  'MS Plate', 'UC Beam', 'MS Angle', 'MS Channel', 'Round Pipe',
  'Square Pipe', 'Flat', 'Round Bar', 'MS Sheet', 'HR Coil',
  'SS Plate', 'SS Sheet', 'Chequered Plate', 'Tee Section', 'Other'
];

const GRADE_OPTIONS = [
  'E250', 'E350', 'E410', 'SS 304', 'SS 316',
  'SA 516 Gr 70', 'SA 387 Gr 11', 'Hardox 400', 'Hardox 500', 'Other'
];

const MAKE_OPTIONS = [
  'SAIL', 'JINDAL', 'TATA', 'AMNS', 'ESSAR', 'BHUSHAN',
  'VIZAG', 'RINL', 'JSW', 'LLOYDS', 'Other'
];

const RATE_BASIS_OPTIONS = ['Per Kg', 'Per Ton', 'Per Nos', 'Per Set', 'Per Piece'];

const PAYMENT_TERMS_OPTIONS = [
  'Immediate', '7 Days', '15 Days', '30 Days', '45 Days', '60 Days',
  'Against Delivery', 'Against Invoice', 'Advance', 'LC 30 Days', 'Other'
];

const INSPECTION_OPTIONS = ['Third Party', 'Customer', 'Our Inspection', 'No Inspection', 'Other'];
const TC_OPTIONS = ['Yes', 'No', 'If Available'];
const UT_LEVEL_OPTIONS = [
  'Not Required', 'Level 1', 'Level 2', 'Level 3',
  'IS 11630 – GRADE 1', 'IS 11630 – GRADE 2',
  'EN 10160 – S0/E0', 'EN 10160 – S0/E1', 'EN 10160 – S1/E1', 'EN 10160 – S1/E2',
  'EN 10160 – S2/E2', 'EN 10160 – S2/E3', 'EN 10160 – S3/E3', 'EN 10160 – S3/E4',
  'ASTM A578 – LEVEL A', 'ASTM A578 – LEVEL B', 'ASTM A578 – LEVEL C',
  'ASME SA-578 – LEVEL A', 'ASME SA-578 – LEVEL B', 'ASME SA-578 – LEVEL C',
  'ASTM A435', 'IS 4225', 'AS PER CUSTOMER SPECIFICATION', 'OTHER'
];
const TRANSPORT_OPTIONS = ['Road', 'Rail', 'Air', 'Courier', 'Self Pick', 'Other'];
const LOADING_OPTIONS = ['Included', 'Extra', 'By Supplier', 'By Our Scope'];
const DELIVERY_LOCATIONS = ['Makarpura Unit', 'Por Unit', 'Site', 'Other'];

const GST_RATE = 18;

// ─── Helper ───────────────────────────────────────────────────
const createEmptyItem = (): POItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  item: '',
  grade: '',
  make: '',
  sizeSection: '',
  thickness: '',
  width: '',
  length: '',
  nos: 0,
  kg: 0,
  rate: 0,
  rateBasis: 'Per Kg',
  amount: 0,
});

const hasContent = (item: POItem) =>
  Boolean(item.item || item.grade || item.thickness || item.nos || item.kg || item.rate);

const fmt = (n: number, dec = 2) => n.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const fmtINR = (n: number) => `₹ ${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── Component ────────────────────────────────────────────────
export const PurchaseOrderEntry: React.FC = () => {
  const { nextPONo, purchaseOrders, setPurchaseOrders, role, user } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const existingPo = useMemo(() => purchaseOrders.find(po => po.id === editId), [editId, purchaseOrders]);
  const poNumber = existingPo?.poNumber ?? nextPONo();

  // ── Supplier Details ──────────────────────────────────────
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierName, setSupplierName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [supplierMobile, setSupplierMobile] = useState('');

  // ── Delivery Details ──────────────────────────────────────
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [transportName, setTransportName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [note, setNote] = useState('');
  const [remark, setRemark] = useState('');

  // ── Payment & Other ───────────────────────────────────────
  const [paymentTerms, setPaymentTerms] = useState('');
  const [inspection, setInspection] = useState('');
  const [tc, setTc] = useState('');
  const [utLevel, setUtLevel] = useState('');
  const [transport, setTransport] = useState('');
  const [loading, setLoading] = useState('');

  // ── Items ─────────────────────────────────────────────────
  const [items, setItems] = useState<POItem[]>([createEmptyItem()]);

  // ── PDF download state ────────────────────────────────────
  const [savedPO, setSavedPO] = useState<PurchaseOrder | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const canCreate = role === 'Admin' || role === 'Office Entry';

  // ── Computed Totals ────────────────────────────────────────
  const totalWeight = useMemo(() => items.reduce((s, i) => s + i.kg, 0), [items]);
  const totalAmount = useMemo(() => items.reduce((s, i) => s + i.amount, 0), [items]);
  const gstAmount = useMemo(() => Math.round(totalAmount * GST_RATE / 100 * 100) / 100, [totalAmount]);
  const roundOff = useMemo(() => {
    const grand = totalAmount + gstAmount;
    return Math.round(grand) - grand;
  }, [totalAmount, gstAmount]);
  const grandTotal = useMemo(() => Math.round(totalAmount + gstAmount), [totalAmount, gstAmount]);
  const filledItems = useMemo(() => items.filter(hasContent), [items]);

  // ── Item Handlers ──────────────────────────────────────────
  const updateItem = useCallback((id: string, field: keyof POItem, value: any) => {
    setItems(prev => {
      const updated = prev.map(item => {
        if (item.id !== id) return item;
        const u = { ...item, [field]: value };

        // Auto-calc weight for plates (THK × W × L × Nos × density)
        if (['thickness', 'width', 'length', 'nos'].includes(field as string)) {
          const thk = parseFloat(u.thickness) || 0;
          const w = parseFloat(u.width) || 0;
          const l = parseFloat(u.length) || 0;
          const n = Number(u.nos) || 0;
          if (thk && w && l && n) {
            u.kg = parseFloat((thk * w * l * n * 7.85 / 1_000_000).toFixed(3));
          }
        }

        // Recalc amount
        if (['kg', 'rate', 'thickness', 'width', 'length', 'nos'].includes(field as string)) {
          u.amount = Math.ceil(u.kg * u.rate);
        }

        return u;
      });

      // Auto-add row if last row got content
      const idx = updated.findIndex(i => i.id === id);
      if (idx === updated.length - 1 && hasContent(updated[idx])) {
        return [...updated, createEmptyItem()];
      }
      return updated;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      if (prev.length === 1) return [createEmptyItem()];
      return prev.filter(i => i.id !== id);
    });
  }, []);

  // ── Load for edit ──────────────────────────────────────────
  useEffect(() => {
    if (!editId) return;
    const existing = purchaseOrders.find(po => po.id === editId);
    if (!existing) return;
    setDate(existing.date);
    setSupplierName(existing.supplierName);
    setContactPerson(existing.contactPerson || '');
    setSupplierMobile(existing.supplierMobile || '');
    setDeliveryLocation(existing.deliveryLocation || existing.deliveryAddress || '');
    setTransportName(existing.transportName || '');
    setDriverMobile(existing.driverMobile || '');
    setNote(existing.note || '');
    setRemark(existing.remark || '');
    setPaymentTerms(existing.paymentTerms || '');
    setInspection(existing.inspection || '');
    setTc(existing.tc || '');
    setUtLevel(existing.utLevel || '');
    setTransport(existing.transport || '');
    setLoading(existing.loading || '');
    const loaded = existing.items.map(i => ({
      ...i,
      item: (i as any).item || '',
      make: (i as any).make || '',
      sizeSection: (i as any).sizeSection || '',
      rateBasis: (i as any).rateBasis || 'Per Kg',
    }));
    const last = loaded[loaded.length - 1];
    setItems(last && hasContent(last) ? [...loaded, createEmptyItem()] : loaded.length ? loaded : [createEmptyItem()]);
  }, [editId, purchaseOrders]);

  // ── Save ────────────────────────────────────────────────────
  const handleSave = async (withPrint = false) => {
    if (!supplierName.trim()) { toast.error('Supplier Name is required'); return; }
    if (filledItems.length === 0) { toast.error('Add at least one item'); return; }

    const newPO: PurchaseOrder = {
      id: editId || Date.now().toString(),
      poNumber,
      date,
      supplierName: supplierName.trim(),
      contactPerson: contactPerson.trim(),
      supplierMobile: supplierMobile.trim(),
      deliveryLocation: deliveryLocation.trim(),
      transportName: transportName.trim(),
      driverMobile: driverMobile.trim(),
      note: note.trim(),
      remark: remark.trim(),
      paymentTerms: paymentTerms.trim(),
      inspection: inspection.trim(),
      tc: tc.trim(),
      utLevel: utLevel.trim(),
      transport: transport.trim(),
      loading: loading.trim(),
      items: filledItems,
      totalKg: filledItems.reduce((s, i) => s + i.kg, 0),
      totalAmount: filledItems.reduce((s, i) => s + i.amount, 0),
      gstRate: GST_RATE,
      status: editId ? (purchaseOrders.find(p => p.id === editId)?.status || 'Pending') : 'Pending',
      createdBy: user?.displayName || 'ADMIN',
    };

    if (editId) {
      setPurchaseOrders(prev => prev.map(po => po.id === editId ? newPO : po));
      toast.success(`PO ${poNumber} updated!`, { icon: '🛍️' });
    } else {
      setPurchaseOrders(prev => [...prev, newPO]);
      toast.success(`PO ${poNumber} saved!`, { icon: '🛍️' });
    }

    if (withPrint) {
      setSavedPO(newPO);
      setIsDownloading(true);
    } else {
      setTimeout(() => navigate('/purchase-reports'), 700);
    }
  };

  useEffect(() => {
    if (isDownloading && savedPO) {
      const t = setTimeout(() => {
        downloadPDF('po-print-area', `PO_${savedPO.poNumber}`);
        setIsDownloading(false);
        setSavedPO(null);
        toast.success('Downloading PO PDF…');
        setTimeout(() => navigate('/purchase-reports'), 900);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [isDownloading, savedPO, navigate]);

  const handleReset = () => {
    setSupplierName(''); setContactPerson(''); setSupplierMobile('');
    setDeliveryLocation(''); setTransportName(''); setDriverMobile('');
    setNote(''); setRemark(''); setPaymentTerms('');
    setInspection(''); setTc(''); setUtLevel('');
    setTransport(''); setLoading('');
    setItems([createEmptyItem()]);
    toast('Form cleared', { icon: '🔄' });
  };

  // ── Reusable field components ──────────────────────────────
  const FieldInput = ({ label, value, onChange, placeholder, type = 'text', required = false }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; type?: string; required?: boolean;
  }) => (
    <div className="flex items-start gap-2 py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-600 min-w-[120px] pt-1.5 shrink-0">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 border border-slate-200 rounded px-2.5 py-1 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition"
      />
    </div>
  );

  const FieldSelect = ({ label, value, onChange, options, required = false }: {
    label: string; value: string; onChange: (v: string) => void;
    options: string[]; required?: boolean;
  }) => (
    <div className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-600 min-w-[120px] shrink-0">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 border border-slate-200 rounded px-2.5 py-1 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition"
      >
        <option value="">Select {label}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const FieldDate = ({ label, value, onChange, readOnly = false }: {
    label: string; value: string; onChange?: (v: string) => void; readOnly?: boolean;
  }) => (
    <div className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-600 min-w-[120px] shrink-0">
        {label}<span className="text-red-500 ml-0.5">*</span>
      </span>
      <input
        type="date"
        value={value}
        onChange={e => onChange?.(e.target.value)}
        readOnly={readOnly}
        className="flex-1 border border-slate-200 rounded px-2.5 py-1 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition"
      />
    </div>
  );

  const FieldReadOnly = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-600 min-w-[120px] shrink-0">
        {label}<span className="text-red-500 ml-0.5">*</span>
      </span>
      <span className="flex-1 border border-blue-200 bg-blue-50 rounded px-2.5 py-1 text-sm text-blue-700 font-semibold font-mono">
        {value}
      </span>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="fade-in pb-24 min-h-screen bg-slate-50">

      {/* Hidden PDF print area */}
      <div style={{ position: 'fixed', left: 0, top: 0, zIndex: -1, visibility: 'hidden', pointerEvents: 'none', width: '210mm' }}>
        {savedPO && <PurchaseOrderPrint po={savedPO} />}
      </div>

      {/* ── TOP HEADER BAR ──────────────────────────────────── */}
      <div className="bg-[#1a237e] text-white px-4 py-0 flex items-center justify-between gap-2 shadow-xl sticky top-0 z-30 min-h-[52px]">
        {/* Title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="bg-orange-500 p-1.5 rounded">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-base font-extrabold tracking-wider uppercase text-white">
            Purchase Order Entry
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 flex-wrap justify-end">
          <button
            onClick={() => toast('Email feature coming soon', { icon: '📧' })}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-all"
          >
            <Mail className="w-3.5 h-3.5" /> Email PO
          </button>
          <button
            onClick={() => { if (savedPO || filledItems.length > 0) handleSave(true); else toast.error('Save first'); }}
            className="flex items-center gap-1.5 bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-all"
          >
            <FileText className="w-3.5 h-3.5" /> PDF PO
          </button>
          <button
            onClick={() => toast('WhatsApp feature coming soon', { icon: '📱' })}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp PO
          </button>
          <button
            onClick={() => navigate(`/purchase-order?edit=${editId || ''}`)}
            className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit PO
          </button>
          <button
            onClick={handleReset}
            disabled={!canCreate}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-all disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> New PO <span className="opacity-70">(F2)</span>
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={!canCreate || isDownloading}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> Save <span className="opacity-70">(F3)</span>
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={!canCreate || isDownloading}
            className="flex items-center gap-1.5 bg-slate-500 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-all disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" /> Print <span className="opacity-70">(F4)</span>
          </button>
          <button
            onClick={() => navigate('/purchase-reports')}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-all"
          >
            <X className="w-3.5 h-3.5" /> Close <span className="opacity-70">(Esc)</span>
          </button>
        </div>
      </div>

      {!canCreate && (
        <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded px-4 py-2 text-sm text-amber-800 font-medium">
          ⚠️ Only Admin or Office Entry role can create purchase orders.
        </div>
      )}

      {/* ── THREE-COLUMN DETAILS ─────────────────────────────── */}
      <div className="mx-4 mt-3 grid grid-cols-1 lg:grid-cols-3 gap-0 border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white">

        {/* COL 1 – Supplier Details */}
        <div className="border-r border-slate-200">
          <div className="bg-[#e8f0fe] border-b border-slate-200 px-4 py-2 flex items-center gap-2">
            <span className="text-blue-700 text-base">👤</span>
            <span className="text-xs font-extrabold text-blue-800 uppercase tracking-wider">Supplier Details</span>
          </div>
          <div className="px-4 py-2 space-y-0.5">
            <FieldReadOnly label="PO No." value={poNumber} />
            <FieldDate label="PO Date" value={date} onChange={setDate} />
            <FieldInput label="Supplier Name" value={supplierName} onChange={setSupplierName} placeholder="Enter Supplier Name" required />
            <FieldInput label="Contact Person" value={contactPerson} onChange={setContactPerson} placeholder="Enter Contact Person" />
            <FieldInput label="Mobile No." value={supplierMobile} onChange={setSupplierMobile} placeholder="Enter Mobile Number" />
          </div>
        </div>

        {/* COL 2 – Delivery Details */}
        <div className="border-r border-slate-200">
          <div className="bg-[#e8f4fd] border-b border-slate-200 px-4 py-2 flex items-center gap-2">
            <span className="text-blue-700 text-base">🚚</span>
            <span className="text-xs font-extrabold text-blue-800 uppercase tracking-wider">Delivery Details</span>
          </div>
          <div className="px-4 py-2 space-y-0.5">
            <FieldSelect label="Delivery Location" value={deliveryLocation} onChange={setDeliveryLocation} options={DELIVERY_LOCATIONS} required />
            <FieldSelect label="Transport Name" value={transportName} onChange={setTransportName} options={TRANSPORT_OPTIONS} required />
            <FieldInput label="Driver Mobile No." value={driverMobile} onChange={setDriverMobile} placeholder="Enter Driver Mobile Number" />
            <div className="flex items-start gap-2 py-1.5 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-600 min-w-[120px] pt-1.5 shrink-0">Note</span>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Enter Note"
                rows={2}
                className="flex-1 border border-slate-200 rounded px-2.5 py-1 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition resize-none"
              />
            </div>
            <div className="flex items-start gap-2 py-1.5">
              <span className="text-xs font-semibold text-slate-600 min-w-[120px] pt-1.5 shrink-0">Remark</span>
              <textarea
                value={remark}
                onChange={e => setRemark(e.target.value)}
                placeholder="Enter Remark"
                rows={2}
                className="flex-1 border border-slate-200 rounded px-2.5 py-1 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition resize-none"
              />
            </div>
          </div>
        </div>

        {/* COL 3 – Payment & Other + Transport & Loading */}
        <div>
          <div className="bg-[#fef3e8] border-b border-slate-200 px-4 py-2 flex items-center gap-2">
            <span className="text-orange-600 text-base">💳</span>
            <span className="text-xs font-extrabold text-orange-800 uppercase tracking-wider">Payment &amp; Other Details</span>
          </div>
          <div className="px-4 py-2 space-y-0.5">
            <FieldSelect label="Payment Terms" value={paymentTerms} onChange={setPaymentTerms} options={PAYMENT_TERMS_OPTIONS} required />
            <FieldSelect label="Inspection" value={inspection} onChange={setInspection} options={INSPECTION_OPTIONS} />
            <FieldSelect label="Test Certificate" value={tc} onChange={setTc} options={TC_OPTIONS} />
            <FieldSelect label="UT Level" value={utLevel} onChange={setUtLevel} options={UT_LEVEL_OPTIONS} />
          </div>
          {/* Transport & Loading sub-section */}
          <div className="border-t border-slate-200">
            <div className="bg-[#e8f4fd] border-b border-slate-200 px-4 py-2 flex items-center gap-2">
              <span className="text-blue-700 text-base">🚛</span>
              <span className="text-xs font-extrabold text-blue-800 uppercase tracking-wider">Transport &amp; Loading</span>
            </div>
            <div className="px-4 py-2 space-y-0.5">
              <FieldSelect label="Transport" value={transport} onChange={setTransport} options={TRANSPORT_OPTIONS} required />
              <FieldSelect label="Loading" value={loading} onChange={setLoading} options={LOADING_OPTIONS} required />
            </div>
          </div>
        </div>
      </div>

      {/* ── ITEM DETAILS TABLE ────────────────────────────────── */}
      <div className="mx-4 mt-4 border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white">
        {/* Table Header Bar */}
        <div className="bg-[#1a237e] text-white px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider">📦 Item Details</span>
          <button
            onClick={() => setItems(prev => [...prev, createEmptyItem()])}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Item <span className="opacity-70">(F6)</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[1100px]">
            <thead>
              <tr className="bg-[#1a237e] text-white text-center">
                <th className="px-2 py-2.5 border-r border-blue-700 font-bold w-9 text-center">SR NO.</th>
                <th className="px-2 py-2.5 border-r border-blue-700 font-bold min-w-[120px]">ITEM</th>
                <th className="px-2 py-2.5 border-r border-blue-700 font-bold min-w-[80px]">GRADE</th>
                <th className="px-2 py-2.5 border-r border-blue-700 font-bold min-w-[80px]">MAKE</th>
                <th className="px-2 py-2.5 border-r border-blue-700 font-bold min-w-[100px]">SIZE / SECTION</th>
                <th className="px-2 py-2.5 border-r border-blue-700 font-bold w-20">THICK (MM)</th>
                <th className="px-2 py-2.5 border-r border-blue-700 font-bold w-20">WIDTH (MM)</th>
                <th className="px-2 py-2.5 border-r border-blue-700 font-bold w-24">LENGTH (MM)</th>
                <th className="px-2 py-2.5 border-r border-blue-700 font-bold w-14">NOS</th>
                <th className="px-2 py-2.5 border-r border-blue-700 font-bold w-24">WEIGHT (KG)</th>
                <th className="px-2 py-2.5 border-r border-blue-700 font-bold w-20">RATE (₹)</th>
                <th className="px-2 py-2.5 border-r border-blue-700 font-bold w-24">RATE BASIS</th>
                <th className="px-2 py-2.5 border-r border-blue-700 font-bold w-28">AMOUNT (₹)</th>
                <th className="px-2 py-2.5 font-bold w-12 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`group border-b border-slate-100 hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                >
                  {/* SR NO */}
                  <td className="px-2 py-1.5 text-center text-slate-500 font-bold border-r border-slate-100">
                    {hasContent(item) ? idx + 1 : ''}
                  </td>

                  {/* ITEM */}
                  <td className="px-1 py-1 border-r border-slate-100">
                    <select
                      value={item.item}
                      onChange={e => updateItem(item.id, 'item', e.target.value)}
                      className="w-full border border-transparent group-hover:border-slate-200 bg-transparent rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white"
                    >
                      <option value="">-</option>
                      {ITEM_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </td>

                  {/* GRADE */}
                  <td className="px-1 py-1 border-r border-slate-100">
                    <select
                      value={item.grade}
                      onChange={e => updateItem(item.id, 'grade', e.target.value)}
                      className="w-full border border-transparent group-hover:border-slate-200 bg-transparent rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white"
                    >
                      <option value="">-</option>
                      {GRADE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </td>

                  {/* MAKE */}
                  <td className="px-1 py-1 border-r border-slate-100">
                    <select
                      value={item.make}
                      onChange={e => updateItem(item.id, 'make', e.target.value)}
                      className="w-full border border-transparent group-hover:border-slate-200 bg-transparent rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white"
                    >
                      <option value="">-</option>
                      {MAKE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </td>

                  {/* SIZE / SECTION */}
                  <td className="px-1 py-1 border-r border-slate-100">
                    <input
                      type="text"
                      value={item.sizeSection}
                      onChange={e => updateItem(item.id, 'sizeSection', e.target.value)}
                      placeholder="-"
                      className="w-full border border-transparent group-hover:border-slate-200 bg-transparent rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white"
                    />
                  </td>

                  {/* THICK */}
                  <td className="px-1 py-1 border-r border-slate-100">
                    <input
                      type="text"
                      value={item.thickness}
                      onChange={e => updateItem(item.id, 'thickness', e.target.value)}
                      placeholder="-"
                      className="w-full border border-transparent group-hover:border-slate-200 bg-transparent rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white text-center"
                    />
                  </td>

                  {/* WIDTH */}
                  <td className="px-1 py-1 border-r border-slate-100">
                    <input
                      type="text"
                      value={item.width}
                      onChange={e => updateItem(item.id, 'width', e.target.value)}
                      placeholder="-"
                      className="w-full border border-transparent group-hover:border-slate-200 bg-transparent rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white text-center"
                    />
                  </td>

                  {/* LENGTH */}
                  <td className="px-1 py-1 border-r border-slate-100">
                    <input
                      type="text"
                      value={item.length}
                      onChange={e => updateItem(item.id, 'length', e.target.value)}
                      placeholder="-"
                      className="w-full border border-transparent group-hover:border-slate-200 bg-transparent rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white text-center"
                    />
                  </td>

                  {/* NOS */}
                  <td className="px-1 py-1 border-r border-slate-100">
                    <input
                      type="number"
                      value={item.nos || ''}
                      onChange={e => updateItem(item.id, 'nos', Number(e.target.value))}
                      placeholder="0"
                      className="w-full border border-transparent group-hover:border-slate-200 bg-transparent rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white text-center"
                    />
                  </td>

                  {/* WEIGHT (KG) */}
                  <td className="px-1 py-1 border-r border-slate-100">
                    <input
                      type="number"
                      step="0.001"
                      value={item.kg || ''}
                      onChange={e => updateItem(item.id, 'kg', Number(e.target.value))}
                      placeholder="0.000"
                      className="w-full border border-transparent group-hover:border-slate-200 bg-transparent rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white text-right font-semibold text-slate-700"
                    />
                  </td>

                  {/* RATE */}
                  <td className="px-1 py-1 border-r border-slate-100">
                    <input
                      type="number"
                      value={item.rate || ''}
                      onChange={e => updateItem(item.id, 'rate', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full border border-transparent group-hover:border-slate-200 bg-transparent rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white text-right"
                    />
                  </td>

                  {/* RATE BASIS */}
                  <td className="px-1 py-1 border-r border-slate-100">
                    <select
                      value={item.rateBasis}
                      onChange={e => updateItem(item.id, 'rateBasis', e.target.value)}
                      className="w-full border border-transparent group-hover:border-slate-200 bg-transparent rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white"
                    >
                      {RATE_BASIS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </td>

                  {/* AMOUNT */}
                  <td className="px-2 py-1.5 border-r border-slate-100 text-right font-bold text-slate-800">
                    {item.amount > 0 ? item.amount.toLocaleString('en-IN') : ''}
                  </td>

                  {/* ACTION */}
                  <td className="px-2 py-1.5 text-center">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Footer totals row */}
            <tfoot>
              <tr className="bg-[#e8f0fe] border-t-2 border-[#1a237e] font-bold text-xs text-slate-800">
                <td colSpan={8} className="px-3 py-2 text-left">
                  <span className="text-blue-800">Total Items : {filledItems.length}</span>
                </td>
                <td className="px-2 py-2 text-center text-slate-700"></td>
                <td className="px-2 py-2 text-right text-blue-800">
                  Total Weight (KG) : {fmt(totalWeight, 2)}
                </td>
                <td colSpan={2} className="px-2 py-2 text-right text-slate-700"></td>
                <td className="px-2 py-2 text-right text-blue-800">
                  Total Amount (₹) : {totalAmount.toLocaleString('en-IN')}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── TERMS & CONDITIONS + TAX SUMMARY ─────────────────── */}
      <div className="mx-4 mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Terms & Conditions */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-[#e8f0fe] border-b border-slate-200 px-4 py-2 flex items-center gap-2">
            <span className="text-blue-700 text-sm">📋</span>
            <span className="text-xs font-extrabold text-blue-800 uppercase tracking-wider">Terms &amp; Conditions</span>
          </div>
          <div className="px-4 py-3">
            <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>Material should be as per our requirement &amp; specification.</li>
              <li>Delivery should be within agreed time schedule.</li>
              <li>Test certificate (TC) must accompany the material.</li>
              <li>Payment will be made as per agreed payment terms.</li>
              <li>Subject to Vadodara jurisdiction only.</li>
            </ol>
          </div>
        </div>

        {/* Tax Summary */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100">
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-slate-600">Total Before Tax</span>
              <span className="text-sm font-semibold text-slate-800">
                ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-slate-600">GST ({GST_RATE}%)</span>
              <span className="text-sm font-semibold text-slate-800">
                ₹ {gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-slate-600">Round Off</span>
              <span className="text-sm font-semibold text-slate-800">
                ₹ {roundOff.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-4 bg-orange-500">
              <span className="text-base font-extrabold text-white uppercase tracking-wider">Grand Total</span>
              <span className="text-xl font-extrabold text-white">
                ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM NOTE BAR ───────────────────────────────────── */}
      <div className="mx-4 mt-4 border border-slate-200 rounded-lg bg-white px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 shadow-sm">
        <div className="flex items-center gap-4">
          <span><strong className="text-slate-700">NOTE :</strong> 1. Weight calculated as per standard.</span>
          <span>2. All dimensions are in MM.</span>
          <span>3. Weight tolerance ± 5% acceptable.</span>
        </div>
        <div className="flex items-center gap-4 text-slate-600">
          <span>Created By : <strong>{user?.displayName || 'ADMIN'}</strong></span>
          <span>|</span>
          <span>{new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}</span>
        </div>
      </div>

    </div>
  );
};
