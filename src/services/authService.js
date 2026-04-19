// Authentication Service — Firestore-backed role-based auth with OTP password reset
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, serverTimestamp, deleteDoc, Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { sendOtpEmail } from './emailService';

const USERS_COL = 'users';
const RESET_COL = 'password_resets';
const SESSION_KEY = 'faceattend_session';

const DEFAULT_USERS = [
  { id: 'admin-1', username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator', email: 'admin@faceattend.edu' },
  { id: 'faculty-1', username: 'faculty', password: 'faculty123', role: 'faculty', name: 'Dr. Sharma', email: 'sharma@faceattend.edu', department: 'Computer', subjects: ['Data Structures', 'Database Systems'] },
  { id: 'faculty-2', username: 'faculty2', password: 'faculty123', role: 'faculty', name: 'Prof. Gupta', email: 'gupta@faceattend.edu', department: 'IT', subjects: ['Web Development', 'Machine Learning'] },
];

// — Initialize default users in Firestore —
export async function initUsers() {
  const settingsRef = doc(db, 'settings', 'users_init');
  const snap = await getDoc(settingsRef);
  if (snap.exists()) return;
  for (const user of DEFAULT_USERS) {
    await setDoc(doc(db, USERS_COL, user.id), { ...user, createdAt: serverTimestamp() });
  }
  await setDoc(settingsRef, { done: true });
}

async function getAllUsers() {
  const snap = await getDocs(collection(db, USERS_COL));
  return snap.docs.map(d => ({ ...d.data(), _docId: d.id }));
}

// — Login —
export async function login(role, username, password) {
  await initUsers();
  const users = await getAllUsers();

  // Admin / faculty match
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

  // Student login — username = studentId or name, password = 'student' (or custom)
  if (role === 'student') {
    const { getStudents } = await import('./dataService');
    const students = await getStudents();
    const searchStr = username.trim().toLowerCase();
    const student = students.find(
      s => (s.studentId?.toLowerCase() === searchStr || s.name?.toLowerCase() === searchStr)
        && (password === 'student' || password === (s.password || 'student'))
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

  return { success: false, error: 'Invalid credentials. Please try again.' };
}

// — Logout —
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

// — Change Password (while logged in) —
export async function changePassword(userId, role, oldPassword, newPassword) {
  try {
    if (role === 'student') {
      const { getStudents, updateStudent } = await import('./dataService');
      const students = await getStudents();
      const student = students.find(s => s.studentId === userId);
      if (!student) return { success: false, error: 'User not found' };
      const currentPass = student.password || 'student';
      if (oldPassword !== currentPass) return { success: false, error: 'Current password is incorrect' };
      await updateStudent(userId, { password: newPassword });
      return { success: true };
    } else {
      // Admin or faculty — stored in USERS_COL
      const users = await getAllUsers();
      const user = users.find(u => u.id === userId);
      if (!user) return { success: false, error: 'User not found' };
      if (oldPassword !== user.password) return { success: false, error: 'Current password is incorrect' };
      await updateDoc(doc(db, USERS_COL, userId), { password: newPassword, updatedAt: serverTimestamp() });
      return { success: true };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// — Request Password Reset (generates OTP, stores in Firestore) —
export async function requestPasswordReset(role, username) {
  try {
    let email = null;
    let userRef = null;
    let userId = null;

    if (role === 'student') {
      const { getStudents } = await import('./dataService');
      const students = await getStudents();
      const searchStr = username.trim().toLowerCase();
      const student = students.find(
        s => s.studentId?.toLowerCase() === searchStr || s.name?.toLowerCase() === searchStr
      );
      if (!student) return { success: false, error: 'Student not found' };
      if (!student.email) return { success: false, error: 'No email registered for this student. Contact admin.' };
      email = student.email;
      userId = student.studentId;
    } else {
      await initUsers();
      const users = await getAllUsers();
      const user = users.find(u => u.role === role && u.username === username.trim());
      if (!user) return { success: false, error: 'User not found' };
      email = user.email;
      userId = user.id;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const token = `${userId}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // Store OTP in Firestore (admin can view in Reset Codes panel)
    await setDoc(doc(db, RESET_COL, token), {
      token, otp, userId, role, email,
      username: username.trim(),
      expiresAt: Timestamp.fromDate(expiresAt),
      used: false,
      createdAt: serverTimestamp(),
    });

    // Attempt to send OTP via email
    let emailSent = false;
    let userName = username;
    if (role === 'student') {
      const { getStudents } = await import('./dataService');
      const students = await getStudents();
      const s = students.find(st => st.studentId?.toLowerCase() === username.toLowerCase() || st.name?.toLowerCase() === username.toLowerCase());
      if (s) userName = s.name;
    }
    const emailResult = await sendOtpEmail(email, userName, otp);
    if (emailResult.success) emailSent = true;

    // Mask email for display
    const [localPart, domain] = email.split('@');
    const maskedEmail = `${localPart.slice(0, 2)}***@${domain}`;

    return { success: true, token, maskedEmail, emailSent, email };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// — Verify OTP and Reset Password —
export async function verifyOtpAndReset(token, otp, newPassword) {
  try {
    const resetRef = doc(db, RESET_COL, token);
    const resetSnap = await getDoc(resetRef);
    if (!resetSnap.exists()) return { success: false, error: 'Invalid or expired reset request' };

    const resetData = resetSnap.data();
    if (resetData.used) return { success: false, error: 'This OTP has already been used' };

    const expiresAt = resetData.expiresAt.toDate();
    if (new Date() > expiresAt) return { success: false, error: 'OTP has expired. Request a new one.' };

    if (resetData.otp !== otp) return { success: false, error: 'Incorrect OTP' };

    // Reset password
    const result = await _forceResetPassword(resetData.userId, resetData.role, newPassword);
    if (!result.success) return result;

    // Mark OTP as used
    await updateDoc(resetRef, { used: true, usedAt: serverTimestamp() });

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function _forceResetPassword(userId, role, newPassword) {
  try {
    if (role === 'student') {
      const { updateStudent } = await import('./dataService');
      await updateStudent(userId, { password: newPassword });
    } else {
      await updateDoc(doc(db, USERS_COL, userId), { password: newPassword, updatedAt: serverTimestamp() });
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// — Get active reset codes (for admin panel) —
export async function getActiveResetCodes() {
  const snap = await getDocs(collection(db, RESET_COL));
  const now = new Date();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data(), expiresAt: d.data().expiresAt?.toDate?.().toISOString() }))
    .filter(r => !r.used && new Date(r.expiresAt) > now)
    .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
}

export async function addUser(userData) {
  await setDoc(doc(db, USERS_COL, userData.id), { ...userData, createdAt: serverTimestamp() });
}

export async function getFacultyList() {
  const q = query(collection(db, USERS_COL), where('role', '==', 'faculty'));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}
