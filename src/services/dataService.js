// Data Service — localStorage-backed CRUD for students, subjects, attendance, streams

const STUDENTS_KEY = 'faceattend_students';
const SUBJECTS_KEY = 'faceattend_subjects';
const ATTENDANCE_KEY = 'faceattend_attendance';
const STREAMS_KEY = 'faceattend_streams';
const SESSIONS_KEY = 'faceattend_sessions';

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

function generateAttendanceSeed() {
  const records = [];
  const students = SEED_STUDENTS;
  const subjects = ['Data Structures', 'Database Systems', 'Operating Systems'];
  const statuses = ['Present', 'Present', 'Present', 'Present', 'Absent']; // 80% present rate

  // Generate last 30 days of attendance
  for (let d = 30; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends

    for (const student of students) {
      for (const subject of subjects) {
        if (student.department !== 'Computer') continue;
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        records.push({
          id: `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          studentId: student.studentId,
          studentName: student.name,
          roll: student.roll,
          department: student.department,
          subject,
          date: date.toISOString().split('T')[0],
          time: `${9 + Math.floor(Math.random() * 6)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
          status,
          markedBy: 'system',
        });
      }
    }
  }
  return records;
}

function init(key, seedData) {
  if (!localStorage.getItem(key)) {
    const data = typeof seedData === 'function' ? seedData() : seedData;
    localStorage.setItem(key, JSON.stringify(data));
  }
}

function getAll(key) {
  return JSON.parse(localStorage.getItem(key) || '[]');
}

function saveAll(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Initialize all data stores
export function initializeData() {
  init(STUDENTS_KEY, SEED_STUDENTS);
  init(SUBJECTS_KEY, SEED_SUBJECTS);
  init(STREAMS_KEY, SEED_STREAMS);
  init(ATTENDANCE_KEY, generateAttendanceSeed);
  init(SESSIONS_KEY, []);
}

// ============= STUDENTS =============
export function getStudents() {
  return getAll(STUDENTS_KEY);
}

export function addStudent(student) {
  const students = getStudents();
  students.push(student);
  saveAll(STUDENTS_KEY, students);
  return student;
}

export function updateStudent(studentId, data) {
  const students = getStudents();
  const idx = students.findIndex(s => s.studentId === studentId);
  if (idx !== -1) { students[idx] = { ...students[idx], ...data }; saveAll(STUDENTS_KEY, students); }
  return students[idx];
}

export function deleteStudent(studentId) {
  const students = getStudents().filter(s => s.studentId !== studentId);
  saveAll(STUDENTS_KEY, students);
}

export function searchStudents(query) {
  const q = query.toLowerCase();
  return getStudents().filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.studentId.toLowerCase().includes(q) ||
    s.roll.toLowerCase().includes(q) ||
    s.department.toLowerCase().includes(q)
  );
}

// ============= SUBJECTS =============
export function getSubjects() {
  return getAll(SUBJECTS_KEY);
}

export function addSubject(subject) {
  const subjects = getSubjects();
  subjects.push({ ...subject, id: `SUB${Date.now()}` });
  saveAll(SUBJECTS_KEY, subjects);
}

export function updateSubject(id, data) {
  const subjects = getSubjects();
  const idx = subjects.findIndex(s => s.id === id);
  if (idx !== -1) { subjects[idx] = { ...subjects[idx], ...data }; saveAll(SUBJECTS_KEY, subjects); }
}

export function deleteSubject(id) {
  saveAll(SUBJECTS_KEY, getSubjects().filter(s => s.id !== id));
}

// ============= STREAMS =============
export function getStreams() {
  return getAll(STREAMS_KEY);
}

export function addStream(stream) {
  const streams = getStreams();
  streams.push({ ...stream, id: `STR${Date.now()}` });
  saveAll(STREAMS_KEY, streams);
}

export function deleteStream(id) {
  saveAll(STREAMS_KEY, getStreams().filter(s => s.id !== id));
}

export function getDepartments() {
  const streams = getStreams();
  const depts = new Set();
  streams.forEach(s => s.departments.forEach(d => depts.add(d)));
  return Array.from(depts);
}

// ============= ATTENDANCE =============
export function getAttendance() {
  return getAll(ATTENDANCE_KEY);
}

export function addAttendanceRecord(record) {
  const attendance = getAttendance();
  attendance.push({
    ...record,
    id: `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  });
  saveAll(ATTENDANCE_KEY, attendance);
}

export function getAttendanceByStudent(studentId) {
  return getAttendance().filter(a => a.studentId === studentId);
}

export function getAttendanceByDate(date) {
  return getAttendance().filter(a => a.date === date);
}

export function getAttendanceByDateRange(startDate, endDate) {
  return getAttendance().filter(a => a.date >= startDate && a.date <= endDate);
}

export function getAttendanceBySubject(subject) {
  return getAttendance().filter(a => a.subject === subject);
}

export function getAttendanceStats(studentId, subject = null) {
  let records = getAttendanceByStudent(studentId);
  if (subject) records = records.filter(r => r.subject === subject);
  const total = records.length;
  const present = records.filter(r => r.status === 'Present').length;
  const absent = total - present;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
  return { total, present, absent, percentage };
}

// ============= ATTENDANCE SESSIONS (Faculty) =============
export function getSessions() {
  return getAll(SESSIONS_KEY);
}

export function createSession(session) {
  const sessions = getSessions();
  const newSession = {
    ...session,
    id: `SES-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'active',
    markedStudents: [],
  };
  sessions.push(newSession);
  saveAll(SESSIONS_KEY, sessions);
  return newSession;
}

export function endSession(sessionId) {
  const sessions = getSessions();
  const idx = sessions.findIndex(s => s.id === sessionId);
  if (idx !== -1) { sessions[idx].status = 'ended'; sessions[idx].endedAt = new Date().toISOString(); saveAll(SESSIONS_KEY, sessions); }
}

export function getActiveSessions() {
  const sessions = getSessions();
  const now = new Date();
  return sessions.filter(s => {
    if (s.status !== 'active') return false;
    const created = new Date(s.createdAt);
    const durationMs = (s.durationMinutes || 10) * 60 * 1000;
    if (now - created > durationMs) {
      s.status = 'expired';
      return false;
    }
    return true;
  });
}

export function markStudentInSession(sessionId, studentId, studentName) {
  const sessions = getSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (!session || session.status !== 'active') return false;
  if (session.markedStudents.includes(studentId)) return false;

  session.markedStudents.push(studentId);
  saveAll(SESSIONS_KEY, sessions);

  // Also add attendance record
  addAttendanceRecord({
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
export function getDashboardStats() {
  const students = getStudents();
  const attendance = getAttendance();
  const subjects = getSubjects();
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === today);

  return {
    totalStudents: students.length,
    totalSubjects: subjects.length,
    totalAttendanceRecords: attendance.length,
    photoCaptured: students.filter(s => s.photoSample === 'Yes').length,
    modelTrained: localStorage.getItem('faceattend_model_trained') === 'true',
    todayPresent: todayAttendance.filter(a => a.status === 'Present').length,
    todayAbsent: todayAttendance.filter(a => a.status === 'Absent').length,
  };
}
