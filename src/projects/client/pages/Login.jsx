import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Lock, Eye, EyeOff } from 'lucide-react';

const VALID_PASSWORDS = ['Mukesh@123', 'Dilip@123'];

export default function Login() {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (VALID_PASSWORDS.includes(password)) {
        dispatch({ type: 'LOGIN' });
        navigate('/');
      } else {
        setError('Incorrect password. Try: Mukesh@123 or Dilip@123');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">⚙️</div>
          <div className="login-title">Steel Connect Pro</div>
          <div className="login-subtitle">Smart Contact Management for Steel Business</div>
        </div>
        <form className="login-form" onSubmit={handleLogin}>
          {error && <div className="login-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={show ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: 36, paddingRight: 40 }}
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
              <button type="button" onClick={() => setShow(p => !p)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            Default passwords: <strong style={{ color: 'var(--gold)' }}>Mukesh@123 / Dilip@123</strong>
          </p>
        </form>
      </div>
    </div>
  );
}
