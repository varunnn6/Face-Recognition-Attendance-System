import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { X, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';

export default function ChangePasswordModal({ onClose }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const { updatePassword } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields'); return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters'); return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match'); return;
    }
    if (oldPassword === newPassword) {
      setError('New password must be different from current'); return;
    }
    setLoading(true);
    try {
      const result = await updatePassword(oldPassword, newPassword);
      if (result.success) {
        setDone(true);
        toast.success('Password changed successfully!');
        setTimeout(() => onClose(), 2000);
      } else {
        setError(result.error || 'Failed to change password');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal glass-strong" style={{ maxWidth: 420 }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Change Password</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>Update your account password</p>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {done ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle2 size={48} color="var(--accent-secondary)" style={{ marginBottom: 12 }} />
              <p style={{ fontWeight: 700, fontSize: '1rem' }}>Password Updated!</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 6 }}>Use your new password next time you log in.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showOld ? 'text' : 'password'} value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)} placeholder="Enter your current password" autoFocus />
                  <button type="button" onClick={() => setShowOld(!showOld)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                    {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showNew ? 'text' : 'password'} value={newPassword}
                    onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 characters" />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Password strength indicator */}
                {newPassword && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{
                        height: 3, flex: 1, borderRadius: 2,
                        background: newPassword.length >= i * 2
                          ? (newPassword.length >= 8 ? 'var(--accent-secondary)' : 'var(--accent-warning)')
                          : 'var(--border-subtle)'
                      }} />
                    ))}
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: 4 }}>
                      {newPassword.length < 6 ? 'Weak' : newPassword.length < 8 ? 'Fair' : newPassword.length < 12 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="label">Confirm New Password</label>
                <input className="input" type="password" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--accent-danger)', marginTop: 4 }}>Passwords do not match</p>
                )}
              </div>

              {error && (
                <p style={{ color: 'var(--accent-danger)', fontSize: '0.82rem', marginBottom: 12, padding: '8px 12px', background: 'rgba(255,107,107,0.08)', borderRadius: 'var(--radius-sm)' }}>
                  {error}
                </p>
              )}

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><KeyRound size={16} style={{ marginRight: 6 }} />Update Password</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
