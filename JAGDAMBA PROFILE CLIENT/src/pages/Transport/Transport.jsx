import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { VEHICLE_TYPES } from '../../data/seedData';
import toast from 'react-hot-toast';
import Modal from '../../components/UI/Modal';

const EMPTY = { vehicleType: '', vehicleNo: '', driverName: '', driverMobile: '', route: '', capacity: '', availability: 'Available', city: '', notes: '' };
const AVAIL_COLORS = { Available: '#10b981', Busy: '#f97316', Maintenance: '#ef4444', Inactive: '#9ca3af' };

export default function Transport() {
  const { state } = useApp();
  const contacts = useMemo(() => state.contacts.filter(c => c.category === 'Transporter'), [state.contacts]);
  const [vehicles, setVehicles] = useState(() => {
    try { return JSON.parse(localStorage.getItem('steelconnect_vehicles') || '[]'); } catch { return []; }
  });
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState('vehicles');

  const save = (v) => { localStorage.setItem('steelconnect_vehicles', JSON.stringify(v)); setVehicles(v); };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.vehicleType) { toast.error('Vehicle type required'); return; }
    if (editId) {
      const updated = vehicles.map(v => v.id === editId ? { ...form, id: editId } : v);
      save(updated); toast.success('Vehicle updated!');
    } else {
      save([...vehicles, { ...form, id: `v_${Date.now()}` }]); toast.success('Vehicle added!');
    }
    setShowModal(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Transport <span>Module</span></div>
          <div className="page-subtitle">{contacts.length} transporter contacts · {vehicles.length} vehicles</div>
        </div>
        {tab === 'vehicles' && <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setEditId(null); setShowModal(true); }}><Plus size={15} /> Add Vehicle</button>}
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'vehicles' ? ' active' : ''}`} onClick={() => setTab('vehicles')}>🚛 Vehicles</button>
        <button className={`tab${tab === 'contacts' ? ' active' : ''}`} onClick={() => setTab('contacts')}>👤 Transporter Contacts</button>
      </div>

      {tab === 'vehicles' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Vehicle Type</th><th>Vehicle No.</th><th>Driver</th><th>Route</th><th>Capacity</th><th>Availability</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr><td colSpan={7} className="table-empty">No vehicles added yet.</td></tr>
                ) : vehicles.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600 }}>{v.vehicleType}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--gold)' }}>{v.vehicleNo || '—'}</td>
                    <td>{v.driverName || '—'}{v.driverMobile && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v.driverMobile}</div>}</td>
                    <td>{v.route || '—'}</td>
                    <td>{v.capacity || '—'}</td>
                    <td>
                      <span style={{ background: `${AVAIL_COLORS[v.availability] || '#94a3b8'}22`, color: AVAIL_COLORS[v.availability] || '#94a3b8', border: `1px solid ${AVAIL_COLORS[v.availability] || '#94a3b8'}44`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                        {v.availability}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => { setForm(v); setEditId(v.id); setShowModal(true); }}>✏️</button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => { save(vehicles.filter(x => x.id !== v.id)); toast.success('Deleted'); }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'contacts' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Company</th><th>Contact Person</th><th>Mobile</th><th>Route Covered</th><th>City</th></tr></thead>
              <tbody>
                {contacts.length === 0 ? (
                  <tr><td colSpan={5} className="table-empty">No transporter contacts. Add contacts with category "Transporter".</td></tr>
                ) : contacts.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.companyName}</td>
                    <td>{c.contactPerson}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--gold)' }}>{c.mobile}</td>
                    <td style={{ fontSize: 12 }}>{c.routeCovered || '—'}</td>
                    <td>{c.city}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Vehicle' : 'Add Vehicle'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}><X size={14} /> Cancel</button><button className="btn btn-primary" onClick={handleSave}><Save size={14} /> Save</button></>}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Vehicle Type *</label>
            <select className="form-select" value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)}>
              <option value="">Select Type</option>
              {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Vehicle Number</label>
            <input className="form-input" value={form.vehicleNo} onChange={e => set('vehicleNo', e.target.value)} placeholder="GJ01AB1234" />
          </div>
          <div className="form-group">
            <label className="form-label">Driver Name</label>
            <input className="form-input" value={form.driverName} onChange={e => set('driverName', e.target.value)} placeholder="Driver name" />
          </div>
          <div className="form-group">
            <label className="form-label">Driver Mobile</label>
            <input className="form-input" value={form.driverMobile} onChange={e => set('driverMobile', e.target.value)} placeholder="10-digit" maxLength={10} />
          </div>
          <div className="form-group">
            <label className="form-label">Route</label>
            <input className="form-input" value={form.route} onChange={e => set('route', e.target.value)} placeholder="Surat–Mumbai" />
          </div>
          <div className="form-group">
            <label className="form-label">Capacity</label>
            <input className="form-input" value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="e.g. 20 Ton" />
          </div>
          <div className="form-group">
            <label className="form-label">Availability</label>
            <select className="form-select" value={form.availability} onChange={e => set('availability', e.target.value)}>
              {['Available', 'Busy', 'Maintenance', 'Inactive'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">City / Base</label>
            <input className="form-input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Home city" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
