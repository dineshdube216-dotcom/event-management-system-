import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider, useRealtime } from './context/RealtimeContext';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { OTPPage } from './pages/OTPPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { EventFeedPage } from './pages/EventFeedPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { MentorDashboard } from './pages/MentorDashboard';
import { PresidentDashboard } from './pages/PresidentDashboard';
import { ProposalDetailPage } from './pages/ProposalDetailPage';
import { EventDashboardPage } from './pages/EventDashboardPage';
import { MyRegistrationsPage } from './pages/MyRegistrationsPage';
import { X, Sparkles, AlertCircle, CheckCircle, Info } from 'lucide-react';

// Protected Route wrapper with role check
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-800 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Global Interactive Real-Time Toast
const GlobalToast = () => {
  const { toast, clearToast } = useRealtime();
  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 p-4 animate-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="mt-0.5">
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          ) : toast.type === 'warning' ? (
            <AlertCircle className="w-5 h-5 text-amber-400" />
          ) : (
            <Info className="w-5 h-5 text-blue-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white">{toast.title}</p>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{toast.message}</p>
          {toast.eventId && (
            <Link
              to={`/proposals/${toast.eventId}`}
              onClick={clearToast}
              className="inline-block mt-2 text-[11px] font-bold text-amber-400 hover:underline"
            >
              View Proposal Dossier →
            </Link>
          )}
        </div>
        <button
          onClick={clearToast}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <Router>
          <GlobalToast />
          <Routes>
            {/* Public student event feed */}
            <Route path="/" element={<EventFeedPage />} />

            {/* Authentication routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/verify-otp" element={<OTPPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Admin Dashboard */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Mentor Dashboard */}
            <Route
              path="/mentor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['mentor', 'admin']}>
                  <MentorDashboard />
                </ProtectedRoute>
              }
            />

            {/* President Dashboard */}
            <Route
              path="/president/dashboard"
              element={
                <ProtectedRoute allowedRoles={['president', 'admin']}>
                  <PresidentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Proposal Detail View with visual workflow and document manager */}
            <Route
              path="/proposals/:id"
              element={
                <ProtectedRoute>
                  <ProposalDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Dedicated Per-Event Analytics Dashboard and Student Roster */}
            <Route
              path="/events/:id/dashboard"
              element={
                <ProtectedRoute>
                  <EventDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Student My Registrations view */}
            <Route
              path="/student/my-events"
              element={
                <ProtectedRoute>
                  <MyRegistrationsPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </RealtimeProvider>
    </AuthProvider>
  );
}
