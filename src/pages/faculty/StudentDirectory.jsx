import { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import DataTable from '../../components/ui/DataTable';
import AttendanceGauge from '../../components/ui/AttendanceGauge';
import { Search, User, X } from 'lucide-react';

export default function StudentDirectory() {
  const { students, getAttendanceByStudent, getAttendanceStats } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.roll.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const selectedAttendance = useMemo(() => {
    if (!selectedStudent) return [];
    return getAttendanceByStudent(selectedStudent.studentId);
  }, [selectedStudent]);

  const selectedStats = useMemo(() => {
    if (!selectedStudent) return null;
    return getAttendanceStats(selectedStudent.studentId);
  }, [selectedStudent]);

  const columns = [
    { key: 'studentId', label: 'ID', width: 80 },
    { key: 'name', label: 'Name', width: 130 },
    { key: 'department', label: 'Dept', width: 80 },
    { key: 'course', label: 'Course', width: 70 },
    { key: 'roll', label: 'Roll', width: 60 },
    { key: 'email', label: 'Email', width: 140 },
    { key: 'phone', label: 'Phone', width: 110 },
  ];

  return (
    <div className="page fade-in">
      <div className="page-header">
        <p className="label-tag">STUDENT DIRECTORY</p>
        <h1>Search & View Students</h1>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-xl)' }}>
        {/* Main List */}
        <div style={{ flex: 2 }}>
          <div style={{ position: 'relative', marginBottom: 'var(--space-md)' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              className="input"
              placeholder="Search by name, ID, roll, or department..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 36 }}
              id="search-students-faculty"
            />
          </div>
          <DataTable columns={columns} data={filtered} onRowClick={setSelectedStudent} />
        </div>

        {/* Student Detail Panel */}
        {selectedStudent && (
          <div className="card-static fade-in-right" style={{ flex: 1, minWidth: 280, padding: 22, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)' }}>STUDENT PROFILE</h3>
              <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setSelectedStudent(null)}>
                <X size={16} />
              </button>
            </div>

            {/* Avatar & Name */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '1.3rem', fontWeight: 800 }}>
                {selectedStudent.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedStudent.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedStudent.studentId} • Roll {selectedStudent.roll}</p>
            </div>

            {/* Attendance Gauge */}
            {selectedStats && (
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                <AttendanceGauge percentage={selectedStats.percentage} size={100} />
                <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-md)', marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>✓ {selectedStats.present}P</span>
                  <span>✗ {selectedStats.absent}A</span>
                  <span>Σ {selectedStats.total}</span>
                </div>
              </div>
            )}

            {/* Details */}
            <div className="section-divider" />
            {[
              ['Department', selectedStudent.department],
              ['Course', selectedStudent.course],
              ['Year', selectedStudent.year],
              ['Semester', selectedStudent.semester],
              ['Division', selectedStudent.division],
              ['Gender', selectedStudent.gender],
              ['DOB', selectedStudent.dob],
              ['Email', selectedStudent.email],
              ['Phone', selectedStudent.phone],
              ['Address', selectedStudent.address],
              ['Teacher', selectedStudent.teacher],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{label}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{value || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
