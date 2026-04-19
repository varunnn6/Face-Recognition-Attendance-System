import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from 'date-fns';

export default function Calendar({ attendanceData = [], onDayClick, selectedSubject }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Build attendance map: date -> status
  const attendanceMap = useMemo(() => {
    const map = {};
    const filtered = selectedSubject
      ? attendanceData.filter(a => a.subject === selectedSubject)
      : attendanceData;

    filtered.forEach(record => {
      const key = record.date;
      if (!map[key]) map[key] = { present: 0, absent: 0, total: 0 };
      map[key].total++;
      if (record.status === 'Present') map[key].present++;
      else map[key].absent++;
    });
    return map;
  }, [attendanceData, selectedSubject]);

  // Generate calendar days
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const start = startOfWeek(monthStart);
    const end = endOfWeek(monthEnd);

    const result = [];
    let day = start;
    while (day <= end) {
      result.push(new Date(day));
      day = addDays(day, 1);
    }
    return result;
  }, [currentMonth]);

  const getStatusClass = (day) => {
    const key = format(day, 'yyyy-MM-dd');
    const data = attendanceMap[key];
    if (!data) return '';
    if (data.present > 0 && data.absent === 0) return 'present';
    if (data.absent > 0 && data.present === 0) return 'absent';
    return 'present'; // Mixed → lean present
  };

  return (
    <div className="calendar card-static" style={{ padding: 'var(--space-md)' }}>
      <div className="calendar-header">
        <button className="btn btn-icon btn-ghost" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft size={18} />
        </button>
        <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{format(currentMonth, 'MMMM yyyy')}</h3>
        <button className="btn btn-icon btn-ghost" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="calendar-grid">
        {dayHeaders.map(d => (
          <div key={d} className="calendar-day-header">{d}</div>
        ))}
        {days.map((day, i) => {
          const inMonth = isSameMonth(day, currentMonth);
          const key = format(day, 'yyyy-MM-dd');
          const statusClass = inMonth ? getStatusClass(day) : '';
          const todayClass = isToday(day) ? 'today' : '';
          const otherMonth = !inMonth ? 'other-month' : '';

          return (
            <div
              key={i}
              className={`calendar-day ${statusClass} ${todayClass} ${otherMonth}`}
              onClick={() => inMonth && onDayClick?.(key)}
              title={attendanceMap[key] ? `${attendanceMap[key].present}P / ${attendanceMap[key].absent}A` : ''}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 'var(--space-md)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(0, 212, 170, 0.3)' }} /> Present
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(255, 107, 107, 0.3)' }} /> Absent
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, border: '1px solid var(--accent-primary)' }} /> Today
        </span>
      </div>
    </div>
  );
}
