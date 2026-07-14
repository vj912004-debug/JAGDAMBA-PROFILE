import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Truck, Pencil, Trash2, Search, FileSpreadsheet, Printer, Edit2, Save, Plus, Filter } from 'lucide-react';
import { useAppContext, type TransportMasterRecord } from '../store/AppContext';
import { nextMasterCode } from '../utils/masterHelpers';
import { ErpEntryPage, ErpEntryToolbar, ErpListPagination, paginateRows } from '../components/ErpPageShell';
import { NumericInput } from '../components/NumericInput';
import { exportToExcel } from '../utils/excel';
import toast from 'react-hot-toast';

const STATES = ['Gujarat', 'Maharashtra', 'Rajasthan', 'Madhya Pradesh', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Other'];
const VEHICLE_TYPES = ['Pickup', 'Tata 407', 'Tata 407 (Tempo)', 'Eicher 11 Ton', 'Trailer 20 Ton', 'Other'];
const DEFAULT_CITIES = ['Ahmedabad', 'Vadodara', 'Surat', 'Rajkot', 'Jamnagar', 'Bhavnagar', 'Gandhinagar'];

type FormState = {
  id: string;
  code: string;
  name: string;
  contact: string;
  phone: string;
  altMobile: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gst: string;
  email: string;
  vehicleCapacity: string;
  vehicleType: string;
  ratePerKg: string;
  remark: string;
};

const blank = (code: string): FormState => ({
  id: '',
  code,
  name: '',
  contact: '',
  phone: '',
  altMobile: '',
  mobile: '',
  address: '',
  city: '',
  state: 'Gujarat',
  pincode: '',
  gst: '',
  email: '',
  vehicleCapacity: '',
  vehicleType: '',
  ratePerKg: '',
  remark: '',
});

const toForm = (t: TransportMasterRecord): FormState => ({
  id: t.id,
  code: t.code,
  name: t.name,
  contact: t.contact || '',
  phone: t.phone || '',
  altMobile: t.altMobile || '',
  mobile: t.mobile,
  address: t.address || '',
  city: t.city || '',
  state: t.state || 'Gujarat',
  pincode: t.pincode || '',
  gst: t.gst || '',
  email: t.email || '',
  vehicleCapacity: t.vehicleCapacity || '',
  vehicleType: t.vehicleType || '',
  ratePerKg: t.ratePerKg || '',
  remark: t.remark || '',
});

const Req = () => <span className="text-red-500"> *</span>;

const Field: React.FC<{
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ label, children, className = '' }) => (
  <div className={`tm-field ${className}`}>
    <label className="tc-mgmt-label">{label}</label>
    {children}
  </div>
);

export const TransportMaster: React.FC = () => {
  const location = useLocation();
  const { transports, addTransport, updateTransport, deleteTransport } = useAppContext();
  const nextCode = useMemo(() => nextMasterCode('TR-', transports, 3), [transports]);
  const [f, setF] = useState(() => blank(nextCode));
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const set = (k: keyof FormState) => (v: string) => setF(p => ({ ...p, [k]: v }));

  const handleNew = () => {
    setF(blank(nextMasterCode('TR-', transports, 3)));
    toast('New transport form');
  };

  const load = (t: TransportMasterRecord) => {
    setF(toForm(t));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const masterId = (location.state as { masterId?: string } | null)?.masterId;
    if (!masterId) return;
    const found = transports.find(t => t.id === masterId);
    if (found) load(found);
  }, [location.state, transports]);

  const handleSave = async () => {
    if (!f.name.trim()) { toast.error('Transport Name is required'); return; }
    if (!f.mobile.trim()) { toast.error('Mobile No. is required'); return; }
    if (!f.address.trim()) { toast.error('Address is required'); return; }
    if (!f.city.trim()) { toast.error('City is required'); return; }

    const payload = {
      code: f.code,
      name: f.name.trim().toUpperCase(),
      contact: f.contact.trim(),
      phone: f.phone.trim(),
      altMobile: f.altMobile.trim(),
      mobile: f.mobile.trim(),
      address: f.address.trim(),
      gst: f.gst.trim().toUpperCase(),
      city: f.city.trim(),
      state: f.state,
      pincode: f.pincode.trim(),
      email: f.email.trim(),
      vehicleCapacity: f.vehicleCapacity.trim(),
      vehicleType: f.vehicleType,
      ratePerKg: f.ratePerKg.trim(),
      remark: f.remark.trim(),
    };
    try {
      if (f.id) {
        await updateTransport({ id: f.id, ...payload });
        toast.success('Transport updated');
      } else {
        const created = await addTransport(payload);
        setF(prev => ({ ...prev, id: created.id }));
        toast.success('Transport saved');
      }
    } catch {
      toast.error('Transport saved locally but server sync failed — try Save again');
    }
  };

  const handleDelete = async () => {
    if (!f.id) {
      toast.error('Load a transport from list first');
      return;
    }
    if (!confirm(`Delete transport "${f.name}"?`)) return;
    try {
      await deleteTransport(f.id);
      handleNew();
      toast.success('Transport deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleDeleteRow = async (t: TransportMasterRecord) => {
    if (!confirm(`Delete transport "${t.name}"?`)) return;
    try {
      await deleteTransport(t.id);
      if (f.id === t.id) handleNew();
      toast.success('Transport deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const cityOptions = useMemo(() => {
    const fromData = transports.map(t => t.city).filter(Boolean);
    return Array.from(new Set([...DEFAULT_CITIES, ...fromData])).sort();
  }, [transports]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transports.filter(t => {
      const matchSearch = !q || `${t.name} ${t.mobile} ${t.city} ${t.contact} ${t.vehicleType}`.toLowerCase().includes(q);
      const matchCity = !filterCity || t.city === filterCity;
      const matchVehicle = !filterVehicle || t.vehicleType === filterVehicle;
      return matchSearch && matchCity && matchVehicle;
    });
  }, [transports, search, filterCity, filterVehicle]);

  const paged = useMemo(() => paginateRows(filtered, page, pageSize), [filtered, page, pageSize]);

  const handleExport = () => {
    exportToExcel(
      filtered.map((t, i) => ({
        'Sr No.': i + 1,
        'Transport Name': t.name,
        'Contact Person': t.contact,
        'Mobile No.': t.mobile,
        City: t.city,
        'Vehicle Type': t.vehicleType || '',
        'Vehicle Capacity': t.vehicleCapacity || '',
        'Rate / KG': t.ratePerKg || '',
        'GST No.': t.gst,
      })),
      'Transport List',
      'Transport_Master.xlsx',
    );
    toast.success('Excel exported');
  };

  return (
    <ErpEntryPage className="tm-page">
      <ErpEntryToolbar
        buttons={[
          { label: 'Save', tone: 'green', icon: <Save className="w-4 h-4" />, hotkey: 'save', onClick: () => void handleSave() },
          { label: 'New', tone: 'blue', icon: <Plus className="w-4 h-4" />, hotkey: 'new', onClick: handleNew },
          { label: 'Edit', tone: 'orange', icon: <Edit2 className="w-4 h-4" />, onClick: () => (f.id ? toast('Editing loaded record') : toast.error('Select a transport from list')) },
          { label: 'Delete', tone: 'red', icon: <Trash2 className="w-4 h-4" />, onClick: () => void handleDelete() },
          { label: 'Print', tone: 'purple', icon: <Printer className="w-4 h-4" />, hotkey: 'print', onClick: () => window.print() },
        ]}
      />

      {/* TRANSPORT MASTER DETAILS */}
      <div className="tc-mgmt-panel">
        <div className="tc-mgmt-panel-head">Transport Master Details</div>

        <div className="tm-form-grid">
          <Field label="Transport Code">
            <input value={f.code} readOnly className="tc-mgmt-input bg-slate-100 dark:bg-slate-800 font-mono text-slate-600" />
          </Field>
          <Field label={<>Transport Name<Req /></>}>
            <input value={f.name} onChange={e => set('name')(e.target.value)} className="tc-mgmt-input" />
          </Field>
          <Field label="Contact Person">
            <input value={f.contact} onChange={e => set('contact')(e.target.value)} className="tc-mgmt-input" />
          </Field>
          <Field label="Phone No.">
            <input value={f.phone} onChange={e => set('phone')(e.target.value)} className="tc-mgmt-input" />
          </Field>

          <Field label="Alt. Mobile No.">
            <input value={f.altMobile} onChange={e => set('altMobile')(e.target.value)} className="tc-mgmt-input" />
          </Field>
          <Field label={<>Mobile No.<Req /></>}>
            <input value={f.mobile} onChange={e => set('mobile')(e.target.value)} className="tc-mgmt-input" />
          </Field>
          <Field label={<>Address<Req /></>}>
            <textarea value={f.address} onChange={e => set('address')(e.target.value)} rows={3} className="tc-mgmt-input min-h-[78px]" />
          </Field>
          <Field label={<>City<Req /></>}>
            <select value={f.city} onChange={e => set('city')(e.target.value)} className="tc-mgmt-input">
              <option value="">Select city</option>
              {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="State">
            <select value={f.state} onChange={e => set('state')(e.target.value)} className="tc-mgmt-input">
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="GST No.">
            <input value={f.gst} onChange={e => set('gst')(e.target.value)} className="tc-mgmt-input" />
          </Field>
          <Field label="Email ID">
            <input type="email" value={f.email} onChange={e => set('email')(e.target.value)} className="tc-mgmt-input" />
          </Field>
          <Field label="Pincode">
            <input value={f.pincode} onChange={e => set('pincode')(e.target.value)} className="tc-mgmt-input" />
          </Field>

          <Field label="Vehicle Capacity">
            <input value={f.vehicleCapacity} onChange={e => set('vehicleCapacity')(e.target.value)} className="tc-mgmt-input" placeholder="e.g. 5 Ton" />
          </Field>
          <Field label="Vehicle Type">
            <select value={f.vehicleType} onChange={e => set('vehicleType')(e.target.value)} className="tc-mgmt-input">
              <option value="">Select vehicle type</option>
              {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Rate / KG (Optional)">
            <NumericInput value={f.ratePerKg} onChange={set('ratePerKg')} className="tc-mgmt-input" />
          </Field>
          <Field label="Remark" className="span-2">
            <input value={f.remark} onChange={e => set('remark')(e.target.value)} className="tc-mgmt-input" />
          </Field>
        </div>
      </div>

      {/* TRANSPORT LIST */}
      <div className="tc-mgmt-panel mt-4">
        <div className="tc-mgmt-panel-head flex items-center gap-2">
          <Truck className="w-4 h-4" /> Transport List
        </div>

        <div className="tm-list-toolbar">
          <div className="tm-search">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search Transport Name, Mobile No., City..."
              className="tc-mgmt-input pl-9 w-full"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(v => !v)}
            className={`tm-filter-btn ${showFilters ? 'active' : ''}`}
          >
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
          <div className="tm-actions">
            <button type="button" onClick={handleExport} className="erp-entry-btn erp-entry-btn-outline-green text-[10px] py-1.5 px-2.5">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export To Excel
            </button>
            <button type="button" onClick={() => window.print()} className="erp-entry-btn erp-entry-btn-outline-orange text-[10px] py-1.5 px-2.5">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="tm-filter-panel">
            <div className="min-w-[140px]">
              <label className="tc-mgmt-label">City</label>
              <select value={filterCity} onChange={e => { setFilterCity(e.target.value); setPage(1); }} className="tc-mgmt-input">
                <option value="">All Cities</option>
                {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="min-w-[160px]">
              <label className="tc-mgmt-label">Vehicle Type</label>
              <select value={filterVehicle} onChange={e => { setFilterVehicle(e.target.value); setPage(1); }} className="tc-mgmt-input">
                <option value="">All Types</option>
                {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            {(filterCity || filterVehicle) && (
              <div className="flex items-end">
                <button type="button" onClick={() => { setFilterCity(''); setFilterVehicle(''); setPage(1); }} className="tm-filter-btn">
                  Clear
                </button>
              </div>
            )}
          </div>
        )}

        <div className="tm-table-wrap">
          <table className="tm-table">
            <thead>
              <tr>
                <th>Sr No.</th>
                <th>Transport Name</th>
                <th>Contact Person</th>
                <th>Mobile No.</th>
                <th>City</th>
                <th>Vehicle Type</th>
                <th>Vehicle Capacity</th>
                <th>Rate / KG</th>
                <th>GST No.</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10 text-slate-400 italic">No transport records found</td></tr>
              ) : paged.map((t, i) => (
                <tr
                  key={t.id}
                  className={`cursor-pointer ${f.id === t.id ? 'selected' : ''}`}
                  onClick={() => load(t)}
                >
                  <td>{(page - 1) * pageSize + i + 1}</td>
                  <td className="name-cell">{t.name}</td>
                  <td>{t.contact || '—'}</td>
                  <td>{t.mobile}</td>
                  <td>{t.city || '—'}</td>
                  <td>{t.vehicleType || '—'}</td>
                  <td>{t.vehicleCapacity || '—'}</td>
                  <td>{t.ratePerKg || '—'}</td>
                  <td>{t.gst || '—'}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="flex justify-center gap-1.5">
                      <button type="button" onClick={() => load(t)} className="erp-master-action-edit" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => void handleDeleteRow(t)} className="erp-master-action-delete" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ErpListPagination
          page={page}
          pageSize={pageSize}
          total={filtered.length}
          onPageChange={setPage}
          navLabels="text"
          activeTone="orange"
        />
      </div>
    </ErpEntryPage>
  );
};
