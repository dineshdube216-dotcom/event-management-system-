import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import {
  Calendar,
  Search,
  Bell,
  LogOut,
  ChevronDown,
  ShieldCheck,
  GraduationCap,
  Crown,
  UserCheck,
  CheckCheck,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

const roleBadges = {
  admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: ShieldCheck, path: '/admin/dashboard' },
  mentor: { label: 'Mentor', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: UserCheck, path: '/mentor/dashboard' },
  president: { label: 'President', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Crown, path: '/president/dashboard' },
  student: { label: 'Student', color: 'bg-brand-100 text-brand-800 border-brand-200', icon: GraduationCap, path: '/student/my-events' },
};

export const Navbar = ({ searchQuery, setSearchQuery }) => {
  const { user, logout, login } = useAuth();
  const { connectionStatus, notifications, unreadCount, markAsRead, markAllAsRead } = useRealtime();
  const navigate = useNavigate();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Quick Demo Account Switcher
  const handleQuickSwitch = async (email) => {
    try {
      await login(email, 'Password123!');
      setUserDropdownOpen(false);
      if (email === 'admin@college.edu') navigate('/admin/dashboard');
      else if (email === 'mentor@college.edu') navigate('/mentor/dashboard');
      else if (email === 'president@college.edu') navigate('/president/dashboard');
      else navigate('/');
    } catch (e) {
      console.error('Quick switch error:', e);
    }
  };

  const RoleIcon = user ? (roleBadges[user.role]?.icon || GraduationCap) : GraduationCap;
  const roleInfo = user ? (roleBadges[user.role] || roleBadges.student) : roleBadges.student;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Live Sync Badge */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-brand-800 flex items-center justify-center text-white shadow-md shadow-brand-900/20 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">CEMS</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase bg-brand-50 text-brand-700 rounded border border-brand-200">
                  Live
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 hidden md:block">College Event System</p>
            </div>
          </Link>

          {/* Real-time Connection Status Indicator */}
          <div
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
              connectionStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : connectionStatus === 'reconnecting' || connectionStatus === 'connecting'
                ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
            title="Real-time WebSocket connection state"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-500'
                  : connectionStatus === 'reconnecting' || connectionStatus === 'connecting'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            <span>
              {connectionStatus === 'connected'
                ? 'Live Synced'
                : connectionStatus === 'reconnecting'
                ? 'Reconnecting...'
                : 'Offline'}
            </span>
          </div>
        </div>

        {/* Global Navigation Links based on role */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-brand-800 hover:bg-slate-100 transition"
          >
            Events Feed
          </Link>

          {user?.role === 'admin' && (
            <Link
              to="/admin/dashboard"
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-brand-800 bg-brand-50 border border-brand-200 transition"
            >
              Admin Dashboard
            </Link>
          )}

          {user?.role === 'mentor' && (
            <Link
              to="/mentor/dashboard"
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 transition"
            >
              Mentor Dashboard
            </Link>
          )}

          {user?.role === 'president' && (
            <Link
              to="/president/dashboard"
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 transition"
            >
              President Workspace
            </Link>
          )}

          {user?.role === 'student' && (
            <Link
              to="/student/my-events"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-brand-800 hover:bg-slate-100 transition"
            >
              My Registrations
            </Link>
          )}
        </nav>

        {/* Global Feed Search Bar */}
        {setSearchQuery && (
          <div className="flex-1 max-w-xs mx-2 hidden sm:block">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search events, clubs, venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-800 focus:bg-white transition"
              />
            </div>
          </div>
        )}

        {/* Right Nav Actions: Notifications & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Notification Center Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 relative transition"
                  title="Real-time notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Drawer */}
                {notifDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-fade-in"
                    onMouseLeave={() => setNotifDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Notifications Center</h4>
                        <p className="text-[10px] text-slate-400">{unreadCount} unread alert(s)</p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[11px] font-semibold text-brand-800 hover:underline flex items-center gap-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.notification_id}
                            onClick={() => {
                              if (!n.is_read) markAsRead(n.notification_id);
                            }}
                            className={`p-3 cursor-pointer hover:bg-slate-50 transition text-left ${
                              !n.is_read ? 'bg-blue-50/50' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-xs ${!n.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                {n.title}
                              </p>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {new Date(n.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                              {n.message}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No notifications yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile & Demo Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-full border border-slate-200 hover:bg-slate-50 transition focus:outline-none"
                >
                  <img
                    src={user.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-brand-800/20"
                  />
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[110px]">{user.name}</p>
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-bold uppercase rounded border ${roleInfo.color}`}>
                      <RoleIcon className="w-2.5 h-2.5" />
                      {roleInfo.label}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu with Quick Role Switcher */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-fade-in"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Authenticated Session</p>
                      <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <p className="text-[10px] text-brand-800 font-semibold mt-1">{user.department}</p>
                    </div>

                    {/* Quick Demo Role Switcher */}
                    <div className="px-2 py-2 border-b border-slate-100">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400 flex items-center justify-between">
                        <span>⚡ Quick Role Switcher</span>
                        <Sparkles className="w-3 h-3 text-amber-500" />
                      </div>

                      <div className="space-y-1 mt-1">
                        <button
                          onClick={() => handleQuickSwitch('admin@college.edu')}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                            user.role === 'admin' ? 'bg-purple-50 text-purple-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>Dr. Sarah Jenkins (Admin)</span>
                          <span className="text-[10px] font-mono text-purple-700">Dean</span>
                        </button>

                        <button
                          onClick={() => handleQuickSwitch('mentor@college.edu')}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                            user.role === 'mentor' ? 'bg-emerald-50 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>Prof. Alan Turing (Mentor)</span>
                          <span className="text-[10px] font-mono text-emerald-700">Faculty</span>
                        </button>

                        <button
                          onClick={() => handleQuickSwitch('president@college.edu')}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                            user.role === 'president' ? 'bg-blue-50 text-blue-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>Alex Rivera (President)</span>
                          <span className="text-[10px] font-mono text-blue-700">Lead</span>
                        </button>

                        <button
                          onClick={() => handleQuickSwitch('student@college.edu')}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                            user.role === 'student' ? 'bg-brand-50 text-brand-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>Samantha Reed (Student)</span>
                          <span className="text-[10px] font-mono text-brand-700">Attendee</span>
                        </button>
                      </div>
                    </div>

                    <div className="px-2 pt-1.5">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-brand-800 hover:bg-brand-50 rounded-lg transition"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-brand-800 hover:bg-brand-900 rounded-lg shadow transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
