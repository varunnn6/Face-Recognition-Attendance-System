import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Users, Camera, Brain, CalendarDays, ArrowRight, Shield, GraduationCap, User, ScanFace, Clock, BarChart3 } from 'lucide-react';
import { useMemo } from 'react';

/* Inline SVG: Face mesh / recognition illustration — premium HUD style */
function FaceMeshIcon({ size = 140 }) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2 + 2; // slightly lower center for natural face position
  const accentPrimary = '#00d4aa';
  const accentBright = '#33ffd0';

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Glow filter */}
        <filter id="faceglow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="softglow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Radial glow behind face */}
        <radialGradient id="facebg" cx="50%" cy="48%" r="45%">
          <stop offset="0%" stopColor={accentPrimary} stopOpacity="0.08" />
          <stop offset="100%" stopColor={accentPrimary} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <circle cx={cx} cy={cy} r={s * 0.44} fill="url(#facebg)" />

      {/* ── FACE OUTLINE (wider, bolder) ── */}
      <ellipse cx={cx} cy={cy} rx={s * 0.34} ry={s * 0.42} stroke={accentPrimary} strokeWidth="2.2" opacity="0.7" filter="url(#faceglow)" />
      {/* Inner secondary contour */}
      <ellipse cx={cx} cy={cy + 1} rx={s * 0.30} ry={s * 0.38} stroke={accentPrimary} strokeWidth="0.7" opacity="0.2" strokeDasharray="4 3" />

      {/* ── FOREHEAD LINES ── */}
      <line x1={cx - 28} y1={cy - 38} x2={cx + 28} y2={cy - 38} stroke={accentPrimary} strokeWidth="1.2" opacity="0.25" />
      <line x1={cx - 34} y1={cy - 32} x2={cx + 34} y2={cy - 32} stroke={accentPrimary} strokeWidth="0.8" opacity="0.15" />

      {/* ── LEFT EYE ── */}
      <ellipse cx={cx - 16} cy={cy - 12} rx={12} ry={6.5} stroke={accentPrimary} strokeWidth="2" opacity="0.85" />
      <circle cx={cx - 16} cy={cy - 12} r="4" fill={accentBright} opacity="0.7" filter="url(#faceglow)" />
      <circle cx={cx - 16} cy={cy - 12} r="2" fill={accentBright} opacity="0.9" />

      {/* ── RIGHT EYE ── */}
      <ellipse cx={cx + 16} cy={cy - 12} rx={12} ry={6.5} stroke={accentPrimary} strokeWidth="2" opacity="0.85" />
      <circle cx={cx + 16} cy={cy - 12} r="4" fill={accentBright} opacity="0.7" filter="url(#faceglow)" />
      <circle cx={cx + 16} cy={cy - 12} r="2" fill={accentBright} opacity="0.9" />

      {/* ── EYEBROWS ── */}
      <path d={`M${cx - 30} ${cy - 22} Q${cx - 16} ${cy - 29}, ${cx - 3} ${cy - 21}`} stroke={accentPrimary} strokeWidth="1.8" opacity="0.5" fill="none" strokeLinecap="round" />
      <path d={`M${cx + 3} ${cy - 21} Q${cx + 16} ${cy - 29}, ${cx + 30} ${cy - 22}`} stroke={accentPrimary} strokeWidth="1.8" opacity="0.5" fill="none" strokeLinecap="round" />

      {/* ── NOSE ── */}
      <line x1={cx} y1={cy - 5} x2={cx} y2={cy + 12} stroke={accentPrimary} strokeWidth="1.5" opacity="0.35" />
      <path d={`M${cx - 8} ${cy + 10} Q${cx} ${cy + 18}, ${cx + 8} ${cy + 10}`} stroke={accentPrimary} strokeWidth="2" opacity="0.65" fill="none" strokeLinecap="round" />
      <circle cx={cx - 7} cy={cy + 11} r="1.8" fill={accentPrimary} opacity="0.5" />
      <circle cx={cx + 7} cy={cy + 11} r="1.8" fill={accentPrimary} opacity="0.5" />
      <circle cx={cx} cy={cy + 15} r="1.5" fill={accentPrimary} opacity="0.4" />

      {/* ── MOUTH ── */}
      <path d={`M${cx - 16} ${cy + 24} Q${cx} ${cy + 32}, ${cx + 16} ${cy + 24}`} stroke={accentPrimary} strokeWidth="2" opacity="0.6" fill="none" strokeLinecap="round" />
      <line x1={cx - 14} y1={cy + 24.5} x2={cx + 14} y2={cy + 24.5} stroke={accentPrimary} strokeWidth="1" opacity="0.3" />
      <circle cx={cx - 17} cy={cy + 24} r="2" fill={accentPrimary} opacity="0.5" />
      <circle cx={cx + 17} cy={cy + 24} r="2" fill={accentPrimary} opacity="0.5" />

      {/* ── CHIN ── */}
      <circle cx={cx} cy={cy + 42} r="2" fill={accentPrimary} opacity="0.4" />

      {/* ═══ DENSE TRIANGULATED MESH ═══ */}

      {/* Define key landmark nodes for mesh */}
      {/* Top crown */}
      {/* Forehead → Eye connections */}
      <line x1={cx} y1={cy - 44} x2={cx - 16} y2={cy - 19} stroke={accentPrimary} strokeWidth="0.7" opacity="0.18" />
      <line x1={cx} y1={cy - 44} x2={cx + 16} y2={cy - 19} stroke={accentPrimary} strokeWidth="0.7" opacity="0.18" />
      <line x1={cx - 24} y1={cy - 40} x2={cx - 28} y2={cy - 12} stroke={accentPrimary} strokeWidth="0.6" opacity="0.15" />
      <line x1={cx + 24} y1={cy - 40} x2={cx + 28} y2={cy - 12} stroke={accentPrimary} strokeWidth="0.6" opacity="0.15" />

      {/* Temple lines */}
      <line x1={cx - 36} y1={cy - 24} x2={cx - 28} y2={cy - 12} stroke={accentPrimary} strokeWidth="0.7" opacity="0.2" />
      <line x1={cx + 36} y1={cy - 24} x2={cx + 28} y2={cy - 12} stroke={accentPrimary} strokeWidth="0.7" opacity="0.2" />
      <line x1={cx - 36} y1={cy - 24} x2={cx - 24} y2={cy - 40} stroke={accentPrimary} strokeWidth="0.5" opacity="0.12" />
      <line x1={cx + 36} y1={cy - 24} x2={cx + 24} y2={cy - 40} stroke={accentPrimary} strokeWidth="0.5" opacity="0.12" />

      {/* Eye → Nose bridge triangulation */}
      <line x1={cx - 16} y1={cy - 5} x2={cx} y2={cy + 15} stroke={accentPrimary} strokeWidth="0.7" opacity="0.2" />
      <line x1={cx + 16} y1={cy - 5} x2={cx} y2={cy + 15} stroke={accentPrimary} strokeWidth="0.7" opacity="0.2" />
      <line x1={cx - 4} y1={cy - 12} x2={cx} y2={cy + 4} stroke={accentPrimary} strokeWidth="0.5" opacity="0.12" />
      <line x1={cx + 4} y1={cy - 12} x2={cx} y2={cy + 4} stroke={accentPrimary} strokeWidth="0.5" opacity="0.12" />

      {/* Cheek → Jaw diagonals */}
      <line x1={cx - 28} y1={cy - 12} x2={cx - 32} y2={cy + 6} stroke={accentPrimary} strokeWidth="0.8" opacity="0.2" />
      <line x1={cx + 28} y1={cy - 12} x2={cx + 32} y2={cy + 6} stroke={accentPrimary} strokeWidth="0.8" opacity="0.2" />
      <line x1={cx - 32} y1={cy + 6} x2={cx - 28} y2={cy + 24} stroke={accentPrimary} strokeWidth="0.7" opacity="0.18" />
      <line x1={cx + 32} y1={cy + 6} x2={cx + 28} y2={cy + 24} stroke={accentPrimary} strokeWidth="0.7" opacity="0.18" />

      {/* Cheek to nose triangles */}
      <line x1={cx - 32} y1={cy + 6} x2={cx - 7} y2={cy + 11} stroke={accentPrimary} strokeWidth="0.5" opacity="0.12" />
      <line x1={cx + 32} y1={cy + 6} x2={cx + 7} y2={cy + 11} stroke={accentPrimary} strokeWidth="0.5" opacity="0.12" />

      {/* Nose to mouth */}
      <line x1={cx} y1={cy + 15} x2={cx - 16} y2={cy + 24} stroke={accentPrimary} strokeWidth="0.7" opacity="0.2" />
      <line x1={cx} y1={cy + 15} x2={cx + 16} y2={cy + 24} stroke={accentPrimary} strokeWidth="0.7" opacity="0.2" />

      {/* Jaw → mouth connections */}
      <line x1={cx - 28} y1={cy + 24} x2={cx - 17} y2={cy + 24} stroke={accentPrimary} strokeWidth="0.6" opacity="0.15" />
      <line x1={cx + 28} y1={cy + 24} x2={cx + 17} y2={cy + 24} stroke={accentPrimary} strokeWidth="0.6" opacity="0.15" />

      {/* Mouth → chin */}
      <line x1={cx - 16} y1={cy + 24} x2={cx} y2={cy + 42} stroke={accentPrimary} strokeWidth="0.7" opacity="0.18" />
      <line x1={cx + 16} y1={cy + 24} x2={cx} y2={cy + 42} stroke={accentPrimary} strokeWidth="0.7" opacity="0.18" />
      <line x1={cx - 28} y1={cy + 24} x2={cx - 14} y2={cy + 38} stroke={accentPrimary} strokeWidth="0.5" opacity="0.12" />
      <line x1={cx + 28} y1={cy + 24} x2={cx + 14} y2={cy + 38} stroke={accentPrimary} strokeWidth="0.5" opacity="0.12" />
      <line x1={cx - 14} y1={cy + 38} x2={cx} y2={cy + 42} stroke={accentPrimary} strokeWidth="0.5" opacity="0.12" />
      <line x1={cx + 14} y1={cy + 38} x2={cx} y2={cy + 42} stroke={accentPrimary} strokeWidth="0.5" opacity="0.12" />

      {/* Extra cross-hatch in cheek zone */}
      <line x1={cx - 28} y1={cy - 12} x2={cx - 17} y2={cy + 24} stroke={accentPrimary} strokeWidth="0.5" opacity="0.1" />
      <line x1={cx + 28} y1={cy - 12} x2={cx + 17} y2={cy + 24} stroke={accentPrimary} strokeWidth="0.5" opacity="0.1" />

      {/* ═══ LANDMARK DOTS (brighter, bigger) ═══ */}
      {/* Jawline */}
      <circle cx={cx - 36} cy={cy - 6} r="2.2" fill={accentPrimary} opacity="0.45" />
      <circle cx={cx + 36} cy={cy - 6} r="2.2" fill={accentPrimary} opacity="0.45" />
      <circle cx={cx - 34} cy={cy + 10} r="2" fill={accentPrimary} opacity="0.4" />
      <circle cx={cx + 34} cy={cy + 10} r="2" fill={accentPrimary} opacity="0.4" />
      <circle cx={cx - 28} cy={cy + 26} r="1.8" fill={accentPrimary} opacity="0.35" />
      <circle cx={cx + 28} cy={cy + 26} r="1.8" fill={accentPrimary} opacity="0.35" />
      <circle cx={cx - 16} cy={cy + 38} r="1.6" fill={accentPrimary} opacity="0.3" />
      <circle cx={cx + 16} cy={cy + 38} r="1.6" fill={accentPrimary} opacity="0.3" />
      {/* Temples */}
      <circle cx={cx - 38} cy={cy - 22} r="1.8" fill={accentPrimary} opacity="0.35" />
      <circle cx={cx + 38} cy={cy - 22} r="1.8" fill={accentPrimary} opacity="0.35" />
      {/* Crown */}
      <circle cx={cx} cy={cy - 46} r="2" fill={accentPrimary} opacity="0.4" />
      <circle cx={cx - 20} cy={cy - 44} r="1.5" fill={accentPrimary} opacity="0.28" />
      <circle cx={cx + 20} cy={cy - 44} r="1.5" fill={accentPrimary} opacity="0.28" />
      {/* Inner eye corners */}
      <circle cx={cx - 5} cy={cy - 11} r="1.8" fill={accentBright} opacity="0.5" />
      <circle cx={cx + 5} cy={cy - 11} r="1.8" fill={accentBright} opacity="0.5" />
      {/* Outer eye corners */}
      <circle cx={cx - 28} cy={cy - 12} r="2" fill={accentPrimary} opacity="0.5" />
      <circle cx={cx + 28} cy={cy - 12} r="2" fill={accentPrimary} opacity="0.5" />
      {/* Brow peaks */}
      <circle cx={cx - 16} cy={cy - 27} r="1.5" fill={accentPrimary} opacity="0.3" />
      <circle cx={cx + 16} cy={cy - 27} r="1.5" fill={accentPrimary} opacity="0.3" />

      {/* ═══ DECORATIVE CORNER BRACKETS ═══ */}
      <g stroke={accentPrimary} strokeWidth="1.5" opacity="0.3">
        {/* Top-left */}
        <line x1={6} y1={10} x2={6} y2={22} />
        <line x1={6} y1={10} x2={18} y2={10} />
        {/* Top-right */}
        <line x1={s - 6} y1={10} x2={s - 6} y2={22} />
        <line x1={s - 6} y1={10} x2={s - 18} y2={10} />
        {/* Bottom-left */}
        <line x1={6} y1={s - 10} x2={6} y2={s - 22} />
        <line x1={6} y1={s - 10} x2={18} y2={s - 10} />
        {/* Bottom-right */}
        <line x1={s - 6} y1={s - 10} x2={s - 6} y2={s - 22} />
        <line x1={s - 6} y1={s - 10} x2={s - 18} y2={s - 10} />
      </g>

      {/* ═══ ANIMATED SCAN LINE ═══ */}
      <line x1={cx - 40} y1={cy} x2={cx + 40} y2={cy} stroke={accentBright} strokeWidth="1.2" opacity="0.25" filter="url(#softglow)">
        <animate attributeName="y1" values={`${cy - 48};${cy + 48};${cy - 48}`} dur="3.5s" repeatCount="indefinite" />
        <animate attributeName="y2" values={`${cy - 48};${cy + 48};${cy - 48}`} dur="3.5s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}


export default function LandingPage({ onLoginClick }) {
  const { isAuthenticated } = useAuth();
  const { getDashboardStats } = useData();
  const stats = useMemo(() => getDashboardStats(), [getDashboardStats]);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'GOOD MORNING' : now.getHours() < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';

  const features = [
    { icon: ScanFace, title: 'Face Recognition', desc: 'AI-powered facial recognition for instant, touchless attendance marking' },
    { icon: Shield, title: 'Role-Based Access', desc: 'Separate dashboards for Admin, Faculty, and Students with tailored features' },
    { icon: Clock, title: 'Time-Limited Sessions', desc: 'Faculty controls when attendance can be marked — preventing unfair marking' },
    { icon: CalendarDays, title: 'Smart Analytics', desc: 'Calendar views, subject filters, date ranges, and attendance trend reports' },
    { icon: Camera, title: 'Zoom-Ready Capture', desc: 'Adjustable camera zoom for perfect face photos during enrollment' },
    { icon: BarChart3, title: 'Detailed Reports', desc: 'Monthly, yearly, and subject-wise attendance breakdowns with export' },
  ];

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-text">
          <p className="landing-greeting">{greeting}</p>
          <h1 className="landing-title">
            SMART FACE<br />
            <span>RECOGNITION</span><br />
            ATTENDANCE
          </h1>
          <p className="landing-subtitle">
            Transform any camera into an intelligent attendance tracking system.
            Powered by AI facial recognition with role-based access for administrators,
            faculty, and students.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={onLoginClick} id="hero-start-btn">
              START NOW <ArrowRight size={18} />
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Learn More
            </button>
          </div>
        </div>

        <div className="landing-hero-image">
          <div className="hero-image-wrapper" style={{ background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Animated face recognition visualization */}
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{
                width: 200, height: 200, borderRadius: '50%',
                border: '2px solid rgba(0,212,170,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                animation: 'glowPulse 2s ease infinite',
                background: 'rgba(0,212,170,0.03)'
              }}>
                <FaceMeshIcon size={150} />
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>AI-Powered</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Face Detection & Recognition</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
                {['Detect', 'Match', 'Verify', 'Record'].map((step, i) => (
                  <span key={step} className={`badge badge-success fade-in-up stagger-${i + 1}`} style={{ opacity: 0, animationFillMode: 'forwards' }}>
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section id="features-section" style={{ padding: 'var(--space-2xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <p className="label-tag" style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-primary)', marginBottom: 8 }}>FEATURES</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Everything You Need</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 8, maxWidth: 500, margin: '8px auto 0' }}>
            A complete attendance management solution with AI-powered face recognition
          </p>
        </div>

        <div className="grid-3">
          {features.map((feat, i) => (
            <div key={i} className={`card fade-in-up stagger-${i + 1}`} style={{ padding: 28, cursor: 'default', opacity: 0, animationFillMode: 'forwards' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(0,212,170,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <feat.icon size={22} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>{feat.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: 'var(--space-xl)', borderTop: '1px solid var(--border-subtle)' }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>FaceAttend v3.0 — AI-Powered Attendance System</p>
      </footer>
    </div>
  );
}
