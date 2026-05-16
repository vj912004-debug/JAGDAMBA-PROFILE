import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CATEGORIES, STEEL_GRADES } from '../../data/seedData';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Masters() {
  const { state, actions } = useApp();
  const [tab, setTab] = useState('categories');
  const [newGrade, setNewGrade] = useState('');

  const allGrades = useMemo(() => {
    const customNames = (state.customSteelGrades || []).map(g => g.name);
    return [...new Set([...STEEL_GRADES, ...customNames])];
  }, [state.customSteelGrades]);

  const handleAddGrade = async () => {
    const g = newGrade.trim();
    if (!g) return;
    if (allGrades.includes(g)) { toast.error('Grade already exists'); return; }
    try {
      await actions.addGrade(g);
      setNewGrade('');
      toast.success('Grade added!');
    } catch (error) {
      toast.error('Failed to add grade');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Master <span>Data</span></div>
          <div className="page-subtitle">Manage categories and steel grade masters</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'categories' ? ' active' : ''}`} onClick={() => setTab('categories')}>📂 Categories</button>
        <button className={`tab${tab === 'grades' ? ' active' : ''}`} onClick={() => setTab('grades')}>🏗️ Steel Grades</button>
      </div>

      {tab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {Object.entries(CATEGORIES).map(([group, cats]) => (
            <div key={group} className="card">
              <div className="card-title" style={{ marginBottom: 12 }}>
                {group === 'Business' ? '🏭' : group === 'Professional' ? '💼' : group === 'Government' ? '🏛️' : group === 'Service' ? '🔧' : '👤'} {group}
                <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{cats.length} categories</span>
              </div>
              {cats.map(c => (
                <div key={c} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span>• {c}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {state.contacts.filter(ct => ct.category === c).length}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === 'grades' && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>Add Custom Steel Grade</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="form-input" style={{ maxWidth: 320 }} value={newGrade} onChange={e => setNewGrade(e.target.value)} placeholder="Enter grade name e.g. IS 2062 E550" onKeyDown={e => e.key === 'Enter' && handleAddGrade()} />
              <button className="btn btn-primary" onClick={handleAddGrade}><Plus size={15} /> Add Grade</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {allGrades.map(g => {
              const isCustom = (state.customSteelGrades || []).some(cg => cg.name === g);
              const supplierCount = state.contacts.filter(c => (c.steelGrades || []).includes(g)).length;
              return (
                <div key={g} style={{ background: 'var(--bg-card)', border: `1px solid ${isCustom ? 'rgba(245,166,35,0.3)' : 'var(--border)'}`, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isCustom ? 'var(--gold)' : 'var(--text-primary)' }}>{g}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{supplierCount} supplier{supplierCount !== 1 ? 's' : ''}</div>
                  </div>
                  {isCustom && (
                    <button onClick={() => { actions.deleteGrade(g); toast.success('Grade removed'); }}
                      style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
