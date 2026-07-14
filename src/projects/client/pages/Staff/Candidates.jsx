import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Edit2, Trash2, Save, X, Upload } from 'lucide-react';
import { JOB_ROLES, DEPARTMENTS, INTERVIEW_STATUSES } from '../../data/seedData';
import toast from 'react-hot-toast';
import Modal from '../../components/UI/Modal';
import { NumericInput } from '../../components/NumericInput';

const EMPTY = { name: '', applyingFor: '', department: '', qualification: '', experience: '', expectedSalary: '', resume: '', interviewStatus: 'Pending' };
const STATUS_COLORS = { Pending: '#94a3b8', Scheduled: '#3b82f6', 'In Progress': '#f97316', Selected: '#10b981', Rejected: '#ef4444', 'On Hold': '#f5a623' };

export default function Candidates() {
  const { state, actions } = useApp();
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileRef = useRef();

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const openAdd = () => { setForm(EMPTY); setEditId(null); setShowModal(true); };
  const openEdit = (c) => { setForm(c); setEditId(c.id); setShowModal(true); };

  const handleResume = (e) => {
    const file = e.target.files[0];
    if (file) set('resume', file.name);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('Candidate name required'); return; }
    setIsSaving(true);
    try {
      if (editId) {
        await actions.updateCandidate(editId, form);
        toast.success('Candidate updated!');
      } else {
        await actions.addCandidate(form);
        toast.success('Candidate added!');
      }
      setShowModal(false);
    } catch (error) {
      toast.error('Failed to save candidate');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = state.candidates.filter(c => {
    if (filterStatus && c.interviewStatus !== filterStatus) return false;
    return `${c.name} ${c.applyingFor} ${c.department}`.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Job <span>Candidates</span></div>
          <div className="page-subtitle">{state.candidates.length} candidates in pipeline</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Candidate</button>
      </div>

      <div className="search-bar">
        <div className="search-input-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input placeholder="Search candidates..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {INTERVIEW_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Status Summary */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        {INTERVIEW_STATUSES.map(s => {
          const count = state.candidates.filter(c => c.interviewStatus === s).length;
          return (
            <div key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              style={{ background: 'var(--bg-card)', border: `1px solid ${filterStatus === s ? STATUS_COLORS[s] : 'var(--border)'}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: STATUS_COLORS[s] }}>{count}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s}</div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Candidate</th><th>Applying For</th><th>Department</th><th>Experience</th><th>Expected Salary</th><th>Interview</th><th>Resume</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="table-empty">No candidates found.</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td><span className="badge badge-cat">{c.applyingFor}</span></td>
                  <td>{c.department}</td>
                  <td>{c.experience}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 600 }}>{c.expectedSalary ? `₹${Number(c.expectedSalary).toLocaleString('en-IN')}` : '—'}</td>
                  <td>
                    <span style={{ background: `${STATUS_COLORS[c.interviewStatus]}22`, color: STATUS_COLORS[c.interviewStatus], border: `1px solid ${STATUS_COLORS[c.interviewStatus]}44`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                      {c.interviewStatus}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.resume || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(c)}><Edit2 size={13} /></button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => setDeleteId(c.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Candidate' : 'Add Job Candidate'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={isSaving}><X size={14} /> Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={isSaving}><Save size={14} /> {isSaving ? 'Saving...' : 'Save'}</button></>}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Candidate Name *</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" />
          </div>
          <div className="form-group">
            <label className="form-label">Applying For</label>
            <select className="form-select" value={form.applyingFor} onChange={e => set('applyingFor', e.target.value)}>
              <option value="">Select Role</option>
              {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <select className="form-select" value={form.department} onChange={e => set('department', e.target.value)}>
              <option value="">Select Dept.</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Qualification</label>
            <input className="form-input" value={form.qualification} onChange={e => set('qualification', e.target.value)} placeholder="ITI, B.Tech, MBA..." />
          </div>
          <div className="form-group">
            <label className="form-label">Experience</label>
            <input className="form-input" value={form.experience} onChange={e => set('experience', e.target.value)} placeholder="e.g. 2 years" />
          </div>
          <div className="form-group">
            <label className="form-label">Expected Salary (₹)</label>
            <NumericInput className="form-input" value={form.expectedSalary} onChange={v => set('expectedSalary', v)} placeholder="e.g. 20000" />
          </div>
          <div className="form-group">
            <label className="form-label">Interview Status</label>
            <select className="form-select" value={form.interviewStatus} onChange={e => set('interviewStatus', e.target.value)}>
              {INTERVIEW_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Resume</label>
            <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Upload size={14} /> {form.resume || 'Upload Resume'}
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleResume} />
            </label>
            {form.resume && <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>✓ {form.resume}</div>}
          </div>
        </div>
      </Modal>

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Delete Candidate?</h2></div>
            <div className="modal-body"><p style={{ color: 'var(--text-secondary)' }}>This cannot be undone.</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={async () => { try { await actions.deleteCandidate(deleteId); setDeleteId(null); toast.success('Deleted'); } catch { toast.error('Failed to delete'); } }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
