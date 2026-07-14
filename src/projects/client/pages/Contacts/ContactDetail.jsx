import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/UI/StatusBadge';
import StarRating from '../../components/UI/StarRating';
import QuickActions from '../../components/UI/QuickActions';
import { ArrowLeft, Edit2, Trash2, MapPin, Phone, Mail, Calendar, Briefcase } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="report-row">
      <span className="label">{label}</span>
      <span className="value" style={{ textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const contact = state.contacts.find(c => c.id === id);

  if (!contact) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <h2 style={{ color: 'var(--text-secondary)' }}>Contact not found</h2>
      <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate('/contacts')}>← Back to Contacts</button>
    </div>
  );

  const handleDelete = () => {
    if (window.confirm('Delete this contact?')) {
      dispatch({ type: 'DELETE_CONTACT', payload: id });
      toast.success('Contact deleted');
      navigate('/contacts');
    }
  };

  const initials = (contact.contactPerson || contact.companyName || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={16} /></button>
          <div>
            <div className="page-title">{contact.contactPerson}</div>
            <div className="page-subtitle">{contact.companyName}</div>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => navigate(`/contacts/${id}/edit`)}><Edit2 size={15} /> Edit</button>
          <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={15} /> Delete</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        {/* Left Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, var(--gold), #2347c5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 auto 16px' }}>
              {initials}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{contact.contactPerson}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>{contact.designation}</div>
            <div style={{ marginBottom: 12 }}><StatusBadge status={contact.status} /></div>
            <StarRating value={contact.rating} readonly size={18} />
            <div style={{ marginTop: 16 }}><QuickActions contact={contact} /></div>
          </div>

          <div className="card">
            <div className="form-section-title" style={{ marginBottom: 12 }}>Contact Info</div>
            {contact.mobile && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13 }}><Phone size={14} color="var(--green)" /><span>{contact.mobile}</span></div>}
            {contact.altMobile && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13 }}><Phone size={14} color="var(--text-muted)" /><span>{contact.altMobile} (Alt)</span></div>}
            {contact.email && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13 }}><Mail size={14} color="var(--blue)" /><span style={{ wordBreak: 'break-all' }}>{contact.email}</span></div>}
            {(contact.city || contact.address) && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                <MapPin size={14} color="var(--orange)" style={{ marginTop: 1 }} />
                <span>{[contact.address, contact.city, contact.state, contact.pincode].filter(Boolean).join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="form-section-title" style={{ marginBottom: 12 }}>Professional Details</div>
            <Row label="Company" value={contact.companyName} />
            <Row label="Category Group" value={contact.categoryGroup} />
            <Row label="Category" value={contact.category} />
            <Row label="Sub Category" value={contact.subCategory} />
            <Row label="Business Type" value={contact.businessType} />
            <Row label="Department" value={contact.department} />
            <Row label="Working Area" value={contact.workingArea} />
            <Row label="Route Covered" value={contact.routeCovered} />
          </div>

          {(contact.steelGrades?.length > 0 || contact.materialType || contact.serviceType) && (
            <div className="card">
              <div className="form-section-title" style={{ marginBottom: 12 }}>Business Details</div>
              <Row label="Material Type" value={contact.materialType} />
              <Row label="Service Type" value={contact.serviceType} />
              {contact.steelGrades?.length > 0 && (
                <div className="report-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                  <span className="label">Steel Grades</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {contact.steelGrades.map(g => <span key={g} className="badge badge-cat">{g}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}

          {(contact.birthday || contact.followUpDate || contact.notes) && (
            <div className="card">
              <div className="form-section-title" style={{ marginBottom: 12 }}>Reminders & Notes</div>
              {contact.birthday && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13 }}><Calendar size={14} color="var(--purple)" /><span>Birthday: {contact.birthday}</span></div>}
              {contact.followUpDate && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13 }}><Calendar size={14} color="var(--gold)" /><span>Follow-up: {contact.followUpDate}</span></div>}
              {contact.notes && <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>{contact.notes}</div>}
            </div>
          )}
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Added on: {contact.createdAt ? format(new Date(contact.createdAt), 'dd MMM yyyy, hh:mm a') : '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
