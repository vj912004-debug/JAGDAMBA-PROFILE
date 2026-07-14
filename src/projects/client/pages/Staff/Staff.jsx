import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { DEPARTMENTS, JOB_ROLES } from '../../data/seedData';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Modal from '../../components/UI/Modal';
import { NumericInput } from '../../components/NumericInput';

const EMPTY_EMP = { name: '', department: '', skill: '', experience: '', salary: '', joiningDate: '' };

export default function Staff() {
  const { state, actions } = useApp();
  const [form, setForm] = useState(EMPTY_EMP);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openAdd = () => { setForm(EMPTY_EMP); setEditId(null); setShowModal(true); };
  const openEdit = (emp) => { setForm(emp); setEditId(emp.id); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name) { toast.error('Employee name is required'); return; }
    setIsSaving(true);
    try {
      if (editId) {
        await actions.updateEmployee(editId, form);
        toast.success('Employee updated!');
      } else {
        await actions.addEmployee(form);
        toast.success('Employee added!');
      }
      setShowModal(false);
    } catch (error) {
      toast.error('Failed to save employee');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = state.employees.filter(e =>
    `${e.name} ${e.department} ${e.skill}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Staff & <span>Employees</span></div>
          <div className="page-subtitle">{state.employees.length} employees on record</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Employee</button>
      </div>

      <div className="search-bar">
        <div className="search-input-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Employee</th><th>Department</th><th>Skill</th><th>Experience</th><th>Salary (₹)</th><th>Joining Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="table-empty">No employees found.</td></tr>
              ) : filtered.map(e => (
                <tr key={e.id}>
                  <td><div style={{ fontWeight: 600 }}>{e.name}</div></td>
                  <td><span className="badge badge-cat">{e.department}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{e.skill}</td>
                  <td>{e.experience}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 600 }}>{e.salary ? `₹${Number(e.salary).toLocaleString('en-IN')}` : '—'}</td>
                  <td>{e.joiningDate || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(e)}><Edit2 size={13} /></button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => setDeleteId(e.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Employee' : 'Add Employee'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={isSaving}><X size={14} /> Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={isSaving}><Save size={14} /> {isSaving ? 'Saving...' : 'Save'}</button></>}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Employee Name *</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" />
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <select className="form-select" value={form.department} onChange={e => set('department', e.target.value)}>
              <option value="">Select Dept.</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Skill / Role</label>
            <input className="form-input" value={form.skill} onChange={e => set('skill', e.target.value)} placeholder="CNC, Accounting, Sales..." />
          </div>
          <div className="form-group">
            <label className="form-label">Experience</label>
            <input className="form-input" value={form.experience} onChange={e => set('experience', e.target.value)} placeholder="e.g. 3 years" />
          </div>
          <div className="form-group">
            <label className="form-label">Monthly Salary (₹)</label>
            <NumericInput className="form-input" value={form.salary} onChange={v => set('salary', v)} placeholder="e.g. 25000" />
          </div>
          <div className="form-group">
            <label className="form-label">Joining Date</label>
            <input className="form-input" type="date" value={form.joiningDate} onChange={e => set('joiningDate', e.target.value)} />
          </div>
        </div>
      </Modal>

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Delete Employee?</h2></div>
            <div className="modal-body"><p style={{ color: 'var(--text-secondary)' }}>This cannot be undone.</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={async () => { try { await actions.deleteEmployee(deleteId); setDeleteId(null); toast.success('Deleted'); } catch { toast.error('Failed to delete'); } }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
