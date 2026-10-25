import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';

export function MyRegistrationsPage() {
  const { user, token } = useAuth();
  const { subscribe } = useRealtime();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchRegistrations = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/events/user/my-registrations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRegistrations(data.registrations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  // Real-time synchronization: if student registers or cancels anywhere, sync
  useEffect(() => {
    const unsubReg = subscribe('REGISTRATION_UPDATED', (data) => {
      if (data.studentId === user?.user_id) {
        fetchRegistrations();
      }
    });

    return () => unsubReg();
  }, [subscribe, user?.user_id, fetchRegistrations]);

  // Cancel registration handler
  const handleCancelRegistration = async (eventId, title) => {
    if (!window.confirm(`Are you sure you want to cancel your registration for "${title}"?`)) return;

    setCancellingId(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchRegistrations();
      } else {
        alert(data.message || 'Failed to cancel registration');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading your confirmed registrations...</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const upcoming = registrations.filter((r) => new Date(r.event.event_date) >= now);
  const past = registrations.filter((r) => new Date(r.event.event_date) < now);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Student Campus Feed
          </Link>

          <button
            onClick={fetchRegistrations}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-800 text-white uppercase tracking-wider">
              Student Event Pass Portfolio
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              My Registered Campus Events
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified registrations for <strong className="text-slate-700">{user?.name}</strong> ({user?.adt_no || user?.department})
            </p>
          </div>

          <div className="flex items-center gap-3 text-center">
            <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-lg font-black text-brand-800">{registrations.length}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Passes</p>
            </div>
            <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-lg font-black text-emerald-700">{upcoming.length}</p>
              <p className="text-[10px] font-bold text-emerald-600 uppercase">Upcoming</p>
            </div>
          </div>
        </div>

        {/* Registrations List */}
        <div className="space-y-4">
          {registrations.length > 0 ? (
            registrations.map(({ registration_id, registered_at, event }) => {
              const isPast = new Date(event.event_date) < now;

              return (
                <div
                  key={registration_id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    {event.banner_image_url && (
                      <img
                        src={event.banner_image_url}
                        alt={event.title}
                        className="w-20 h-20 rounded-lg object-cover shrink-0 hidden sm:block"
                      />
                    )}

                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            event.event_type === 'official'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {event.event_type === 'official' ? '⭐ Official Event' : event.organizer}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isPast ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isPast ? 'Past Event' : 'Confirmed Registration'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{event.title}</h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                        <span className="flex items-center gap-1 text-slate-700 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(event.event_date).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>

                        <span className="flex items-center gap-1 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {event.venue}
                        </span>

                        <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                          Registered on {new Date(registered_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {!isPast && (
                      <button
                        onClick={() => handleCancelRegistration(event.event_id, event.title)}
                        disabled={cancellingId === event.event_id}
                        className="px-3 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                      >
                        {cancellingId === event.event_id ? 'Cancelling...' : 'Cancel Registration'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 mb-1">No Registered Events Yet</h3>
              <p className="text-xs text-slate-500 mb-4">
                Explore the verified student event feed and register for exciting technical symposiums, hackathons, and cultural gala nights!
              </p>
              <Link
                to="/"
                className="px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-lg text-xs font-bold transition shadow"
              >
                Browse Live Events Feed
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
