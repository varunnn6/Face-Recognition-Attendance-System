// Data Service — Firebase Firestore-backed CRUD for students, subjects, attendance, streams
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// ============= COLLECTION NAMES =============
const STUDENTS_COL = 'students';
const SUBJECTS_COL = 'subjects';
const STREAMS_COL = 'streams';
const ATTENDANCE_COL = 'attendance';
const SESSIONS_COL = 'sessions';
const SETTINGS_COL = 'settings';
const FACULTY_COL = 'faculty';

// ============= SEED DATA =============
const SEED_STUDENTS = [
  { studentId: 'STD001', name: 'Aarav Patel', department: 'Computer', course: 'B.Tech', year: '2024-25', semester: 'Sem-3', division: 'A', roll: '101', gender: 'Male', dob: '2004-05-12', email: 'aarav@email.com', phone: '9876543210', address: 'Delhi', teacher: 'Dr. Sharma', photoSample: 'Yes' },
  { studentId: 'STD002', name: 'Priya Singh', department: 'Computer', course: 'B.Tech', year: '2024-25', semester: 'Sem-3', division: 'A', roll: '102', gender: 'Female', dob: '2004-08-23', email: 'priya@email.com', phone: '9876543211', address: 'Mumbai', teacher: 'Dr. Sharma', photoSample: 'Yes' },
  { studentId: 'STD003', name: 'Rohan Kumar', department: 'IT', course: 'B.Tech', year: '2024-25', semester: 'Sem-3', division: 'B', roll: '201', gender: 'Male', dob: '2004-02-14', email: 'rohan@email.com', phone: '9876543212', address: 'Bangalore', teacher: 'Prof. Gupta', photoSample: 'Yes' },
  { studentId: 'STD004', name: 'Sneha Reddy', department: 'Computer', course: 'M.Tech', year: '2024-25', semester: 'Sem-1', division: 'A', roll: '301', gender: 'Female', dob: '2002-11-05', email: 'sneha@email.com', phone: '9876543213', address: 'Hyderabad', teacher: 'Dr. Sharma', photoSample: 'No' },
  { studentId: 'STD005', name: 'Vikram Mehta', department: 'IT', course: 'BCA', year: '2024-25', semester: 'Sem-5', division: 'A', roll: '401', gender: 'Male', dob: '2003-07-30', email: 'vikram@email.com', phone: '9876543214', address: 'Pune', teacher: 'Prof. Gupta', photoSample: 'Yes' },
  { studentId: 'STD006', name: 'Ananya Sharma', department: 'Computer', course: 'B.Tech', year: '2024-25', semester: 'Sem-3', division: 'A', roll: '103', gender: 'Female', dob: '2004-03-18', email: 'ananya@email.com', phone: '9876543215', address: 'Jaipur', teacher: 'Dr. Sharma', photoSample: 'Yes' },
];

const SEED_SUBJECTS = [
  { id: 'SUB001', name: 'Data Structures', code: 'CS201', department: 'Computer', semester: 'Sem-3', faculty: 'Dr. Sharma' },
  { id: 'SUB002', name: 'Database Systems', code: 'CS202', department: 'Computer', semester: 'Sem-3', faculty: 'Dr. Sharma' },
  { id: 'SUB003', name: 'Web Development', code: 'IT201', department: 'IT', semester: 'Sem-3', faculty: 'Prof. Gupta' },
  { id: 'SUB004', name: 'Machine Learning', code: 'IT301', department: 'IT', semester: 'Sem-5', faculty: 'Prof. Gupta' },
  { id: 'SUB005', name: 'Operating Systems', code: 'CS203', department: 'Computer', semester: 'Sem-3', faculty: 'Dr. Sharma' },
  { id: 'SUB006', name: 'Computer Networks', code: 'CS301', department: 'Computer', semester: 'Sem-5', faculty: 'Dr. Sharma' },
];

const SEED_STREAMS = [
  { id: 'STR001', name: 'B.Tech', departments: ['Computer', 'IT', 'Civil', 'Mechanical'], years: 4, semesters: 8 },
  { id: 'STR002', name: 'M.Tech', departments: ['Computer', 'IT'], years: 2, semesters: 4 },
  { id: 'STR003', name: 'BCA', departments: ['Computer', 'IT'], years: 3, semesters: 6 },
  { id: 'STR004', name: 'MCA', departments: ['Computer', 'IT'], years: 2, semesters: 4 },
];

const SEED_FACULTY = [
  { id: 'FAC001', name: 'Dr. Sharma', email: 'dr.sharma@example.com', department: 'Computer', phone: '9876543201', designation: 'Professor' },
  { id: 'FAC002', name: 'Prof. Gupta', email: 'prof.gupta@example.com', department: 'IT', phone: '9876543202', designation: 'Associate Professor' },
];

// ============= INITIALIZATION =============
export async function initializeData() {
  // Check if already seeded
  const settingsRef = doc(db, SETTINGS_COL, 'init');
  const settingsSnap = await getDoc(settingsRef);
  if (settingsSnap.exists() && settingsSnap.data().seeded) return;

  // Seed students
  for (const student of SEED_STUDENTS) {
    await setDoc(doc(db, STUDENTS_COL, student.studentId), student);
  }
  // Seed subjects
  for (const subject of SEED_SUBJECTS) {
    await setDoc(doc(db, SUBJECTS_COL, subject.id), subject);
  }
  // Seed streams
  for (const stream of SEED_STREAMS) {
    await setDoc(doc(db, STREAMS_COL, stream.id), stream);
  }
  // Seed faculty
  for (const fac of SEED_FACULTY) {
    await setDoc(doc(db, FACULTY_COL, fac.id), fac);
  }
  // Mark as initialized
  await setDoc(settingsRef, { seeded: true, timestamp: serverTimestamp() });

  // Seed sample attendance (last 5 days only to keep it lightweight)
  const subjects = ['Data Structures', 'Database Systems', 'Operating Systems'];
  const statuses = ['Present', 'Present', 'Present', 'Present', 'Absent'];
  for (let d = 5; d >= 1; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const dateStr = date.toISOString().split('T')[0];
    for (const student of SEED_STUDENTS.filter(s => s.department === 'Computer')) {
      for (const subject of subjects) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        await addDoc(collection(db, ATTENDANCE_COL), {
          studentId: student.studentId, studentName: student.name,
          roll: student.roll, department: student.department,
          subject, date: dateStr, status, markedBy: 'system',
          time: `${9 + Math.floor(Math.random() * 6)}:00`,
          createdAt: serverTimestamp(),
        });
      }
    }
  }
}

// ============= STUDENTS =============
export async function getStudents() {
  const snap = await getDocs(collection(db, STUDENTS_COL));
  return snap.docs.map(d => ({ ...d.data(), _docId: d.id }));
}

export async function addStudent(student) {
  await setDoc(doc(db, STUDENTS_COL, student.studentId), { ...student, createdAt: serverTimestamp() });
  return student;
}

export async function updateStudent(studentId, data) {
  await updateDoc(doc(db, STUDENTS_COL, studentId), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteStudent(studentId) {
  await deleteDoc(doc(db, STUDENTS_COL, studentId));
}

export async function searchStudents(queryStr) {
  const all = await getStudents();
  const q = queryStr.toLowerCase();
  return all.filter(s =>
    s.name?.toLowerCase().includes(q) ||
    s.studentId?.toLowerCase().includes(q) ||
    s.roll?.toLowerCase().includes(q) ||
    s.department?.toLowerCase().includes(q)
  );
}

// ============= SUBJECTS =============
export async function getSubjects() {
  const snap = await getDocs(collection(db, SUBJECTS_COL));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addSubject(subject) {
  const id = `SUB${Date.now()}`;
  await setDoc(doc(db, SUBJECTS_COL, id), { ...subject, id, createdAt: serverTimestamp() });
}

export async function updateSubject(id, data) {
  await updateDoc(doc(db, SUBJECTS_COL, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteSubject(id) {
  await deleteDoc(doc(db, SUBJECTS_COL, id));
}

// ============= FACULTY CRUD =============
export async function getFaculty() {
  const snapshot = await getDocs(collection(db, FACULTY_COL));
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
}

export async function addFaculty(facultyData) {
  const docRef = doc(db, FACULTY_COL, facultyData.id || `FAC${Date.now()}`);
  await setDoc(docRef, { ...facultyData, createdAt: serverTimestamp() });
}

export async function updateFaculty(id, data) {
  await updateDoc(doc(db, FACULTY_COL, id), data);
}

export async function deleteFaculty(id) {
  await deleteDoc(doc(db, FACULTY_COL, id));
}

// ============= STREAMS =============
export async function getStreams() {
  const snap = await getDocs(collection(db, STREAMS_COL));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addStream(stream) {
  const id = `STR${Date.now()}`;
  await setDoc(doc(db, STREAMS_COL, id), { ...stream, id, createdAt: serverTimestamp() });
}

export async function deleteStream(id) {
  await deleteDoc(doc(db, STREAMS_COL, id));
}

export async function getDepartments() {
  const streams = await getStreams();
  const depts = new Set();
  streams.forEach(s => (s.departments || []).forEach(d => depts.add(d)));
  return Array.from(depts);
}

// ============= ATTENDANCE =============
export async function getAttendance() {
  const snap = await getDocs(collection(db, ATTENDANCE_COL));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addAttendanceRecord(record) {
  const docRef = await addDoc(collection(db, ATTENDANCE_COL), {
    ...record,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, ...record };
}

export async function updateAttendanceRecord(id, data) {
  await updateDoc(doc(db, ATTENDANCE_COL, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteAttendanceRecord(id) {
  await deleteDoc(doc(db, ATTENDANCE_COL, id));
}

export async function getAttendanceByStudent(studentId) {
  const q = query(collection(db, ATTENDANCE_COL), where('studentId', '==', studentId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAttendanceByDate(date) {
  const q = query(collection(db, ATTENDANCE_COL), where('date', '==', date));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAttendanceByDateRange(startDate, endDate) {
  const q = query(
    collection(db, ATTENDANCE_COL),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAttendanceBySubject(subject) {
  const q = query(collection(db, ATTENDANCE_COL), where('subject', '==', subject));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAttendanceStats(studentId, subject = null) {
  let records = await getAttendanceByStudent(studentId);
  if (subject) records = records.filter(r => r.subject === subject);
  const total = records.length;
  const present = records.filter(r => r.status === 'Present').length;
  const absent = total - present;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
  return { total, present, absent, percentage };
}

// ============= SESSIONS (Real-time) =============
export async function getSessions() {
  const snap = await getDocs(collection(db, SESSIONS_COL));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createSession(session) {
  const id = `SES-${Date.now()}`;
  const newSession = {
    ...session,
    id,
    createdAt: serverTimestamp(),
    status: 'active',
    markedStudents: [],
  };
  await setDoc(doc(db, SESSIONS_COL, id), newSession);
  return { ...newSession, createdAt: new Date().toISOString() };
}

export async function endSession(sessionId) {
  await updateDoc(doc(db, SESSIONS_COL, sessionId), {
    status: 'ended',
    endedAt: serverTimestamp(),
  });
}

export async function getActiveSessions() {
  const q = query(collection(db, SESSIONS_COL), where('status', '==', 'active'));
  const snap = await getDocs(q);
  const now = new Date();
  const sessions = [];
  for (const d of snap.docs) {
    const s = { id: d.id, ...d.data() };
    // Convert Firestore Timestamp to JS Date
    const created = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
    const durationMs = (s.durationMinutes || 10) * 60 * 1000;
    if (now - created > durationMs) {
      await updateDoc(doc(db, SESSIONS_COL, d.id), { status: 'expired' });
    } else {
      sessions.push({ ...s, createdAt: created.toISOString() });
    }
  }
  return sessions;
}

// Real-time listener for active sessions (use in student/faculty components)
export function subscribeToActiveSessions(callback) {
  const q = query(collection(db, SESSIONS_COL), where('status', '==', 'active'));
  return onSnapshot(q, (snap) => {
    const now = new Date();
    const sessions = snap.docs
      .map(d => {
        const s = { id: d.id, ...d.data() };
        const created = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
        return { ...s, createdAt: created.toISOString() };
      })
      .filter(s => {
        const created = new Date(s.createdAt);
        const durationMs = (s.durationMinutes || 10) * 60 * 1000;
        return now - created <= durationMs;
      });
    callback(sessions);
  });
}

// Real-time listener for a specific session (for faculty live view)
export function subscribeToSession(sessionId, callback) {
  return onSnapshot(doc(db, SESSIONS_COL, sessionId), (snap) => {
    if (snap.exists()) {
      const s = { id: snap.id, ...snap.data() };
      const created = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
      callback({ ...s, createdAt: created.toISOString() });
    }
  });
}

export async function markStudentInSession(sessionId, studentId, studentName) {
  const sessionRef = doc(db, SESSIONS_COL, sessionId);
  const sessionSnap = await getDoc(sessionRef);
  if (!sessionSnap.exists()) return false;

  const session = sessionSnap.data();
  if (session.status !== 'active') return false;
  if ((session.markedStudents || []).includes(studentId)) return false;

  // Update session's markedStudents array
  const { arrayUnion } = await import('firebase/firestore');
  await updateDoc(sessionRef, {
    markedStudents: arrayUnion(studentId),
  });

  // Add attendance record
  await addAttendanceRecord({
    studentId,
    studentName,
    roll: '',
    department: session.department || '',
    subject: session.subject,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    status: 'Present',
    markedBy: 'face-recognition',
    sessionId,
  });

  return true;
}

// ============= DASHBOARD STATS =============
export async function getDashboardStats() {
  const [students, attendance, subjects, sessions] = await Promise.all([
    getStudents(),
    getAttendance(),
    getSubjects(),
    getSessions(),
  ]);
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === today);

  return {
    totalStudents: students.length,
    totalSubjects: subjects.length,
    totalAttendanceRecords: attendance.length,
    photoCaptured: students.filter(s => s.photoSample === 'Yes').length,
    modelTrained: false,
    todayPresent: todayAttendance.filter(a => a.status === 'Present').length,
    todayAbsent: todayAttendance.filter(a => a.status === 'Absent').length,
    activeSessions: sessions.filter(s => s.status === 'active').length,
  };
}
