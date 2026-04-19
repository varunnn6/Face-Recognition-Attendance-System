// DataContext — loads all Firestore data once on login and keeps it in sync
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getStudents, getSubjects, getStreams, getAttendance, getSessions,
  subscribeToActiveSessions, addStudent, updateStudent, deleteStudent,
  addSubject, updateSubject, deleteSubject, addStream, deleteStream,
  addAttendanceRecord, createSession, endSession, markStudentInSession,
} from '../services/dataService';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [students, setStudents]       = useState([]);
  const [subjects, setSubjects]       = useState([]);
  const [streams, setStreams]         = useState([]);
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
      const [s, sub, str, att, ses] = await Promise.all([
        getStudents(), getSubjects(), getStreams(), getAttendance(), getSessions(),
      ]);
      setStudents(s);
      setSubjects(sub);
      setStreams(str);
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

  const addAttendanceAndRefresh = async (record) => {
    const newRecord = await addAttendanceRecord(record);
    setAttendance(prev => [...prev, newRecord]);
    return newRecord;
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
      students, subjects, streams, attendance, sessions, activeSessions,
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

      // Attendance mutators
      addAttendanceRecord: addAttendanceAndRefresh,

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
