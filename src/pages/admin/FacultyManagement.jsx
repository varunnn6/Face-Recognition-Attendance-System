import { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { UserCheck, Search, Plus, Edit2, Trash2, X, GraduationCap } from 'lucide-react';

export default function FacultyManagement() {
  const { faculty, streams, addFaculty, updateFaculty, deleteFaculty } = useData();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    department: '',
    phone: '',
    designation: 'Professor'
  });

  // Get unique departments from streams
  const departments = useMemo(() => {
    const depts = new Set();
    streams.forEach(s => (s.departments || []).forEach(d => depts.add(d)));
    return Array.from(depts);
  }, [streams]);

  const filteredFaculty = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return faculty.filter(f => 
      f.name.toLowerCase().includes(q) || 
      f.department.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q)
    );
  }, [faculty, searchQuery]);

  const handleEdit = (fac) => {
    setFormData(fac);
    setEditingId(fac.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this teacher record?')) return;
    try {
      await deleteFaculty(id);
      toast.success('Teacher record deleted successfully');
    } catch (err) {
      toast.error('Failed to delete teacher record');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateFaculty(editingId, formData);
        toast.success('Teacher record updated');
      } else {
        const newId = formData.id || `FAC${Date.now().toString().slice(-4)}`;
        await addFaculty({ ...formData, id: newId });
        toast.success('Teacher record added');
      }
      setShowForm(false);
      setFormData({ id: '', name: '', email: '', department: '', phone: '', designation: 'Professor' });
      setEditingId(null);
    } catch (err) {
      toast.error('Failed to save teacher record');
    }
  };

  return (
    <div className="page fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="label-tag">MANAGEMENT</p>
          <h1>Teacher Records</h1>
          <p>Manage faculty profiles, departments, and contact information.</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setEditingId(null);
          setFormData({ id: '', name: '', email: '', department: departments[0] || '', phone: '', designation: 'Professor' });
          setShowForm(true);
        }}>
          <Plus size={18} /> Add Teacher
        </button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <div className="search-bar" style={{ flex: 1, maxWidth: 400 }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search teachers by name, department or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Teacher Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Phone</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFaculty.map(fac => (
              <tr key={fac.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0, 212, 170, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                      <GraduationCap size={18} />
                    </div>
                    <div>
                      <strong>{fac.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ID: {fac.id}</div>
                    </div>
                  </div>
                </td>
                <td>{fac.email}</td>
                <td><span className="badge badge-info">{fac.department}</span></td>
                <td>{fac.designation}</td>
                <td>{fac.phone || '-'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="icon-btn" onClick={() => handleEdit(fac)} title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button className="icon-btn text-danger" onClick={() => handleDelete(fac.id)} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredFaculty.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-dim)' }}>
                  No teacher records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Teacher Record' : 'Add New Teacher'}</h2>
              <button className="icon-btn" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              
              <div className="form-group">
                <label>Teacher ID (Optional)</label>
                <input 
                  type="text" 
                  value={formData.id} 
                  onChange={e => setFormData({...formData, id: e.target.value})}
                  disabled={!!editingId}
                  placeholder="Leave empty to auto-generate"
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Dr. Ramesh Kumar"
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input 
                  type="email" 
                  required
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="teacher@institution.edu"
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label>Department *</label>
                  <select 
                    required
                    value={formData.department}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                    className="input-field"
                  >
                    <option value="">Select Dept</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Designation</label>
                  <select 
                    value={formData.designation}
                    onChange={e => setFormData({...formData, designation: e.target.value})}
                    className="input-field"
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Lecturer">Lecturer</option>
                    <option value="Guest Faculty">Guest Faculty</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="10-digit number"
                  className="input-field"
                />
              </div>

              <div className="modal-footer" style={{ marginTop: 'var(--space-md)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Add Teacher'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
