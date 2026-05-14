import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, Brain, Camera, CalendarDays,
  Settings, PlayCircle, Search, BarChart3, UserCheck, ScanFace, Mail, GraduationCap, Eye
} from 'lucide-react';

const sidebarConfig = {
  admin: [
    { label: 'OVERVIEW', items: [
      { to: '/admin', icon: LayoutDashboard, text: 'Dashboard', end: true },
    ]},
    { label: 'MANAGEMENT', items: [
      { to: '/admin/students', icon: Users, text: 'Students' },
      { to: '/admin/faculty', icon: GraduationCap, text: 'Teachers' },
      { to: '/admin/faculty-overview', icon: Eye, text: 'Faculty Overview' },
      { to: '/admin/subjects', icon: BookOpen, text: 'Subjects' },
    ]},
    { label: 'AI ENGINE', items: [
      { to: '/admin/capture', icon: Camera, text: 'Photo Capture' }
    ]},
    { label: 'RECORDS', items: [
      { to: '/admin/attendance', icon: CalendarDays, text: 'Attendance' },
      { to: '/admin/emails', icon: Mail, text: 'Email Reports' },
    ]},
  ],
  faculty: [
    { label: 'OVERVIEW', items: [
      { to: '/faculty', icon: LayoutDashboard, text: 'Dashboard', end: true },
    ]},
    { label: 'ATTENDANCE', items: [
      { to: '/faculty/session', icon: PlayCircle, text: 'Sessions' },
      { to: '/faculty/reports', icon: BarChart3, text: 'Reports' },
    ]},
    { label: 'SUBJECTS', items: [
      { to: '/faculty/subjects', icon: BookOpen, text: 'My Subjects' },
    ]},
    { label: 'STUDENTS', items: [
      { to: '/faculty/students', icon: Search, text: 'Directory' },
    ]},
  ],
  student: [
    { label: 'OVERVIEW', items: [
      { to: '/student', icon: LayoutDashboard, text: 'Dashboard', end: true },
    ]},
    { label: 'ATTENDANCE', items: [
      { to: '/student/attendance', icon: CalendarDays, text: 'My Attendance' },
      { to: '/student/mark', icon: ScanFace, text: 'Mark Attendance' },
    ]},
  ],
};

export default function Sidebar() {
  const { role } = useAuth();
  const sections = sidebarConfig[role] || [];

  return (
    <aside className="sidebar" id="app-sidebar">
      {sections.map((section, si) => (
        <div key={si} className="sidebar-section">
          <div className="sidebar-label">{section.label}</div>
          {section.items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={18} />
              {item.text}
            </NavLink>
          ))}
        </div>
      ))}
    </aside>
  );
}
