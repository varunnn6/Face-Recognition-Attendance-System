// Authentication Service — localStorage-backed role-based auth

const USERS_KEY = 'faceattend_users';
const SESSION_KEY = 'faceattend_session';

// Default credentials
const DEFAULT_USERS = [
  { id: 'admin-1', username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator', email: 'admin@faceattend.edu' },
  { id: 'faculty-1', username: 'faculty', password: 'faculty123', role: 'faculty', name: 'Dr. Sharma', email: 'sharma@faceattend.edu', department: 'Computer', subjects: ['Data Structures', 'Database Systems'] },
  { id: 'faculty-2', username: 'faculty2', password: 'faculty123', role: 'faculty', name: 'Prof. Gupta', email: 'gupta@faceattend.edu', department: 'IT', subjects: ['Web Development', 'Machine Learning'] },
];

function initUsers() {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
  }
}

function getUsers() {
  initUsers();
  return JSON.parse(localStorage.getItem(USERS_KEY));
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function login(role, username, password) {
  const users = getUsers();
  const user = users.find(
    u => u.role === role && u.username === username && u.password === password
  );

  if (!user) {
    // For student role, try matching by student ID or Name
    if (role === 'student') {
      const studentsData = JSON.parse(localStorage.getItem('faceattend_students') || '[]');
      const searchUser = username.trim().toLowerCase();
      const student = studentsData.find(
        (s) => (s.studentId.toLowerCase() === searchUser || s.name.toLowerCase() === searchUser) && password === 'student'
      );
      if (student) {
        const session = {
          id: student.studentId,
          username: student.studentId,
          role: 'student',
          name: student.name,
          email: student.email || '',
          department: student.department,
          studentData: student,
          loginTime: new Date().toISOString(),
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return { success: true, user: session };
      }
    }
    return { success: false, error: 'Invalid credentials' };
  }

  const session = {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    email: user.email,
    department: user.department,
    subjects: user.subjects,
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { success: true, user: session };
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession() {
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
}

export function isAuthenticated() {
  return !!getSession();
}

export function getRole() {
  const session = getSession();
  return session?.role || null;
}

export function addUser(userData) {
  const users = getUsers();
  users.push(userData);
  saveUsers(users);
}

export function getFacultyList() {
  return getUsers().filter(u => u.role === 'faculty');
}
