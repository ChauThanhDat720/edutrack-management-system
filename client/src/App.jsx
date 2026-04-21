import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Announcements from './pages/Announcements';
import CreateAnnouncement from './pages/CreateAnnouncement';
import EditAnnouncement from './pages/EditAnnouncement';
import UserManagement from './pages/UserManagement';
import ClassManagement from './pages/ClassManagement';
import ClassDetail from './pages/ClassDetail';
import SessionAttendance from './pages/SessionAttendance';
import StudentSchedule from './pages/StudentSchedule';
import TeacherSchedule from './pages/TeacherSchedule';
import ConductManagement from './pages/ConductManagement';

import GradeManagement from './pages/GradeManagement';
import MyGrades from './pages/MyGrades';
import Confessions from './pages/Confessions';
import StudentAbsences from './pages/StudentAbsences';
import ManageAbsences from './pages/ManageAbsences';
import StudentAttendance from './pages/StudentAttendance';
import RescheduleRequest from './pages/RescheduleRequest';
import ManageReschedule from './pages/ManageReschedule';

// ─── Base Protected Route ────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// ─── Role-Based Protected Route ──────────────────────────────────────────────
const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user?.role)) return <Navigate to="/unauthorized" replace />;
  
  return children;
};

// ─── Unauthorized Page ───────────────────────────────────────────────────────
const Unauthorized = () => (
  <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 gap-4">
    <h1 className="text-3xl font-bold text-red-600">403 – Không có quyền truy cập</h1>
    <p className="text-gray-600">Bạn không có quyền xem trang này.</p>
    <a href="/" className="text-blue-500 underline">Quay về trang chủ</a>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <Router>
          <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ── Shared authenticated routes ── */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="confessions" element={<Confessions />} />
          </Route>

          {/* ── Admin-only routes ── */}
          <Route path="/admin" element={<RoleProtectedRoute allowedRoles={['admin']}><Layout /></RoleProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="announcements/create" element={<CreateAnnouncement />} />
            <Route path="announcements/edit/:id" element={<EditAnnouncement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="classes" element={<ClassManagement />} />
            <Route path="classes/:id" element={<ClassDetail />} />
            <Route path="classes/:id/grades" element={<GradeManagement />} />
            <Route path="classes/:id/sessions/:sessionId/attendance" element={<SessionAttendance />} />
            <Route path="absences" element={<ManageAbsences />} />
            <Route path="conduct" element={<ConductManagement />} />
            <Route path="reschedule" element={<ManageReschedule />} />
          </Route>

          {/* ── Teacher-only routes ── */}
          <Route path="/teacher" element={<RoleProtectedRoute allowedRoles={['teacher']}><Layout /></RoleProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="classes" element={<ClassManagement />} />
            <Route path="schedule" element={<TeacherSchedule />} />
            <Route path="classes/:id" element={<ClassDetail />} />
            <Route path="classes/:id" element={<ClassDetail />} />
            <Route path="classes/:id/grades" element={<GradeManagement />} />
            <Route path="classes/:id/sessions/:sessionId/attendance" element={<SessionAttendance />} />
            <Route path="absences" element={<ManageAbsences />} />
            <Route path="conduct" element={<ConductManagement />} />
            <Route path="reschedule" element={<RescheduleRequest />} />
          </Route>

          {/* ── Student-only routes ── */}
          <Route path="/student" element={<RoleProtectedRoute allowedRoles={['student']}><Layout /></RoleProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="classes" element={<ClassManagement />} />
            <Route path="classes/:id" element={<ClassDetail />} />
            <Route path="schedule" element={<StudentSchedule />} />
            <Route path="grades" element={<MyGrades />} />
            <Route path="absences" element={<StudentAbsences />} />
            <Route path="attendance" element={<StudentAttendance />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
