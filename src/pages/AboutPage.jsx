import { Fingerprint, Users, Shield, GraduationCap, Code } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="page fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header" style={{ textAlign: 'center' }}>
        <p className="label-tag">ABOUT</p>
        <h1>About FaceAttend</h1>
        <p>AI-powered facial recognition attendance system for educational institutions</p>
      </div>

      <div className="card-static" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px', border: '2px solid var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,212,170,0.05)' }}>
            <Fingerprint size={36} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            FaceAttend transforms traditional attendance tracking into a seamless, AI-powered experience.
            Using advanced face recognition technology, our system ensures accurate, touchless attendance
            marking while providing comprehensive analytics and role-based access control.
          </p>
        </div>

        <div className="section-divider" />

        <h3 style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>Key Features</h3>
        <div className="grid-2">
          {[
            { icon: Fingerprint, title: 'AI Face Recognition', desc: 'LBPH-based facial recognition for instant identity verification' },
            { icon: Shield, title: 'Role-Based Security', desc: 'Separate portals for Admin, Faculty, and Students' },
            { icon: GraduationCap, title: 'Session Control', desc: 'Time-limited attendance windows prevent unfair marking' },
            { icon: Users, title: 'Student Management', desc: 'Complete CRUD with photo capture and zoom controls' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: 16, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
              <f.icon size={24} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <h4 style={{ fontWeight: 700, marginBottom: 2 }}>{f.title}</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
        <p>FaceAttend v3.0 • Built with React + Vite</p>
      </div>
    </div>
  );
}
