import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { CATEGORIES, STATUS_OPTIONS, STEEL_GRADES, MATERIAL_TYPES, VEHICLE_TYPES, INDIAN_STATES, DEPARTMENTS } from '../../data/seedData';
import StarRating from '../../components/UI/StarRating';
import toast from 'react-hot-toast';
import { Save, X } from 'lucide-react';

const EMPTY_CONTACT = {
  companyName: '', contactPerson: '', mobile: '', altMobile: '', whatsapp: '',
  email: '', address: '', city: '', state: '', pincode: '',
  designation: '', department: '', categoryGroup: 'Business', category: '', subCategory: '',
  businessType: '', steelGrades: [], materialType: '', serviceType: '', workingArea: '', routeCovered: '',
  status: 'Regular', rating: 0, birthday: '', followUpDate: '', notes: '',
};

export default function ContactForm() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const existing = useMemo(() => isEdit ? state.contacts.find(c => c.id === id) : null, [id, state.contacts]);
  const [form, setForm] = useState(EMPTY_CONTACT);
  const [gradeInput, setGradeInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (existing) setForm({ ...EMPTY_CONTACT, ...existing });
  }, [existing]);

  const allGrades = useMemo(() => {
    const custom = state.customSteelGrades || [];
    return [...new Set([...STEEL_GRADES, ...custom.map(g => g.name)])];
  }, [state.customSteelGrades]);

  const cats = useMemo(() => CATEGORIES[form.categoryGroup] || [], [form.categoryGroup]);

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const toggleGrade = (g) => {
    const grades = form.steelGrades || [];
    set('steelGrades', grades.includes(g) ? grades.filter(x => x !== g) : [...grades, g]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.contactPerson && !form.companyName) { toast.error('Enter contact person or company name'); return; }
    if (!form.mobile) { toast.error('Mobile number is required'); return; }
    
    setIsSaving(true);
    try {
      if (isEdit) {
        await actions.updateContact(id, form);
        toast.success('Contact updated!');
      } else {
        await actions.addContact(form);
        toast.success('Contact added!');
      }
      navigate('/contacts');
    } catch (error) {
      toast.error('Failed to save contact');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">{isEdit ? 'Edit Contact' : 'Add New Contact'}</div>
          <div className="page-subtitle">Fill in the contact details below</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}><X size={15} /> Cancel</button>
          <button className="btn btn-primary" form="contact-form" type="submit" disabled={isSaving}>
            <Save size={15} /> {isSaving ? 'Saving...' : 'Save Contact'}
          </button>
        </div>
      </div>

      <form id="contact-form" onSubmit={handleSubmit}>
        {/* Basic Details */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="form-section-title">Basic Details</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input className="form-input" value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Company / Firm name" />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Person *</label>
              <input className="form-input" value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} placeholder="Person name" />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input className="form-input" value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="10-digit mobile" maxLength={10} />
            </div>
            <div className="form-group">
              <label className="form-label">Alternate Mobile</label>
              <input className="form-input" value={form.altMobile} onChange={e => set('altMobile', e.target.value)} placeholder="Alternate number" maxLength={10} />
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp Number</label>
              <input className="form-input" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="WhatsApp number" maxLength={10} />
            </div>
            <div className="form-group">
              <label className="form-label">Email ID</label>
              <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="form-group full">
              <label className="form-label">Address</label>
              <input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address, area..." />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <select className="form-select" value={form.state} onChange={e => set('state', e.target.value)}>
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Pincode</label>
              <input className="form-input" value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder="6-digit pincode" maxLength={6} />
            </div>
          </div>
        </div>

        {/* Professional Details */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="form-section-title">Professional Details</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Designation</label>
              <input className="form-input" value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="Owner / Manager / Director..." />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-select" value={form.department} onChange={e => set('department', e.target.value)}>
                <option value="">Select Dept.</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category Group</label>
              <select className="form-select" value={form.categoryGroup} onChange={e => { set('categoryGroup', e.target.value); set('category', ''); }}>
                {Object.keys(CATEGORIES).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Select Category</option>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Sub Category</label>
              <input className="form-input" value={form.subCategory} onChange={e => set('subCategory', e.target.value)} placeholder="Sub category" />
            </div>
            <div className="form-group">
              <label className="form-label">Business Type</label>
              <input className="form-input" value={form.businessType} onChange={e => set('businessType', e.target.value)} placeholder="Wholesale / Retail / Manufacturer..." />
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="form-section-title">Business Details</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Material Type</label>
              <select className="form-select" value={form.materialType} onChange={e => set('materialType', e.target.value)}>
                <option value="">Select Material</option>
                {MATERIAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Service Type</label>
              <input className="form-input" value={form.serviceType} onChange={e => set('serviceType', e.target.value)} placeholder="Service provided..." />
            </div>
            <div className="form-group">
              <label className="form-label">Working Area</label>
              <input className="form-input" value={form.workingArea} onChange={e => set('workingArea', e.target.value)} placeholder="Gujarat, Maharashtra..." />
            </div>
            <div className="form-group">
              <label className="form-label">Route Covered</label>
              <input className="form-input" value={form.routeCovered} onChange={e => set('routeCovered', e.target.value)} placeholder="Surat–Ahmedabad–Mumbai" />
            </div>
            <div className="form-group full">
              <label className="form-label">Steel Grades Available</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <select className="form-select" value={gradeInput} onChange={e => { if (e.target.value) { toggleGrade(e.target.value); setGradeInput(''); } }}>
                  <option value="">+ Add Grade</option>
                  {allGrades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="chips-wrap">
                {(form.steelGrades || []).length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No grades selected</span>}
                {(form.steelGrades || []).map(g => (
                  <span key={g} className="chip">{g} <button type="button" onClick={() => toggleGrade(g)}>×</button></span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Status & Rating */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="form-section-title">Status, Rating & Reminders</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Importance Status</label>
              <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Rating</label>
              <div style={{ paddingTop: 6 }}>
                <StarRating value={form.rating} onChange={v => set('rating', v)} size={22} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Birthday</label>
              <input className="form-input" type="date" value={form.birthday} onChange={e => set('birthday', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Follow-up Date</label>
              <input className="form-input" type="date" value={form.followUpDate} onChange={e => set('followUpDate', e.target.value)} />
            </div>
            <div className="form-group full">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes..." />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
