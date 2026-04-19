// Authentication Service — Firebase Auth + Firestore role-based auth
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

const USERS_COL = 'users';
const SESSION_KEY = 'faceattend_session';

// Default user accounts — email format: username@faceattend.edu
// Passwords are used for both Firebase Auth and app login
const DEFAULT_USERS = [
  {
    id: 'admin-1',
    username: 'admin',
    email: 'admin@faceattend.edu',
    password: 'admin123',
    role: 'admin',
    name: 'Administrator',
  },
  {
    id: 'faculty-1',
    username: 'faculty',
    email: 'faculty@faceattend.edu',
    password: 'faculty123',
    role: 'faculty',
    name: 'Dr. Sharma',
    department: 'Computer',
    subjects: ['Data Structures', 'Database Systems'],
  },
  {
    id: 'faculty-2',
    username: 'faculty2',
    email: 'faculty2@faceattend.edu',
    password: 'faculty123',
    role: 'faculty',
    name: 'Prof. Gupta',
    department: 'IT',
    subjects: ['Web Development', 'Machine Learning'],
  },
];

// Initialize default users in both Firebase Auth and Firestore
export async function initUsers() {
  const settingsRef = doc(db, 'settings', 'users_init');
  const snap = await getDoc(settingsRef);
  if (snap.exists()) return;

  for (const user of DEFAULT_USERS) {
    try {
      // Create Firebase Auth account
      const cred = await createUserWithEmailAndPassword(auth, user.email, user.password);
      // Store profile in Firestore (without password)
      await setDoc(doc(db, USERS_COL, cred.user.uid), {
        id: cred.user.uid,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name,
        department: user.department || null,
        subjects: user.subjects || [],
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      // User may already exist — ignore
    }
  }
  await setDoc(settingsRef, { done: true, createdAt: serverTimestamp() });
}

// For student accounts: create Firebase Auth account on first login
async function ensureStudentAuthAccount(student) {
  const email = `${student.studentId.toLowerCase()}@faceattend.edu`;
  const password = 'student123';
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    // Store in Firestore users collection
    const { getAuth } = await import('firebase/auth');
    const currentAuth = getAuth();
    if (currentAuth.currentUser) {
      await setDoc(doc(db, USERS_COL, currentAuth.currentUser.uid), {
        id: currentAuth.currentUser.uid,
        username: student.studentId,
        email,
        role: 'student',
        name: student.name,
        studentId: student.studentId,
        department: student.department,
        createdAt: serverTimestamp(),
      });
    }
  } catch (e) {
    // Account already exists — that's fine
  }
}

export async function login(role, username, password) {
  try {
    let email;
    let session;

    if (role === 'admin') {
      email = 'admin@faceattend.edu';
      if (username !== 'admin' || password !== 'admin123') {
        return { success: false, error: 'Invalid credentials' };
      }
      const cred = await signInWithEmailAndPassword(auth, email, 'admin123');
      const userDoc = await getDoc(doc(db, USERS_COL, cred.user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      session = {
        id: cred.user.uid,
        username: 'admin',
        role: 'admin',
        name: userData.name || 'Administrator',
        email,
        loginTime: new Date().toISOString(),
      };

    } else if (role === 'faculty') {
      // Dynamic faculty lookup
      const q = query(collection(db, USERS_COL), where('role', '==', 'faculty'), where('username', '==', username));
      const snap = await getDocs(q);
      if (snap.empty) return { success: false, error: 'Invalid credentials' };
      const userData = snap.docs[0].data();
      // All faculty share password 'faculty123'
      if (password !== 'faculty123') return { success: false, error: 'Invalid credentials' };
      email = userData.email;
      const cred = await signInWithEmailAndPassword(auth, email, 'faculty123');
      session = {
        id: cred.user.uid,
        username: userData.username,
        role: 'faculty',
        name: userData.name,
        email,
        department: userData.department,
        subjects: userData.subjects || [],
        loginTime: new Date().toISOString(),
      };

    } else if (role === 'student') {
      // Match student by studentId or name
      const { getStudents } = await import('./dataService');
      const students = await getStudents();
      const searchStr = username.trim().toLowerCase();
      const student = students.find(
        s => s.studentId?.toLowerCase() === searchStr || s.name?.toLowerCase() === searchStr
      );
      if (!student) return { success: false, error: 'Student not found' };
      if (password !== 'student') return { success: false, error: 'Invalid password. Use "student"' };

      email = `${student.studentId.toLowerCase()}@faceattend.edu`;
      // Ensure student has a Firebase Auth account
      await ensureStudentAuthAccount(student);
      // Sign in
      const cred = await signInWithEmailAndPassword(auth, email, 'student123');
      session = {
        id: cred.user.uid,
        username: student.studentId,
        role: 'student',
        name: student.name,
        email,
        department: student.department,
        studentData: student,
        loginTime: new Date().toISOString(),
      };
    } else {
      return { success: false, error: 'Unknown role' };
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { success: true, user: session };

  } catch (err) {
    console.error('Login error:', err);
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
      return { success: false, error: 'Invalid credentials' };
    }
    return { success: false, error: err.message || 'Login failed' };
  }
}

export async function logout() {
  await signOut(auth);
  localStorage.removeItem(SESSION_KEY);
}

export function getSession() {
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
}

export function isAuthenticated() {
  return !!getSession() && !!auth.currentUser;
}

export function getRole() {
  return getSession()?.role || null;
}

export async function addUser(userData) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, userData.email, userData.password || 'faculty123');
    await setDoc(doc(db, USERS_COL, cred.user.uid), {
      ...userData,
      id: cred.user.uid,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.error('addUser error:', e);
  }
}

export async function getFacultyList() {
  const q = query(collection(db, USERS_COL), where('role', '==', 'faculty'));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

// Watch auth state changes (call in App.jsx to restore session)
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
