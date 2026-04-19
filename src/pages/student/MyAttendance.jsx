import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAttendanceByStudent, getSubjects } from '../../services/dataService';
import Calendar from '../../components/ui/Calendar';
import DataTable from '../../components/ui/DataTable';
import AttendanceGauge from '../../components/ui/AttendanceGauge';
import { Download } from 'lucide-react';

export default function MyAttendance() {
  const { user } = useAuth();
  const studentId = user?.studentData?.studentId || user?.id;

  const [attendance] = useState(() => getAttendanceByStudent(studentId));
  const [subjects] = useState(() => getSubjects());
  const [selectedSubject, setSelectedSubject] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [view, setView] = useState('calendar');
  const [selectedDay, setSelectedDay] = useState(null);

  const filteredData = useMemo(() => {
    let data = attendance;
    if (selectedSubject) data = data.filter(a => a.subject === selectedSubject);
    if (dateFrom) data = data.filter(a => a.date >= dateFrom);
    if (dateTo) data = data.filter(a => a.date <= dateTo);
    return data;
  }, [attendance, selectedSubject, dateFrom, dateTo]);

  const dayDetails = useMemo(() => {
    if (!selectedDay) return [];
    return filteredData.filter(a => a.date === selectedDay);
  }, [filteredData, selectedDay]);

  const overallStats = useMemo(() => {
    const total = filteredData.length;
    const present = filteredData.filter(r => r.status === 'Present').length;
    return { total, present, absent: total - present, percentage: total > 0 ? Math.round((present / total) * 100) : 0 };
  }, [filteredData]);

  // Subject-wise stats
  const subjectBreakdown = useMemo(() => {
    const map = {};
    filteredData.forEach(r => {
      if (!map[r.subject]) map[r.subject] = { name: r.subject, present: 0, absent: 0, total: 0 };
      map[r.subject].total++;
      if (r.status === 'Present') map[r.subject].present++;
      else map[r.subject].absent++;
    });
    return Object.values(map).map(s => ({ ...s, percentage: Math.round((s.present / s.total) * 100) }));
  }, [filteredData]);

  const handleExport = () => {
    const csv = ['Subject,Date,Time,Status',
      ...filteredData.map(r => `${r.subject},${r.date},${r.time},${r.status}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'my_attendance.csv'; a.click();
  };

  // Get unique subjects from student's attendance
  const mySubjects = useMemo(() => {
    const subs = new Set(attendance.map(a => a.subject));
    return Array.from(subs);
  }, [attendance]);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <p className="label-tag">MY ATTENDANCE</p>
        <h1>Attendance Calendar & Stats</h1>
        <p>{user?.name || 'Student'} • {studentId}</p>
      </div>

      {/* Filters */}
      <div className="card-static" style={{ padding: 18, marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0, minWidth: 150 }}>
            <label className="label">Subject</label>
            <select className="select" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              <option value="">All Subjects</option>
              {mySubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: 130 }}>
            <label className="label">From</label>
            <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: 130 }}>
            <label className="label">To</label>
            <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className={`btn ${view === 'calendar' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setView('calendar')}>Calendar</button>
            <button className={`btn ${view === 'subjects' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setView('subjects')}>By Subject</button>
            <button className={`btn ${view === 'table' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setView('table')}>Records</button>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleExport}><Download size={14} /> Export</button>
        </div>
      </div>

      {/* Overall Gauge */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--space-xl)' }}>
        <div className="card-static" style={{ padding: 20, textAlign: 'center' }}>
          <AttendanceGauge percentage={overallStats.percentage} size={80} strokeWidth={6} label="Overall" />
        </div>
        <div className="card-static" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Present</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{overallStats.present}</p>
        </div>
        <div className="card-static" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Absent</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-danger)' }}>{overallStats.absent}</p>
        </div>
        <div className="card-static" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Classes</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{overallStats.total}</p>
        </div>
      </div>

      {/* Views */}
      {view === 'calendar' && (
        <div style={{ display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 320 }}>
            <Calendar attendanceData={filteredData} selectedSubject={selectedSubject} onDayClick={setSelectedDay} />
          </div>
          {selectedDay && dayDetails.length > 0 && (
            <div className="card-static fade-in-right" style={{ flex: 1, minWidth: 260, padding: 22 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>📅 {selectedDay}</h3>
              {dayDetails.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.subject}</span>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginLeft: 8 }}>{r.time}</span>
                  </div>
                  <span className={`badge ${r.status === 'Present' ? 'badge-success' : 'badge-danger'}`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'subjects' && (
        <div className="grid-2">
          {subjectBreakdown.map((sub, i) => (
            <div key={i} className="card-static" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{sub.name}</h4>
                <AttendanceGauge percentage={sub.percentage} size={60} strokeWidth={5} label="" />
              </div>
              <div style={{ height: 8, background: 'var(--border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 8 }}>
                <div style={{
                  width: `${sub.percentage}%`, height: '100%',
                  background: sub.percentage >= 75 ? 'var(--accent-primary)' : sub.percentage >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)',
                  borderRadius: 'var(--radius-full)',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>{sub.present} Present</span>
                <span>{sub.absent} Absent</span>
                <span>{sub.total} Total</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'table' && (
        <DataTable
          columns={[
            { key: 'subject', label: 'Subject', width: 150 },
            { key: 'date', label: 'Date', width: 100 },
            { key: 'time', label: 'Time', width: 70 },
            { key: 'status', label: 'Status', width: 80, render: (val) => <span className={`badge ${val === 'Present' ? 'badge-success' : 'badge-danger'}`}>{val}</span> },
          ]}
          data={filteredData}
        />
      )}
    </div>
  );
}
