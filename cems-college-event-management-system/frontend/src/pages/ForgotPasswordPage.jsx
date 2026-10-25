import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [devResetLink, setDevResetLink] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email);
      if (res.success) {
        setSubmitted(true);
        setMessage(res.message);
        if (res.dev_reset_link) {
          setDevResetLink(res.dev_reset_link);
        }
      } else {
        setError(res.message || 'Failed to process request.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 text-brand-700 mb-3 border border-brand-100 shadow-sm">
            <Mail className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slateText tracking-tight">
            Forgot Password?
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Enter your college email address to receive a secure password reset link.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                Reset Email Sent!
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">{message}</p>
            </div>

            {/* Dev Reset Link Helper */}
            {devResetLink && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Dev Environment Direct Link:
                </p>
                <a
                  href={devResetLink}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-800 bg-white border border-amber-300 px-3 py-2 rounded-xl hover:bg-amber-100 transition-colors break-all"
                >
                  Click to Open Reset Password Page <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs font-bold text-brand-700 hover:text-brand-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-brand-800 hover:bg-brand-900 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-900/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Send Password Reset Link <Send className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
