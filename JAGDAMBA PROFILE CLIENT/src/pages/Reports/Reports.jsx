import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download } from 'lucide-react';
import { exportToExcel } from '../../utils/excel';
import { CATEGORIES } from '../../data/seedData';
import toast from 'react-hot-toast';

const COLORS = ['#f5a623', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f97316', '#06b6d4', '#84cc16'];

export default function Reports() {
  const { state } = useApp();
  const { contacts, candidates } = state;

  // Category-wise
  const catData = useMemo(() => {
    const map = {};
    contacts.forEach(c => { const k = c.category || 'Unknown'; map[k] = (map[k] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [contacts]);

  // City-wise
  const cityData = useMemo(() => {
    const map = {};
    contacts.forEach(c => { if (c.city) map[c.city] = (map[c.city] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([city, count]) => ({ city, count }));
  }, [contacts]);

  // VIP
  const vipContacts = contacts.filter(c => c.status === 'VIP');

  // Grade-wise Suppliers
  const gradeData = useMemo(() => {
    const map = {};
    contacts.forEach(c => (c.steelGrades || []).forEach(g => { map[g] = (map[g] || 0) + 1; }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([grade, count]) => ({ grade, count }));
  }, [contacts]);

  const exportCat = () => { exportToExcel(catData, 'Category Report', 'Category_Report.xlsx'); toast.success('Exported!'); };
  const exportCity = () => { exportToExcel(cityData.map(d => ({ City: d.city, Count: d.count })), 'City Report', 'City_Report.xlsx'); toast.success('Exported!'); };
  const exportVIP = () => { exportToExcel(vipContacts.map(c => ({ Company: c.companyName, Person: c.contactPerson, Mobile: c.mobile, City: c.city, Category: c.category, Rating: c.rating })), 'VIP Contacts', 'VIP_Contacts.xlsx'); toast.success('Exported!'); };
  const exportGrade = () => { exportToExcel(gradeData.map(d => ({ 'Steel Grade': d.grade, 'Supplier Count': d.count })), 'Grade Report', 'Grade_Suppliers.xlsx'); toast.success('Exported!'); };
  const exportCandidates = () => { exportToExcel(candidates.map(c => ({ Name: c.name, 'Applying For': c.applyingFor, Department: c.department, Qualification: c.qualification, Experience: c.experience, 'Expected Salary': c.expectedSalary, Status: c.interviewStatus })), 'Candidates', 'Job_Candidates.xlsx'); toast.success('Exported!'); };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Reports & <span>Analytics</span></div>
          <div className="page-subtitle">Business insights from your contact database</div>
        </div>
      </div>

      <div className="report-grid">
        {/* Category-wise */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📂 Category-wise Contacts</div>
            <button className="btn btn-secondary btn-sm" onClick={exportCat}><Download size={13} /> Export</button>
          </div>
          {catData.slice(0, 8).map((d, i) => (
            <div key={d.name} style={{ marginBottom: 12 }}>
              <div className="report-row" style={{ paddingBottom: 4, borderBottom: 'none' }}>
                <span className="label">{d.name}</span>
                <span className="value">{d.count}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(d.count / (catData[0]?.count || 1)) * 100}%`, background: COLORS[i % COLORS.length] }} />
              </div>
            </div>
          ))}
        </div>

        {/* City-wise */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🏙️ City-wise Distribution</div>
            <button className="btn btn-secondary btn-sm" onClick={exportCity}><Download size={13} /> Export</button>
          </div>
          {cityData.length === 0 ? <div className="table-empty">No data</div> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={cityData.slice(0, 8)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="city" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {cityData.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {cityData.slice(0, 6).map(d => (
            <div key={d.city} className="report-row">
              <span className="label">{d.city}</span><span className="value">{d.count}</span>
            </div>
          ))}
        </div>

        {/* VIP Contacts */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">⭐ VIP Contact List ({vipContacts.length})</div>
            <button className="btn btn-secondary btn-sm" onClick={exportVIP}><Download size={13} /> Export</button>
          </div>
          {vipContacts.length === 0 ? <div className="table-empty">No VIP contacts</div>
            : vipContacts.slice(0, 6).map(c => (
              <div key={c.id} className="report-row">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{c.contactPerson}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{c.companyName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--gold)' }}>{c.category}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.city}</div>
                </div>
              </div>
            ))}
        </div>

        {/* Grade-wise Suppliers */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🏗️ Grade-wise Suppliers</div>
            <button className="btn btn-secondary btn-sm" onClick={exportGrade}><Download size={13} /> Export</button>
          </div>
          {gradeData.length === 0 ? <div className="table-empty">No grade data. Add steel grades to contacts.</div>
            : gradeData.map((d, i) => (
              <div key={d.grade} style={{ marginBottom: 10 }}>
                <div className="report-row" style={{ paddingBottom: 4, borderBottom: 'none' }}>
                  <span className="label" style={{ fontSize: 12 }}>{d.grade}</span>
                  <span className="value" style={{ fontSize: 12 }}>{d.count} supplier{d.count !== 1 ? 's' : ''}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(d.count / (gradeData[0]?.count || 1)) * 100}%`, background: COLORS[i % COLORS.length] }} />
                </div>
              </div>
            ))}
        </div>

        {/* Job Candidates */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">👤 Job Candidates Report</div>
            <button className="btn btn-secondary btn-sm" onClick={exportCandidates}><Download size={13} /> Export</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gold)' }}>{candidates.length}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total Candidates</div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)' }}>{candidates.filter(c => c.interviewStatus === 'Selected').length}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Selected</div>
            </div>
          </div>
          {['Pending', 'Scheduled', 'In Progress', 'Selected', 'Rejected', 'On Hold'].map(s => (
            <div key={s} className="report-row">
              <span className="label">{s}</span>
              <span className="value">{candidates.filter(c => c.interviewStatus === s).length}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
