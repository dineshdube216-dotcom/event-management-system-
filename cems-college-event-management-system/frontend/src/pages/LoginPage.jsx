import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, Mail, Lock, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        if (res.user?.role === 'admin') navigate('/admin/dashboard');
        else if (res.user?.role === 'mentor') navigate('/mentor/dashboard');
        else if (res.user?.role === 'president') navigate('/president/dashboard');
        else navigate('/');
      } else if (res.requires_verification) {
        navigate('/verify-otp', { state: { email: res.email, dev_otp: res.dev_otp } });
      } else {
        setError(res.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill demo user credentials
  const fillDemoUser = (userEmail) => {
    setEmail(userEmail);
    setPassword('Password123!');
    setError('');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      
      {/* Left Branding Panel (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-900 via-brand-800 to-indigo-950 p-12 flex-col justify-between relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">CEMS</h1>
            <p className="text-xs text-brand-200 font-medium">College Event Management System</p>
          </div>
        </div>

        {/* Hero Illustration / Content */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-amber-300 border border-white/10 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-amber-400" /> Verified Centralized Campus Events
          </div>
          
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            Never miss an official or club event on campus again.
          </h2>

          <p className="text-brand-100 text-sm leading-relaxed">
            One unified feed for verified university announcements, technical workshops, robotics hackathons, and cultural gala nights.
          </p>

          <div className="space-y-3 pt-2">
            {[
              'Official events highlighted with distinct amber verified badges',
              'President proposals & mentor approval workflows (Role Architecture)',
              'Instant email OTP verification and single sign-on access',
            ].map((text, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs text-brand-100 font-medium">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-6 border-t border-white/10 text-xs text-brand-300 flex justify-between">
          <span>MVP Milestone Build 30%</span>
          <span>© 2026 University Portal</span>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          
          {/* Header */}
          <div className="text-center lg:text-left">
            <div className="flex lg:hidden justify-center items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-900 flex items-center justify-center text-white">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-2xl text-slate-900">CEMS</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slateText tracking-tight">
              Welcome back
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Enter your credentials to access your college event dashboard.
            </p>
          </div>

          {/* Quick Demo Credentials Panel for Reviewer */}
          <div className="p-4 bg-indigo-50/80 border border-indigo-100 rounded-2xl space-y-2">
            <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-700" /> Quick Demo Role Logins:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <button
                type="button"
                onClick={() => fillDemoUser('student@college.edu')}
                className="px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-100 text-indigo-800 transition-colors text-left truncate"
              >
                🎓 Student
              </button>
              <button
                type="button"
                onClick={() => fillDemoUser('president@college.edu')}
                className="px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-100 text-indigo-800 transition-colors text-left truncate"
              >
                👑 President
              </button>
              <button
                type="button"
                onClick={() => fillDemoUser('mentor@college.edu')}
                className="px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-100 text-indigo-800 transition-colors text-left truncate"
              >
                👨‍🏫 Mentor
              </button>
              <button
                type="button"
                onClick={() => fillDemoUser('admin@college.edu')}
                className="px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-100 text-indigo-800 transition-colors text-left truncate"
              >
                🛡️ Admin
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                College Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="student@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-brand-800 hover:bg-brand-900 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-900/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Sign In to Dashboard <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-sm text-slate-500 font-medium">
            Don't have a verified account?{' '}
            <Link to="/signup" className="font-bold text-brand-700 hover:text-brand-900 transition-colors">
              Sign up as a Student
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
};
