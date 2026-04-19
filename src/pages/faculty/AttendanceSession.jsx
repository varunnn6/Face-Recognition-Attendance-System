import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getSubjects, createSession, endSession, getActiveSessions, getSessions } from '../../services/dataService';
import { PlayCircle, StopCircle, Clock, Users, CheckCircle } from 'lucide-react';

export default function AttendanceSession() {
  const { user } = useAuth();
  const toast = useToast();
  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState(user?.department || 'Computer');
  const [duration, setDuration] = useState(10);
  const [activeSessions, setActiveSessions] = useState(() => getActiveSessions());
  const [allSessions, setAllSessions] = useState(() => getSessions());
  const [timer, setTimer] = useState(null);

  const subjects = useMemo(() => getSubjects().filter(s => s.department === user?.department || s.faculty === user?.name), [user]);

  // Timer for active sessions
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSessions(getActiveSessions());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    if (!subject) { toast.error('Select a subject'); return; }
    const session = createSession({
      subject,
      department,
      durationMinutes: duration,
      facultyId: user?.id,
      facultyName: user?.name,
    });
    toast.success(`Session started for ${subject} (${duration} min)`);
    setActiveSessions(getActiveSessions());
    setAllSessions(getSessions());
  };

  const handleEnd = (sessionId) => {
    endSession(sessionId);
    toast.info('Session ended');
    setActiveSessions(getActiveSessions());
    setAllSessions(getSessions());
  };

  const getTimeRemaining = (session) => {
    const created = new Date(session.createdAt);
    const expires = new Date(created.getTime() + session.durationMinutes * 60 * 1000);
    const now = new Date();
    const remaining = Math.max(0, Math.floor((expires - now) / 1000));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const pastSessions = allSessions.filter(s => s.status !== 'active').slice(-10).reverse();

  return (
    <div className="page fade-in">
      <div className="page-header">
        <p className="label-tag">ATTENDANCE SESSIONS</p>
        <h1>Start & Manage Sessions</h1>
        <p>Create time-limited windows for students to mark attendance via face recognition</p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap' }}>
        {/* Create Session */}
        <div className="card-static" style={{ flex: 1, minWidth: 320, padding: 24 }}>
          <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 'var(--space-lg)' }}>
            NEW SESSION
          </h3>

          <div className="form-group">
            <label className="label">Subject</label>
            <select className="select" value={subject} onChange={e => setSubject(e.target.value)} id="session-subject">
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.name}>{s.name} ({s.code})</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Department</label>
            <select className="select" value={department} onChange={e => setDepartment(e.target.value)}>
              {['Computer', 'IT', 'Civil', 'Mechanical'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Duration (minutes)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 5, 10, 15, 20, 30].map(d => (
                <button
                  key={d}
                  className={`btn ${duration === d ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                  onClick={() => setDuration(d)}
                >
                  {d}m
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 'var(--space-md)' }} onClick={handleStart} id="start-session-btn">
            <PlayCircle size={18} /> Start Session
          </button>
        </div>

        {/* Active Sessions */}
        <div style={{ flex: 1, minWidth: 320 }}>
          <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 'var(--space-md)' }}>
            ACTIVE SESSIONS ({activeSessions.length})
          </h3>

          {activeSessions.length === 0 ? (
            <div className="card-static empty-state" style={{ padding: 'var(--space-2xl)' }}>
              <Clock size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
              <h3>No Active Sessions</h3>
              <p>Start a session to allow students to mark attendance</p>
            </div>
          ) : (
            activeSessions.map(session => (
              <div key={session.id} className="card-static session-active" style={{ padding: 22, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{session.subject}</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{session.department}</p>
                  </div>
                  <span className="badge badge-success">● Live</span>
                </div>

                <div className="session-timer" style={{ textAlign: 'center', margin: '12px 0' }}>
                  {getTimeRemaining(session)}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{session.markedStudents.length} marked</span>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => handleEnd(session.id)}>
                    <StopCircle size={14} /> End Session
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Past Sessions */}
          {pastSessions.length > 0 && (
            <div style={{ marginTop: 'var(--space-xl)' }}>
              <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 'var(--space-md)' }}>
                PAST SESSIONS
              </h3>
              {pastSessions.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', marginBottom: 6, border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.subject}</span>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginLeft: 8 }}>{s.markedStudents.length} students</span>
                  </div>
                  <span className={`badge ${s.status === 'ended' ? 'badge-info' : 'badge-warning'}`}>{s.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
