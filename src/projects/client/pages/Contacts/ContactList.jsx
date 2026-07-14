import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Download, Upload, Trash2, Edit2, Eye, X, CheckCircle, AlertCircle, Contact as ContactIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CATEGORIES } from '../../data/seedData';
import StatusBadge from '../../components/UI/StatusBadge';
import StarRating from '../../components/UI/StarRating';
import QuickActions from '../../components/UI/QuickActions';
import { exportToExcel, importFromExcel, importFromCSV, importFromVCF } from '../../utils/excel';
import toast from 'react-hot-toast';

import BulkWhatsAppModal from '../../components/BulkWhatsAppModal';
import { MessageSquare } from 'lucide-react';


const PAGE_SIZE = 15;

export default function ContactList() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterCat, setFilterCat] = useState(() => searchParams.get('cat') || '');
  const [filterStatus, setFilterStatus] = useState(() => searchParams.get('status') || '');
  const [filterCity, setFilterCity] = useState('');
  const [page, setPage] = useState(1);

  // Re-apply filters when URL params change (e.g. navigating from dashboard)
  useEffect(() => {
    setFilterCat(searchParams.get('cat') || '');
    setFilterStatus(searchParams.get('status') || '');
    setPage(1);
  }, [searchParams.toString()]);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showClearAll, setShowClearAll] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState(null); // { rows, filename }
  const [isImporting, setIsImporting] = useState(false);
  const csvInputRef = useRef(null);



  const allCities = useMemo(() => [...new Set(state.contacts.map(c => c.city).filter(Boolean))].sort(), [state.contacts]);
  const allCats = useMemo(() => {
    if (!filterGroup) return Object.values(CATEGORIES).flat();
    return CATEGORIES[filterGroup] || [];
  }, [filterGroup]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return state.contacts.filter(c => {
      if (q && !`${c.contactPerson} ${c.companyName} ${c.mobile} ${c.city}`.toLowerCase().includes(q)) return false;
      if (filterGroup && c.categoryGroup !== filterGroup) return false;
      if (filterCat && c.category !== filterCat) return false;
      if (filterStatus && c.status !== filterStatus) return false;
      if (filterCity && c.city !== filterCity) return false;
      return true;
    });
  }, [state.contacts, search, filterGroup, filterCat, filterStatus, filterCity]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (id) => {
    setIsDeleting(true);
    try {
      await actions.deleteContact(id);
      setDeleteId(null);
      toast.success('Contact deleted');
    } catch (error) {
      toast.error('Failed to delete contact');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      await actions.clearContacts();
      setShowClearAll(false);
      setPage(1);
      toast.success('All contacts deleted');
    } catch {
      toast.error('Failed to delete contacts');
    } finally {
      setIsClearing(false);
    }
  };

  const handleExport = () => {
    exportToExcel(filtered.map(c => ({
      'Company': c.companyName, 'Person': c.contactPerson, 'Mobile': c.mobile,
      'WhatsApp': c.whatsapp, 'Email': c.email, 'City': c.city, 'State': c.state,
      'Category Group': c.categoryGroup, 'Category': c.category, 'Status': c.status,
      'Rating': c.rating, 'Steel Grades': (c.steelGrades || []).join(', '),
    })), 'Contacts', 'SteelConnectPro_Contacts.xlsx');
    toast.success('Exported to Excel!');
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const rows = await importFromExcel(file);
      const imported = rows.map((r, i) => ({
        id: `imp_${Date.now()}_${i}`,
        companyName: r['Company'] || '', contactPerson: r['Person'] || '',
        mobile: String(r['Mobile'] || ''), whatsapp: String(r['WhatsApp'] || ''),
        email: r['Email'] || '', city: r['City'] || '', state: r['State'] || '',
        categoryGroup: r['Category Group'] || 'Business', category: r['Category'] || '',
        status: r['Status'] || 'Regular', rating: Number(r['Rating']) || 0,
        steelGrades: r['Steel Grades'] ? r['Steel Grades'].split(',').map(s => s.trim()) : [],
        createdAt: new Date().toISOString(),
      }));
      await actions.importContacts(imported);
      toast.success(`Imported ${imported.length} contacts!`);
    } catch { toast.error('Import failed. Check file format.'); }
    e.target.value = '';
  };

  const handleCSVSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const rows = await importFromCSV(file);
      if (rows.length === 0) {
        toast.error('No data rows found. Make sure your CSV has headers in the first row and at least one data row.', { duration: 5000 });
        return;
      }
      setCsvPreview({ rows, filename: file.name });
    } catch (err) {
      toast.error('Failed to parse CSV. Make sure it is a valid .csv file.', { duration: 4000 });
    }
    e.target.value = '';
  };

  const handleVCFSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const rows = await importFromVCF(file);
      if (rows.length === 0) {
        toast.error('No contacts found in this .vcf file.', { duration: 5000 });
        return;
      }
      setCsvPreview({ rows, filename: file.name });
    } catch (err) {
      toast.error('Failed to read .vcf file. Make sure it is a valid vCard file.', { duration: 4000 });
    }
    e.target.value = '';
  };

  const handleCSVConfirm = async () => {
    if (!csvPreview) return;
    setIsImporting(true);
    try {
      await actions.importContacts(csvPreview.rows);
      toast.success(`${csvPreview.rows.length} contacts imported successfully!`);
      setCsvPreview(null);
    } catch { toast.error('Import failed. Please try again.'); }
    setIsImporting(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Contacts</div>
          <div className="page-subtitle">{filtered.length} of {state.contacts.length} contacts</div>
        </div>
        <div className="page-actions">
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            <Upload size={15} /> Import
            <input type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleImport} />
          </label>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            <ContactIcon size={15} /> Import VCF
            <input type="file" accept=".vcf,text/vcard" style={{ display: 'none' }} onChange={handleVCFSelect} />
          </label>
          <button className="btn btn-secondary" onClick={handleExport}><Download size={15} /> Export</button>
          <button className="btn btn-danger" onClick={() => setShowClearAll(true)} disabled={state.contacts.length === 0}>
            <Trash2 size={15} /> Delete All
          </button>
          <button className="btn btn-success" style={{ background: '#25D366', color: 'white', border: 'none' }} onClick={() => setIsWhatsAppOpen(true)}>
            <MessageSquare size={15} /> Bulk WhatsApp
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/contacts/new')}><Plus size={15} /> Add Contact</button>
        </div>
      </div>

      {/* Filters */}
      <div className="search-bar">
        <div className="search-input-wrap" style={{ flex: 2 }}>
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input placeholder="Search by name, company, mobile, city..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={filterGroup} onChange={e => { setFilterGroup(e.target.value); setFilterCat(''); setPage(1); }}>
          <option value="">All Groups</option>
          {Object.keys(CATEGORIES).map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select className="filter-select" value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {allCats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {['VIP', 'IMP', 'Favourite', 'Regular', 'Backup', 'Avoid'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="filter-select" value={filterCity} onChange={e => { setFilterCity(e.target.value); setPage(1); }}>
          <option value="">All Cities</option>
          {allCities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Contact</th>
                <th>Mobile</th>
                <th>Category</th>
                <th>City</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="table-empty">No contacts found. Try adjusting filters.</td></tr>
              ) : paginated.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="contact-avatar">{(c.contactPerson || c.companyName || '?')[0].toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.contactPerson}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.companyName}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--gold)' }}>{c.mobile}</td>
                  <td>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.categoryGroup}</div>
                    <span className="badge badge-cat">{c.category}</span>
                  </td>
                  <td>{c.city}{c.state ? `, ${c.state}` : ''}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td><StarRating value={c.rating} readonly /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <QuickActions contact={c} />
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => navigate(`/contacts/${c.id}`)} title="View"><Eye size={13} /></button>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => navigate(`/contacts/${c.id}/edit`)} title="Edit"><Edit2 size={13} /></button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => setDeleteId(c.id)} title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 6, borderTop: '1px solid var(--border)' }}>
          <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            const p = i + 1;
            return <button key={p} className={`page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>;
          })}
          <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
          <span className="page-info">Page {page} of {totalPages} · {filtered.length} results</span>
        </div>
      </div>

      {/* Delete Confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Delete Contact?</h2></div>
            <div className="modal-body"><p style={{ color: 'var(--text-secondary)' }}>This action cannot be undone.</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)} disabled={isDeleting}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Clear All Confirm */}
      {showClearAll && (
        <div className="modal-overlay" onClick={() => !isClearing && setShowClearAll(false)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Delete All Contacts?</h2></div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>
                This will permanently remove all <strong style={{ color: 'var(--red)' }}>{state.contacts.length}</strong> contacts. This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowClearAll(false)} disabled={isClearing}>Cancel</button>
              <button className="btn btn-danger" onClick={handleClearAll} disabled={isClearing}>
                {isClearing ? 'Deleting...' : `Delete All ${state.contacts.length}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <BulkWhatsAppModal isOpen={isWhatsAppOpen} onClose={() => setIsWhatsAppOpen(false)} />

      {/* CSV Preview Modal */}
      {csvPreview && (
        <div className="modal-overlay" onClick={() => !isImporting && setCsvPreview(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">CSV Import Preview</h2>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  <span style={{ color: 'var(--green)', fontWeight: 600 }}>{csvPreview.rows.length} contacts</span> ready to import from <strong>{csvPreview.filename}</strong>
                </div>
              </div>
              <button className="modal-close" onClick={() => setCsvPreview(null)} disabled={isImporting}><X size={18} /></button>
            </div>

            <div className="modal-body" style={{ padding: '16px 24px' }}>
              {/* Stats bar */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                  { label: 'Total Rows', value: csvPreview.rows.length, color: 'var(--gold)' },
                  { label: 'With Mobile', value: csvPreview.rows.filter(r => r.mobile).length, color: 'var(--green)' },
                  { label: 'With Company', value: csvPreview.rows.filter(r => r.companyName).length, color: 'var(--blue)' },
                  { label: 'With Email', value: csvPreview.rows.filter(r => r.email).length, color: 'var(--purple)' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 16px', minWidth: 100 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Preview table — first 10 rows */}
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Showing first {Math.min(10, csvPreview.rows.length)} of {csvPreview.rows.length} rows
              </div>
              <div className="table-wrap" style={{ maxHeight: 320, overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Contact Person</th>
                      <th>Company</th>
                      <th>Mobile</th>
                      <th>City</th>
                      <th>Category</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.rows.slice(0, 10).map((r, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{r.contactPerson || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{r.companyName || '—'}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--gold)' }}>{r.mobile || <span style={{ color: 'var(--red)' }}>missing</span>}</td>
                        <td>{r.city || '—'}</td>
                        <td>{r.category || '—'}</td>
                        <td>
                          <span className={`badge badge-${(r.status || 'regular').toLowerCase()}`}>{r.status || 'Regular'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {csvPreview.rows.some(r => !r.mobile) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '8px 12px', background: 'var(--red-dim)', borderRadius: 8, fontSize: 13, color: 'var(--red)' }}>
                  <AlertCircle size={15} />
                  {csvPreview.rows.filter(r => !r.mobile).length} row(s) are missing a mobile number and will be saved without it.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setCsvPreview(null)} disabled={isImporting}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCSVConfirm} disabled={isImporting}>
                <CheckCircle size={15} />
                {isImporting ? 'Importing...' : `Import ${csvPreview.rows.length} Contacts`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
