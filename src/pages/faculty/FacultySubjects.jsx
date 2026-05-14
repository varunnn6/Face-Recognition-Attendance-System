import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { BookOpen, Plus, Trash2, Edit2, RotateCcw } from 'lucide-react';

export default function FacultySubjects() {
  const { user } = useAuth();
  const { subjects, addSubject, updateSubject, deleteSubject } = useData();
  const toast = useToast();

  const [form, setForm] = useState({
    name: '', code: '', semester: 'Sem-1',
    department: user?.department || 'Computer',
    faculty: user?.name || '',
  });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // Only show THIS faculty member's subjects
  const mySubjects = useMemo(() =>
    subjects.filter(s => s.faculty === user?.name),
    [subjects, user]
  );

  const resetForm = () => {
    setForm({ name: '', code: '', semester: 'Sem-1', department: user?.department || 'Computer', faculty: user?.name || '' });
    setEditing(null);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Subject Name and Code are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateSubject(editing, form);
        toast.success('Subject updated successfully');
      } else {
        await addSubject({ ...form, faculty: user?.name, department: user?.department });
        toast.success('Subject added successfully');
      }
      resetForm();
    } catch (e) {
      toast.error(e.message || 'Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (subject) => {
    setForm(subject);
    setEditing(subject.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      await deleteSubject(id);
      toast.success('Subject deleted');
    } catch (e) {
      toast.error('Failed to delete subject');
    }
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <p className="label-tag">MY SUBJECTS</p>
        <h1>Subject Management</h1>
        <p>Add and manage subjects assigned to you. Students will see these when marking attendance.</p>
      </div>

      {/* Add/Edit Form */}
      <div className="card-static" style={{ padding: 22, marginBottom: 'var(--space-xl)' }}>
        <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 'var(--space-md)' }}>
          {editing ? '✏️ EDIT SUBJECT' : '➕ ADD NEW SUBJECT'}
        </h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
            <label className="label">Subject Code *</label>
            <input
              className="input"
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value })}
              placeholder="e.g., CS301"
              disabled={!!editing}
            />
          </div>
          <div className="form-group" style={{ flex: 2, minWidth: 180 }}>
            <label className="label">Subject Name *</label>
            <input
              className="input"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Computer Networks"
            />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 100 }}>
            <label className="label">Semester</label>
            <select
              className="select"
              value={form.semester}
              onChange={e => setForm({ ...form, semester: e.target.value })}
            >
              {['Sem-1','Sem-2','Sem-3','Sem-4','Sem-5','Sem-6','Sem-7','Sem-8'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <div className="spinner" /> : editing ? <><Edit2 size={14} /> Update</> : <><Plus size={14} /> Add</>}
            </button>
            {editing && (
              <button className="btn btn-ghost" onClick={resetForm}>
                <RotateCcw size={14} /> Cancel
              </button>
            )}
          </div>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 10 }}>
          📌 Subject will be automatically assigned to <strong>{user?.name}</strong> ({user?.department})
        </p>
      </div>

      {/* My Subjects Table */}
      {mySubjects.length === 0 ? (
        <div className="card-static" style={{ padding: 40, textAlign: 'center' }}>
          <BookOpen size={36} style={{ color: 'var(--text-dim)', marginBottom: 12 }} />
          <p style={{ color: 'var(--text-dim)' }}>You haven't added any subjects yet. Use the form above to add your first subject.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Subject Name</th>
                <th>Department</th>
                <th>Semester</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mySubjects.map(sub => (
                <tr key={sub.id}>
                  <td><code style={{ background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: 4, fontSize: '0.82rem' }}>{sub.code}</code></td>
                  <td><strong>{sub.name}</strong></td>
                  <td><span className="badge badge-info">{sub.department}</span></td>
                  <td>{sub.semester}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => handleEdit(sub)}><Edit2 size={14} /></button>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => handleDelete(sub.id)} style={{ color: 'var(--accent-danger)' }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
