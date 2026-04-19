// Authentication Service — Firebase Firestore-backed role-based auth
import { collection, doc, getDoc, getDocs, setDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const USERS_COL = 'users';
const SESSION_KEY = 'faceattend_session'; // session stays in localStorage (browser-local only)

const DEFAULT_USERS = [
  { id: 'admin-1', username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator', email: 'admin@faceattend.edu' },
  { id: 'faculty-1', username: 'faculty', password: 'faculty123', role: 'faculty', name: 'Dr. Sharma', email: 'sharma@faceattend.edu', department: 'Computer', subjects: ['Data Structures', 'Database Systems'] },
  { id: 'faculty-2', username: 'faculty2', password: 'faculty123', role: 'faculty', name: 'Prof. Gupta', email: 'gupta@faceattend.edu', department: 'IT', subjects: ['Web Development', 'Machine Learning'] },
];

// Initialize default users in Firestore if not present
export async function initUsers() {
  const settingsRef = doc(db, 'settings', 'users_init');
  const snap = await getDoc(settingsRef);
  if (snap.exists()) return;

  for (const user of DEFAULT_USERS) {
    await setDoc(doc(db, USERS_COL, user.id), { ...user, createdAt: serverTimestamp() });
  }
  await setDoc(settingsRef, { done: true });
}

async function getUsers() {
  const snap = await getDocs(collection(db, USERS_COL));
  return snap.docs.map(d => ({ ...d.data(), _docId: d.id }));
}

export async function login(role, username, password) {
  const users = await getUsers();

  // Try admin/faculty match
  const user = users.find(
    u => u.role === role && u.username === username && u.password === password
  );

  if (user) {
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

  // Student login: match by studentId or name with password 'student'
  if (role === 'student') {
    const { getStudents } = await import('./dataService');
    const students = await getStudents();
    const searchStr = username.trim().toLowerCase();
    const student = students.find(
      s => (s.studentId?.toLowerCase() === searchStr || s.name?.toLowerCase() === searchStr)
        && password === 'student'
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
  return getSession()?.role || null;
}

export async function addUser(userData) {
  await setDoc(doc(db, USERS_COL, userData.id), { ...userData, createdAt: serverTimestamp() });
}

export async function getFacultyList() {
  const q = query(collection(db, USERS_COL), where('role', '==', 'faculty'));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}
