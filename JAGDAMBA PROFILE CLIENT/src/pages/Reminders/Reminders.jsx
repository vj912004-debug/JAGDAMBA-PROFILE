import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { parseISO, format, differenceInDays } from 'date-fns';
import { Phone, MessageCircle } from 'lucide-react';

export default function Reminders() {
  const { state } = useApp();
  const navigate = useNavigate();
  const today = new Date();

  const birthdays = useMemo(() => {
    return state.contacts
      .filter(c => c.birthday)
      .map(c => {
        const d = parseISO(c.birthday);
        const thisYear = new Date(today.getFullYear(), d.getMonth(), d.getDate());
        const diff = differenceInDays(thisYear, new Date(today.getFullYear(), today.getMonth(), today.getDate()));
        return { ...c, diff, dateStr: format(d, 'dd MMM') };
      })
      .filter(c => c.diff >= 0 && c.diff <= 60)
      .sort((a, b) => a.diff - b.diff);
  }, [state.contacts]);

  const followups = useMemo(() => {
    return state.contacts
      .filter(c => c.followUpDate)
      .map(c => {
        const diff = differenceInDays(new Date(c.followUpDate), today);
        return { ...c, diff };
      })
      .filter(c => c.diff >= -7 && c.diff <= 14)
      .sort((a, b) => a.diff - b.diff);
  }, [state.contacts]);

  const todayBirthdays = birthdays.filter(c => c.diff === 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">🔔 Reminders</div>
          <div className="page-subtitle">{todayBirthdays.length} birthdays today · {followups.filter(c => c.diff <= 0).length} follow-ups overdue</div>
        </div>
      </div>

      {/* Today's Birthdays */}
      {todayBirthdays.length > 0 && (
        <div className="card" style={{ marginBottom: 20, border: '1px solid rgba(245,166,35,0.4)', background: 'rgba(245,166,35,0.05)' }}>
          <div className="card-title" style={{ marginBottom: 16, color: 'var(--gold)' }}>🎉 Today's Birthdays!</div>
          {todayBirthdays.map(c => (
            <div key={c.id} className="reminder-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/contacts/${c.id}`)}>
              <div className="reminder-avatar">{(c.contactPerson || '?')[0].toUpperCase()}</div>
              <div>
                <div className="reminder-name">{c.contactPerson}</div>
                <div className="reminder-sub">{c.companyName} · {c.city}</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ color: 'var(--gold)', fontWeight: 700 }}>🎂 {c.dateStr}</span>
                {c.mobile && <a href={`https://wa.me/91${c.whatsapp || c.mobile}?text=Happy Birthday ${c.contactPerson}! 🎉`} target="_blank" rel="noreferrer" className="btn btn-success btn-sm" style={{ textDecoration: 'none' }}><MessageCircle size={13} /> Wish</a>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Upcoming Birthdays */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🎂 Upcoming Birthdays (60 days)</div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{birthdays.length} total</span>
          </div>
          {birthdays.length === 0
            ? <div className="table-empty">No upcoming birthdays</div>
            : birthdays.map(c => (
              <div key={c.id} className="reminder-item" onClick={() => navigate(`/contacts/${c.id}`)} style={{ cursor: 'pointer' }}>
                <div className="reminder-avatar" style={{ background: c.diff === 0 ? 'linear-gradient(135deg, var(--gold), #d97706)' : 'var(--bg-elevated)', color: c.diff === 0 ? '#000' : 'var(--text-primary)' }}>
                  {(c.contactPerson || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div className="reminder-name">{c.contactPerson}</div>
                  <div className="reminder-sub">{c.companyName || c.category}</div>
                </div>
                <div className="reminder-date">{c.diff === 0 ? '🎉 Today' : `${c.dateStr} (${c.diff}d)`}</div>
              </div>
            ))}
        </div>

        {/* Follow-ups */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📋 Follow-up Reminders</div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{followups.length} total</span>
          </div>
          {followups.length === 0
            ? <div className="table-empty">No pending follow-ups</div>
            : followups.map(c => {
              const isOverdue = c.diff < 0;
              const isToday = c.diff === 0;
              return (
                <div key={c.id} className="reminder-item" onClick={() => navigate(`/contacts/${c.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="reminder-avatar" style={{ background: isOverdue ? 'var(--red)' : isToday ? 'var(--orange)' : 'linear-gradient(135deg, var(--blue), #2563eb)' }}>
                    {(c.contactPerson || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="reminder-name">{c.contactPerson}</div>
                    <div className="reminder-sub">{c.companyName}</div>
                  </div>
                  <div className="reminder-date" style={{ color: isOverdue ? 'var(--red)' : isToday ? 'var(--orange)' : 'var(--gold)' }}>
                    {isOverdue ? `${Math.abs(c.diff)}d overdue` : isToday ? 'Today' : `in ${c.diff}d`}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
