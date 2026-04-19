import { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import Calendar from '../../components/ui/Calendar';
import DataTable from '../../components/ui/DataTable';
import { Download, Edit2, Trash2, Check, X } from 'lucide-react';

export default function AdminAttendance() {
  const { attendance, subjects, updateAttendanceRecord, deleteAttendanceRecord } = useData();
  const toast = useToast();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [view, setView] = useState('calendar');
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('');

  const handleUpdate = async (id) => {
    try {
      await updateAttendanceRecord(id, { status: editStatus });
      toast.success('Attendance updated!');
      setEditingId(null);
    } catch (e) { toast.error('Error updating record'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this attendance record?')) {
      try {
        await deleteAttendanceRecord(id);
        toast.success('Record deleted!');
      } catch (e) { toast.error('Error deleting record'); }
    }
  };

  const filteredData = useMemo(() => {
    let data = attendance;
    if (selectedSubject) data = data.filter(a => a.subject === selectedSubject);
    if (dateFrom) data = data.filter(a => a.date >= dateFrom);
    if (dateTo) data = data.filter(a => a.date <= dateTo);
    return data;
  }, [attendance, selectedSubject, dateFrom, dateTo]);

  const handleExport = () => {
    const csv = ['StudentID,Name,Dept,Subject,Date,Time,Status',
      ...filteredData.map(r => `${r.studentId},${r.studentName},${r.department},${r.subject},${r.date},${r.time},${r.status}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'attendance.csv'; a.click();
  };

  const columns = [
    { key: 'studentId', label: 'ID', width: 80 },
    { key: 'studentName', label: 'Name', width: 120 },
    { key: 'department', label: 'Dept', width: 80 },
    { key: 'subject', label: 'Subject', width: 120 },
    { key: 'date', label: 'Date', width: 100 },
    { key: 'time', label: 'Time', width: 70 },
    { key: 'status', label: 'Status', width: 100, render: (val, row) => {
      if (editingId === row.id) {
        return (
          <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="select" style={{ padding: '4px 8px', fontSize: '0.8rem', minHeight: 'auto', width: 'auto' }}>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>
        );
      }
      return <span className={`badge ${val === 'Present' ? 'badge-success' : 'badge-danger'}`}>{val}</span>;
    }},
    { key: 'actions', label: '', width: 80, render: (_, row) => (
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {editingId === row.id ? (
          <>
            <button className="btn btn-icon btn-ghost" style={{ color: 'var(--accent-primary)' }} onClick={() => handleUpdate(row.id)} title="Save"><Check size={14} /></button>
            <button className="btn btn-icon btn-ghost" style={{ color: 'var(--text-muted)' }} onClick={() => setEditingId(null)} title="Cancel"><X size={14} /></button>
          </>
        ) : (
          <>
            <button className="btn btn-icon btn-ghost" onClick={() => { setEditingId(row.id); setEditStatus(row.status); }} title="Edit"><Edit2 size={14} /></button>
            <button className="btn btn-icon btn-ghost" style={{ color: 'var(--accent-danger)' }} onClick={() => handleDelete(row.id)} title="Delete"><Trash2 size={14} /></button>
          </>
        )}
      </div>
    )},
  ];

  return (
    <div className="page fade-in">
      <div className="page-header">
        <p className="label-tag">ATTENDANCE RECORDS</p>
        <h1>View & Manage Attendance</h1>
      </div>

      {/* Filters */}
      <div className="card-static" style={{ padding: 18, marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0, minWidth: 160 }}>
            <label className="label">Subject</label>
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
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`btn ${view === 'calendar' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setView('calendar')}>Calendar</button>
            <button className={`btn ${view === 'table' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setView('table')}>Table</button>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleExport}>
            <Download size={14} /> Export CSV
          </button>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {filteredData.length} records
          </span>
        </div>
      </div>

      {/* Content */}
      {view === 'calendar' ? (
        <div style={{ maxWidth: 500 }}>
          <Calendar attendanceData={filteredData} selectedSubject={selectedSubject} />
        </div>
      ) : (
        <DataTable columns={columns} data={filteredData} />
      )}
    </div>
  );
}
