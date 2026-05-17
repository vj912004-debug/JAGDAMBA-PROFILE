import React, { useState, useEffect } from 'react';
import { MessageSquare, X, RefreshCw, Send, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { CATEGORIES } from '../data/seedData';
import { api } from '../utils/api';
import { useApp } from '../context/AppContext';

export default function BulkWhatsAppModal({ isOpen, onClose }) {
  const { state } = useApp();
  const [status, setStatus] = useState('DISCONNECTED');
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [group, setGroup] = useState('');
  const [category, setCategory] = useState('');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);

  const fetchStatus = async () => {
    try {
      const data = await api.whatsapp.getStatus();
      setStatus(data.status);
      if (data.status === 'QR_READY') {
        fetchQr();
      }
    } catch (error) {
      console.error('Failed to fetch status', error);
    }
  };

  const fetchQr = async () => {
    try {
      const data = await api.whatsapp.getQr();
      setQr(data.qr);
    } catch (error) {
      console.error('Failed to fetch QR', error);
    }
  };

  const handleInit = async () => {
    setLoading(true);
    try {
      await api.whatsapp.init();
      toast.success('Initializing WhatsApp...');
      setTimeout(fetchStatus, 2000);
    } catch (error) {
      toast.error('Failed to initialize');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await api.whatsapp.disconnect();
      toast.success('WhatsApp disconnected');
      setStatus('DISCONNECTED');
      setQr(null);
    } catch (error) {
      toast.error('Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message) return toast.error('Please enter a message');
    
    // Filter contacts based on selected category
    const filteredContacts = state.contacts.filter(c => {
      if (group && c.categoryGroup !== group) return false;
      if (category && c.category !== category) return false;
      return !!(c.whatsapp || c.mobile);
    });

    if (filteredContacts.length === 0) {
      return toast.error('No contacts found in the selected category');
    }

    setSending(true);
    setResults(null);
    try {
      const data = await api.whatsapp.sendBulk(message, filteredContacts);
      setResults(data);
      if (data.success > 0) {
        toast.success(`Successfully sent to ${data.success} contacts`);
      }
      if (data.failed > 0) {
        toast.error(`Failed to send to ${data.failed} contacts`);
      }
    } catch (error) {
      toast.error('Failed to send bulk messages');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="icon-wrap" style={{ background: 'rgba(37, 211, 102, 0.1)', color: '#25D366' }}>
              <MessageSquare size={20} />
            </div>
            <h2 className="modal-title">Bulk WhatsApp Automation</h2>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          {/* Status Section */}
          <div className="card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Connection Status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                  <div style={{ 
                    width: '10px', height: '10px', borderRadius: '50%', 
                    background: status === 'CONNECTED' ? '#25D366' : status === 'QR_READY' ? '#f59e0b' : '#ef4444' 
                  }}></div>
                  {status.replace('_', ' ')}
                </div>
              </div>
              {status === 'DISCONNECTED' ? (
                <button className="btn btn-primary btn-sm" onClick={handleInit} disabled={loading}>
                  {loading ? <RefreshCw className="spin" size={14} /> : 'Initialize WhatsApp'}
                </button>
              ) : status === 'CONNECTED' ? (
                <button className="btn btn-sm" style={{ background: 'var(--bg-card-hover)', color: '#ef4444' }} onClick={handleDisconnect} disabled={loading}>
                  {loading ? <RefreshCw className="spin" size={14} /> : 'Disconnect'}
                </button>
              ) : null}
            </div>

            {status === 'QR_READY' && qr && (
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <p style={{ fontSize: '14px', marginBottom: '12px' }}>Scan this QR code with your WhatsApp</p>
                <div style={{ background: 'white', padding: '16px', display: 'inline-block', borderRadius: '8px' }}>
                  <img src={qr} alt="WhatsApp QR Code" style={{ width: '200px', height: '200px' }} />
                </div>
              </div>
            )}
          </div>

          {status === 'CONNECTED' ? (
            <div className="space-y-4">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="label">Category Group</label>
                  <select className="input" value={group} onChange={e => { setGroup(e.target.value); setCategory(''); }}>
                    <option value="">All Groups</option>
                    {Object.keys(CATEGORIES).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Category</label>
                  <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="">All Categories</option>
                    {(CATEGORIES[group] || []).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Message Content</label>
                <textarea 
                  className="input" 
                  rows="4" 
                  placeholder="Type your message here..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  style={{ resize: 'none' }}
                ></textarea>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  The message will be sent to all contacts in the selected category.
                </p>
              </div>

              {results && (
                <div style={{ 
                  padding: '12px', 
                  borderRadius: '8px', 
                  background: 'rgba(255,255,255,0.05)',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#25D366' }}>
                      <CheckCircle size={14} /> Success: {results.success}
                    </div>
                    {results.failed > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}>
                        <AlertCircle size={14} /> Failed: {results.failed}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <p>Please connect your WhatsApp to enable bulk messaging.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          {status === 'CONNECTED' && (
            <button className="btn btn-primary" onClick={handleSend} disabled={sending || !message}>
              {sending ? <RefreshCw className="spin" size={18} /> : <><Send size={18} /> Send Bulk Message</>}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .space-y-4 > * + * { margin-top: 16px; }
      `}</style>
    </div>
  );
}
