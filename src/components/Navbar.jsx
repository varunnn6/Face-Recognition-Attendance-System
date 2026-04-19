import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { LogOut, LogIn, Menu, X, KeyRound } from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';

export default function Navbar({ onLoginClick }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [clock, setClock] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) + '  •  ' + now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Public links (before login)
  const publicLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  // Role-based links after login
  const roleLinks = {
    admin: [
      { to: '/admin', label: 'Dashboard' },
      { to: '/admin/students', label: 'Students' },
      { to: '/admin/subjects', label: 'Subjects' },
      { to: '/admin/capture', label: 'Capture' },
      { to: '/admin/attendance', label: 'Attendance' },
    ],
    faculty: [
      { to: '/faculty', label: 'Dashboard' },
      { to: '/faculty/session', label: 'Sessions' },
      { to: '/faculty/students', label: 'Students' },
      { to: '/faculty/reports', label: 'Reports' },
    ],
    student: [
      { to: '/student', label: 'Dashboard' },
      { to: '/student/attendance', label: 'My Attendance' },
      { to: '/student/mark', label: 'Mark Attendance' },
    ],
  };

  const links = isAuthenticated ? (roleLinks[user.role] || []) : publicLinks;

  return (
    <nav className="navbar" id="main-navbar">
      <NavLink to="/" className="navbar-brand">
        <span className="dot" />
        FACEATTEND
      </NavLink>

      <div className="navbar-links" style={mobileOpen ? { display: 'flex', position: 'absolute', top: 60, left: 0, right: 0, background: 'var(--bg-secondary)', flexDirection: 'column', padding: '16px', borderBottom: '1px solid var(--border-subtle)', zIndex: 50 } : {}}>
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/' || link.to === '/admin' || link.to === '/faculty' || link.to === '/student'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="navbar-right">
        <span className="navbar-clock">{clock}</span>

        {isAuthenticated ? (
          <>
            <div className="navbar-user" title={`${user.name} (${user.role})`}>
              <div className="navbar-avatar">{user.name?.split(' ').map(n => n[0]).join('').toUpperCase()}</div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{user.name}</span>
              <span className="badge badge-success" style={{ marginLeft: 4 }}>{user.role}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowChangePw(true)} id="change-pw-btn" title="Change Password">
              <KeyRound size={15} /> Password
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout} id="logout-btn">
              <LogOut size={15} /> Logout
            </button>
          </>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onLoginClick} id="login-btn">
            <LogIn size={15} /> Login
          </button>
        )}
        {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}

        <button className="btn btn-icon btn-ghost" onClick={() => setMobileOpen(!mobileOpen)} style={{ display: 'none' }} id="mobile-menu-btn">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </nav>
  );
}
