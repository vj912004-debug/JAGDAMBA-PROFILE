import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext, type PartyMaster, BRANCHES, EMPLOYEES } from '../store/AppContext';
import {
  Plus, Save, Edit2, Trash2, Search, MessageSquare, Mail, Printer, FileDown, X,
  User, MapPin, FileText, ClipboardList, ShoppingCart, Truck, IndianRupee, CalendarClock, UploadCloud, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { importFromExcel } from '../utils/excel';
import { excelRowToParty } from '../utils/partyExcel';
import { erpHotkeyProps } from '../utils/erpHotkeys';
import { isSupplierParty } from '../utils/masterHelpers';
import {
  applyGstLookupToPartyForm,
  fetchGstCaptcha,
  fetchGstDetails,
  findPartyByGst,
  submitGstLookupWithCaptcha,
  type GstLookupResult,
} from '../utils/gstLookup';
import { isValidGstinFormat, localGstLookup, normalizeGstin } from '../utils/gstHelpers';

const CATEGORIES = ['Customer', 'Supplier', 'Both'];
const STATES = ['Gujarat', 'Maharashtra', 'Rajasthan', 'Madhya Pradesh', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Other'];
const DOC_TYPES = [
  { key: 'gst' as const, label: 'GST Certificate' },
  { key: 'pan' as const, label: 'PAN Card' },
  { key: 'msme' as const, label: 'MSME Certificate' },
];

type DocKey = typeof DOC_TYPES[number]['key'];

const blankForm = () => ({
  id: '',
  partyCode: '',
  partyName: '',
  reference: '',
  category: 'Customer',
  contactPerson: '',
  mobileNumber: '',
  mobile2: '',
  whatsappNumber: '',
  email: '',
  address: '',
  city: '',
  state: 'Gujarat',
  country: 'India',
  pincode: '',
  gstNumber: '',
  panNumber: '',
  msmeNumber: '',
  salesPerson: '',
  followupPerson: '',
  remark: '',
  partyStatus: 'Active',
  location: BRANCHES[0] || '',
  deliveryAddress: '',
  supplierAddress: '',
  grades: [] as string[],
});

type FormState = ReturnType<typeof blankForm>;

const fmtDate = (iso: string) => {
  if (!iso || iso === '-') return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB');
};

const fmtMoney = (n: number) =>
  `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const PartyMasterPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { parties, addParty, updateParty, deleteParty, importParties, orders } = useAppContext();
  const excelInputRef = useRef<HTMLInputElement>(null);
  const docInputRefs = useRef<Record<DocKey, HTMLInputElement | null>>({ gst: null, pan: null, msme: null });

  const nextCode = useMemo(() => `P${String(parties.length + 1).padStart(6, '0')}`, [parties.length]);
  const [form, setForm] = useState<FormState>(() => ({ ...blankForm(), partyCode: nextCode }));
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [docs, setDocs] = useState<Record<DocKey, string | null>>({ gst: null, pan: null, msme: null });
  const [gstLoading, setGstLoading] = useState(false);
  const [gstCaptchaModal, setGstCaptchaModal] = useState<{
    gstin: string;
    sessionId: string;
    image: string;
    imageUrl?: string;
    captcha: string;
  } | null>(null);

  const staffOptions = useMemo(() => {
    const fromParties = parties.flatMap(p =>
      [p.salesPerson, p.followupPerson].filter(Boolean) as string[]
    );
    return Array.from(new Set([...EMPLOYEES, ...fromParties])).sort();
  }, [parties]);

  const set = (field: keyof FormState, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const applyLookup = (lookup: GstLookupResult) => {
    setForm(prev => applyGstLookupToPartyForm(prev, lookup, STATES));
  };

  const openGstCaptchaModal = async (gstin: string) => {
    const cap = await fetchGstCaptcha();
    setGstCaptchaModal({
      gstin,
      sessionId: cap.sessionId,
      image: cap.image,
      imageUrl: cap.imageUrl,
      captcha: '',
    });
  };

  const submitGstCaptchaLookup = async () => {
    if (!gstCaptchaModal) return;
    const captcha = gstCaptchaModal.captcha.trim();
    if (!captcha) {
      toast.error('Enter the captcha shown');
      return;
    }

    setGstLoading(true);
    try {
      const lookup = await submitGstLookupWithCaptcha(
        gstCaptchaModal.gstin,
        captcha,
        gstCaptchaModal.sessionId,
      );
      applyLookup(lookup);
      setGstCaptchaModal(null);
      toast.success('Company details filled from GST portal');
    } catch (err) {
      toast.error((err as Error).message || 'Could not fetch GST details');
      try {
        await openGstCaptchaModal(gstCaptchaModal.gstin);
      } catch {
        // Captcha refresh failed; modal stays open with previous image.
      }
    } finally {
      setGstLoading(false);
    }
  };

  const fillFromGst = async (rawGst?: string) => {
    const gstin = normalizeGstin(rawGst ?? form.gstNumber);
    if (!gstin) return;
    if (!isValidGstinFormat(gstin)) {
      toast.error('Enter a valid 15-character GST number', { id: 'gst-toast' });
      return;
    }

    const existing = findPartyByGst(parties, gstin, form.id);
    if (existing) {
      applyLookup({
        gstNumber: normalizeGstin(existing.gstNumber || gstin),
        partyName: existing.partyName,
        legalName: existing.partyName,
        tradeName: existing.partyName,
        panNumber: existing.panNumber || '',
        address: existing.address || existing.deliveryAddress || '',
        city: existing.city || '',
        state: existing.state || '',
        pincode: existing.pincode || '',
        status: existing.partyStatus || '',
        source: 'party',
        partial: false,
      });
      toast.success('Details filled from existing party with this GST', { id: 'gst-toast' });
      return;
    }

    if (gstLoading) return;
    setGstLoading(true);
    
    try {
      let lookup = localGstLookup(gstin);
      try {
        const remote = await fetchGstDetails(gstin);
        lookup = remote;
      } catch {
        // Fall back to local PAN/state when lookup API is unavailable.
      }

      applyLookup(lookup);

      if (lookup.partyName && !lookup.partial) {
        toast.success('Company details filled from GST', { id: 'gst-toast' });
        return;
      }

      if ((lookup as any).requiresCaptcha) {
        toast('PAN & state filled. Enter the captcha below to fetch company name and address.', { duration: 6000, id: 'gst-toast' });
        await openGstCaptchaModal(gstin);
      } else {
        toast.success('PAN & state filled. Please enter company details manually.', { id: 'gst-toast' });
      }
    } catch (err) {
      applyLookup(localGstLookup(gstin));
      toast.error((err as Error).message || 'Could not load GST verification', { id: 'gst-toast' });
    } finally {
      setGstLoading(false);
    }
  };

  const handleGstChange = (value: string) => {
    set('gstNumber', normalizeGstin(value));
  };

  const handleGstBlur = () => {
    const gstin = normalizeGstin(form.gstNumber);
    if (gstin.length === 15 && isValidGstinFormat(gstin)) {
      void fillFromGst(gstin);
    }
  };

  const stats = useMemo(() => {
    const name = form.partyName.trim().toUpperCase();
    const partyOrders = orders.filter(o => o.partyName.trim().toUpperCase() === name);
    const totalVal = partyOrders.reduce((s, o) => s + o.items.reduce((a, i) => a + (i.amount || 0), 0), 0);
    const dispatched = partyOrders.filter(o => (o.stage || '').toLowerCase().includes('dispatch')).length;
    const lastDate = partyOrders.map(o => o.orderDate).sort().slice(-1)[0] || '-';
    return {
      inquiry: partyOrders.length,
      quotation: partyOrders.length,
      salesOrder: partyOrders.length,
      dispatch: dispatched,
      outstanding: totalVal,
      lastDate: fmtDate(lastDate),
    };
  }, [form.partyName, orders]);

  const clearDocs = () => setDocs({ gst: null, pan: null, msme: null });

  const handleNew = () => {
    setForm({ ...blankForm(), partyCode: nextCode });
    clearDocs();
    setGstCaptchaModal(null);
    toast('New party form');
  };

  const loadParty = (p: PartyMaster) => {
    setForm({
      id: p.id,
      partyCode: p.partyCode || `P${p.id.slice(-6)}`,
      partyName: p.partyName,
      reference: p.reference || '',
      category: p.category || 'Customer',
      contactPerson: p.contactPerson || '',
      mobileNumber: p.mobileNumber || '',
      mobile2: p.mobile2 || '',
      whatsappNumber: p.whatsappNumber || '',
      email: p.email || '',
      address: p.address || p.deliveryAddress || '',
      city: p.city || '',
      state: p.state || 'Gujarat',
      country: p.country || 'India',
      pincode: p.pincode || '',
      gstNumber: p.gstNumber || '',
      panNumber: p.panNumber || '',
      msmeNumber: p.msmeNumber || '',
      salesPerson: p.salesPerson || '',
      followupPerson: p.followupPerson || '',
      remark: p.remark || '',
      partyStatus: p.partyStatus || 'Active',
      location: p.location || BRANCHES[0] || '',
      deliveryAddress: p.deliveryAddress || '',
      supplierAddress: p.supplierAddress || '',
      grades: p.grades ?? [],
    });
    clearDocs();
    setGstCaptchaModal(null);
    setShowSearch(false);
  };

  useEffect(() => {
    const masterId = (location.state as { masterId?: string } | null)?.masterId;
    if (!masterId) return;
    const found = parties.find(p => p.id === masterId);
    if (found) loadParty(found);
  }, [location.state, parties]);

  const buildPayload = () => ({
    partyName: form.partyName.trim().toUpperCase(),
    contactPerson: form.contactPerson.trim().toUpperCase(),
    mobileNumber: form.mobileNumber.trim(),
    location: form.location,
    deliveryAddress: (form.deliveryAddress || form.address).trim().toUpperCase(),
    address: form.address.trim().toUpperCase(),
    supplierAddress: form.supplierAddress.trim().toUpperCase(),
    reference: form.reference.trim(),
    paymentTerms: '30 DAYS',
    gstNumber: form.gstNumber.trim().toUpperCase(),
    email: form.email.trim(),
    partyCode: form.partyCode,
    category: form.category,
    mobile2: form.mobile2.trim(),
    whatsappNumber: form.whatsappNumber.trim(),
    city: form.city.trim(),
    state: form.state,
    country: form.country,
    pincode: form.pincode.trim(),
    panNumber: form.panNumber.trim().toUpperCase(),
    msmeNumber: form.msmeNumber.trim(),
    salesPerson: form.salesPerson,
    followupPerson: form.followupPerson,
    remark: form.remark,
    partyStatus: form.partyStatus,
    grades: form.grades,
  });

  const handleSave = async () => {
    if (!form.partyName.trim()) {
      toast.error('Party Name is required');
      return;
    }
    try {
      if (form.id) {
        await updateParty({ id: form.id, ...buildPayload() });
        toast.success('Party updated successfully!');
      } else {
        const created = await addParty(buildPayload());
        setForm(prev => ({ ...prev, id: created.id }));
        toast.success('New party created!');
      }
    } catch {
      toast.error('Failed to save party to server — data kept in browser, try Save again');
    }
  };

  const handleDelete = async () => {
    if (!form.id) {
      toast.error('Load a party first');
      return;
    }
    if (!confirm(`Delete "${form.partyName}"?`)) return;
    try {
      await deleteParty(form.id);
      handleNew();
      toast.success('Party deleted');
    } catch {
      toast.error('Failed to delete party on server');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await importFromExcel(file);
      const parsed = rows.map(excelRowToParty).filter(p => p.partyName.trim());
      const { saved, skipped } = await importParties(parsed);
      toast.success(`${saved} parties imported${skipped ? ` (${skipped} skipped)` : ''}`);
    } catch {
      toast.error('Could not read Excel file');
    }
    e.target.value = '';
  };

  const handleDocPick = (key: DocKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type);
    if (!ok) {
      toast.error('Only PDF, JPG, PNG allowed');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Max file size is 2MB');
      e.target.value = '';
      return;
    }
    setDocs(prev => ({ ...prev, [key]: file.name }));
    e.target.value = '';
  };

  const filteredParties = useMemo(
    () =>
      parties.filter(
        p =>
          p.partyName.toUpperCase().includes(searchTerm.toUpperCase()) ||
          (p.mobileNumber || '').includes(searchTerm)
      ),
    [parties, searchTerm]
  );

  return (
    <div className="party-master-page">
      <input ref={excelInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />

      <div className="party-master-toolbar">
        <button {...erpHotkeyProps('new')} onClick={handleNew} className="party-master-btn party-master-btn-green">
          <Plus className="w-4 h-4" /> New Party
        </button>
        <button {...erpHotkeyProps('save')} onClick={handleSave} className="party-master-btn party-master-btn-blue">
          <Save className="w-4 h-4" /> Save
        </button>
        <button
          onClick={() => (form.id ? toast('Editing loaded party') : toast.error('Load a party via Search'))}
          className="party-master-btn party-master-btn-orange"
        >
          <Edit2 className="w-4 h-4" /> Edit
        </button>
        <button onClick={handleDelete} className="party-master-btn party-master-btn-red">
          <Trash2 className="w-4 h-4" /> Delete
        </button>
        <button onClick={() => setShowSearch(true)} className="party-master-btn party-master-btn-navy">
          <Search className="w-4 h-4" /> Search
        </button>
        <button {...erpHotkeyProps('whatsapp')} onClick={() => toast('Share on WhatsApp')} className="party-master-btn party-master-btn-green">
          <MessageSquare className="w-4 h-4" /> WhatsApp
        </button>
        <button onClick={() => toast('Email party')} className="party-master-btn party-master-btn-teal">
          <Mail className="w-4 h-4" /> Email
        </button>
        <button {...erpHotkeyProps('print')} onClick={() => window.print()} className="party-master-btn party-master-btn-purple">
          <Printer className="w-4 h-4" /> Print
        </button>
        <button onClick={() => toast('PDF download')} className="party-master-btn party-master-btn-navy">
          <FileDown className="w-4 h-4" /> PDF Download
        </button>
        {isSupplierParty(form) && form.id && (
          <button
            type="button"
            onClick={() => navigate('/supplier-ledger', { state: { supplierId: form.id } })}
            className="party-master-btn party-master-btn-teal"
          >
            <IndianRupee className="w-4 h-4" /> Supplier Ledger
          </button>
        )}
      </div>

      <div className="party-master-top-grid">
        <div>
          <label className="party-master-label">Party Code</label>
          <input
            value={`${form.partyCode} (Auto)`}
            readOnly
            className="party-master-input party-master-input-readonly"
          />
        </div>
        <div>
          <label className="party-master-label party-master-label-req">Party Name</label>
          <input
            value={form.partyName}
            onChange={e => set('partyName', e.target.value)}
            placeholder="Party name"
            className="party-master-input"
          />
        </div>
        <div>
          <label className="party-master-label">Party Reference</label>
          <input
            value={form.reference}
            onChange={e => set('reference', e.target.value)}
            placeholder="e.g. IndiaMART"
            className="party-master-input"
          />
        </div>
        <div>
          <label className="party-master-label party-master-label-req">Category</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} className="party-master-input">
            {CATEGORIES.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="party-master-3col">
        <SectionCard icon={User} title="Contact Details">
          <Field label="Contact Person" value={form.contactPerson} onChange={v => set('contactPerson', v)} />
          <Field label="Mobile No 1" required value={form.mobileNumber} onChange={v => set('mobileNumber', v)} />
          <Field label="Mobile No 2" value={form.mobile2} onChange={v => set('mobile2', v)} />
          <Field label="WhatsApp No" value={form.whatsappNumber} onChange={v => set('whatsappNumber', v)} />
          <Field label="Email ID" value={form.email} onChange={v => set('email', v)} />
        </SectionCard>

        <SectionCard icon={MapPin} title="Address Details">
          <div>
            <label className="party-master-label party-master-label-req">Address</label>
            <textarea
              value={form.address}
              onChange={e => set('address', e.target.value)}
              rows={2}
              className="party-master-input"
            />
          </div>
          <Field label="City" required value={form.city} onChange={v => set('city', v)} />
          <div>
            <label className="party-master-label party-master-label-req">State</label>
            <select value={form.state} onChange={e => set('state', e.target.value)} className="party-master-input">
              {STATES.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="party-master-label party-master-label-req">Country</label>
            <select value={form.country} onChange={e => set('country', e.target.value)} className="party-master-input">
              <option value="India">India</option>
            </select>
          </div>
          <Field label="Pincode" required value={form.pincode} onChange={v => set('pincode', v)} />
        </SectionCard>

        <SectionCard icon={FileText} title="GST & Legal Details">
          <div className="w-full min-w-0 space-y-2">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">GST No.</label>
            <input
              value={form.gstNumber}
              onChange={e => handleGstChange(e.target.value)}
              onBlur={handleGstBlur}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void fillFromGst();
                }
              }}
              placeholder="15-character GSTIN"
              maxLength={15}
              style={{ display: 'block', width: '100%', boxSizing: 'border-box' }}
              className="uppercase w-full min-w-0 bg-white border border-slate-300 rounded px-2.5 py-2 text-sm text-slate-800"
            />
            <button
              type="button"
              onClick={() => void fillFromGst()}
              disabled={gstLoading}
              style={{ display: 'block', width: '100%', boxSizing: 'border-box' }}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-extrabold uppercase text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
              title="Fetch company details from GST"
            >
              {gstLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Auto Fill from GST'}
            </button>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Enter GST number and click <strong>Auto Fill from GST</strong> (or press Tab). PAN &amp; state fill instantly.
              A captcha window opens to fetch company name, address, city and pincode.
            </p>
          </div>
          <Field label="PAN No." value={form.panNumber} onChange={v => set('panNumber', v)} />
          <Field label="MSME No." value={form.msmeNumber} onChange={v => set('msmeNumber', v)} />
        </SectionCard>
      </div>

      <div className="party-master-3col">
        <SectionCard icon={User} title="Sales Details">
          <div>
            <label className="party-master-label">Sales Person</label>
            <select
              value={form.salesPerson}
              onChange={e => set('salesPerson', e.target.value)}
              className="party-master-input"
            >
              <option value="">Select</option>
              {staffOptions.map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="party-master-label">Follow-up Person</label>
            <select
              value={form.followupPerson}
              onChange={e => set('followupPerson', e.target.value)}
              className="party-master-input"
            >
              <option value="">Select</option>
              {staffOptions.map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </SectionCard>

        <SectionCard icon={ClipboardList} title="Extra Details">
          <div>
            <label className="party-master-label">Remark</label>
            <textarea
              value={form.remark}
              onChange={e => set('remark', e.target.value)}
              rows={3}
              className="party-master-input"
            />
          </div>
          <div>
            <label className="party-master-label party-master-label-req">Party Status</label>
            <select
              value={form.partyStatus}
              onChange={e => set('partyStatus', e.target.value)}
              className={`party-master-input ${form.partyStatus === 'Active' ? 'party-master-status-active' : ''}`}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </SectionCard>

        <SectionCard icon={UploadCloud} title="Document Upload">
          <div className="party-master-doc-grid">
            {DOC_TYPES.map(({ key, label }) => (
              <div key={key}>
                <input
                  ref={el => {
                    docInputRefs.current[key] = el;
                  }}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={e => handleDocPick(key, e)}
                />
                {docs[key] ? (
                  <div className="party-master-doc-item">
                    <FileText className="w-4 h-4 shrink-0 text-red-500" />
                    <span className="text-xs font-semibold text-slate-700 truncate flex-1">{docs[key]}</span>
                    <button
                      type="button"
                      onClick={() => setDocs(prev => ({ ...prev, [key]: null }))}
                      className="text-red-500 hover:text-red-700 p-0.5"
                      aria-label={`Remove ${label}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => docInputRefs.current[key]?.click()}
                    className="party-master-doc-upload w-full"
                  >
                    <UploadCloud className="w-5 h-5 text-slate-400" />
                    <span className="text-[10px] font-semibold text-slate-500">{label}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="party-master-doc-note">(Only PDF, JPG, PNG allowed. Max size 2MB)</p>
        </SectionCard>
      </div>

      <div className="party-master-summary">
        <div className="party-master-summary-head">Party Summary (Auto)</div>
        <div className="party-master-summary-grid">
          <SummaryTile
            icon={ClipboardList}
            bg="bg-blue-50"
            color="text-brand-blue"
            label="Total Inquiry"
            value={String(stats.inquiry)}
          />
          <SummaryTile
            icon={FileText}
            bg="bg-emerald-50"
            color="text-emerald-600"
            label="Total Quotation"
            value={String(stats.quotation)}
          />
          <SummaryTile
            icon={ShoppingCart}
            bg="bg-indigo-50"
            color="text-indigo-600"
            label="Total Sales Order"
            value={String(stats.salesOrder)}
          />
          <SummaryTile
            icon={Truck}
            bg="bg-orange-50"
            color="text-brand-orange"
            label="Total Dispatch"
            value={String(stats.dispatch)}
          />
          <SummaryTile
            icon={IndianRupee}
            bg="bg-red-50"
            color="text-red-500"
            label="Total Outstanding"
            value={fmtMoney(stats.outstanding)}
          />
          <SummaryTile
            icon={CalendarClock}
            bg="bg-cyan-50"
            color="text-cyan-600"
            label="Last Transaction Date"
            value={stats.lastDate}
          />
        </div>
      </div>

      <p className="party-master-footer">© 2026 Jagdamba Profile ERP. All Rights Reserved.</p>

      {gstCaptchaModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="erp-section-header accent-blue justify-between">
              <span className="font-bold">GST Portal Verification</span>
              <button type="button" onClick={() => setGstCaptchaModal(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                GST No: <span className="font-bold text-slate-900 dark:text-slate-100">{gstCaptchaModal.gstin}</span>
              </p>
              <p className="text-xs text-slate-500">
                Enter the captcha from the official GST portal to fetch company name and address.
              </p>
              <div className="flex justify-center">
                <img
                  src={gstCaptchaModal.imageUrl || gstCaptchaModal.image}
                  alt="GST captcha"
                  className="border border-slate-200 rounded-lg bg-white max-h-16"
                  onError={() => {
                    setGstCaptchaModal(prev => {
                      if (!prev) return prev;
                      // Force URL-based captcha if data: image fails to render on some browsers/devices.
                      if (prev.imageUrl) return prev;
                      return { ...prev, imageUrl: `/api/erp/gst-captcha/${encodeURIComponent(prev.sessionId)}.png` };
                    });
                  }}
                />
              </div>
              <input
                autoFocus
                value={gstCaptchaModal.captcha}
                onChange={e => setGstCaptchaModal(prev => prev ? { ...prev, captcha: e.target.value.toUpperCase() } : prev)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void submitGstCaptchaLookup();
                  }
                }}
                placeholder="Enter captcha"
                className="party-master-input uppercase tracking-widest text-center"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!gstCaptchaModal) return;
                    setGstLoading(true);
                    try {
                      await openGstCaptchaModal(gstCaptchaModal.gstin);
                    } catch (err) {
                      toast.error((err as Error).message || 'Could not refresh captcha');
                    } finally {
                      setGstLoading(false);
                    }
                  }}
                  disabled={gstLoading}
                  className="party-master-btn party-master-btn-orange flex-1"
                >
                  Refresh Captcha
                </button>
                <button
                  type="button"
                  onClick={() => void submitGstCaptchaLookup()}
                  disabled={gstLoading}
                  className="party-master-btn party-master-btn-blue flex-1"
                >
                  {gstLoading ? 'Fetching...' : 'Fetch Details'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-20">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="erp-section-header accent-orange justify-between">
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4" /> Search Party
              </span>
              <button onClick={() => setShowSearch(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <input
                autoFocus
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name or mobile..."
                className="party-master-input mb-3"
              />
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {filteredParties.length === 0 ? (
                  <p className="text-sm text-slate-400 italic py-6 text-center">No parties found</p>
                ) : (
                  filteredParties.map(p => (
                    <button
                      key={p.id}
                      onClick={() => loadParty(p)}
                      className="w-full text-left px-3 py-2.5 hover:bg-orange-50/50 dark:hover:bg-slate-800 rounded-lg transition"
                    >
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{p.partyName}</p>
                      <p className="text-xs text-slate-500">
                        {p.contactPerson} {p.mobileNumber && `• ${p.mobileNumber}`}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SectionCard: React.FC<{ icon: React.ElementType; title: string; children: React.ReactNode }> = ({
  icon: Icon,
  title,
  children,
}) => (
  <div className="party-master-card">
    <div className="party-master-card-head">
      <Icon className="w-4 h-4" /> {title}
    </div>
    <div className="party-master-card-body">{children}</div>
  </div>
);

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}> = ({ label, value, onChange, required }) => (
  <div>
    <label className={`party-master-label ${required ? 'party-master-label-req' : ''}`}>{label}</label>
    <input value={value} onChange={e => onChange(e.target.value)} className="party-master-input" />
  </div>
);

const SummaryTile: React.FC<{
  icon: React.ElementType;
  bg: string;
  color: string;
  label: string;
  value: string;
}> = ({ icon: Icon, bg, color, label, value }) => (
  <div className={`party-master-summary-tile ${bg}`}>
    <span className={`w-9 h-9 rounded-lg bg-white/70 flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="w-5 h-5" />
    </span>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-slate-500 truncate">{label}</p>
      <p className={`text-sm font-black ${color} truncate`}>{value}</p>
    </div>
  </div>
);
