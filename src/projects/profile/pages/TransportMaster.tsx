import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Truck, Pencil, Trash2, Search, FileSpreadsheet, Printer, Edit2, Save, Plus, Filter, ArrowLeft, Check, X } from 'lucide-react';
import { useAppContext, type TransportMasterRecord, type TransportVehicle } from '../store/AppContext';
import { nextMasterCode } from '../utils/masterHelpers';
import { ErpListPagination, paginateRows } from '../components/ErpPageShell';
import { exportToExcel } from '../utils/excel';
import toast from 'react-hot-toast';

const STATES = ['Gujarat', 'Maharashtra', 'Rajasthan', 'Madhya Pradesh', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Other'];
const VEHICLE_TYPES = ['PICKUP', 'TRUCK', 'TRAILER', 'CONTAINER', 'TATA 407', 'EICHER 11 TON', 'OTHER'];
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
  vehicles: TransportVehicle[];
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
  vehicles: [],
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
  vehicles: t.vehicles || [],
});

const Req = () => <span className="text-red-500"> *</span>;

const Field: React.FC<{
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ label, children, className = '' }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-[10px] font-bold text-[#333333] uppercase tracking-wide">{label}</label>
    {children}
  </div>
);

export const TransportMaster: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { transports, addTransport, updateTransport, deleteTransport } = useAppContext();
  const nextCode = useMemo(() => nextMasterCode('TR-', transports, 3), [transports]);
  const [f, setF] = useState(() => blank(nextCode));
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [vForm, setVForm] = useState<Partial<TransportVehicle>>({});

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
      vehicles: f.vehicles,
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

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); handleNew(); }
      if (e.key === 'F3') { e.preventDefault(); void handleSave(); }
      if (e.key === 'F4') { e.preventDefault(); if (!f.id) toast.error('Select a transport from list'); else toast('Editing loaded record'); }
      if (e.key === 'F5') { e.preventDefault(); void handleDelete(); }
      if (e.key === 'F6') { e.preventDefault(); window.print(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [f.id, handleNew, handleSave, handleDelete]);

  const saveVehicle = () => {
    if (!vForm.vehicleNo) { toast.error('Vehicle No required'); return; }
    if (editingVehicleId && editingVehicleId !== 'new') {
      setF(prev => ({
        ...prev,
        vehicles: prev.vehicles.map(v => v.id === editingVehicleId ? { ...v, ...vForm } as TransportVehicle : v)
      }));
    } else {
      const newV: TransportVehicle = {
        id: Math.random().toString(36).substring(7),
        vehicleNo: vForm.vehicleNo.toUpperCase(),
        vehicleType: vForm.vehicleType || '',
        vehicleCapacity: vForm.vehicleCapacity || '',
        driverName: vForm.driverName || '',
        driverMobileNo: vForm.driverMobileNo || '',
        altMobileNo: vForm.altMobileNo || '',
        status: vForm.status || 'ACTIVE'
      };
      setF(prev => ({ ...prev, vehicles: [...prev.vehicles, newV] }));
    }
    setEditingVehicleId(null);
    setVForm({});
  };

  const editVehicle = (v: TransportVehicle) => {
    setEditingVehicleId(v.id);
    setVForm({ ...v });
  };

  const deleteVehicle = (id: string) => {
    if (!confirm('Delete this vehicle?')) return;
    setF(prev => ({ ...prev, vehicles: prev.vehicles.filter(v => v.id !== id) }));
  };

  const addVehicleLine = () => {
    setEditingVehicleId('new');
    setVForm({ status: 'ACTIVE' });
  };

  return (
    <div className="bg-[#f0f2f5] min-h-screen pb-10 font-sans tm-page">
      {/* TOOLBAR */}
      <div className="flex gap-2 items-center bg-white p-2.5 border-b border-slate-300 shadow-sm sticky top-0 z-10">
        <button type="button" onClick={handleNew} className="bg-[#28a745] hover:bg-[#218838] text-white px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 shadow-sm transition-colors uppercase">
          <Plus className="w-3.5 h-3.5" strokeWidth={3} /> NEW (F2)
        </button>
        <button type="button" onClick={() => void handleSave()} className="bg-[#0056b3] hover:bg-[#004494] text-white px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 shadow-sm transition-colors uppercase">
          <Save className="w-3.5 h-3.5" strokeWidth={3} /> SAVE (F3)
        </button>
        <button type="button" onClick={() => (f.id ? toast('Editing loaded record') : toast.error('Select a transport from list'))} className="bg-[#fd7e14] hover:bg-[#e06a09] text-white px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 shadow-sm transition-colors uppercase">
          <Edit2 className="w-3.5 h-3.5" strokeWidth={3} /> EDIT (F4)
        </button>
        <button type="button" onClick={() => void handleDelete()} className="bg-[#dc3545] hover:bg-[#c82333] text-white px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 shadow-sm transition-colors uppercase">
          <Trash2 className="w-3.5 h-3.5" strokeWidth={3} /> DELETE (F5)
        </button>
        <button type="button" onClick={() => window.print()} className="bg-[#6f42c1] hover:bg-[#5a32a3] text-white px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 shadow-sm transition-colors uppercase">
          <Printer className="w-3.5 h-3.5" strokeWidth={3} /> PRINT (F6)
        </button>
        <button type="button" onClick={() => navigate(-1)} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 ml-auto shadow-sm transition-colors uppercase">
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={3} /> BACK
        </button>
      </div>

      <div className="p-4 max-w-6xl mx-auto space-y-4">
        
        {/* TRANSPORT MASTER DETAILS */}
        <div className="bg-white border border-[#003366] rounded overflow-hidden">
          <div className="bg-[#003366] text-white font-semibold px-4 py-2 text-[11px] uppercase tracking-wider">
            TRANSPORT MASTER DETAILS
          </div>
          
          <div className="p-4 grid grid-cols-4 gap-x-6 gap-y-4 items-start">
            {/* ROW 1 */}
            <Field label="TRANSPORT CODE">
              <input value={f.code} readOnly className="border border-slate-300 px-2 py-1.5 rounded text-[11px] w-full bg-slate-50 text-slate-600 outline-none" />
            </Field>
            <Field label={<>TRANSPORT NAME <Req/></>}>
              <input value={f.name} onChange={e => set('name')(e.target.value)} className="border border-slate-300 px-2 py-1.5 rounded text-[11px] w-full focus:border-blue-500 outline-none" />
            </Field>
            <Field label="CONTACT PERSON">
              <input value={f.contact} onChange={e => set('contact')(e.target.value)} className="border border-slate-300 px-2 py-1.5 rounded text-[11px] w-full focus:border-blue-500 outline-none" />
            </Field>
            <Field label="PHONE NO.">
              <input value={f.phone} onChange={e => set('phone')(e.target.value)} className="border border-slate-300 px-2 py-1.5 rounded text-[11px] w-full focus:border-blue-500 outline-none" />
            </Field>

            {/* ROW 2 */}
            <Field label="ALT. MOBILE NO.">
              <input value={f.altMobile} onChange={e => set('altMobile')(e.target.value)} className="border border-slate-300 px-2 py-1.5 rounded text-[11px] w-full focus:border-blue-500 outline-none" />
            </Field>
            <Field label={<>MOBILE NO. <Req/></>}>
              <input value={f.mobile} onChange={e => set('mobile')(e.target.value)} className="border border-slate-300 px-2 py-1.5 rounded text-[11px] w-full focus:border-blue-500 outline-none" />
            </Field>
            <Field label={<>ADDRESS <Req/></>} className="row-span-2 h-full flex flex-col">
              <textarea value={f.address} onChange={e => set('address')(e.target.value)} rows={4} className="border border-slate-300 px-2 py-1.5 rounded text-[11px] w-full focus:border-blue-500 outline-none flex-1 resize-none min-h-[90px]" />
            </Field>
            <div className="hidden" /> {/* Spacer for Row 2 Col 4 */}

            {/* ROW 3 */}
            <Field label="STATE">
              <select value={f.state} onChange={e => set('state')(e.target.value)} className="border border-slate-300 px-2 py-1.5 rounded text-[11px] w-full focus:border-blue-500 outline-none bg-white">
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label={<>CITY <Req/></>}>
               <input value={f.city} onChange={e => set('city')(e.target.value)} list="city-options" className="border border-slate-300 px-2 py-1.5 rounded text-[11px] w-full focus:border-blue-500 outline-none" />
               <datalist id="city-options">
                 {cityOptions.map(c => <option key={c} value={c} />)}
               </datalist>
            </Field>
            {/* Address occupies col 3 row 3 */}
            <Field label="PINCODE">
              <input value={f.pincode} onChange={e => set('pincode')(e.target.value)} className="border border-slate-300 px-2 py-1.5 rounded text-[11px] w-full focus:border-blue-500 outline-none" />
            </Field>

            {/* ROW 4 */}
            <Field label="GST NO.">
              <input value={f.gst} onChange={e => set('gst')(e.target.value)} className="border border-slate-300 px-2 py-1.5 rounded text-[11px] w-full focus:border-blue-500 outline-none uppercase" />
            </Field>
            <Field label="EMAIL ID">
              <input value={f.email} type="email" onChange={e => set('email')(e.target.value)} className="border border-slate-300 px-2 py-1.5 rounded text-[11px] w-full focus:border-blue-500 outline-none" />
            </Field>
            <div />
            <div />

            {/* ROW 5 */}
            <Field label="REMARK">
              <input value={f.remark} onChange={e => set('remark')(e.target.value)} className="border border-slate-300 px-2 py-1.5 rounded text-[11px] w-full focus:border-blue-500 outline-none" />
            </Field>
            <div />
            <div />
            <div />
          </div>
        </div>

        {/* VEHICLE DETAILS */}
        <div className="bg-white border border-[#003366] rounded overflow-hidden">
          <div className="bg-[#003366] text-white font-semibold px-4 py-2 text-[11px] uppercase tracking-wider flex justify-between items-center">
            <span>VEHICLE DETAILS (Total Vehicles : {f.vehicles.length})</span>
            <button type="button" onClick={addVehicleLine} className="bg-[#28a745] hover:bg-[#218838] text-white px-2.5 py-1 text-[10px] rounded flex items-center gap-1 transition-colors">
              <Plus className="w-3 h-3" strokeWidth={3} /> ADD VEHICLE
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left whitespace-nowrap border-collapse">
              <thead>
                <tr className="bg-[#004080] text-white">
                  <th className="px-3 py-1.5 border-r border-[#003366] text-center w-12 font-semibold">SR. NO.</th>
                  <th className="px-3 py-1.5 border-r border-[#003366] font-semibold text-center">VEHICLE NO.</th>
                  <th className="px-3 py-1.5 border-r border-[#003366] font-semibold text-center">VEHICLE TYPE</th>
                  <th className="px-3 py-1.5 border-r border-[#003366] font-semibold text-center">VEHICLE CAPACITY</th>
                  <th className="px-3 py-1.5 border-r border-[#003366] font-semibold text-center">DRIVER NAME</th>
                  <th className="px-3 py-1.5 border-r border-[#003366] font-semibold text-center">DRIVER MOBILE NO.</th>
                  <th className="px-3 py-1.5 border-r border-[#003366] font-semibold text-center">ALT. MOBILE NO.</th>
                  <th className="px-3 py-1.5 border-r border-[#003366] font-semibold text-center">STATUS</th>
                  <th className="px-3 py-1.5 font-semibold text-center">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {f.vehicles.map((v, i) => (
                  <tr key={v.id} className="border-b border-slate-200 hover:bg-slate-50">
                    {editingVehicleId === v.id ? (
                      <td colSpan={9} className="p-1.5 bg-blue-50">
                        <div className="flex items-center gap-1.5 justify-center">
                          <input placeholder="Veh. No" value={vForm.vehicleNo||''} onChange={e=>setVForm({...vForm, vehicleNo: e.target.value.toUpperCase()})} className="border border-blue-300 px-1.5 py-1 text-[11px] rounded w-24" autoFocus />
                          <select value={vForm.vehicleType||''} onChange={e=>setVForm({...vForm, vehicleType: e.target.value})} className="border border-blue-300 px-1.5 py-1 text-[11px] rounded w-28 bg-white">
                            <option value="">Select Type</option>
                            {VEHICLE_TYPES.map(vt => <option key={vt} value={vt}>{vt}</option>)}
                          </select>
                          <input placeholder="Capacity" value={vForm.vehicleCapacity||''} onChange={e=>setVForm({...vForm, vehicleCapacity: e.target.value})} className="border border-blue-300 px-1.5 py-1 text-[11px] rounded w-20" />
                          <input placeholder="Driver Name" value={vForm.driverName||''} onChange={e=>setVForm({...vForm, driverName: e.target.value})} className="border border-blue-300 px-1.5 py-1 text-[11px] rounded w-28" />
                          <input placeholder="Driver Mobile" value={vForm.driverMobileNo||''} onChange={e=>setVForm({...vForm, driverMobileNo: e.target.value})} className="border border-blue-300 px-1.5 py-1 text-[11px] rounded w-28" />
                          <input placeholder="Alt Mobile" value={vForm.altMobileNo||''} onChange={e=>setVForm({...vForm, altMobileNo: e.target.value})} className="border border-blue-300 px-1.5 py-1 text-[11px] rounded w-28" />
                          <select value={vForm.status||'ACTIVE'} onChange={e=>setVForm({...vForm, status: e.target.value as any})} className="border border-blue-300 px-1.5 py-1 text-[11px] rounded w-20 bg-white">
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                          </select>
                          <div className="flex gap-1">
                            <button onClick={saveVehicle} className="bg-[#28a745] text-white p-1 rounded hover:bg-[#218838]" title="Save"><Check className="w-3.5 h-3.5"/></button>
                            <button onClick={()=>setEditingVehicleId(null)} className="bg-slate-400 text-white p-1 rounded hover:bg-slate-500" title="Cancel"><X className="w-3.5 h-3.5"/></button>
                          </div>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="px-3 py-1.5 border-r border-slate-200 text-center font-medium">{i + 1}</td>
                        <td className="px-3 py-1.5 border-r border-slate-200 text-center">{v.vehicleNo}</td>
                        <td className="px-3 py-1.5 border-r border-slate-200 text-center">{v.vehicleType}</td>
                        <td className="px-3 py-1.5 border-r border-slate-200 text-center">{v.vehicleCapacity}</td>
                        <td className="px-3 py-1.5 border-r border-slate-200 text-center">{v.driverName}</td>
                        <td className="px-3 py-1.5 border-r border-slate-200 text-center">{v.driverMobileNo}</td>
                        <td className="px-3 py-1.5 border-r border-slate-200 text-center">{v.altMobileNo}</td>
                        <td className="px-3 py-1.5 border-r border-slate-200 text-center">
                          <span className={`font-semibold ${v.status === 'ACTIVE' ? 'text-[#28a745]' : 'text-red-500'}`}>{v.status}</span>
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <div className="flex justify-center gap-1.5">
                            <button type="button" onClick={() => editVehicle(v)} className="bg-[#007bff] hover:bg-[#0069d9] text-white p-1 rounded shadow-sm" title="Edit">
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button type="button" onClick={() => deleteVehicle(v.id)} className="bg-[#dc3545] hover:bg-[#c82333] text-white p-1 rounded shadow-sm" title="Delete">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                
                {editingVehicleId === 'new' && (
                   <tr className="bg-blue-50">
                     <td colSpan={9} className="p-1.5 border-t border-slate-200">
                        <div className="flex items-center gap-1.5 justify-center">
                          <input placeholder="Veh. No *" value={vForm.vehicleNo||''} onChange={e=>setVForm({...vForm, vehicleNo: e.target.value.toUpperCase()})} className="border border-blue-400 px-1.5 py-1 text-[11px] rounded w-24" autoFocus />
                          <select value={vForm.vehicleType||''} onChange={e=>setVForm({...vForm, vehicleType: e.target.value})} className="border border-blue-400 px-1.5 py-1 text-[11px] rounded w-28 bg-white">
                            <option value="">Select Type</option>
                            {VEHICLE_TYPES.map(vt => <option key={vt} value={vt}>{vt}</option>)}
                          </select>
                          <input placeholder="Capacity" value={vForm.vehicleCapacity||''} onChange={e=>setVForm({...vForm, vehicleCapacity: e.target.value})} className="border border-blue-400 px-1.5 py-1 text-[11px] rounded w-20" />
                          <input placeholder="Driver Name" value={vForm.driverName||''} onChange={e=>setVForm({...vForm, driverName: e.target.value})} className="border border-blue-400 px-1.5 py-1 text-[11px] rounded w-28" />
                          <input placeholder="Driver Mobile" value={vForm.driverMobileNo||''} onChange={e=>setVForm({...vForm, driverMobileNo: e.target.value})} className="border border-blue-400 px-1.5 py-1 text-[11px] rounded w-28" />
                          <input placeholder="Alt Mobile" value={vForm.altMobileNo||''} onChange={e=>setVForm({...vForm, altMobileNo: e.target.value})} className="border border-blue-400 px-1.5 py-1 text-[11px] rounded w-28" />
                          <select value={vForm.status||'ACTIVE'} onChange={e=>setVForm({...vForm, status: e.target.value as any})} className="border border-blue-400 px-1.5 py-1 text-[11px] rounded w-20 bg-white">
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                          </select>
                          <div className="flex gap-1 ml-auto">
                            <button onClick={saveVehicle} className="bg-[#28a745] text-white px-2 py-1 rounded hover:bg-[#218838] text-[9px] font-bold shadow-sm" title="Save">SAVE</button>
                            <button onClick={()=>setEditingVehicleId(null)} className="bg-slate-500 text-white px-2 py-1 rounded hover:bg-slate-600 text-[9px] font-bold shadow-sm" title="Cancel">CANCEL</button>
                          </div>
                        </div>
                     </td>
                   </tr>
                )}

                {f.vehicles.length === 0 && editingVehicleId !== 'new' && (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-400 italic">No vehicles added yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-[#f8f9fa] px-3 py-2 border-t border-slate-200 text-[11px] text-slate-600 flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full border border-blue-400 text-blue-500 flex items-center justify-center font-serif italic text-[10px]">i</div>
            Note : One Transport can have multiple vehicles. Add all vehicles under this transport.
          </div>
        </div>

        {/* TRANSPORT LIST */}
        <div className="bg-white border border-slate-300 shadow-sm rounded overflow-hidden mt-6">
          <div className="bg-slate-100 border-b border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 flex items-center gap-2">
            <Truck className="w-4 h-4 text-slate-500" /> TRANSPORT LIST
          </div>

          <div className="p-3 border-b border-slate-200 bg-slate-50 flex gap-2 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search Transport Name, Mobile No., City..."
                className="pl-9 pr-3 py-1.5 w-full border border-slate-300 rounded text-xs focus:border-blue-500 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded text-xs font-semibold ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-300 text-slate-700'}`}
            >
              <Filter className="w-3.5 h-3.5" /> Filters
            </button>
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-semibold hover:bg-green-100">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Export To Excel
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="p-3 border-b border-slate-200 bg-slate-50/50 flex gap-4">
              <div className="min-w-[140px] flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">City</label>
                <select value={filterCity} onChange={e => { setFilterCity(e.target.value); setPage(1); }} className="border border-slate-300 px-2 py-1.5 rounded text-xs bg-white">
                  <option value="">All Cities</option>
                  {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="min-w-[160px] flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Vehicle Type</label>
                <select value={filterVehicle} onChange={e => { setFilterVehicle(e.target.value); setPage(1); }} className="border border-slate-300 px-2 py-1.5 rounded text-xs bg-white">
                  <option value="">All Types</option>
                  {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              {(filterCity || filterVehicle) && (
                <div className="flex items-end">
                  <button type="button" onClick={() => { setFilterCity(''); setFilterVehicle(''); setPage(1); }} className="text-xs text-blue-600 hover:underline px-2 py-1.5">
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left whitespace-nowrap">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                  <th className="px-3 py-2 font-semibold">Sr No.</th>
                  <th className="px-3 py-2 font-semibold">Transport Name</th>
                  <th className="px-3 py-2 font-semibold">Contact Person</th>
                  <th className="px-3 py-2 font-semibold">Mobile No.</th>
                  <th className="px-3 py-2 font-semibold">City</th>
                  <th className="px-3 py-2 font-semibold">Vehicles</th>
                  <th className="px-3 py-2 font-semibold">GST No.</th>
                  <th className="px-3 py-2 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-slate-400 italic">No transport records found</td></tr>
                ) : paged.map((t, i) => (
                  <tr
                    key={t.id}
                    className={`border-b border-slate-100 cursor-pointer transition-colors ${f.id === t.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                    onClick={() => load(t)}
                  >
                    <td className="px-3 py-2">{(page - 1) * pageSize + i + 1}</td>
                    <td className="px-3 py-2 font-semibold text-slate-800">{t.name}</td>
                    <td className="px-3 py-2">{t.contact || '—'}</td>
                    <td className="px-3 py-2">{t.mobile}</td>
                    <td className="px-3 py-2">{t.city || '—'}</td>
                    <td className="px-3 py-2">
                       <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                         {t.vehicles?.length || 0}
                       </span>
                    </td>
                    <td className="px-3 py-2">{t.gst || '—'}</td>
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-center gap-1.5">
                        <button type="button" onClick={() => load(t)} className="text-blue-500 hover:text-blue-700 p-1" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => void handleDeleteRow(t)} className="text-red-500 hover:text-red-700 p-1" title="Delete">
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
            activeTone="blue"
          />
        </div>

      </div>
    </div>
  );
};
