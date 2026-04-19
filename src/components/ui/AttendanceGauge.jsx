import { useEffect, useRef } from 'react';

export default function AttendanceGauge({ percentage = 0, size = 120, strokeWidth = 8, label = 'Attendance' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const color = percentage >= 75 ? 'var(--accent-primary)' : percentage >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} className="gauge-ring">
        <circle className="gauge-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
        <circle
          className="gauge-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div style={{ position: 'relative', marginTop: -size / 2 - 20, textAlign: 'center' }}>
        <div style={{ fontSize: size / 4, fontWeight: 800, color }}>{percentage}%</div>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: size / 4 - 12 }}>{label}</p>
    </div>
  );
}
