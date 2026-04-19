import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to their own dashboard
    const dashboards = { admin: '/admin', faculty: '/faculty', student: '/student' };
    return <Navigate to={dashboards[role] || '/'} replace />;
  }

  return children;
}
