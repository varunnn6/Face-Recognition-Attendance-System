// DataContext — loads all Firestore data once on login and keeps it in sync
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getStudents, getSubjects, getStreams, getAttendance, getSessions,
  subscribeToActiveSessions, addStudent, updateStudent, deleteStudent,
  addSubject, updateSubject, deleteSubject, addStream, deleteStream,
  getFaculty, addFaculty, updateFaculty, deleteFaculty,
  addAttendanceRecord, updateAttendanceRecord, deleteAttendanceRecord, createSession, endSession, markStudentInSession,
} from '../services/dataService';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [students, setStudents]       = useState([]);
  const [subjects, setSubjects]       = useState([]);
  const [streams, setStreams]         = useState([]);
  const [faculty, setFaculty]         = useState([]);
  const [attendance, setAttendance]   = useState([]);
  const [sessions, setSessions]       = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  // — Load all data when logged in —
  const loadAll = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      // Load each collection independently — if one fails (e.g. missing Firestore rule),
      // the others still load. This prevents a single permission error from wiping all data.
      const safeLoad = async (fn, fallback = []) => {
        try { return await fn(); } catch (e) { console.warn('DataContext load error:', e.message); return fallback; }
      };

      const [s, sub, str, fac, att, ses] = await Promise.all([
        safeLoad(getStudents),
        safeLoad(getSubjects),
        safeLoad(getStreams),
        safeLoad(getFaculty),
        safeLoad(getAttendance),
        safeLoad(getSessions),
      ]);
      setStudents(s);
      setSubjects(sub);
      setStreams(str);
      setFaculty(fac);
      setAttendance(att);
      setSessions(ses);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Real-time listener for active sessions (cross-device live updates)
  useEffect(() => {
    if (!isAuthenticated) return;
    const unsubscribe = subscribeToActiveSessions(setActiveSessions);
    return () => unsubscribe();
  }, [isAuthenticated]);

  // — Wrapped mutators that update local state immediately —
  const addStudentAndRefresh = async (student) => {
    await addStudent(student);
    setStudents(prev => [...prev, student]);
    return student;
  };

  const updateStudentAndRefresh = async (studentId, data) => {
    await updateStudent(studentId, data);
    setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, ...data } : s));
  };

  const deleteStudentAndRefresh = async (studentId) => {
    await deleteStudent(studentId);
    setStudents(prev => prev.filter(s => s.studentId !== studentId));
  };

  const addSubjectAndRefresh = async (subject) => {
    await addSubject(subject);
    const updated = await getSubjects();
    setSubjects(updated);
  };

  const updateSubjectAndRefresh = async (id, data) => {
    await updateSubject(id, data);
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const deleteSubjectAndRefresh = async (id) => {
    await deleteSubject(id);
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  const addStreamAndRefresh = async (stream) => {
    await addStream(stream);
    const updated = await getStreams();
    setStreams(updated);
  };

  const deleteStreamAndRefresh = async (id) => {
    await deleteStream(id);
    setStreams(prev => prev.filter(s => s.id !== id));
  };

  const addFacultyAndRefresh = async (fac) => {
    await addFaculty(fac);
    const updated = await getFaculty();
    setFaculty(updated);
  };

  const updateFacultyAndRefresh = async (id, data) => {
    await updateFaculty(id, data);
    setFaculty(prev => prev.map(f => f.id === id ? { ...f, ...data } : f));
  };

  const deleteFacultyAndRefresh = async (id) => {
    await deleteFaculty(id);
    setFaculty(prev => prev.filter(f => f.id !== id));
  };

  const addAttendanceAndRefresh = async (record) => {
    const newRecord = await addAttendanceRecord(record);
    setAttendance(prev => [...prev, newRecord]);
    return newRecord;
  };

  const updateAttendanceAndRefresh = async (id, data) => {
    await updateAttendanceRecord(id, data);
    setAttendance(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  };

  const deleteAttendanceAndRefresh = async (id) => {
    await deleteAttendanceRecord(id);
    setAttendance(prev => prev.filter(a => a.id !== id));
  };

  const createSessionAndRefresh = async (session) => {
    const newSession = await createSession(session);
    setSessions(prev => [...prev, newSession]);
    return newSession;
  };

  const endSessionAndRefresh = async (sessionId) => {
    await endSession(sessionId);
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'ended' } : s));
  };

  const markStudentAndRefresh = async (sessionId, studentId, studentName) => {
    const result = await markStudentInSession(sessionId, studentId, studentName);
    if (result) {
      // Refresh attendance
      const updated = await getAttendance();
      setAttendance(updated);
    }
    return result;
  };

  // Computed helpers
  const getAttendanceByStudent = (studentId) =>
    attendance.filter(a => a.studentId === studentId);

  const getAttendanceStats = (studentId, subject = null) => {
    let records = getAttendanceByStudent(studentId);
    if (subject) records = records.filter(r => r.subject === subject);
    const total = records.length;
    const present = records.filter(r => r.status === 'Present').length;
    const absent = total - present;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, percentage };
  };

  const getDashboardStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayAtt = attendance.filter(a => a.date === today);
    return {
      totalStudents: students.length,
      totalSubjects: subjects.length,
      totalAttendanceRecords: attendance.length,
      photoCaptured: students.filter(s => s.photoSample === 'Yes').length,
      modelTrained: false,
      todayPresent: todayAtt.filter(a => a.status === 'Present').length,
      todayAbsent: todayAtt.filter(a => a.status === 'Absent').length,
      activeSessions: activeSessions.length,
    };
  };

  const getDepartments = () => {
    const depts = new Set();
    streams.forEach(s => (s.departments || []).forEach(d => depts.add(d)));
    return Array.from(depts);
  };

  return (
    <DataContext.Provider value={{
      // State
      students, subjects, streams, faculty, attendance, sessions, activeSessions,
      loading, error,

      // Refresh
      refresh: loadAll,

      // Student mutators
      addStudent: addStudentAndRefresh,
      updateStudent: updateStudentAndRefresh,
      deleteStudent: deleteStudentAndRefresh,

      // Subject mutators
      addSubject: addSubjectAndRefresh,
      updateSubject: updateSubjectAndRefresh,
      deleteSubject: deleteSubjectAndRefresh,

      // Stream mutators
      addStream: addStreamAndRefresh,
      deleteStream: deleteStreamAndRefresh,

      // Faculty mutators
      addFaculty: addFacultyAndRefresh,
      updateFaculty: updateFacultyAndRefresh,
      deleteFaculty: deleteFacultyAndRefresh,

      // Attendance mutators
      addAttendanceRecord: addAttendanceAndRefresh,
      updateAttendanceRecord: updateAttendanceAndRefresh,
      deleteAttendanceRecord: deleteAttendanceAndRefresh,

      // Session mutators
      createSession: createSessionAndRefresh,
      endSession: endSessionAndRefresh,
      markStudentInSession: markStudentAndRefresh,

      // Computed helpers (synchronous, use in-memory data)
      getAttendanceByStudent,
      getAttendanceStats,
      getDashboardStats,
      getDepartments,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
