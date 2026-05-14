import { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { GraduationCap, BookOpen } from 'lucide-react';

export default function AdminFacultyOverview() {
  const { faculty, subjects } = useData();

  // Group subjects by faculty name
  const facultyWithSubjects = useMemo(() => {
    return faculty.map(fac => ({
      ...fac,
      subjects: subjects.filter(s => s.faculty === fac.name),
    }));
  }, [faculty, subjects]);

  // Also show subjects with faculty names NOT in the faculty records
  const unmappedSubjects = useMemo(() => {
    const knownNames = new Set(faculty.map(f => f.name));
    return subjects.filter(s => s.faculty && !knownNames.has(s.faculty));
  }, [faculty, subjects]);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <p className="label-tag">ADMIN VIEW</p>
        <h1>Faculty & Their Subjects</h1>
        <p>Overview of all registered faculty members and the subjects they have added.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        {facultyWithSubjects.map(fac => (
          <div key={fac.id} className="card-static" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0, 212, 170, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', flexShrink: 0 }}>
                <GraduationCap size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{fac.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  {fac.designation} &bull; {fac.department} &bull; {fac.email}
                </div>
              </div>
              <span className="badge badge-info" style={{ marginLeft: 'auto' }}>
                {fac.subjects.length} Subject{fac.subjects.length !== 1 ? 's' : ''}
              </span>
            </div>

            {fac.subjects.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontStyle: 'italic', paddingLeft: 8 }}>
                No subjects added yet by this faculty member.
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 8 }}>
                {fac.subjects.map(sub => (
                  <div key={sub.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)', padding: '6px 12px',
                  }}>
                    <BookOpen size={14} style={{ color: 'var(--accent-secondary)' }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{sub.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{sub.code} &bull; {sub.semester}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Subjects with unregistered faculty names */}
        {unmappedSubjects.length > 0 && (
          <div className="card-static" style={{ padding: 22, borderColor: 'var(--accent-warning)' }}>
            <h3 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-warning)', marginBottom: 12 }}>
              ⚠️ Subjects With Unregistered Faculty
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: 12 }}>
              These subjects are assigned to a faculty name that doesn't exist in the Teachers registry.
            </p>
            {unmappedSubjects.map(sub => (
              <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 600 }}>{sub.name} ({sub.code})</span>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>Assigned to: {sub.faculty || 'Unknown'}</span>
              </div>
            ))}
          </div>
        )}

        {facultyWithSubjects.length === 0 && (
          <div className="card-static" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ color: 'var(--text-dim)' }}>No faculty records found. Add teachers in the Teachers section first.</p>
          </div>
        )}
      </div>
    </div>
  );
}
