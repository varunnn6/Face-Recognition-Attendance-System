import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { X, Shield, GraduationCap, User, Eye, EyeOff } from 'lucide-react';

const ROLES = [
  { key: 'admin', label: 'Admin', icon: Shield, color: 'var(--accent-danger)' },
  { key: 'faculty', label: 'Faculty', icon: GraduationCap, color: 'var(--accent-secondary)' },
  { key: 'student', label: 'Student', icon: User, color: 'var(--accent-primary)' },
];

export default function LoginModal({ onClose }) {
  const [role, setRole] = useState('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);

    // Simulate small delay for UX
    setTimeout(() => {
      const result = login(role, username.trim(), password.trim());
      setLoading(false);
      if (result.success) {
        toast.success(`Welcome back, ${result.user.name}!`);
        onClose();
        // Navigate to role dashboard
        const routes = { admin: '/admin', faculty: '/faculty', student: '/student' };
        navigate(routes[role] || '/');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    }, 600);
  };

  const hints = {
    admin: { user: 'admin', pass: 'admin123' },
    faculty: { user: 'faculty', pass: 'faculty123' },
    student: { user: 'Student ID or Name', pass: 'student' },
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal glass-strong" style={{ maxWidth: 440 }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Welcome Back</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>Sign in to your account</p>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose} id="close-login-modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Role Tabs */}
          <div className="login-tabs">
            {ROLES.map(r => (
              <button
                key={r.key}
                className={`login-tab ${role === r.key ? 'active' : ''}`}
                onClick={() => { setRole(r.key); setError(''); }}
                id={`tab-${r.key}`}
              >
                <r.icon size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">{role === 'student' ? 'Student ID' : 'Username'}</label>
              <input
                className="input"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={hints[role].user}
                autoFocus
                id="login-username"
              />
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  id="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ color: 'var(--accent-danger)', fontSize: '0.82rem', marginBottom: 12, padding: '8px 12px', background: 'rgba(255,107,107,0.08)', borderRadius: 'var(--radius-sm)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 8 }}
              disabled={loading}
              id="login-submit"
            >
              {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Sign In'}
            </button>
          </form>

          {/* Hint */}
          <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4 }}>Demo Credentials</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <strong>{hints[role].user}</strong> / <strong>{hints[role].pass}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
