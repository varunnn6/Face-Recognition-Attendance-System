import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Layout
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginModal from './components/LoginModal';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentManagement from './pages/admin/StudentManagement';
import SubjectManagement from './pages/admin/SubjectManagement';
import FacultyManagement from './pages/admin/FacultyManagement';
import PhotoCapture from './pages/admin/PhotoCapture';
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminEmailReports from './pages/admin/AdminEmailReports';

// Faculty pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import AttendanceSession from './pages/faculty/AttendanceSession';
import StudentDirectory from './pages/faculty/StudentDirectory';
import AttendanceReports from './pages/faculty/AttendanceReports';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import MyAttendance from './pages/student/MyAttendance';
import MarkAttendance from './pages/student/MarkAttendance';

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Navbar onLoginClick={() => setShowLogin(true)} />

      {isAuthenticated ? (
        /* Authenticated Layout: Sidebar + Content */
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <Routes>
              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><StudentManagement /></ProtectedRoute>} />
              <Route path="/admin/faculty" element={<ProtectedRoute allowedRoles={['admin']}><FacultyManagement /></ProtectedRoute>} />
              <Route path="/admin/subjects" element={<ProtectedRoute allowedRoles={['admin']}><SubjectManagement /></ProtectedRoute>} />
              <Route path="/admin/capture" element={<ProtectedRoute allowedRoles={['admin']}><PhotoCapture /></ProtectedRoute>} />
              <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={['admin']}><AdminAttendance /></ProtectedRoute>} />
              <Route path="/admin/emails" element={<ProtectedRoute allowedRoles={['admin']}><AdminEmailReports /></ProtectedRoute>} />

              {/* Faculty Routes */}
              <Route path="/faculty" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyDashboard /></ProtectedRoute>} />
              <Route path="/faculty/session" element={<ProtectedRoute allowedRoles={['faculty']}><AttendanceSession /></ProtectedRoute>} />
              <Route path="/faculty/students" element={<ProtectedRoute allowedRoles={['faculty']}><StudentDirectory /></ProtectedRoute>} />
              <Route path="/faculty/reports" element={<ProtectedRoute allowedRoles={['faculty']}><AttendanceReports /></ProtectedRoute>} />

              {/* Student Routes */}
              <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
              <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['student']}><MyAttendance /></ProtectedRoute>} />
              <Route path="/student/mark" element={<ProtectedRoute allowedRoles={['student']}><MarkAttendance /></ProtectedRoute>} />

              {/* Public fallback */}
              <Route path="*" element={<LandingPage onLoginClick={() => setShowLogin(true)} />} />
            </Routes>
          </main>
        </div>
      ) : (
        /* Public Layout: Full width content */
        <Routes>
          <Route path="/" element={<LandingPage onLoginClick={() => setShowLogin(true)} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<LandingPage onLoginClick={() => setShowLogin(true)} />} />
        </Routes>
      )}

      {/* Login Modal */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}

export default App;
