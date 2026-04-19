import { useState, useMemo } from 'react';
import { getAttendance, getSubjects, getStudents, getAttendanceStats } from '../../services/dataService';
import Calendar from '../../components/ui/Calendar';
import DataTable from '../../components/ui/DataTable';
import AttendanceGauge from '../../components/ui/AttendanceGauge';
import { Download, Filter } from 'lucide-react';

export default function AttendanceReports() {
  const [attendance] = useState(() => getAttendance());
  const [subjects] = useState(() => getSubjects());
  const [students] = useState(() => getStudents());
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

  // Student-wise summary
  const studentSummary = useMemo(() => {
    const map = {};
    filteredData.forEach(r => {
      if (!map[r.studentId]) map[r.studentId] = { name: r.studentName, id: r.studentId, present: 0, absent: 0, total: 0 };
      map[r.studentId].total++;
      if (r.status === 'Present') map[r.studentId].present++;
      else map[r.studentId].absent++;
    });
    return Object.values(map).map(s => ({ ...s, percentage: Math.round((s.present / s.total) * 100) }));
  }, [filteredData]);

  const handleExport = () => {
    const csv = ['StudentID,Name,Dept,Subject,Date,Time,Status',
      ...filteredData.map(r => `${r.studentId},${r.studentName},${r.department},${r.subject},${r.date},${r.time},${r.status}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'attendance_report.csv'; a.click();
  };

  const summaryColumns = [
    { key: 'id', label: 'ID', width: 80 },
    { key: 'name', label: 'Name', width: 130 },
    { key: 'present', label: 'Present', width: 70 },
    { key: 'absent', label: 'Absent', width: 70 },
    { key: 'total', label: 'Total', width: 60 },
    { key: 'percentage', label: 'Attendance', width: 100, render: (val) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 6, background: 'var(--border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div style={{ width: `${val}%`, height: '100%', background: val >= 75 ? 'var(--accent-primary)' : val >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)', borderRadius: 'var(--radius-full)' }} />
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: val >= 75 ? 'var(--accent-primary)' : val >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)' }}>{val}%</span>
      </div>
    )},
  ];

  return (
    <div className="page fade-in">
      <div className="page-header">
        <p className="label-tag">ATTENDANCE REPORTS</p>
        <h1>Analytics & Calendar View</h1>
      </div>

      {/* Filters */}
      <div className="card-static" style={{ padding: 18, marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0, minWidth: 160 }}>
            <label className="label">Subject Filter</label>
            <select className="select" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: 140 }}>
            <label className="label">From Date</label>
            <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: 140 }}>
            <label className="label">To Date</label>
            <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className={`btn ${view === 'calendar' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setView('calendar')}>Calendar</button>
            <button className={`btn ${view === 'summary' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setView('summary')}>Summary</button>
            <button className={`btn ${view === 'table' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setView('table')}>All Records</button>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleExport}><Download size={14} /> Export</button>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{filteredData.length} records</span>
        </div>
      </div>

      {/* Views */}
      {view === 'calendar' && (
        <div style={{ display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 320 }}>
            <Calendar attendanceData={filteredData} selectedSubject={selectedSubject} onDayClick={setSelectedDay} />
          </div>
          {selectedDay && dayDetails.length > 0 && (
            <div className="card-static fade-in-right" style={{ flex: 1, minWidth: 300, padding: 22 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>📅 {selectedDay}</h3>
              {dayDetails.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.studentName}</span>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginLeft: 8 }}>{r.subject}</span>
                  </div>
                  <span className={`badge ${r.status === 'Present' ? 'badge-success' : 'badge-danger'}`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'summary' && (
        <DataTable columns={summaryColumns} data={studentSummary} emptyMessage="No attendance data for selected filters" />
      )}

      {view === 'table' && (
        <DataTable
          columns={[
            { key: 'studentId', label: 'ID', width: 80 },
            { key: 'studentName', label: 'Name', width: 120 },
            { key: 'subject', label: 'Subject', width: 130 },
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
