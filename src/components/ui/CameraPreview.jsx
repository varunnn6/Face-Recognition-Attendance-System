import { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Camera, RotateCcw, Play, Square } from 'lucide-react';

export default function CameraPreview({ onCapture, captureCount = 0, maxCaptures = 100, onBurstComplete }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const burstRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const maxZoom = 5;
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState('');
  const [isBursting, setIsBursting] = useState(false);
  const [burstCount, setBurstCount] = useState(0);

  const startCamera = useCallback(async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch (_) {}
      }
      setIsActive(true);
      setZoom(1);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied. Please allow camera permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    stopBurst();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setZoom(1);
  }, []);

  useEffect(() => {
    return () => {
      stopBurst();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Ensure stream binds to video element after it mounts
  useEffect(() => {
    if (isActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isActive]);

  const captureOnePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const vw = video.videoWidth;
    const vh = video.videoHeight;

    if (!vw || !vh) return null;

    if (zoom > 1) {
      const cropW = vw / zoom;
      const cropH = vh / zoom;
      const sx = (vw - cropW) / 2;
      const sy = (vh - cropH) / 2;
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, cropW, cropH);
    } else {
      canvas.width = vw;
      canvas.height = vh;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
    }
    return canvas.toDataURL('image/jpeg', 0.8);
  }, [zoom]);

  // Single capture
  const handleSingleCapture = () => {
    const dataUrl = captureOnePhoto();
    if (dataUrl) onCapture?.(dataUrl);
  };

  // Burst capture — rapid-fire 100 photos
  const startBurst = useCallback(() => {
    if (isBursting) return;
    setIsBursting(true);
    setBurstCount(0);
    let count = 0;

    const captureTick = () => {
      if (count >= maxCaptures) {
        setIsBursting(false);
        onBurstComplete?.();
        return;
      }
      const dataUrl = captureOnePhoto();
      if (dataUrl) {
        onCapture?.(dataUrl);
        count++;
        setBurstCount(count);
      }
      burstRef.current = setTimeout(captureTick, 120); // ~8 fps rapid capture
    };
    captureTick();
  }, [isBursting, maxCaptures, captureOnePhoto, onCapture, onBurstComplete]);

  const stopBurst = useCallback(() => {
    if (burstRef.current) {
      clearTimeout(burstRef.current);
      burstRef.current = null;
    }
    setIsBursting(false);
  }, []);

  const handleZoomChange = (newZoom) => {
    setZoom(Math.min(maxZoom, Math.max(1, newZoom)));
  };

  const handleZoomStep = (delta) => {
    setZoom(prev => Math.min(maxZoom, Math.max(1, prev + delta * 0.25)));
  };

  return (
    <div className="camera-container" style={{ position: 'relative' }}>
      {!isActive ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 380, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          {error ? (
            <>
              <p style={{ color: 'var(--accent-danger)', fontSize: '0.9rem', marginBottom: 12 }}>{error}</p>
              <button className="btn btn-primary" onClick={startCamera}>
                <RotateCcw size={16} /> Retry
              </button>
            </>
          ) : (
            <>
              <Camera size={48} style={{ color: 'var(--text-dim)', marginBottom: 16 }} />
              <p style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: '0.95rem', fontWeight: 600 }}>Camera Preview</p>
              <p style={{ color: 'var(--text-dim)', marginBottom: 20, fontSize: '0.82rem' }}>Click below to start your webcam</p>
              <button className="btn btn-primary" onClick={startCamera} id="start-camera-btn">
                <Camera size={16} /> Start Camera
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Video container */}
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 'var(--radius-lg)',
            background: '#000',
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                display: 'block',
                width: '100%',
                height: 380,
                objectFit: 'cover',
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
              }}
            />

            {/* Zoom indicator */}
            {zoom > 1 && (
              <div style={{
                position: 'absolute', top: 12, left: 12,
                padding: '4px 10px', borderRadius: 'var(--radius-full)',
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)',
              }}>
                {zoom.toFixed(1)}x
              </div>
            )}

            {/* Burst progress overlay */}
            {isBursting && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)',
              }}>
                <div style={{
                  fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent-primary)',
                  textShadow: '0 0 20px rgba(0,212,170,0.5)',
                }}>
                  {burstCount} / {maxCaptures}
                </div>
                <p style={{ color: '#fff', fontSize: '0.85rem', marginTop: 8 }}>Capturing photos...</p>
                {/* Progress bar */}
                <div style={{ width: '60%', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.15)', marginTop: 12 }}>
                  <div style={{
                    width: `${(burstCount / maxCaptures) * 100}%`,
                    height: '100%', borderRadius: 3,
                    background: 'var(--accent-primary)',
                    transition: 'width 0.1s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Counter badge */}
            {captureCount > 0 && !isBursting && (
              <div style={{
                position: 'absolute', top: 12, right: 12,
                padding: '6px 14px', borderRadius: 'var(--radius-full)',
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                fontSize: '0.78rem', fontWeight: 700, color: '#fff',
              }}>
                📸 {captureCount} / {maxCaptures}
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 16px', marginTop: 8,
            background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
          }}>
            {/* Zoom Section */}
            <button className="btn btn-icon btn-ghost" onClick={() => handleZoomStep(-1)} title="Zoom Out" disabled={isBursting}>
              <ZoomOut size={16} />
            </button>
            <input
              type="range"
              className="zoom-slider"
              min={1}
              max={maxZoom}
              step={0.1}
              value={zoom}
              onChange={e => handleZoomChange(parseFloat(e.target.value))}
              disabled={isBursting}
              style={{ flex: 1, minWidth: 80 }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', minWidth: 32, fontWeight: 600 }}>{zoom.toFixed(1)}x</span>
            <button className="btn btn-icon btn-ghost" onClick={() => handleZoomStep(1)} title="Zoom In" disabled={isBursting}>
              <ZoomIn size={16} />
            </button>

            <div style={{ width: 1, height: 24, background: 'var(--border-default)' }} />

            {/* Capture Controls */}
            {!isBursting ? (
              <>
                <button className="btn btn-primary btn-sm" onClick={handleSingleCapture} id="capture-photo-btn">
                  <Camera size={14} /> Capture 1
                </button>
                <button
                  className="btn btn-sm"
                  onClick={startBurst}
                  id="start-burst-btn"
                  style={{ background: 'var(--accent-secondary)', color: '#fff' }}
                >
                  <Play size={14} /> Start Capture ({maxCaptures})
                </button>
              </>
            ) : (
              <button className="btn btn-danger btn-sm" onClick={stopBurst} id="stop-burst-btn">
                <Square size={14} /> Stop Capture
              </button>
            )}

            <button className="btn btn-ghost btn-sm" onClick={stopCamera} style={{ color: 'var(--accent-danger)', marginLeft: 'auto' }}>
              Stop Camera
            </button>
          </div>
        </>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
