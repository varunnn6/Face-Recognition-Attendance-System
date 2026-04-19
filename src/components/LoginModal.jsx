import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { X, Shield, GraduationCap, User, Eye, EyeOff, Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { requestPasswordReset, verifyOtpAndReset } from '../services/authService';

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

  // Forgot password states
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'otp'
  const [resetUsername, setResetUsername] = useState('');
  const [resetRole, setResetRole] = useState('student');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState(null);
  const [resetEmail, setResetEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // ---- Login submit ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const result = await login(role, username.trim(), password.trim());
      if (result.success) {
        toast.success(`Welcome back, ${result.user.name}!`);
        onClose();
        const routes = { admin: '/admin', faculty: '/faculty', student: '/student' };
        navigate(routes[role] || '/');
      } else {
        setError(result.error || 'Invalid credentials. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---- Forgot password: request OTP ----
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    if (!resetUsername.trim()) { setError('Please enter your username or student ID'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await requestPasswordReset(resetRole, resetUsername.trim());
      if (result.success) {
        setResetToken(result.token);
        setResetEmail(result.maskedEmail);
        setEmailSent(result.emailSent || false);
        setView('otp');
        if (result.emailSent) {
          toast.success(`OTP sent to ${result.maskedEmail}!`);
        } else {
          toast.success('OTP generated! Ask admin for the code or check your email.');
        }
      } else {
        setError(result.error || 'User not found.');
      }
    } catch {
      setError('Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---- Forgot password: verify OTP and reset ----
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp.trim() || !newPassword.trim()) { setError('Please fill all fields'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await verifyOtpAndReset(resetToken, otp.trim(), newPassword.trim());
      if (result.success) {
        toast.success('Password reset successfully! Please log in with your new password.');
        setView('login');
        setOtp(''); setNewPassword(''); setResetToken(null);
      } else {
        setError(result.error || 'Invalid or expired OTP.');
      }
    } catch {
      setError('Failed to reset password. Try again.');
    } finally {
      setLoading(false);
    }
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
            {view === 'login' && <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Welcome Back</h2>}
            {view === 'forgot' && <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Reset Password</h2>}
            {view === 'otp' && <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Enter OTP</h2>}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
              {view === 'login' ? 'Sign in to your account' : view === 'forgot' ? 'We\'ll send an OTP to your registered email' : `OTP code sent — check admin panel`}
            </p>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose} id="close-login-modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* ---- LOGIN VIEW ---- */}
          {view === 'login' && (
            <>
              <div className="login-tabs">
                {ROLES.map(r => (
                  <button key={r.key} className={`login-tab ${role === r.key ? 'active' : ''}`}
                    onClick={() => { setRole(r.key); setError(''); }} id={`tab-${r.key}`}>
                    <r.icon size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                    {r.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="label">{role === 'student' ? 'Student ID' : 'Username'}</label>
                  <input className="input" type="text" value={username}
                    onChange={e => setUsername(e.target.value)} placeholder={hints[role].user} autoFocus id="login-username" />
                </div>

                <div className="form-group">
                  <label className="label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input className="input" type={showPass ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)} placeholder="••••••••" id="login-password" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && <p style={{ color: 'var(--accent-danger)', fontSize: '0.82rem', marginBottom: 12, padding: '8px 12px', background: 'rgba(255,107,107,0.08)', borderRadius: 'var(--radius-sm)' }}>{error}</p>}

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading} id="login-submit">
                  {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Sign In'}
                </button>

                <button type="button" onClick={() => { setView('forgot'); setError(''); setResetRole(role); }}
                  style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.83rem', cursor: 'pointer', textDecoration: 'underline' }}>
                  Forgot password?
                </button>
              </form>

              <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4 }}>Default Credentials</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <strong>{hints[role].user}</strong> / <strong>{hints[role].pass}</strong>
                </p>
              </div>
            </>
          )}

          {/* ---- FORGOT PASSWORD VIEW ---- */}
          {view === 'forgot' && (
            <form onSubmit={handleForgotRequest}>
              <div className="form-group">
                <label className="label">Your Role</label>
                <div className="login-tabs" style={{ marginBottom: 0 }}>
                  {ROLES.map(r => (
                    <button key={r.key} type="button" className={`login-tab ${resetRole === r.key ? 'active' : ''}`}
                      onClick={() => setResetRole(r.key)}>
                      <r.icon size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="label">{resetRole === 'student' ? 'Student ID or Name' : 'Username'}</label>
                <input className="input" type="text" value={resetUsername}
                  onChange={e => setResetUsername(e.target.value)} placeholder="Enter your username" autoFocus />
              </div>

              {error && <p style={{ color: 'var(--accent-danger)', fontSize: '0.82rem', marginBottom: 12, padding: '8px 12px', background: 'rgba(255,107,107,0.08)', borderRadius: 'var(--radius-sm)' }}>{error}</p>}

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><Mail size={16} style={{ marginRight: 6 }} />Send OTP</>}
              </button>
              <button type="button" onClick={() => { setView('login'); setError(''); }}
                style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.83rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <ArrowLeft size={14} /> Back to Login
              </button>
            </form>
          )}

          {/* ---- OTP + NEW PASSWORD VIEW ---- */}
          {view === 'otp' && (
            <form onSubmit={handleOtpSubmit}>
              <div style={{ padding: '10px 14px', background: emailSent ? 'rgba(47,165,114,0.1)' : 'rgba(255,165,0,0.1)', borderRadius: 'var(--radius-sm)', border: `1px solid ${emailSent ? 'rgba(47,165,114,0.3)' : 'rgba(255,165,0,0.3)'}`, marginBottom: 16 }}>
                <p style={{ fontSize: '0.82rem', color: emailSent ? 'var(--accent-secondary)' : 'var(--accent-warning)' }}>
                  <Mail size={13} style={{ marginRight: 5, verticalAlign: -2 }} />
                  {emailSent
                    ? `OTP sent to ${resetEmail}. Check your inbox (and spam folder).`
                    : 'EmailJS not configured yet. Ask admin to check Firebase → password_resets collection for your OTP code.'}
                </p>
              </div>

              <div className="form-group">
                <label className="label">Enter OTP (6-digit code)</label>
                <input className="input" type="text" maxLength={6} value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="123456" autoFocus />
              </div>

              <div className="form-group">
                <label className="label">New Password</label>
                <input className="input" type="password" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 characters" />
              </div>

              {error && <p style={{ color: 'var(--accent-danger)', fontSize: '0.82rem', marginBottom: 12, padding: '8px 12px', background: 'rgba(255,107,107,0.08)', borderRadius: 'var(--radius-sm)' }}>{error}</p>}

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><KeyRound size={16} style={{ marginRight: 6 }} />Reset Password</>}
              </button>
              <button type="button" onClick={() => { setView('forgot'); setError(''); }}
                style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.83rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <ArrowLeft size={14} /> Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
