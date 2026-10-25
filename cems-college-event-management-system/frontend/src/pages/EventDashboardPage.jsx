import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Award,
  CheckCircle,
  FileText,
  Clock,
  Sparkles,
  Download,
  Search,
  RefreshCw,
  TrendingUp,
  Share2,
  Edit3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { CertificateModal } from '../components/CertificateModal';
import { TemplateEditorModal } from '../components/TemplateEditorModal';

const DEPT_COLORS = ['#1E3A8A', '#059669', '#D97706', '#7C3AED', '#DB2777', '#2563EB'];

export function EventDashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { subscribe } = useRealtime();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rosterSearch, setRosterSearch] = useState('');
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);

  // Smart back navigation path based on user role
  const getBackPath = () => {
    if (user?.role === 'admin') return '/admin/dashboard';
    if (user?.role === 'mentor') return '/mentor/dashboard';
    if (user?.role === 'president') return '/president/dashboard';
    return '/';
  };

  const getDashboardLabel = () => {
    if (user?.role === 'admin') return 'Admin Dashboard';
    if (user?.role === 'mentor') return 'Mentor Dashboard';
    if (user?.role === 'president') return 'President Workspace';
    return 'Campus Feed';
  };

  // Fetch Event Analytics & Roster
  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/proposals/${id}/event-dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resData = await res.json();
      if (resData.success) {
        setData(resData);
      } else {
        setError(resData.message || 'Event dashboard not found');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time synchronization
  useEffect(() => {
    const unsubReg = subscribe('REGISTRATION_UPDATED', (payload) => {
      if (payload.event_id === id) {
        fetchDashboardData();
      }
    });

    const unsubCert = subscribe('CERTIFICATE_AWARDED', () => fetchDashboardData());
    const unsubDoc = subscribe('DOCUMENT_UPDATED', (payload) => {
      if (payload.event_id === id) fetchDashboardData();
    });

    return () => {
      unsubReg();
      unsubCert();
      unsubDoc();
    };
  }, [id, subscribe, fetchDashboardData]);

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    const list = data?.analytics?.roster || [];
    if (!rosterSearch.trim()) return list;
    const term = rosterSearch.toLowerCase();
    return list.filter(
      (r) =>
        r.student_name?.toLowerCase().includes(term) ||
        r.student_email?.toLowerCase().includes(term) ||
        r.student_department?.toLowerCase().includes(term) ||
        r.adt_no?.toLowerCase().includes(term)
    );
  }, [data?.analytics?.roster, rosterSearch]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading event dashboard & student analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center max-w-md shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">Cannot Load Event Dashboard</h3>
          <p className="text-xs text-slate-500 mb-4">{error || 'Event analytics could not be retrieved.'}</p>
          <Link
            to={getBackPath()}
            className="px-4 py-2 bg-brand-800 text-white text-xs font-bold rounded-xl"
          >
            Return to {getDashboardLabel()}
          </Link>
        </div>
      </div>
    );
  }

  const { event, analytics } = data;
  const isDean = user?.role === 'admin';
  const isPresident = user?.role === 'president';

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation & Breadcrumbs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 px-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs">
            <Link
              to={getBackPath()}
              className="inline-flex items-center gap-1.5 font-bold text-brand-800 hover:text-brand-900 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              {getDashboardLabel()}
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 truncate max-w-[200px]">{event.club?.club_name || 'Events'}</span>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-800 truncate max-w-[220px]">{event.title}</span>
            <span className="text-slate-300">/</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
              Live Event Analytics
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setIsTemplateEditorOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold transition shadow-sm"
              title="Edit standardized proposal document template in-app"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-700" />
              Edit Common Template
            </button>

            <Link
              to={`/proposals/${event.event_id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              Proposal Dossier
            </Link>

            <button
              onClick={fetchDashboardData}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              title="Refresh Analytics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Banner for this Specific Event */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-800 text-white">
                {event.event_type === 'official' ? 'Official University Event' : event.club?.club_name || 'Club Event'}
              </span>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  event.status === 'published'
                    ? 'bg-emerald-100 text-emerald-800'
                    : event.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                ● {event.status.replace('_', ' ')}
              </span>

              {event.certificate && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-600" />
                  Dean's Certificate Awarded
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {event.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Organized by <strong className="text-slate-700">{event.creator?.name || 'Club President'}</strong> | Faculty Mentor: <strong className="text-slate-700">{event.club?.mentor?.name || 'Prof. Alan Turing'}</strong>
            </p>
          </div>

          {/* Action buttons (Dean Certificate, exports) */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Award Dean Certificate Button */}
            {isDean && (
              <button
                onClick={() => setIsCertModalOpen(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
              >
                <Award className="w-4 h-4 text-slate-950" />
                {event.certificate ? 'Inspect Certificate' : 'Award Certificate of Excellence'}
              </button>
            )}

            {event.certificate && !isDean && (
              <button
                onClick={() => setIsCertModalOpen(true)}
                className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Award className="w-4 h-4 text-amber-600" />
                View Dean's Certificate
              </button>
            )}

            <a
              href={`/api/proposals/${event.event_id}/export-word?token=${token}`}
              download
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              Word (.docx)
            </a>
          </div>
        </div>

        {/* 4 Accurate, High-Contrast Event KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Card 1: Total Confirmed Registrations */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Confirmed Attendees
              </span>
              <Users className="w-4 h-4 text-brand-800" />
            </div>
            <p className="text-3xl font-black text-brand-900">
              {analytics.totalRegistrations}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Target Capacity: {analytics.capacity} seats
            </p>
          </div>

          {/* Card 2: Capacity Utilization */}
          <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-sm ring-1 ring-emerald-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Capacity Filled
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-3xl font-black text-emerald-700">
              {analytics.capacityPercentage}%
            </p>
            <div className="w-full bg-emerald-100 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${analytics.capacityPercentage}%` }}
              />
            </div>
          </div>

          {/* Card 3: Remaining Seats */}
          <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-sm ring-1 ring-blue-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                Remaining Seats
              </span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-3xl font-black text-blue-700">
              {analytics.remainingSpots}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Venue: {event.venue}
            </p>
          </div>

          {/* Card 4: Allocated Budget */}
          <div className="p-4 bg-white rounded-2xl border border-purple-200 shadow-sm ring-1 ring-purple-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                Approved Budget
              </span>
              <DollarSign className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-3xl font-black text-purple-700">
              ${event.budget || 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Cost / Seat: ${analytics.totalRegistrations > 0 ? Math.round((event.budget || 0) / analytics.totalRegistrations) : 0}
            </p>
          </div>
        </div>

        {/* Visual Charts Grid (Optimized with isAnimationActive={false} to ensure ZERO LAG) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Registration Velocity Over Time */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Registration Velocity Timeline
              </h3>
              <p className="text-xs text-slate-500">
                Number of student sign-ups recorded per date leading up to event day
              </p>
            </div>

            <div className="h-64 w-full">
              {analytics.velocityData && analytics.velocityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.velocityData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                    <Tooltip
                      formatter={(val) => [`${val} Students`, 'Registrations']}
                      contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar
                      dataKey="count"
                      name="New Registrations"
                      fill="#1E3A8A"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Registrations will appear here once students RSVP.
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Academic Department Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Registrations by Department / Faculty
              </h3>
              <p className="text-xs text-slate-500">
                Distribution of student participants across campus academic departments
              </p>
            </div>

            <div className="h-64 w-full">
              {analytics.departmentBreakdown && analytics.departmentBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.departmentBreakdown}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                    <YAxis dataKey="department" type="category" tick={{ fontSize: 10, fill: '#64748B' }} width={90} />
                    <Tooltip
                      formatter={(val) => [`${val} Attendees`, 'Students']}
                      contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar
                      dataKey="count"
                      name="Students"
                      fill="#059669"
                      radius={[0, 4, 4, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No department registration records available.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Confirmed Students Roster Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Confirmed Student Attendees Roster ({filteredRoster.length})
              </h3>
              <p className="text-xs text-slate-500">
                Live verified student passes with ADT credentials and timestamps
              </p>
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Search attendee by name, ADT, email..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-800"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">ADT No</th>
                  <th className="py-2.5 px-3 text-right">Registration Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRoster.length > 0 ? (
                  filteredRoster.map((item) => (
                    <tr key={item.registration_id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{item.student_name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{item.student_email}</td>
                      <td className="py-2.5 px-3 text-slate-600">{item.student_department || 'General'}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{item.adt_no}</td>
                      <td className="py-2.5 px-3 text-right text-slate-400 text-[11px]">
                        {new Date(item.registered_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                      No student attendee records matching current search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dean's Virtual Certificate Modal */}
      {isCertModalOpen && (
        <CertificateModal
          event={event}
          existingCertificate={event.certificate}
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          onCertificateIssued={() => {
            fetchDashboardData();
          }}
        />
      )}

      {/* Common Proposal Document Template In-App Editor */}
      {isTemplateEditorOpen && (
        <TemplateEditorModal
          eventId={event.event_id}
          eventTitle={event.title}
          isOpen={isTemplateEditorOpen}
          onClose={() => setIsTemplateEditorOpen(false)}
          onSaved={() => {
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}
