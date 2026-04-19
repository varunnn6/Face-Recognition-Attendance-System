import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Users, Camera, Brain, CalendarDays, ArrowRight, TrendingUp, BookOpen } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { students, loading, getDashboardStats } = useData();
  const navigate = useNavigate();

  const stats = getDashboardStats();
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const recentStudents = students.slice(-5).reverse();

  const quickActions = [
    { title: 'Add Student', desc: 'Register new students and capture photographs', icon: Users, color: 'var(--accent-primary)', path: '/admin/students' },
    { title: 'Manage Subjects', desc: 'Add or associate faculty to subjects', icon: Users, color: 'var(--accent-secondary)', path: '/admin/subjects' },
    { title: 'Capture Photos', desc: 'Start camera with zoom controls', icon: Camera, color: 'var(--accent-primary)', path: '/admin/capture' },
    { title: 'View Attendance', desc: 'Browse and export attendance records', icon: CalendarDays, color: 'var(--accent-info)', path: '/admin/attendance' },
  ];

  if (loading) return (
    <div className="page fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  return (
    <div className="page fade-in">
      <div className="page-header">
        <p className="label-tag">ADMIN DASHBOARD</p>
        <h1>{greeting}, {user?.name || 'Admin'} 👋</h1>
        <p>Here's an overview of your attendance system</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        {[
          { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'var(--accent-primary)' },
          { label: 'Photos Captured', value: stats.photoCaptured, icon: Camera, color: 'var(--accent-secondary)' },
          { label: 'AI Model', value: stats.modelTrained ? 'Ready' : 'Not Trained', icon: Brain, color: stats.modelTrained ? 'var(--accent-primary)' : 'var(--accent-danger)' },
          { label: 'Total Records', value: stats.totalAttendanceRecords, icon: CalendarDays, color: 'var(--accent-info)' },
          { label: 'Subjects', value: stats.totalSubjects, icon: BookOpen, color: 'var(--accent-secondary)' },
          { label: 'Today Present', value: stats.todayPresent, icon: TrendingUp, color: 'var(--accent-primary)' },
        ].map((s, i) => (
          <div key={i} className={`card-static fade-in-up stagger-${i + 1}`} style={{ padding: '18px 22px', opacity: 0, animationFillMode: 'forwards' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', marginBottom: 4 }}>{s.label}</p>
                <p style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.value}</p>
              </div>
              <div style={{ padding: 8, borderRadius: 'var(--radius-sm)', background: `${s.color}10` }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 'var(--space-md)' }}>QUICK ACTIONS</h3>
        <div className="grid-4">
          {quickActions.map((action, i) => (
            <div key={i} className="card" style={{ padding: 22, cursor: 'pointer' }} onClick={() => navigate(action.path)}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: `${action.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <action.icon size={20} style={{ color: action.color }} />
              </div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 4 }}>{action.title}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>{action.desc}</p>
              <span style={{ fontSize: '0.78rem', color: action.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                Open <ArrowRight size={14} />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Students */}
      <div className="card-static" style={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)' }}>RECENT STUDENTS</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/students')}>View All</button>
        </div>
        {recentStudents.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No students added yet.</p>
        ) : (
          <table className="data-table">
            <thead><tr><th>ID</th><th>Name</th><th>Department</th><th>Course</th><th>Roll</th><th>Photo</th></tr></thead>
            <tbody>
              {recentStudents.map(s => (
                <tr key={s.studentId}>
                  <td style={{ fontWeight: 600 }}>{s.studentId}</td>
                  <td>{s.name}</td>
                  <td>{s.department}</td>
                  <td>{s.course}</td>
                  <td>{s.roll}</td>
                  <td><span className={`badge ${s.photoSample === 'Yes' ? 'badge-success' : 'badge-warning'}`}>{s.photoSample === 'Yes' ? 'Captured' : 'Pending'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
