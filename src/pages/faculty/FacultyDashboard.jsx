import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { PlayCircle, Users, CalendarDays, Search, ArrowRight, Clock } from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const { students, attendance, activeSessions, subjects, loading } = useData();
  const navigate = useNavigate();

  const deptStudents = students.filter(s => s.department === user?.department);
  const mySubjects = subjects.filter(s => s.faculty === user?.name || s.department === user?.department);
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = attendance.filter(a => a.date === today);
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return (
    <div className="page fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  return (
    <div className="page fade-in">
      <div className="page-header">
        <p className="label-tag">FACULTY DASHBOARD</p>
        <h1>{greeting}, {user?.name || 'Professor'} 👋</h1>
        <p>{user?.department} Department</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        {[
          { label: 'My Students', value: deptStudents.length, icon: Users, color: 'var(--accent-primary)' },
          { label: 'Active Sessions', value: activeSessions.length, icon: PlayCircle, color: activeSessions.length > 0 ? 'var(--accent-primary)' : 'var(--text-dim)' },
          { label: "Today's Records", value: todayRecords.length, icon: CalendarDays, color: 'var(--accent-info)' },
          { label: 'My Subjects', value: mySubjects.length, icon: Clock, color: 'var(--accent-secondary)' },
        ].map((s, i) => (
          <div key={i} className="card-static" style={{ padding: '18px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', marginBottom: 4 }}>{s.label}</p>
                <p style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.value}</p>
              </div>
              <s.icon size={18} style={{ color: s.color, opacity: 0.6 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid-3" style={{ marginBottom: 'var(--space-xl)' }}>
        {[
          { title: 'Start Session', desc: 'Open a time-limited attendance window for students', icon: PlayCircle, color: 'var(--accent-primary)', path: '/faculty/session' },
          { title: 'View Reports', desc: 'Calendar view, subject filters, and date range analytics', icon: CalendarDays, color: 'var(--accent-info)', path: '/faculty/reports' },
          { title: 'Student Directory', desc: 'Search and view student profiles and attendance', icon: Search, color: 'var(--accent-secondary)', path: '/faculty/students' },
        ].map((action, i) => (
          <div key={i} className="card" style={{ padding: 24, cursor: 'pointer' }} onClick={() => navigate(action.path)}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: `${action.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <action.icon size={20} style={{ color: action.color }} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>{action.title}</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>{action.desc}</p>
            <span style={{ fontSize: '0.78rem', color: action.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              Open <ArrowRight size={14} />
            </span>
          </div>
        ))}
      </div>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="card-static session-active" style={{ padding: 22 }}>
          <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-primary)', marginBottom: 'var(--space-md)' }}>
            🟢 ACTIVE SESSIONS
          </h3>
          {activeSessions.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{s.subject}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.department} • {s.durationMinutes} min • {(s.markedStudents || []).length} marked</div>
              </div>
              <span className="badge badge-success">Active</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
