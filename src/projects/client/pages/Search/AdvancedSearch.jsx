import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CATEGORIES, STEEL_GRADES } from '../../data/seedData';
import StatusBadge from '../../components/UI/StatusBadge';
import StarRating from '../../components/UI/StarRating';
import QuickActions from '../../components/UI/QuickActions';
import { Eye, Edit2 } from 'lucide-react';

export default function AdvancedSearch() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [f, setF] = useState({ name: '', company: '', mobile: '', city: '', catGroup: '', category: '', grade: '', status: '' });
  const [searched, setSearched] = useState(false);

  const cats = useMemo(() => f.catGroup ? (CATEGORIES[f.catGroup] || []) : Object.values(CATEGORIES).flat(), [f.catGroup]);
  const cities = useMemo(() => [...new Set(state.contacts.map(c => c.city).filter(Boolean))].sort(), [state.contacts]);

  const results = useMemo(() => {
    if (!searched) return [];
    return state.contacts.filter(c => {
      if (f.name && !c.contactPerson?.toLowerCase().includes(f.name.toLowerCase())) return false;
      if (f.company && !c.companyName?.toLowerCase().includes(f.company.toLowerCase())) return false;
      if (f.mobile && !c.mobile?.includes(f.mobile)) return false;
      if (f.city && c.city !== f.city) return false;
      if (f.catGroup && c.categoryGroup !== f.catGroup) return false;
      if (f.category && c.category !== f.category) return false;
      if (f.grade && !(c.steelGrades || []).includes(f.grade)) return false;
      if (f.status && c.status !== f.status) return false;
      return true;
    });
  }, [state.contacts, f, searched]);

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const handleSearch = (e) => { e.preventDefault(); setSearched(true); };
  const handleReset = () => { setF({ name: '', company: '', mobile: '', city: '', catGroup: '', category: '', grade: '', status: '' }); setSearched(false); };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Advanced <span>Search</span></div>
          <div className="page-subtitle">Search across all contact fields</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={handleSearch}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Person Name</label>
              <input className="form-input" placeholder="Search by name..." value={f.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input className="form-input" placeholder="Search company..." value={f.company} onChange={e => set('company', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input className="form-input" placeholder="Search mobile..." value={f.mobile} onChange={e => set('mobile', e.target.value)} maxLength={10} />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <select className="form-select" value={f.city} onChange={e => set('city', e.target.value)}>
                <option value="">All Cities</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category Group</label>
              <select className="form-select" value={f.catGroup} onChange={e => { set('catGroup', e.target.value); set('category', ''); }}>
                <option value="">All Groups</option>
                {Object.keys(CATEGORIES).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={f.category} onChange={e => set('category', e.target.value)}>
                <option value="">All Categories</option>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Steel Grade</label>
              <select className="form-select" value={f.grade} onChange={e => set('grade', e.target.value)}>
                <option value="">Any Grade</option>
                {STEEL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status (VIP / IMP)</label>
              <select className="form-select" value={f.status} onChange={e => set('status', e.target.value)}>
                <option value="">Any Status</option>
                {['VIP', 'IMP', 'Favourite', 'Regular', 'Backup', 'Avoid'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button type="submit" className="btn btn-primary"><Search size={15} /> Search</button>
            <button type="button" className="btn btn-secondary" onClick={handleReset}>Reset Filters</button>
          </div>
        </form>
      </div>

      {searched && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Contact</th><th>Mobile</th><th>Category</th><th>City</th><th>Status</th><th>Rating</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan={7} className="table-empty">No contacts match your search criteria.</td></tr>
                ) : results.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="contact-avatar">{(c.contactPerson || '?')[0].toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.contactPerson}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.companyName}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--gold)' }}>{c.mobile}</td>
                    <td><span className="badge badge-cat">{c.category}</span></td>
                    <td>{c.city}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td><StarRating value={c.rating} readonly /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <QuickActions contact={c} />
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => navigate(`/contacts/${c.id}`)}><Eye size={13} /></button>
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => navigate(`/contacts/${c.id}/edit`)}><Edit2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
