import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useData } from '../../contexts/DataContext';
import { ScanFace, Clock, CheckCircle, ShieldOff, XCircle } from 'lucide-react';

const LiveRecognitionCamera = ({ studentId, studentName, onRecognized }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognizedRef = useRef(false); // Prevent double-firing
  const onRecognizedRef = useRef(onRecognized);
  onRecognizedRef.current = onRecognized;

  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState('init'); // 'init' | 'scanning' | 'verified'
  const [scanMessage, setScanMessage] = useState('Initializing camera...');

  const captureFrame = () => {
    if (!videoRef.current || videoRef.current.videoWidth === 0) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  useEffect(() => {
    let scanInterval;
    let verifyTimeout;

    const startCam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try { await videoRef.current.play(); } catch (_) {}
        }
        setActive(true);
        setPhase('scanning');
        setScanMessage('Detecting face...');

        // Start real recognition loop every 1.5 seconds
        scanInterval = setInterval(async () => {
          if (recognizedRef.current) return;
          const frameBase64 = captureFrame();
          if (!frameBase64) return;

          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/recognize_face`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                studentId,
                studentName,
                frame: frameBase64
              })
            });
            const data = await response.json();

            if (response.ok && data.verified) {
              if (recognizedRef.current) return;
              recognizedRef.current = true;
              clearInterval(scanInterval);
              setPhase('verified');
              setScanMessage(`${studentName} verified ✓`);

              // Freeze the frame
              if (videoRef.current) videoRef.current.pause();

              // After showing green tick for 2s, fire callback and stop camera
              verifyTimeout = setTimeout(() => {
                if (streamRef.current) {
                  streamRef.current.getTracks().forEach(t => t.stop());
                  streamRef.current = null;
                }
                onRecognizedRef.current();
              }, 2000);
            } else {
              // Update scan message with backend error (e.g. "Move closer", "Security Error")
              setScanMessage(data.message || (data.detail ? data.detail : 'Looking for face...'));
            }
          } catch (err) {
            console.error('API Error:', err);
            setScanMessage('Network issue. Retrying...');
          }
        }, 1500);

      } catch (e) {
        console.error('Camera error:', e);
        setScanMessage('Camera access denied');
      }
    };

    startCam();

    // Cleanup on unmount
    return () => {
      clearInterval(scanInterval);
      clearTimeout(verifyTimeout);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [studentId, studentName]); // Re-run if student changes


  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)', background: '#0a0a0f', height: 400, border: `1px solid ${phase === 'verified' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`, transition: 'border-color 0.4s ease' }}>
      <style>{`
        @keyframes scanline {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
        @keyframes popInTick {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(0,212,170,0.3); }
          50% { box-shadow: 0 0 40px rgba(0,212,170,0.6); }
        }
      `}</style>

      {/* Live Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: active ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      />

      {/* Init state */}
      {!active && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span className="spinner" style={{ marginBottom: 12 }}></span>
          <p style={{ color: 'var(--text-muted)' }}>Initializing camera...</p>
        </div>
      )}

      {/* Scanning Overlay — face frame + scanline */}
      {phase === 'scanning' && (
        <div style={{ position: 'absolute', inset: '10% 15%', border: '2px solid rgba(0, 212, 170, 0.4)', borderRadius: 'var(--radius-md)', pointerEvents: 'none' }}>
          {/* Corner decorators */}
          <div style={{ position: 'absolute', top: -2, left: -2, width: 20, height: 20, borderTop: '4px solid var(--accent-primary)', borderLeft: '4px solid var(--accent-primary)' }} />
          <div style={{ position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderTop: '4px solid var(--accent-primary)', borderRight: '4px solid var(--accent-primary)' }} />
          <div style={{ position: 'absolute', bottom: -2, left: -2, width: 20, height: 20, borderBottom: '4px solid var(--accent-primary)', borderLeft: '4px solid var(--accent-primary)' }} />
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderBottom: '4px solid var(--accent-primary)', borderRight: '4px solid var(--accent-primary)' }} />

          {/* Scan line */}
          <div style={{
            width: '100%', height: 2,
            background: 'var(--accent-primary)',
            boxShadow: '0 0 12px 2px var(--accent-primary)',
            position: 'absolute',
            animation: 'scanline 3s linear infinite',
          }} />

          {/* Status text below frame */}
          <div style={{
            position: 'absolute', bottom: -40, width: '100%', textAlign: 'center',
            color: '#fff', fontSize: '0.9rem', fontWeight: 700,
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
          }}>
            {scanMessage}
          </div>
        </div>
      )}

      {/* Verified Overlay — green tick */}
      {phase === 'verified' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0, 212, 170, 0.25)', backdropFilter: 'blur(4px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 90, height: 90, borderRadius: '50%', background: 'var(--accent-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'popInTick 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, pulseGlow 2s ease infinite',
            border: '4px solid #fff',
          }}>
            <CheckCircle size={48} color="#0a0a0f" />
          </div>
          <h3 style={{
            color: '#fff', marginTop: 16, fontSize: '1.4rem', fontWeight: 800,
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            animation: 'popInTick 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.1s both',
          }}>
            {studentName} Verified!
          </h3>
          <p style={{
            color: 'rgba(255,255,255,0.8)', marginTop: 6, fontSize: '0.85rem',
            animation: 'popInTick 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s both',
          }}>
            Marking attendance...
          </p>
        </div>
      )}
    </div>
  );
};

export default function MarkAttendance() {
  const { user } = useAuth();
  const toast = useToast();
  const { activeSessions, markStudentInSession } = useData();
  const [selectedSession, setSelectedSession] = useState(null);
  const [markStatus, setMarkStatus] = useState('idle');

  const studentId = user?.studentData?.studentId || user?.id;
  const studentName = user?.name || 'Student';

  const handleRecognized = useCallback(async () => {
    if (!selectedSession) return;
    const marked = await markStudentInSession(selectedSession.id, studentId, user?.name);
    if (marked) {
      setMarkStatus('success');
      toast.success('Attendance marked successfully! ✓');
    } else {
      setMarkStatus('success');
      toast.info('Already marked for this session');
    }
  }, [selectedSession, studentId, user?.name, toast, markStudentInSession]);

  const getTimeRemaining = (session) => {
    const created = new Date(session.createdAt);
    const expires = new Date(created.getTime() + session.durationMinutes * 60 * 1000);
    const remaining = Math.max(0, Math.floor((expires - new Date()) / 1000));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const alreadyMarked = selectedSession?.markedStudents?.includes(studentId);

  // Show camera only when: session selected, not already marked, and not yet succeeded
  const showCamera = selectedSession && !alreadyMarked && markStatus === 'idle';

  return (
    <div className="page fade-in">
      <div className="page-header">
        <p className="label-tag">MARK ATTENDANCE</p>
        <h1>Face Recognition Attendance</h1>
        <p>Your live camera feed checks your identity and marks attendance automatically</p>
      </div>

      {activeSessions.length === 0 ? (
        /* No Active Sessions */
        <div className="card-static" style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%', margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,107,107,0.08)', border: '2px solid rgba(255,107,107,0.2)',
          }}>
            <ShieldOff size={40} style={{ color: 'var(--accent-danger)' }} />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 8 }}>No Active Session</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto', fontSize: '0.9rem' }}>
            Your faculty has not started an attendance session yet. Please wait for the session to begin and try again.
          </p>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 'var(--space-md)' }}>
            <span className="badge badge-warning">Anti-Cheat Active</span>
            <span className="badge badge-info">Time-Limited Sessions Only</span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap' }}>
          {/* Camera Panel */}
          <div style={{ flex: 2, minWidth: 400 }}>
            {/* Success state — attendance already logged */}
            {(markStatus === 'success' || alreadyMarked) && (
              <div className="card-static fade-in" style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
                <div style={{
                  width: 100, height: 100, borderRadius: '50%', margin: '0 auto 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,212,170,0.1)', border: '2px solid var(--accent-primary)',
                  animation: 'glowPulse 2s ease infinite',
                }}>
                  <CheckCircle size={48} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: 8 }}>
                  Attendance Logged
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Subject: {selectedSession?.subject}</p>
                <p style={{ color: 'var(--text-muted)' }}>Student: <strong>{studentName}</strong></p>
                <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Status: <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Present ✓</span></p>
              </div>
            )}

            {/* Live camera — only shown when actively scanning */}
            {showCamera && (
              <LiveRecognitionCamera
                key={selectedSession.id}
                studentId={studentId}
                studentName={studentName}
                onRecognized={handleRecognized}
              />
            )}

            {/* No session selected yet */}
            {!selectedSession && markStatus === 'idle' && (
              <div className="card-static empty-state" style={{ padding: 'var(--space-2xl)' }}>
                <ScanFace size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
                <h3>Select a Session</h3>
                <p>Choose an active session from the right panel to start the live face scan</p>
              </div>
            )}
          </div>

          {/* Sessions Panel */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 'var(--space-md)' }}>
              AVAILABLE SESSIONS ({activeSessions.length})
            </h3>
            {activeSessions.map(session => {
              const isSelected = selectedSession?.id === session.id;
              const marked = session.markedStudents?.includes(studentId);
              return (
                <div
                  key={session.id}
                  className={`card-static ${isSelected ? 'session-active' : ''}`}
                  style={{ padding: 18, marginBottom: 10, cursor: 'pointer', border: isSelected ? '1px solid var(--accent-primary)' : undefined }}
                  onClick={() => { setSelectedSession(session); setMarkStatus('idle'); }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{session.subject}</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{session.department} • by {session.facultyName}</p>
                    </div>
                    {marked ? (
                      <span className="badge badge-success">✓ Marked</span>
                    ) : (
                      <span className="badge badge-warning">Pending</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span><Clock size={12} style={{ verticalAlign: -2 }} /> {getTimeRemaining(session)} left</span>
                    <span>{session.markedStudents?.length || 0} checked in</span>
                  </div>
                </div>
              );
            })}

            {/* Anti-cheat info */}
            <div className="card-static" style={{ padding: 16, marginTop: 'var(--space-lg)', border: '1px solid rgba(0,212,170,0.15)' }}>
              <h4 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 8 }}>
                🛡️ SECURE ATTENDANCE
              </h4>
              <ul style={{ fontSize: '0.78rem', color: 'var(--text-muted)', paddingLeft: 16 }}>
                <li>Only recognizes logged-in student</li>
                <li>Camera closes after verification</li>
                <li>Time-limited sessions</li>
                <li>One mark per session</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
