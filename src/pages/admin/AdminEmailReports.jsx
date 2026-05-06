import { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { sendAttendanceEmail } from '../../services/emailService';
import { Mail, Clock, Send, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function AdminEmailReports() {
  const { students, sessions, attendance } = useData();
  const toast = useToast();
  
  const [isSending, setIsSending] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState('manual');
  const [progress, setProgress] = useState(0);

  // Calculate statistics for all students
  const studentStats = useMemo(() => {
    return students.map(student => {
      // Find all sessions this student was SUPPOSED to attend (matching their subject/department)
      // For simplicity, we just count all sessions as "total" for now, or match by course/dept.
      // Let's just find sessions that match their department and semester.
      const relevantSessions = sessions.filter(s => 
        // Example filter: if session has department/semester fields, match them.
        // For now, we assume all sessions are relevant, or you can refine this logic.
        true 
      );
      
      const attendedCount = attendance.filter(a => a.studentId === student.studentId && a.status === 'Present').length;
      const totalCount = relevantSessions.length > 0 ? relevantSessions.length : 1; // avoid / 0
      const percentage = Math.round((attendedCount / totalCount) * 100) || 0;

      return {
        ...student,
        stats: {
          total: totalCount,
          attended: attendedCount,
          percentage: percentage > 100 ? 100 : percentage, // Cap at 100
          period: 'All Time'
        }
      };
    });
  }, [students, sessions, attendance]);

  const handleSaveAutomation = async () => {
    try {
      // In a real app with backend, this would schedule a cron job.
      // Since we are serverless, we save it to settings to mock the behavior.
      await setDoc(doc(db, 'settings', 'email_automation'), {
        frequency: selectedFrequency,
        updatedAt: new Date()
      }, { merge: true });
      
      toast.success(`Automation preference saved as: ${selectedFrequency.toUpperCase()}`);
      if (selectedFrequency !== 'manual') {
        toast.info('Note: Full automated background sending requires Firebase Cloud Functions (Blaze Plan).', { duration: 5000 });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save automation settings');
    }
  };

  const handleManualSendAll = async () => {
    if (!window.confirm(`Are you sure you want to send attendance emails to all ${studentStats.length} students right now?`)) return;
    
    setIsSending(true);
    setProgress(0);
    
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < studentStats.length; i++) {
      const student = studentStats[i];
      if (student.email) {
        const result = await sendAttendanceEmail(student.email, student.name, student.stats);
        if (result.success) {
          successCount++;
        } else if (result.notConfigured) {
           toast.error('EmailJS is not configured. Add keys in emailService.js');
           setIsSending(false);
           setProgress(0);
           return;
        } else {
          failCount++;
        }
      } else {
        failCount++;
      }
      setProgress(Math.round(((i + 1) / studentStats.length) * 100));
    }

    setIsSending(false);
    if (failCount > 0) {
      toast.error(`Sent: ${successCount}. Failed: ${failCount} (Check EmailJS template ID)`, { duration: 5000 });
    } else {
      toast.success(`Successfully sent ${successCount} emails!`);
    }
    setTimeout(() => setProgress(0), 2000);
  };

  const handleSendSingle = async (student) => {
    if (!student.email) {
      toast.error('Student has no email address configured.');
      return;
    }
    toast.info(`Sending email to ${student.name}...`);
    const result = await sendAttendanceEmail(student.email, student.name, student.stats);
    if (result.success) {
      toast.success(`Email sent successfully to ${student.name}`);
    } else if (result.notConfigured) {
      toast.error('EmailJS is not configured with your credentials.');
    } else {
      toast.error(`Failed: ${result.error}`);
    }
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <p className="label-tag">COMMUNICATIONS</p>
        <h1>Attendance Email Reports</h1>
        <p>Configure automated email schedules or manually send attendance reports to students right now.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        
        {/* Automation Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Clock size={24} style={{ color: 'var(--accent-info)' }} />
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Automated Sending</h2>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: 20 }}>
            Select how often the system should automatically email attendance summaries to students. 
            (Requires Cloud Functions for background execution).
          </p>
          
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {['manual', 'daily', 'weekly', 'monthly'].map(freq => (
              <button
                key={freq}
                className={`btn ${selectedFrequency === freq ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, textTransform: 'capitalize' }}
                onClick={() => setSelectedFrequency(freq)}
              >
                {freq}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary w-full" onClick={handleSaveAutomation}>
            Save Automation Preference
          </button>
        </div>

        {/* Manual Send Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Send size={24} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Manual Send Now</h2>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: 20 }}>
            Instantly dispatch the current attendance reports to all registered students' email addresses.
          </p>

          <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 'var(--radius-sm)', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.9rem' }}>Eligible Students</span>
              <strong>{studentStats.filter(s => s.email).length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9rem' }}>Template</span>
              <strong style={{ color: 'var(--accent-info)' }}>Attendance_Summary_V1</strong>
            </div>
          </div>

          <button 
            className="btn btn-primary w-full" 
            onClick={handleManualSendAll}
            disabled={isSending}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {isSending ? (
              <>Sending Emails ({progress}%)...</>
            ) : (
              <>
                <Mail size={18} />
                Send Reports to All Students Now
              </>
            )}
          </button>
          
          {progress > 0 && (
            <div style={{ width: '100%', height: 4, background: 'var(--border-color)', marginTop: 12, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
            </div>
          )}
        </div>
      </div>

      {/* Individual Student List */}
      <h3 style={{ marginBottom: 16, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
        Send Individual Reports
      </h3>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Email</th>
              <th>Current Attendance</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {studentStats.map(student => (
              <tr key={student.studentId}>
                <td>
                  <div>
                    <strong>{student.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{student.studentId}</div>
                  </div>
                </td>
                <td>{student.email || <span style={{ color: 'var(--accent-danger)' }}>No Email</span>}</td>
                <td>
                  <span className={`badge ${student.stats.percentage >= 75 ? 'badge-success' : 'badge-danger'}`}>
                    {student.stats.percentage}%
                  </span>
                  <span style={{ fontSize: '0.8rem', marginLeft: 8, color: 'var(--text-dim)' }}>
                    ({student.stats.attended}/{student.stats.total})
                  </span>
                </td>
                <td>
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => handleSendSingle(student)}
                    disabled={!student.email || isSending}
                  >
                    Send Email
                  </button>
                </td>
              </tr>
            ))}
            {studentStats.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
