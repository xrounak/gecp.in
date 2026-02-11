import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import IntroOverlay from './components/ui/IntroOverlay';

// Lazy loading pages
const Home = lazy(() => import('./pages/Home'));
const Directory = lazy(() => import('./pages/Directory'));
const ClubDetails = lazy(() => import('./pages/ClubDetails'));
const NoticeBoardPage = lazy(() => import('./pages/NoticeBoardPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const RegisterClub = lazy(() => import('./pages/RegisterClub'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const ClubDashboard = lazy(() => import('./pages/Dashboard/ClubDashboard'));
const AdminDashboard = lazy(() => import('./pages/Dashboard/AdminDashboard'));
const StudentDashboard = lazy(() => import('./pages/Dashboard/StudentDashboard'));

// Role Guard Component
const RoleGuard: React.FC<{ children: React.ReactNode, allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role || 'student')) return <Navigate to="/" replace />;

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <IntroOverlay />
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="directory" element={<Directory />} />
              <Route path="club/:slug" element={<ClubDetails />} />
              <Route path="notices" element={<NoticeBoardPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="register-club" element={<RegisterClub />} />
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<SignUp />} />

              {/* Protected Dashboards */}
              <Route path="dashboard/student" element={
                <RoleGuard allowedRoles={['student', 'club_admin', 'moderator', 'super_admin']}>
                  <StudentDashboard />
                </RoleGuard>
              } />

              <Route path="dashboard/club_admin" element={
                <RoleGuard allowedRoles={['club_admin', 'moderator', 'super_admin']}>
                  <ClubDashboard />
                </RoleGuard>
              } />

              <Route path="dashboard/moderator" element={
                <RoleGuard allowedRoles={['moderator', 'super_admin']}>
                  <AdminDashboard />
                </RoleGuard>
              } />

              <Route path="dashboard/super_admin" element={
                <RoleGuard allowedRoles={['super_admin']}>
                  <AdminDashboard />
                </RoleGuard>
              } />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
