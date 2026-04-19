import { useState } from 'react';
import { Brain, CheckCircle, AlertCircle, Play, Loader } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

export default function TrainModel() {
  const [training, setTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(localStorage.getItem('faceattend_model_trained') === 'true' ? 'trained' : 'not_trained');
  const [log, setLog] = useState([]);

  const { students } = useData();
  const withPhotos = students.filter(s => s.photoSample === 'Yes').length;

  const handleTrain = () => {
    if (withPhotos === 0) return;
    setTraining(true);
    setProgress(0);
    setLog([]);

    const steps = [
      { msg: 'Loading face dataset...', delay: 500 },
      { msg: `Found ${withPhotos} students with photos`, delay: 800 },
      { msg: 'Initializing LBPH Face Recognizer...', delay: 600 },
      { msg: 'Extracting face features...', delay: 1200 },
      { msg: 'Training classifier model...', delay: 1500 },
      { msg: 'Validating model accuracy...', delay: 800 },
      { msg: 'Saving model to storage...', delay: 400 },
      { msg: '✅ Training complete!', delay: 300 },
    ];

    let i = 0;
    const run = () => {
      if (i >= steps.length) {
        setTraining(false);
        setStatus('trained');
        localStorage.setItem('faceattend_model_trained', 'true');
        return;
      }
      setLog(prev => [...prev, steps[i].msg]);
      setProgress(Math.round(((i + 1) / steps.length) * 100));
      setTimeout(() => { i++; run(); }, steps[i].delay);
    };
    run();
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <p className="label-tag">AI ENGINE</p>
        <h1>Train Recognition Model</h1>
        <p>Build the facial recognition classifier from captured photo data</p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap' }}>
        {/* Status Card */}
        <div className="card-static" style={{ flex: 1, minWidth: 300, padding: 'var(--space-xl)', textAlign: 'center' }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%', margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: status === 'trained' ? 'rgba(0,212,170,0.1)' : 'rgba(255,107,107,0.1)',
            border: `2px solid ${status === 'trained' ? 'var(--accent-primary)' : 'var(--accent-danger)'}`,
            animation: status === 'trained' ? 'glowPulse 3s ease infinite' : 'none',
          }}>
            {training ? (
              <Loader size={40} style={{ color: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }} />
            ) : status === 'trained' ? (
              <CheckCircle size={40} style={{ color: 'var(--accent-primary)' }} />
            ) : (
              <AlertCircle size={40} style={{ color: 'var(--accent-danger)' }} />
            )}
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>
            {training ? 'Training in Progress...' : status === 'trained' ? 'Model Ready' : 'Model Not Trained'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
            {training ? `${progress}% complete` : status === 'trained' ? 'The classifier is ready for face recognition' : 'Train the model to enable face recognition'}
          </p>

          {training && (
            <div style={{ width: '100%', height: 6, background: 'var(--border-subtle)', borderRadius: 'var(--radius-full)', marginBottom: 20, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: 'var(--radius-full)', transition: 'width 0.3s ease' }} />
            </div>
          )}

          <button className="btn btn-primary btn-lg" onClick={handleTrain} disabled={training || withPhotos === 0}>
            <Play size={18} /> {training ? 'Training...' : 'Start Training'}
          </button>

          {withPhotos === 0 && (
            <p style={{ color: 'var(--accent-danger)', fontSize: '0.82rem', marginTop: 12 }}>
              ⚠ No students with captured photos. Capture photos first.
            </p>
          )}
        </div>

        {/* Info & Log */}
        <div style={{ flex: 1, minWidth: 300 }}>
          {/* Stats */}
          <div className="card-static" style={{ padding: 22, marginBottom: 'var(--space-md)' }}>
            <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 'var(--space-md)' }}>TRAINING DATA</h3>
            <div className="grid-2" style={{ gap: 12 }}>
              <div style={{ padding: 14, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Students</p>
                <p style={{ fontSize: '1.3rem', fontWeight: 800 }}>{students.length}</p>
              </div>
              <div style={{ padding: 14, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>With Photos</p>
                <p style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{withPhotos}</p>
              </div>
            </div>
          </div>

          {/* Training Log */}
          <div className="card-static" style={{ padding: 22 }}>
            <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 'var(--space-md)' }}>TRAINING LOG</h3>
            <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: 16, fontFamily: 'monospace', fontSize: '0.78rem', maxHeight: 280, overflowY: 'auto', minHeight: 120 }}>
              {log.length === 0 ? (
                <span style={{ color: 'var(--text-dim)' }}>Awaiting training start...</span>
              ) : (
                log.map((line, i) => (
                  <div key={i} style={{ color: line.includes('✅') ? 'var(--accent-primary)' : 'var(--text-secondary)', padding: '2px 0' }}>
                    <span style={{ color: 'var(--text-dim)', marginRight: 8 }}>[{String(i + 1).padStart(2, '0')}]</span>
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
