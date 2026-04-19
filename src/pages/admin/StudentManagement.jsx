import { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import DataTable from '../../components/ui/DataTable';
import { UserPlus, Search, Download, Trash2, Edit2, RotateCcw, AlertTriangle } from 'lucide-react';

const COURSE_CONFIG = {
  'B.Tech': {
    duration: 4,
    departments: ['CSE', 'IT', 'Civil', 'Electrical', 'Mechanical']
  },
  'MCA': {
    duration: 2,
    departments: ['Normal', 'Software Engineering (SE)']
  },
  'BCA': {
    duration: 3,
    departments: ['BCA']
  },
  'M.Tech': {
    duration: 2,
    departments: ['CSE', 'IT', 'Data Science', 'VLSI']
  }
};

const generateYearsForDuration = (duration) => {
  const currentYear = new Date().getFullYear();
  const years = [];
  // For standard college batches, maybe cover last 4-5 intakes
  for (let i = -3; i <= 1; i++) {
    const start = currentYear + i;
    const end = start + duration;
    years.push(`${start}-${end}`);
  }
  return years;
};

const EMPTY = { 
  studentId: '', name: '', 
  course: 'B.Tech', department: 'CSE', year: generateYearsForDuration(4)[3], 
  semester: 'Sem-1', division: 'A', roll: '', gender: 'Male', dob: '', 
  email: '', phone: '', address: '', teacher: '', photoSample: 'No' 
};

// Defined OUTSIDE the component to prevent re-creation on every render
function Field({ label, field, type = 'text', value, onChange, disabled = false }) {
  return (
    <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
      <label className="label">{label}</label>
      <input className="input" type={type} value={value || ''} onChange={e => onChange(field, e.target.value)} disabled={disabled} />
    </div>
  );
}

function SelectField({ label, field, options, value, onChange }) {
  return (
    <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
      <label className="label">{label}</label>
      <select className="select" value={value} onChange={e => onChange(field, e.target.value)}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function StudentManagement() {
  const toast = useToast();
  const { students, addStudent, updateStudent, deleteStudent } = useData();
  const [form, setForm] = useState({ ...EMPTY });
  const [editing, setEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.studentId?.toLowerCase().includes(q) ||
      s.roll?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const availableCourses = Object.keys(COURSE_CONFIG);
  const currentConfig = COURSE_CONFIG[form.course] || COURSE_CONFIG['B.Tech'];
  const availableDepartments = currentConfig.departments;
  const availableYears = generateYearsForDuration(currentConfig.duration);

  const handleChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      
      // Handle dependent dropdown cascades
      if (field === 'course') {
        const config = COURSE_CONFIG[value];
        if (config) {
          next.department = config.departments[0]; // Reset to first available department
          const newYears = generateYearsForDuration(config.duration);
          // Auto-select the current batch year for convenience
          next.year = newYears[3] || newYears[0];
        }
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.studentId || !form.name) {
      toast.error('Student ID and Name are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateStudent(form.studentId, form);
        toast.success('Student updated successfully');
      } else {
        if (students.find(s => s.studentId === form.studentId)) {
          toast.error('Student ID already exists');
          return;
        }
        await addStudent({ ...form });
        toast.success('Student added successfully');
      }
      handleReset();
    } catch (e) {
      toast.error('Failed to save student: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!form.studentId) return;
    try {
      await deleteStudent(form.studentId);
      handleReset();
      setShowDeleteModal(false);
      toast.success('Student deleted');
    } catch (e) {
      toast.error('Failed to delete: ' + e.message);
    }
  };

  const handleReset = () => { setForm({ ...EMPTY }); setEditing(false); };

  const handleRowClick = (row) => {
    // If the old data's course somehow doesn't exist, fallback to B.Tech safely
    let currentCourse = row.course;
    if (!COURSE_CONFIG[currentCourse]) {
      currentCourse = 'B.Tech';
    }
    setForm({ ...row, course: currentCourse });
    setEditing(true);
  };

  const handleExportCSV = () => {
    const headers = Object.keys(EMPTY);
    const csv = [headers.join(','), ...students.map(s => headers.map(h => `"${s[h] || ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'students.csv'; a.click();
    toast.success('Exported students.csv');
  };

  const columns = [
    { key: 'studentId', label: 'ID', width: 80 },
    { key: 'name', label: 'Name', width: 120 },
    { key: 'department', label: 'Dept', width: 80 },
    { key: 'course', label: 'Course', width: 70 },
    { key: 'roll', label: 'Roll', width: 60 },
    { key: 'semester', label: 'Sem', width: 60 },
    { key: 'gender', label: 'Gender', width: 65 },
    { key: 'phone', label: 'Phone', width: 100 },
    { key: 'photoSample', label: 'Photo', width: 70, render: (val) => (
      <span className={`badge ${val === 'Yes' ? 'badge-success' : 'badge-warning'}`}>{val === 'Yes' ? '✓' : '✗'}</span>
    )},
  ];

  return (
    <>
      <div className="page fade-in">
        <div className="page-header">
          <p className="label-tag">STUDENT MANAGEMENT</p>
          <h1>Manage Records & Capture Photos</h1>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'stretch' }}>
          {/* Form Panel */}
          <div className="card-static" style={{ width: 500, flexShrink: 0, padding: 22, overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
            <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 'var(--space-md)' }}>
              {editing ? '✏️ EDIT STUDENT' : '➕ ADD STUDENT'}
            </h3>

            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-primary)', marginBottom: 8 }}>COURSE INFO</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <SelectField label="Course" field="course" options={availableCourses} value={form.course} onChange={handleChange} />
              <SelectField label="Department" field="department" options={availableDepartments} value={form.department} onChange={handleChange} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <SelectField label="Year" field="year" options={availableYears} value={form.year} onChange={handleChange} />
              <SelectField label="Semester" field="semester" options={['Sem-1', 'Sem-2', 'Sem-3', 'Sem-4', 'Sem-5', 'Sem-6', 'Sem-7', 'Sem-8']} value={form.semester} onChange={handleChange} />
            </div>

            <div className="section-divider" />

            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-primary)', marginBottom: 8 }}>STUDENT INFO</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Field label="Student ID" field="studentId" value={form.studentId} onChange={handleChange} disabled={editing} />
              <Field label="Name" field="name" value={form.name} onChange={handleChange} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <SelectField label="Division" field="division" options={['A', 'B', 'C']} value={form.division} onChange={handleChange} />
              <Field label="Roll No" field="roll" value={form.roll} onChange={handleChange} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <SelectField label="Gender" field="gender" options={['Male', 'Female', 'Other']} value={form.gender} onChange={handleChange} />
              <Field label="Date of Birth" field="dob" type="date" value={form.dob} onChange={handleChange} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Field label="Email" field="email" type="email" value={form.email} onChange={handleChange} />
              <Field label="Phone" field="phone" type="tel" value={form.phone} onChange={handleChange} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Field label="Address" field="address" value={form.address} onChange={handleChange} />
              <Field label="Teacher" field="teacher" value={form.teacher} onChange={handleChange} />
            </div>

            <div className="section-divider" />

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : editing ? <><Edit2 size={14} /> Update</> : <><UserPlus size={14} /> Save</>}
              </button>
              {editing && (
                <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)} type="button">
                  <Trash2 size={14} /> Delete
                </button>
              )}
              <button className="btn btn-ghost" onClick={handleReset}>
                <RotateCcw size={14} /> Reset
              </button>
            </div>
          </div>

          {/* Table Panel */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-md)' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  className="input"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: 36 }}
                  id="search-students"
                />
              </div>
              <button className="btn btn-ghost" onClick={handleExportCSV}>
                <Download size={14} /> Export
              </button>
            </div>

            <DataTable
              columns={columns}
              data={filteredStudents}
              onRowClick={handleRowClick}
              emptyMessage="No students found"
            />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop fade-in" onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}>
          <div className="modal glass-strong fade-in-up" style={{ maxWidth: 400, textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,107,107,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <AlertTriangle size={32} style={{ color: 'var(--accent-danger)' }} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>Delete Student?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>
              Are you sure you want to delete <strong>{form.name}</strong> ({form.studentId})? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
