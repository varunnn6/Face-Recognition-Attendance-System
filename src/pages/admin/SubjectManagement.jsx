import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import DataTable from '../../components/ui/DataTable';
import { BookOpen, Plus, Trash2, Edit2, RotateCcw } from 'lucide-react';

export default function SubjectManagement() {
  const toast = useToast();
  const { subjects, addSubject, updateSubject, deleteSubject } = useData();
  const [form, setForm] = useState({ name: '', code: '', department: 'Computer', semester: 'Sem-1', faculty: '' });
  const [editing, setEditing] = useState(null);

  const handleSave = async () => {
    if (!form.name || !form.code) { toast.error('Name and Code are required'); return; }
    try {
      if (editing) {
        await updateSubject(editing, form);
        toast.success('Subject updated');
        setEditing(null);
      } else {
        await addSubject(form);
        toast.success('Subject added');
      }
      setForm({ name: '', code: '', department: 'Computer', semester: 'Sem-1', faculty: '' });
    } catch (e) { toast.error('Failed: ' + e.message); }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this subject?')) {
      try {
        await deleteSubject(id);
        toast.success('Subject deleted');
      } catch (e) { toast.error('Failed: ' + e.message); }
    }
  };

  const columns = [
    { key: 'code', label: 'Code', width: 90 },
    { key: 'name', label: 'Subject', width: 160 },
    { key: 'department', label: 'Dept', width: 100 },
    { key: 'semester', label: 'Semester', width: 80 },
    { key: 'faculty', label: 'Faculty', width: 120 },
    { key: 'id', label: 'Actions', width: 100, sortable: false, render: (val, row) => (
      <div style={{ display: 'flex', gap: 4 }}>
        <button className="btn btn-icon btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setForm(row); setEditing(row.id); }}>
          <Edit2 size={14} />
        </button>
        <button className="btn btn-icon btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(val); }} style={{ color: 'var(--accent-danger)' }}>
          <Trash2 size={14} />
        </button>
      </div>
    )},
  ];

  return (
    <div className="page fade-in">
      <div className="page-header">
        <p className="label-tag">SUBJECT MANAGEMENT</p>
        <h1>Manage Subjects & Streams</h1>
      </div>

      {/* Add/Edit Form */}
      <div className="card-static" style={{ padding: 22, marginBottom: 'var(--space-xl)' }}>
        <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 'var(--space-md)' }}>
          {editing ? '✏️ EDIT SUBJECT' : '➕ ADD SUBJECT'}
        </h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
            <label className="label">Subject Code</label>
            <input className="input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g., CS201" />
          </div>
          <div className="form-group" style={{ flex: 2, minWidth: 180 }}>
            <label className="label">Subject Name</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Data Structures" />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
            <label className="label">Department</label>
            <select className="select" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
              {['Computer', 'IT', 'Civil', 'Mechanical'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 100 }}>
            <label className="label">Semester</label>
            <select className="select" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
              {['Sem-1', 'Sem-2', 'Sem-3', 'Sem-4', 'Sem-5', 'Sem-6', 'Sem-7', 'Sem-8'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
            <label className="label">Faculty</label>
            <input className="input" value={form.faculty} onChange={e => setForm({ ...form, faculty: e.target.value })} placeholder="e.g., Dr. Sharma" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleSave}>
              {editing ? <><Edit2 size={14} /> Update</> : <><Plus size={14} /> Add</>}
            </button>
            {editing && (
              <button className="btn btn-ghost" onClick={() => { setEditing(null); setForm({ name: '', code: '', department: 'Computer', semester: 'Sem-1', faculty: '' }); }}>
                <RotateCcw size={14} /> Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subjects Table */}
      <DataTable columns={columns} data={subjects} emptyMessage="No subjects added yet" />
    </div>
  );
}
