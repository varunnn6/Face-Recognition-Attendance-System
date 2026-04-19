import { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAttendanceByStudent, getAttendanceStats, getSubjects, getActiveSessions } from '../../services/dataService';
import AttendanceGauge from '../../components/ui/AttendanceGauge';
import { CalendarDays, ScanFace, BookOpen, Clock, ArrowRight, CheckCircle, XCircle } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const studentId = user?.studentData?.studentId || user?.id;
  const attendance = useMemo(() => getAttendanceByStudent(studentId), [studentId]);
  const stats = useMemo(() => getAttendanceStats(studentId), [studentId]);
  const activeSessions = useMemo(() => getActiveSessions(), []);
  const subjects = useMemo(() => getSubjects(), []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  // Subject-wise stats
  const subjectStats = useMemo(() => {
    const map = {};
    attendance.forEach(r => {
      if (!map[r.subject]) map[r.subject] = { present: 0, absent: 0, total: 0 };
      map[r.subject].total++;
      if (r.status === 'Present') map[r.subject].present++;
      else map[r.subject].absent++;
    });
    return Object.entries(map).map(([name, data]) => ({
      name,
      ...data,
      percentage: Math.round((data.present / data.total) * 100),
    }));
  }, [attendance]);

  const today = new Date().toISOString().split('T')[0];
  const todayRecords = attendance.filter(a => a.date === today);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <p className="label-tag">STUDENT DASHBOARD</p>
        <h1>{greeting}, {user?.name || 'Student'} 👋</h1>
        <p>ID: {studentId} • {user?.studentData?.department || 'N/A'} • {user?.studentData?.course || 'N/A'}</p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap' }}>
        {/* Left Column */}
        <div style={{ flex: 2, minWidth: 400 }}>
          {/* Overall Stats */}
          <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="card-static" style={{ padding: 20, textAlign: 'center' }}>
              <AttendanceGauge percentage={stats.percentage} size={90} strokeWidth={7} label="Overall" />
            </div>
            <div className="card-static" style={{ padding: 20 }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>Summary</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontSize: '0.85rem' }}>{stats.present} Present</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <XCircle size={16} style={{ color: 'var(--accent-danger)' }} />
                  <span style={{ fontSize: '0.85rem' }}>{stats.absent} Absent</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CalendarDays size={16} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.85rem' }}>{stats.total} Total</span>
                </div>
              </div>
            </div>
            <div className="card-static" style={{ padding: 20 }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>Today</p>
              {todayRecords.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No records today</p>
              ) : (
                todayRecords.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.82rem' }}>
                    <span>{r.subject}</span>
                    <span className={`badge ${r.status === 'Present' ? 'badge-success' : 'badge-danger'}`}>{r.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Subject-wise Breakdown */}
          <div className="card-static" style={{ padding: 22, marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 'var(--space-md)' }}>
              SUBJECT-WISE ATTENDANCE
            </h3>
            {subjectStats.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No attendance data yet</p>
            ) : (
              subjectStats.map((sub, i) => (
                <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sub.name}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: sub.percentage >= 75 ? 'var(--accent-primary)' : sub.percentage >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)' }}>
                      {sub.percentage}%
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${sub.percentage}%`,
                      height: '100%',
                      background: sub.percentage >= 75 ? 'var(--accent-primary)' : sub.percentage >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4 }}>
                    {sub.present}P / {sub.absent}A / {sub.total} Total
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ flex: 1, minWidth: 280 }}>
          {/* Active Sessions Alert */}
          {activeSessions.length > 0 ? (
            <div className="card-static session-active" style={{ padding: 22, marginBottom: 'var(--space-md)', cursor: 'pointer' }} onClick={() => navigate('/student/mark')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)', animation: 'pulse 1.5s infinite' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-primary)' }}>Active Session Available</span>
              </div>
              {activeSessions.map(s => (
                <div key={s.id} style={{ padding: 10, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', marginBottom: 6 }}>
                  <div style={{ fontWeight: 700 }}>{s.subject}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.durationMinutes} min window</div>
                </div>
              ))}
              <span style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                Mark Attendance Now <ArrowRight size={14} />
              </span>
            </div>
          ) : (
            <div className="card-static" style={{ padding: 22, marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Clock size={16} style={{ color: 'var(--text-dim)' }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No active sessions</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Wait for faculty to start an attendance session</p>
            </div>
          )}

          {/* Quick Links */}
          <div className="card" style={{ padding: 22, cursor: 'pointer', marginBottom: 'var(--space-md)' }} onClick={() => navigate('/student/attendance')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CalendarDays size={20} style={{ color: 'var(--accent-primary)' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>View Full Calendar</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Monthly & yearly attendance view</div>
              </div>
              <ArrowRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-dim)' }} />
            </div>
          </div>

          <div className="card" style={{ padding: 22, cursor: 'pointer' }} onClick={() => navigate('/student/mark')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ScanFace size={20} style={{ color: 'var(--accent-secondary)' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Mark via Face</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Use camera to mark attendance</div>
              </div>
              <ArrowRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-dim)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
